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
    "Your DailyGear picks are still waiting.",
    "",
    "You were one step away from completing your order. Take another look at your selection, confirm the details, and continue when you're ready.",
    "",
    "Your selection:",
    itemLines || "- Your selected items are available on the checkout page.",
    `Subtotal: ${input.currency} ${input.subtotal.toLocaleString()}`,
    "",
    `Continue your order: ${input.orderUrl}`,
    "",
    "Prices and availability are checked again when you place the order. No pressure—if you've changed your mind, you can simply ignore this reminder.",
    "",
    "Need help before ordering? Reply to this email and DailyGear can help you confirm the details.",
    "",
    "DailyGear",
    "Gear chosen for real life.",
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
        `Still thinking it over? Your DailyGear picks are waiting`,
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
