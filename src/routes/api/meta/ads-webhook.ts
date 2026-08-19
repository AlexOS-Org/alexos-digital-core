import { createFileRoute } from "@tanstack/react-router";
import {
  clearDailyGearAdsManagerCache,
  syncDailyGearAdsManager,
} from "@/server/meta/dailygear-ads-manager-sync";
import {
  parseDailyGearAdsWebhook,
  verifyMetaWebhookSignature,
} from "@/server/meta/dailygear-ads-webhook";

function json(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

export const Route = createFileRoute("/api/meta/ads-webhook")({
  server: {
    handlers: {
      GET: ({ request }) => {
        const url = new URL(request.url);
        const mode = url.searchParams.get("hub.mode");
        const token = url.searchParams.get("hub.verify_token");
        const challenge = url.searchParams.get("hub.challenge");
        const expectedToken = process.env.META_WEBHOOK_VERIFY_TOKEN;
        if (
          mode === "subscribe" &&
          token &&
          challenge &&
          expectedToken &&
          token === expectedToken
        ) {
          return new Response(challenge, {
            status: 200,
            headers: { "Content-Type": "text/plain", "Cache-Control": "no-store" },
          });
        }
        return new Response("Forbidden", { status: 403 });
      },
      POST: async ({ request }) => {
        const rawBody = await request.text();
        const appSecret = process.env.META_APP_SECRET;
        const signature = request.headers.get("x-hub-signature-256");
        if (!appSecret || !verifyMetaWebhookSignature(rawBody, signature, appSecret)) {
          return json({ ok: false, error: "Invalid webhook signature." }, 401);
        }

        const event = parseDailyGearAdsWebhook(rawBody);
        if (!event) return json({ ok: false, error: "Unsupported or unauthorized event." }, 202);
        if (event.duplicate) return json({ ok: true, duplicate: true });

        clearDailyGearAdsManagerCache();
        void syncDailyGearManagerAfterWebhook(event.accountIds);
        return json({
          ok: true,
          accepted: true,
          accountIds: event.accountIds,
          fields: event.fields,
        });
      },
    },
  },
});

let refreshPromise: Promise<void> | null = null;

async function syncDailyGearManagerAfterWebhook(accountIds: readonly string[]): Promise<void> {
  if (refreshPromise) return refreshPromise;
  refreshPromise = syncDailyGearAdsManager({
    accountIds,
    datePreset: "this_month",
    includeInsights: true,
    maxPages: 10,
    forceRefresh: true,
  })
    .then(() => undefined)
    .catch((error: unknown) => {
      console.error("[Meta Ads Webhook] Background refresh failed", error);
    })
    .finally(() => {
      refreshPromise = null;
    });
  return refreshPromise;
}
