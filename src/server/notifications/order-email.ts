export interface OrderNotificationInput {
  orderNumber: string;
  total: number;
  shippingFee?: number;
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

function paymentInstructions(input: OrderNotificationInput) {
  if (input.paymentMethod !== "mpesa") return [];
  const paybill = requiredEnv("DAILYGEAR_MPESA_PAYBILL") || "542542";
  const account = requiredEnv("DAILYGEAR_MPESA_ACCOUNT") || "184545";
  const nearbyCounties = new Set(["nairobi", "kiambu", "kajiado"]);
  const outsideNearby = !nearbyCounties.has(input.county.trim().toLowerCase());
  return [
    "M-Pesa payment instructions:",
    `Paybill: ${paybill}`,
    `Account: ${account}`,
    `Amount: ${input.currency} ${input.total.toLocaleString()}`,
    "Use your order number as the payment reference where your M-Pesa screen allows it.",
    "After payment, reply with the M-Pesa transaction code so DailyGear can match and confirm the receipt.",
    outsideNearby
      ? "Your location is outside the Nairobi, Kiambu and Kajiado nearby-delivery area. Paying before dispatch lets us confirm the route and any approved prepayment delivery benefit before fulfilment; no discount is applied unless it is explicitly confirmed."
      : "Your location is within our nearby-delivery area. We will confirm the delivery route and collection or prepayment details with you.",
    "If you prefer pay on delivery, reply to this message and we will confirm whether that option is available for your route.",
  ];
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
    ...(audience === "customer" ? paymentInstructions(input) : []),
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
