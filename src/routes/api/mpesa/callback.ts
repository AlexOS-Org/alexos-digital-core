import { createFileRoute } from "@tanstack/react-router";
import { handleStkCallback } from "@/server/mpesa/stk.server";

function json(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

/**
 * Safaricom POSTs STK results here. Always return 200 once the body is accepted
 * so Daraja does not retry endlessly on application-level outcomes.
 */
export const Route = createFileRoute("/api/mpesa/callback")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const raw = await request.json().catch(() => null);
          const result = await handleStkCallback(raw);
          return json({ ok: true, ...result });
        } catch (error) {
          console.error("[mpesa/callback]", error);
          // Still 200 so Safaricom stops retrying noisy parse errors after log.
          return json({ ok: false, error: "callback_processing_error" }, 200);
        }
      },
    },
  },
});
