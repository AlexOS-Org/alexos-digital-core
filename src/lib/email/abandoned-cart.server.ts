import {
  resolveSessionCartForEmail,
  type RecoveryCartLine,
} from "@/lib/storefront/cart-session.server";

type AbandonedCartSession = {
  id: string;
  storefront_id: string;
  session_token_hash: string;
  email: string;
  first_name: string | null;
  cart_json: unknown;
  currency: string;
};

export class EmailNotConfiguredError extends Error {
  constructor() {
    super("Transactional email is not configured.");
    this.name = "EmailNotConfiguredError";
  }
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function money(value: number, currency: string) {
  return `${currency} ${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function recoveryUrl(token: string) {
  const base = process.env.DAILYGEAR_PUBLIC_URL || "https://dailygear.co.ke";
  return `${base.replace(/\/$/, "")}/shop/checkout?recovery=${encodeURIComponent(token)}`;
}

function renderEmail(
  session: Pick<AbandonedCartSession, "first_name" | "currency" | "session_token_hash">,
  lines: RecoveryCartLine[],
) {
  const name = escapeHtml(session.first_name || "there");
  const currency = escapeHtml(session.currency || "KES");
  const link = recoveryUrl(session.session_token_hash);
  const total = lines.reduce((sum, line) => sum + line.price * line.quantity, 0);
  const rows = lines
    .map(
      (line) =>
        `<li style="margin:0 0 10px"><strong>${escapeHtml(line.name)}</strong> × ${line.quantity}<br><span style="color:#64748b">${money(line.price * line.quantity, session.currency || "KES")}</span></li>`,
    )
    .join("");
  const textRows = lines
    .map(
      (line) =>
        `${line.quantity} × ${line.name} — ${money(line.price * line.quantity, session.currency || "KES")}`,
    )
    .join("\n");

  return {
    subject: "Your DailyGear bag is still waiting",
    text: `Hi ${session.first_name || "there"},\n\nYou left these items in your DailyGear bag:\n${textRows}\n\nCurrent subtotal: ${money(total, session.currency || "KES")}\n\nContinue checkout: ${link}\n\nThis is the one reminder you requested. If the items or availability have changed, the checkout page will show the current information.`,
    html: `<!doctype html><html><body style="margin:0;background:#f8fafc;color:#0f172a;font-family:Arial,sans-serif"><div style="max-width:560px;margin:0 auto;padding:32px 20px"><div style="background:#0f172a;color:#fff;border-radius:18px;padding:22px 24px"><div style="font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#cbd5e1">DailyGear</div><h1 style="margin:10px 0 0;font-size:25px;line-height:1.2">Your bag is still waiting</h1></div><div style="background:#fff;border-radius:18px;padding:24px;margin-top:14px;border:1px solid #e2e8f0"><p>Hi ${name},</p><p>You left these items in your DailyGear bag. We are sending the one reminder you requested.</p><ul style="padding-left:20px">${rows}</ul><p style="font-weight:700">Current subtotal: ${escapeHtml(money(total, session.currency || "KES"))}</p><p style="color:#475569">Prices and availability are checked again when you return to checkout.</p><p><a href="${link}" style="display:inline-block;background:#0f172a;color:#fff;text-decoration:none;padding:13px 18px;border-radius:10px;font-weight:700">Continue checkout</a></p></div><p style="color:#64748b;font-size:12px;line-height:1.5">This is a single reminder for a checkout you started on DailyGear. No further reminders will be sent for this session.</p></div></body></html>`,
  };
}

export async function sendAbandonedCartEmail(session: AbandonedCartSession) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) throw new EmailNotConfiguredError();

  const resolved = await resolveSessionCartForEmail(session.storefront_id, session.cart_json);
  if (resolved.lines.length === 0)
    return { sent: false as const, reason: "no_available_items" as const };
  const content = renderEmail(session, resolved.lines);
  const replyTo = process.env.RESEND_REPLY_TO_EMAIL;
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [session.email],
      subject: content.subject,
      html: content.html,
      text: content.text,
      ...(replyTo ? { reply_to: replyTo } : {}),
    }),
  });

  if (!response.ok) {
    const details = (await response.text()).slice(0, 500);
    throw new Error(
      `Transactional email provider rejected the message (${response.status}): ${details}`,
    );
  }
  return { sent: true as const };
}
