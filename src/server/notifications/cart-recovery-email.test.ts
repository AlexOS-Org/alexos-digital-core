import { beforeEach, describe, expect, it, vi } from "vitest";

const recoveryMocks = vi.hoisted(() => ({
  getAbandonedCartCandidates: vi.fn(),
  claimCartSession: vi.fn(),
  resolveSessionCartForEmail: vi.fn(),
  expireCartSession: vi.fn(),
  markCartSessionFollowUpSent: vi.fn(),
  markCartSessionFollowUpFailed: vi.fn(),
}));

vi.mock("@/lib/storefront/cart-session.server", () => recoveryMocks);

import { processAbandonedCartFollowUps } from "./cart-recovery-email";

describe("abandoned checkout recovery email", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.RESEND_API_KEY = "re_mock_only";
    process.env.DAILYGEAR_EMAIL_FROM = "DailyGear <test@example.test>";
    process.env.DAILYGEAR_PUBLIC_URL = "https://dailygear.test";
    globalThis.fetch = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
  });

  it("claims a candidate, sends one Resend email, and marks it sent", async () => {
    const candidate = {
      id: "session-1",
      storefront_id: "store-1",
      store_slug: "dailygear",
      session_token_hash: "a".repeat(64),
      email: "customer@example.test",
      first_name: "Amina",
      currency: "KES",
      cart_json: [{ productId: "product-1", variantId: null, quantity: 1 }],
    };
    recoveryMocks.getAbandonedCartCandidates.mockResolvedValue([candidate]);
    recoveryMocks.claimCartSession.mockResolvedValue(candidate);
    recoveryMocks.resolveSessionCartForEmail.mockResolvedValue({
      subtotal: 3950,
      lines: [{ name: "NAVIFORCE NF5060", quantity: 1, price: 3950 }],
    });

    const result = await processAbandonedCartFollowUps(10);

    expect(result).toEqual({ processed: 1, sent: 1 });
    expect(recoveryMocks.claimCartSession).toHaveBeenCalledWith("session-1");
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "https://api.resend.com/emails",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: "Bearer re_mock_only" }),
      }),
    );
    const request = vi.mocked(globalThis.fetch).mock.calls[0]?.[1];
    expect(String(request?.body)).toContain("Amina");
    expect(String(request?.body)).toContain("https://dailygear.test/shop/checkout?recovery=");
    expect(recoveryMocks.markCartSessionFollowUpSent).toHaveBeenCalledWith("session-1");
    expect(recoveryMocks.markCartSessionFollowUpFailed).not.toHaveBeenCalled();
  });

  it("records a failed send and does not mark the session sent", async () => {
    const candidate = {
      id: "session-2",
      storefront_id: "store-1",
      store_slug: "dailygear",
      session_token_hash: "b".repeat(64),
      email: "customer@example.test",
      first_name: null,
      currency: "KES",
      cart_json: [{ productId: "product-2", variantId: null, quantity: 1 }],
    };
    recoveryMocks.getAbandonedCartCandidates.mockResolvedValue([candidate]);
    recoveryMocks.claimCartSession.mockResolvedValue(candidate);
    recoveryMocks.resolveSessionCartForEmail.mockResolvedValue({
      subtotal: 1000,
      lines: [{ name: "Test item", quantity: 1, price: 1000 }],
    });
    globalThis.fetch = vi.fn().mockResolvedValue(new Response("rejected", { status: 401 }));

    const result = await processAbandonedCartFollowUps(10);

    expect(result).toEqual({ processed: 1, sent: 0 });
    expect(recoveryMocks.markCartSessionFollowUpSent).not.toHaveBeenCalled();
    expect(recoveryMocks.markCartSessionFollowUpFailed).toHaveBeenCalledWith(
      "session-2",
      expect.stringContaining("401"),
    );
  });
});
