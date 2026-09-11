import { createFileRoute } from "@tanstack/react-router";
import { initiateOrderStkPush } from "@/server/mpesa/stk.server";

function json(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

export const Route = createFileRoute("/api/mpesa/stk-push")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
          const orderNumber = typeof body?.orderNumber === "string" ? body.orderNumber : "";
          const phone = typeof body?.phone === "string" ? body.phone : "";
          const result = await initiateOrderStkPush({ orderNumber, phone });
          if (!result.ok) {
            return json(
              { ok: false, error: result.error, configured: result.configured ?? true },
              result.status,
            );
          }
          return json({
            ok: true,
            checkoutRequestId: result.checkoutRequestId,
            merchantRequestId: result.merchantRequestId,
            customerMessage: result.customerMessage,
            amount: result.amount,
            phone: result.phone,
            attemptId: result.attemptId,
          });
        } catch (error) {
          console.error("[mpesa/stk-push]", error);
          return json({ ok: false, error: "Could not start M-Pesa payment." }, 500);
        }
      },
    },
  },
});
