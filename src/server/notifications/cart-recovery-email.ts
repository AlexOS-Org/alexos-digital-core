import {
  claimCartSession,
  expireCartSession,
  getAbandonedCartCandidates,
  markCartSessionFollowUpFailed,
  markCartSessionFollowUpSent,
  resolveSessionCartForEmail,
} from "@/lib/storefront/cart-session.server";

function requiredEnv(name: string) {
  const value = process.env[name]?.trim();
  return value || null;
}

function recoveryOrigin() {
  return requiredEnv("DAILYGEAR_PUBLIC_URL") ?? "https://dailygear.co.ke";
}

function buildText(input: {
  firstName: string | null;
  orderUrl: string;
  currency: string;
  subtotal: number;
  items: Array<{ name: string; quantity: number; price: number }>;
}) {
  const greeting = input.firstName ? `Hello ${input.firstName},` : "Hello,";
  const itemLines = input.items
    .map(
      (item) =>
        `- ${item.name} × ${item.quantity} — ${input.currency} ${(item.price * item.quantity).toLocaleString()}`,
    )
    .join("\n");

  return [
    greeting,
    "",
    "You were close to checking out at DailyGear. Your selected items are still saved so you can pick up where you left off without rebuilding your basket.",
    "",
    "Your saved bag:",
    itemLines || "- Your selected items are available on the checkout page.",
    `Subtotal: ${input.currency} ${input.subtotal.toLocaleString()}`,
    "",
    "Why finish now?",
    "- Your basket is already prepared.",
    "- Product availability and prices are checked again before the order is placed.",
    "- You can review your delivery details before committing to the purchase.",
    "",
    `Continue your order: ${input.orderUrl}`,
    "",
    "No pressure: if you changed your mind, you can ignore this reminder. If something stopped you at checkout, reply to this email and tell us what you need help with.",
    "",
    "DailyGear",
  ].join("\n");
}

async function sendEmail(apiKey: string, from: string, to: string, subject: string, text: string) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [to], subject, text }),
  });
  if (!response.ok)
    throw new Error(`Recovery email provider rejected the message (${response.status})`);
}

export async function processAbandonedCartFollowUps(limit = 25) {
  const apiKey = requiredEnv("RESEND_API_KEY");
  const from = requiredEnv("DAILYGEAR_EMAIL_FROM");
  if (!apiKey || !from) return { processed: 0, sent: 0, skipped: "email_not_configured" as const };

  const candidates = await getAbandonedCartCandidates(limit);
  let sent = 0;
  for (const candidate of candidates) {
    const claimed = await claimCartSession(candidate.id);
    if (!claimed) continue;
    try {
      const resolved = await resolveSessionCartForEmail(claimed.storefront_id, claimed.cart_json);
      if (resolved.lines.length === 0) {
        await expireCartSession(claimed.id);
        continue;
      }
      const token = claimed.session_token_hash;
      const url = `${recoveryOrigin()}/shop/checkout?recovery=${encodeURIComponent(token)}`;
      await sendEmail(
        apiKey,
        from,
        claimed.email,
        `Still thinking it over? Your DailyGear bag is saved`,
        buildText({
          firstName: claimed.first_name,
          orderUrl: url,
          currency: claimed.currency,
          subtotal: resolved.subtotal,
          items: resolved.lines.map((line) => ({
            name: line.name,
            quantity: line.quantity,
            price: line.price,
          })),
        }),
      );
      await markCartSessionFollowUpSent(claimed.id);
      sent += 1;
    } catch (error) {
      await markCartSessionFollowUpFailed(
        claimed.id,
        error instanceof Error ? error.message : "Recovery email failed",
      );
    }
  }
  return { processed: candidates.length, sent };
}
