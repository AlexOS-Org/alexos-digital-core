import { createFileRoute } from "@tanstack/react-router";
import { getStkStatus } from "@/server/mpesa/stk.server";

function json(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

export const Route = createFileRoute("/api/mpesa/status")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const url = new URL(request.url);
          const result = await getStkStatus({
            orderNumber: url.searchParams.get("orderNumber") ?? undefined,
            phone: url.searchParams.get("phone") ?? undefined,
            checkoutRequestId: url.searchParams.get("checkoutRequestId") ?? undefined,
          });
          if (!result.ok) return json({ ok: false, error: result.error }, 400);
          return json({
            ok: true,
            status: result.status,
            resultDesc: result.resultDesc ?? null,
            receipt: result.receipt ?? null,
            amount: result.amount ?? null,
          });
        } catch (error) {
          console.error("[mpesa/status]", error);
          return json({ ok: false, error: "Could not load STK status." }, 500);
        }
      },
    },
  },
});
