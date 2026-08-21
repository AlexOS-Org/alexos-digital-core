import { createFileRoute } from "@tanstack/react-router";
import {
  claimCartSession,
  expireCartSession,
  getAbandonedCartCandidates,
  markCartSessionFollowUpFailed,
  markCartSessionFollowUpSent,
} from "@/lib/storefront/cart-session.server";
import { EmailNotConfiguredError, sendAbandonedCartEmail } from "@/lib/email/abandoned-cart.server";

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

function authorized(request: Request) {
  const expected = process.env.ABANDONED_CART_SCHEDULE_SECRET;
  if (!expected) return false;
  const url = new URL(request.url);
  const querySecret = url.searchParams.get("token");
  const headerSecret = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  return querySecret === expected || headerSecret === expected;
}

export const Route = createFileRoute("/api/scheduled/abandoned-cart")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!authorized(request)) return json({ ok: false, error: "Forbidden" }, 403);

        try {
          if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) {
            return json({ ok: true, skipped: "transactional_email_not_configured" });
          }

          const candidates = await getAbandonedCartCandidates(25);
          let sent = 0;
          let expired = 0;
          let failed = 0;

          for (const candidate of candidates) {
            const session = await claimCartSession(candidate.id);
            if (!session) continue;
            try {
              const result = await sendAbandonedCartEmail(session);
              if (result.sent) {
                await markCartSessionFollowUpSent(session.id);
                sent += 1;
              } else {
                await expireCartSession(session.id);
                expired += 1;
              }
            } catch (error) {
              if (error instanceof EmailNotConfiguredError) {
                await markCartSessionFollowUpFailed(session.id, error.message);
                return json({ ok: true, skipped: "transactional_email_not_configured" });
              }
              failed += 1;
              await markCartSessionFollowUpFailed(
                session.id,
                error instanceof Error ? error.message : "Unknown email error",
              );
            }
          }

          return json({ ok: true, processed: candidates.length, sent, expired, failed });
        } catch (error) {
          return json(
            {
              ok: false,
              error: error instanceof Error ? error.message : "Abandoned-cart job failed.",
              timestamp: new Date().toISOString(),
            },
            500,
          );
        }
      },
    },
  },
});
