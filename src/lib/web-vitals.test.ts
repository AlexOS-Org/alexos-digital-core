import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { sendMetric, startWebVitalsMonitoring } from "./web-vitals";
import { onCLS, onFCP, onINP, onLCP, type Metric } from "web-vitals";
import { supabase } from "../integrations/supabase/client";

vi.mock("web-vitals", () => ({
  onCLS: vi.fn(),
  onFCP: vi.fn(),
  onINP: vi.fn(),
  onLCP: vi.fn(),
}));

vi.mock("../integrations/supabase/client", () => {
  const insertMock = vi.fn().mockResolvedValue({ error: null });
  const fromMock = vi.fn().mockReturnValue({ insert: insertMock });
  const getSessionMock = vi.fn().mockResolvedValue({
    data: { session: { user: { id: "test-user-123" } } },
    error: null,
  });

  return {
    supabase: {
      auth: {
        getSession: getSessionMock,
      },
      from: fromMock,
    },
  };
});

describe("web-vitals monitoring", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete (globalThis as Record<string, unknown>).window;
    delete (globalThis as Record<string, unknown>).navigator;
  });

  afterEach(() => {
    delete (globalThis as Record<string, unknown>).window;
    delete (globalThis as Record<string, unknown>).navigator;
  });

  it("returns a safe no-op cleanup during SSR when window is undefined", () => {
    const cleanup = startWebVitalsMonitoring(1);

    expect(typeof cleanup).toBe("function");
    expect(cleanup()).toBeUndefined();
    expect(onCLS).not.toHaveBeenCalled();
    expect(onFCP).not.toHaveBeenCalled();
    expect(onINP).not.toHaveBeenCalled();
    expect(onLCP).not.toHaveBeenCalled();
  });

  it("returns a no-op cleanup on non-ecommerce routes without registering vitals", async () => {
    (globalThis as unknown as { window: unknown }).window = {
      location: { pathname: "/money-center" },
      matchMedia: () => ({ matches: false }),
    };

    const cleanup = startWebVitalsMonitoring(1);

    expect(typeof cleanup).toBe("function");

    await Promise.resolve();

    expect(onCLS).not.toHaveBeenCalled();
    expect(onFCP).not.toHaveBeenCalled();
    expect(onINP).not.toHaveBeenCalled();
    expect(onLCP).not.toHaveBeenCalled();
  });

  it("does not register monitoring when sampleRate is 0", async () => {
    (globalThis as unknown as { window: unknown }).window = {
      location: { pathname: "/e-commerce/products" },
      matchMedia: () => ({ matches: false }),
    };

    const cleanup = startWebVitalsMonitoring(0);

    expect(typeof cleanup).toBe("function");

    await Promise.resolve();

    expect(onCLS).not.toHaveBeenCalled();
    expect(onFCP).not.toHaveBeenCalled();
  });

  it("registers CLS, FCP, INP, and LCP callbacks on /e-commerce routes for authenticated users", async () => {
    (globalThis as unknown as { window: unknown }).window = {
      location: { pathname: "/e-commerce/orders" },
      matchMedia: () => ({ matches: false }),
    };

    const cleanup = startWebVitalsMonitoring(1);

    await vi.waitFor(() => {
      expect(onCLS).toHaveBeenCalledTimes(1);
      expect(onFCP).toHaveBeenCalledTimes(1);
      expect(onINP).toHaveBeenCalledTimes(1);
      expect(onLCP).toHaveBeenCalledTimes(1);
    });

    cleanup();
  });

  it("does not register listeners when user is not authenticated", async () => {
    (globalThis as unknown as { window: unknown }).window = {
      location: { pathname: "/e-commerce" },
      matchMedia: () => ({ matches: false }),
    };

    vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
      data: { session: null },
      error: null,
    });

    const cleanup = startWebVitalsMonitoring(1);

    await vi.waitFor(() => {
      expect(supabase.auth.getSession).toHaveBeenCalled();
    });

    expect(onCLS).not.toHaveBeenCalled();
    expect(onFCP).not.toHaveBeenCalled();
    cleanup();
  });

  it("stops sending metrics after cleanup is invoked", async () => {
    (globalThis as unknown as { window: unknown }).window = {
      location: { pathname: "/e-commerce/products" },
      matchMedia: () => ({ matches: false }),
    };

    let capturedReport: ((metric: Parameters<Parameters<typeof onLCP>[0]>[0]) => void) | undefined;

    vi.mocked(onLCP).mockImplementationOnce((cb) => {
      capturedReport = cb;
    });

    const cleanup = startWebVitalsMonitoring(1);

    await vi.waitFor(() => {
      expect(onLCP).toHaveBeenCalled();
    });

    cleanup();

    capturedReport?.({
      name: "LCP",
      value: 1200,
      rating: "good",
      delta: 1200,
      id: "v1-123",
      entries: [],
      navigationType: "navigate",
    });

    expect(supabase.from).not.toHaveBeenCalledWith("web_vitals_events");
  });

  it("filters out unsupported metric names in sendMetric", () => {
    const invalidMetric = {
      name: "TTFB",
      value: 300,
      rating: "good",
    } as unknown as Metric;

    sendMetric(invalidMetric, "user-1");

    expect(supabase.from).not.toHaveBeenCalled();
  });

  it("sends sanitized payload with permitted fields and no query string", () => {
    (globalThis as unknown as { window: unknown }).window = {
      location: {
        pathname: "/e-commerce/products?token=secret123&order_id=456",
      },
      matchMedia: () => ({ matches: false }),
    };

    const validMetric: Metric = {
      name: "FCP",
      value: 850,
      rating: "good",
      delta: 850,
      id: "fcp-test",
      entries: [],
      navigationType: "navigate",
    };

    sendMetric(validMetric, "user-abc");

    expect(supabase.from).toHaveBeenCalledWith("web_vitals_events");

    const insertMock = vi.mocked(supabase.from("web_vitals_events").insert);

    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "user-abc",
        route: "/e-commerce/products",
        metric_rating: "good",
        load_mode: "cold_or_initial",
      }),
    );

    const callArg = insertMock.mock.calls[0][0] as Record<string, unknown>;

    expect(callArg.route).not.toContain("token");
    expect(callArg.route).not.toContain("secret");
    expect(callArg).not.toHaveProperty("token");
    expect(callArg).not.toHaveProperty("order_id");
  });
});
