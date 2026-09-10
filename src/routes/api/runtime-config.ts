import { createFileRoute } from "@tanstack/react-router";

function json(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}

export const Route = createFileRoute("/api/runtime-config")({
  server: {
    handlers: {
      GET: () => {
        const url = process.env.SUPABASE_URL?.trim();
        const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY?.trim();

        if (!url || !publishableKey) {
          return json(
            {
              ok: false,
              error: "Supabase browser configuration is unavailable.",
            },
            503,
          );
        }

        return json({
          ok: true,
          supabaseUrl: url,
          supabasePublishableKey: publishableKey,
        });
      },
    },
  },
});
