import { beforeEach, describe, expect, it, vi } from "vitest";

const state = {
  attemptStatus: "pending",
  attemptId: "attempt-1",
  checkoutRequestId: "ws_CO_123",
  merchantRequestId: "ws_MR_123",
  rpcResult: {} as { status: string; paymentId?: string; moneyTransactionId?: string },
  rpcCalls: 0,
  stkInitiated: false,
};

function result<T>(data: T, error: null = null) {
  return { data, error };
}

const supabaseAdmin = {
  from(table: string) {
    if (table === "dg_mpesa_stk_attempts") {
      return {
        select: () => ({
          eq: (_column: string, value: string) => ({
            maybeSingle: async () =>
              result(
                state.attemptStatus === "missing"
                  ? null
                  : {
                      id: state.attemptId,
                      status: state.attemptStatus,
                      checkout_request_id: state.checkoutRequestId,
                      merchant_request_id: state.merchantRequestId,
                    },
              ),
          }),
          order: () => ({
            limit: () => ({ maybeSingle: async () => result(null) }),
          }),
        }),
        update: () => ({ eq: async () => result(null) }),
        insert: (payload: Record<string, unknown>) => ({
          select: () => ({
            single: async () => {
              expect(payload.amount).toBe(1200);
              state.stkInitiated = true;
              return result({ id: state.attemptId });
            },
          }),
        }),
      };
    }
    if (table === "dg_orders") {
      return {
        select: () => ({
          eq: () => ({
            is: () => ({
              maybeSingle: async () =>
                result({
                  id: "order-1",
                  order_number: "DG-TEST-1",
                  total: 1200,
                  currency: "KES",
                  payment_status: "partial",
                  payment_method: "mpesa",
                  customer_id: "customer-1",
                  deleted_at: null,
                }),
            }),
          }),
        }),
      };
    }
    if (table === "dg_customers") {
      return {
        select: () => ({
          eq: () => ({ maybeSingle: async () => result({ phone: "0712345678" }) }),
        }),
      };
    }
    throw new Error(`Unexpected mocked table: ${table}`);
  },
  rpc: async (name: string, args: Record<string, unknown>) => {
    expect(name).toBe("dg_settle_mpesa_stk_success");
    expect(args).toEqual({ p_attempt_id: state.attemptId });
    state.rpcCalls += 1;
    return result(state.rpcResult);
  },
};

vi.mock("@/integrations/supabase/client.server", () => ({ supabaseAdmin }));

const { handleStkCallback, initiateOrderStkPush } = await import("./stk.server");

const successfulCallback = {
  Body: {
    stkCallback: {
      MerchantRequestID: "ws_MR_123",
      CheckoutRequestID: "ws_CO_123",
      ResultCode: 0,
      ResultDesc: "The service request is processed successfully.",
      CallbackMetadata: {
        Item: [
          { Name: "Amount", Value: 1200 },
          { Name: "MpesaReceiptNumber", Value: "RCP123456" },
          { Name: "PhoneNumber", Value: 254712345678 },
          { Name: "TransactionDate", Value: 20260926170000 },
        ],
      },
    },
  },
};

describe("synthetic M-Pesa checkout and settlement", () => {
  beforeEach(() => {
    state.attemptStatus = "pending";
    state.rpcResult = { status: "settled", paymentId: "payment-1", moneyTransactionId: "tx-1" };
    state.rpcCalls = 0;
    state.stkInitiated = false;
    vi.stubEnv("MPESA_CONSUMER_KEY", "synthetic-key");
    vi.stubEnv("MPESA_CONSUMER_SECRET", "synthetic-secret");
    vi.stubEnv("MPESA_PASSKEY", "synthetic-passkey");
    vi.stubEnv("MPESA_SHORTCODE", "174379");
    vi.stubEnv("MPESA_ENVIRONMENT", "sandbox");
  });

  it("initiates a checkout attempt, settles one success, and prevents replay duplication", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ access_token: "synthetic-token", expires_in: "3600" })),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            MerchantRequestID: "ws_MR_123",
            CheckoutRequestID: "ws_CO_123",
            ResponseCode: "0",
            ResponseDescription: "Success",
            CustomerMessage: "Success. Request accepted for processing",
          }),
        ),
      ) as typeof fetch;

    const initiated = await initiateOrderStkPush({ orderNumber: "DG-TEST-1", phone: "0712345678" });
    expect(initiated.ok).toBe(true);
    expect(state.stkInitiated).toBe(true);

    const settled = await handleStkCallback(successfulCallback);
    expect(settled).toEqual({ ok: true, status: "success:settled" });
    expect(state.rpcCalls).toBe(1);

    state.attemptStatus = "success";
    const replay = await handleStkCallback(successfulCallback);
    expect(replay).toEqual({ ok: true, status: "already_success" });
    expect(state.rpcCalls).toBe(1);

    globalThis.fetch = originalFetch;
  });

  it("surfaces a safe amount-mismatch settlement result without duplicating a receipt", async () => {
    state.rpcResult = { status: "amount_mismatch" };
    const outcome = await handleStkCallback(successfulCallback);
    expect(outcome).toEqual({ ok: true, status: "success:amount_mismatch" });
    expect(state.rpcCalls).toBe(1);
  });

  it("does not call settlement for an unknown checkout", async () => {
    state.attemptStatus = "missing";
    const outcome = await handleStkCallback(successfulCallback);
    expect(outcome).toEqual({ ok: true, status: "unknown_attempt" });
    expect(state.rpcCalls).toBe(0);
  });
});
