import handler from "@tanstack/react-start/server-entry";
import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

const WORKER_ENV_KEYS = [
  "SUPABASE_URL",
  "SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "RESEND_API_KEY",
  "DAILYGEAR_EMAIL_FROM",
  "DAILYGEAR_PUBLIC_URL",
  "RESEND_REPLY_TO_EMAIL",
  "META_WEBHOOK_VERIFY_TOKEN",
  "META_APP_SECRET",
  "ABANDONED_CART_SCHEDULE_SECRET",
  "MPESA_CONSUMER_KEY",
  "MPESA_CONSUMER_SECRET",
  "MPESA_PASSKEY",
  "MPESA_SHORTCODE",
  "MPESA_ENVIRONMENT",
  "MPESA_CALLBACK_URL",
  "MPESA_TRANSACTION_TYPE",
  "DAILYGEAR_MPESA_PAYBILL",
  "DAILYGEAR_MPESA_ACCOUNT",
] as const;

function hydrateProcessEnv(env: unknown): void {
  if (typeof process === "undefined" || !env || typeof env !== "object") return;

  const bindings = env as Record<string, unknown>;
  for (const key of WORKER_ENV_KEYS) {
    const value = bindings[key];
    if (typeof value === "string" && value.length > 0) process.env[key] = value;
  }
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

function nairobiDateKey(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Nairobi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      hydrateProcessEnv(env);
      const response = await handler.fetch(request);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
  async scheduled(controller: { cron: string }, env: unknown) {
    try {
      hydrateProcessEnv(env);
      if (controller.cron === "*/30 * * * *") {
        const { refreshAurenEvidence } = await import("@/server/auren/live-evidence-refresh");
        const refresh = await refreshAurenEvidence();
        console.info("Scheduled Auren evidence refresh completed", refresh);
      }

      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { processAbandonedCartFollowUps } =
        await import("@/server/notifications/cart-recovery-email");
      const { error } = await supabaseAdmin.rpc(
        "money_post_due_salary_schedules" as never,
        {
          p_run_date: nairobiDateKey(),
        } as never,
      );
      if (error) throw error;
      const recovery = await processAbandonedCartFollowUps(25);
      const { data: purgedOrders, error: purgeError } = await supabaseAdmin.rpc(
        "dg_purge_expired_order_trash" as never,
      );
      if (purgeError) throw purgeError;
      console.info("Scheduled salary, cart recovery, and order Trash jobs completed", {
        runDate: nairobiDateKey(),
        recovery,
        purgedOrders: Number(purgedOrders ?? 0),
      });
    } catch (error) {
      console.error("Scheduled AlexOS maintenance failed", error);
      throw error;
    }
  },
};
