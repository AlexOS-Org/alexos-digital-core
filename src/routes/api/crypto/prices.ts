import { createFileRoute } from "@tanstack/react-router";
import { fetchLiveCryptoPrices } from "@/server/crypto/binance-prices";

function json(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=30",
    },
  });
}

export const Route = createFileRoute("/api/crypto/prices")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const data = await fetchLiveCryptoPrices();
          return json({ ok: true, ...data });
        } catch (error) {
          console.error("[crypto/prices]", error);
          return json({ ok: false, error: "Could not load live crypto prices." }, 502);
        }
      },
    },
  },
});
