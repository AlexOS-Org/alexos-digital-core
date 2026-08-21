export interface OrderNotificationInput {
  orderNumber: string;
  total: number;
  currency: string;
  paymentMethod: string;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string;
  county: string;
  town: string;
  address: string;
  deliveryDetails: string | null;
  ownerEmail: string | null;
  items: Array<{
    name: string;
    sku: string | null;
    quantity: number;
    lineTotal: number;
  }>;
}

function requiredEnv(name: string) {
  const value = process.env[name]?.trim();
  return value || null;
}

function plainText(input: OrderNotificationInput, audience: "customer" | "owner") {
  const greeting =
    audience === "customer" ? `Hello ${input.customerName},` : "Hello DailyGear team,";
  const itemLines = input.items
    .map(
      (item) =>
        `- ${item.name}${item.sku ? ` (SKU ${item.sku})` : ""} × ${item.quantity} — ${input.currency} ${item.lineTotal.toLocaleString()}`,
    )
    .join("\n");
  return [
    greeting,
    "",
    audience === "customer"
      ? "We have received your DailyGear order. Keep this reference for delivery support:"
      : "A new DailyGear order was received and needs fulfilment:",
    `Order: ${input.orderNumber}`,
    `Total: ${input.currency} ${input.total.toLocaleString()}`,
    `Payment method: ${input.paymentMethod.toUpperCase()}`,
    "",
    "Items:",
    itemLines || "- Item details are available in the Orders workspace.",
    "",
    `Delivery: ${input.county} — ${input.town}`,
    `Address: ${input.address}`,
    input.deliveryDetails ? `Delivery details: ${input.deliveryDetails}` : "",
    `Customer phone: ${input.customerPhone}`,
    input.customerEmail ? `Customer email: ${input.customerEmail}` : "",
    "",
    audience === "customer"
      ? "DailyGear will contact you to confirm delivery and payment collection where applicable."
      : "Review the order in AlexOS before fulfilment. Payment status remains separate from order creation.",
  ]
    .filter(Boolean)
    .join("\n");
}

async function sendEmail(apiKey: string, from: string, to: string, subject: string, text: string) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to: [to], subject, text }),
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `Order email provider rejected the message (${response.status}): ${detail.slice(0, 240)}`,
    );
  }
}

export async function sendOrderNotifications(input: OrderNotificationInput) {
  const apiKey = requiredEnv("RESEND_API_KEY");
  const from = requiredEnv("DAILYGEAR_EMAIL_FROM");
  const recipients = [
    ...new Set([input.customerEmail, input.ownerEmail].filter(Boolean)),
  ] as string[];
  if (!apiKey || !from || recipients.length === 0) {
    return {
      sent: false as const,
      reason: !apiKey
        ? "RESEND_API_KEY is not configured"
        : !from
          ? "DAILYGEAR_EMAIL_FROM is not configured"
          : "No order notification recipient is available",
    };
  }

  if (input.customerEmail) {
    await sendEmail(
      apiKey,
      from,
      input.customerEmail,
      `DailyGear order received — ${input.orderNumber}`,
      plainText(input, "customer"),
    );
  }
  if (input.ownerEmail && input.ownerEmail !== input.customerEmail) {
    await sendEmail(
      apiKey,
      from,
      input.ownerEmail,
      `New DailyGear order — ${input.orderNumber}`,
      plainText(input, "owner"),
    );
  }

  return { sent: true as const, recipients };
}
