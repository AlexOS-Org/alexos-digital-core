import { describe, expect, it } from "vitest";
import { BASELINE_SECURITY_HEADERS, withSecurityHeaders } from "./headers";

describe("withSecurityHeaders", () => {
  it("adds baseline browser security headers without replacing existing response headers", () => {
    const response = withSecurityHeaders(
      new Response("ok", {
        headers: { "content-type": "text/plain", "x-existing": "keep" },
      }),
    );

    expect(response.headers.get("content-type")).toBe("text/plain");
    expect(response.headers.get("x-existing")).toBe("keep");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(response.headers.get("x-frame-options")).toBe("SAMEORIGIN");
    expect(response.headers.get("referrer-policy")).toBe("strict-origin-when-cross-origin");
    expect(response.headers.get("permissions-policy")).toBe(
      "camera=(), microphone=(), geolocation=()",
    );
  });

  it("preserves response status and statusText", () => {
    const response = withSecurityHeaders(
      new Response("not found", {
        status: 404,
        statusText: "Item Not Found",
      }),
    );

    expect(response.status).toBe(404);
    expect(response.statusText).toBe("Item Not Found");
  });

  it("preserves response body content", async () => {
    const originalBody = JSON.stringify({ message: "secure payload", count: 42 });
    const response = withSecurityHeaders(
      new Response(originalBody, {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    expect(await response.text()).toBe(originalBody);
  });

  it("does not overwrite caller-provided security header values", () => {
    const response = withSecurityHeaders(
      new Response("ok", {
        headers: {
          "x-frame-options": "DENY",
          "referrer-policy": "no-referrer",
          "permissions-policy": "camera=(self)",
        },
      }),
    );

    expect(response.headers.get("x-frame-options")).toBe("DENY");
    expect(response.headers.get("referrer-policy")).toBe("no-referrer");
    expect(response.headers.get("permissions-policy")).toBe("camera=(self)");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
  });

  it("preserves caller-supplied casing when matching existing headers", () => {
    const response = withSecurityHeaders(
      new Response("ok", {
        headers: {
          "X-Frame-Options": "DENY",
        },
      }),
    );

    expect(response.headers.get("x-frame-options")).toBe("DENY");
  });

  it("preserves unrelated custom headers", () => {
    const response = withSecurityHeaders(
      new Response("ok", {
        headers: {
          "x-request-id": "req-12345",
          "cache-control": "private, no-cache",
        },
      }),
    );

    expect(response.headers.get("x-request-id")).toBe("req-12345");
    expect(response.headers.get("cache-control")).toBe("private, no-cache");
  });

  it("handles null-body status codes safely (204, 304)", () => {
    const response204 = withSecurityHeaders(
      new Response(null, {
        status: 204,
        statusText: "No Content",
      }),
    );

    expect(response204.status).toBe(204);
    expect(response204.body).toBeNull();
    expect(response204.headers.get("x-content-type-options")).toBe("nosniff");

    const response304 = withSecurityHeaders(
      new Response(null, {
        status: 304,
        statusText: "Not Modified",
      }),
    );

    expect(response304.status).toBe(304);
  });

  it("does not mutate the original response headers", () => {
    const original = new Response("ok");
    withSecurityHeaders(original);

    expect(original.headers.get("x-content-type-options")).toBeNull();
  });

  it("exports baseline security headers dictionary", () => {
    expect(BASELINE_SECURITY_HEADERS["x-content-type-options"]).toBe("nosniff");
    expect(BASELINE_SECURITY_HEADERS["x-frame-options"]).toBe("SAMEORIGIN");
  });
});
