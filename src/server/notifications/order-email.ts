import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import QRCode from "qrcode";
import dailyGearLogo from "@/assets/branding/dailygear-logo.jpg";

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
    imageUrl?: string | null;
  }>;
}

function requiredEnv(name: string) {
  const value = process.env[name]?.trim();
  return value || null;
}

function money(currency: string, value: number) {
  return `${currency} ${Number(value || 0).toLocaleString("en-KE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function wrapText(text: string, maxChars: number) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else current = next;
  }
  if (current) lines.push(current);
  return lines;
}

function paymentInstructions(input: OrderNotificationInput) {
  const nearbyCounties = new Set(["nairobi", "kiambu", "kajiado"]);
  const outsideNearby = !nearbyCounties.has(input.county.trim().toLowerCase());
  if (input.paymentMethod === "mpesa") {
    const paybill = requiredEnv("DAILYGEAR_MPESA_PAYBILL") || "542542";
    const account = requiredEnv("DAILYGEAR_MPESA_ACCOUNT") || "184545";
    return [
      "M-Pesa payment instructions",
      `Paybill ${paybill} · Account ${account} · Amount ${money(input.currency, input.total)}`,
      "Use the order number as your reference where supported and send the confirmation code to DailyGear.",
      outsideNearby
        ? "Your location is outside the nearby Nairobi delivery area. DailyGear will confirm the route and any approved upfront delivery requirement before fulfilment."
        : "Online payment helps DailyGear confirm and prioritise dispatch for the delivery route.",
    ];
  }
  if (input.paymentMethod.toLowerCase().includes("cod")) {
    return [
      "Cash on delivery",
      outsideNearby
        ? "Cash on delivery is intended for Nairobi and its environs. DailyGear will confirm whether your route qualifies before dispatch."
        : "Pay when your order arrives. Keep your phone available so the delivery team can confirm the route.",
      outsideNearby
        ? "Do not send an upfront payment until DailyGear confirms your order and provides the approved instructions."
        : "No online payment is required before delivery unless DailyGear confirms a different arrangement with you.",
    ];
  }
  return [
    `Payment method: ${input.paymentMethod}`,
    "DailyGear will confirm the next payment step with you before fulfilment.",
  ];
}

async function createMpesaQr(input: OrderNotificationInput) {
  if (input.paymentMethod !== "mpesa") return null;
  const paybill = requiredEnv("DAILYGEAR_MPESA_PAYBILL") || "542542";
  const account = requiredEnv("DAILYGEAR_MPESA_ACCOUNT") || "184545";
  const payload = [
    "DailyGear M-Pesa payment instructions",
    `Paybill: ${paybill}`,
    `Account: ${account}`,
    `Amount: ${money(input.currency, input.total)}`,
    `Order: ${input.orderNumber}`,
    "This QR opens payment instructions; it does not trigger an STK Push.",
  ].join("\\n");
  const dataUrl = await QRCode.toDataURL(payload, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 220,
    color: { dark: "#07152f", light: "#ffffff" },
  });
  const encoded = dataUrl.split(",", 2)[1];
  if (!encoded) return null;
  const binary = atob(encoded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function fetchBytes(url: string) {
  try {
    const resolved = url.startsWith("/") ? new URL(url, "https://dailygear.co.ke").toString() : url;
    const response = await fetch(resolved);
    if (!response.ok) return null;
    return {
      bytes: new Uint8Array(await response.arrayBuffer()),
      contentType: response.headers.get("content-type")?.toLowerCase() ?? "",
    };
  } catch {
    return null;
  }
}

async function createOrderPdf(input: OrderNotificationInput) {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595, 842]);
  const mpesaQrBytes = await createMpesaQr(input);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const navy = rgb(0.04, 0.08, 0.18);
  const teal = rgb(0.02, 0.55, 0.52);
  const ink = rgb(0.11, 0.14, 0.19);
  const muted = rgb(0.38, 0.42, 0.48);
  const line = rgb(0.87, 0.89, 0.92);
  const pale = rgb(0.96, 0.98, 0.98);
  const white = rgb(1, 1, 1);
  const pageWidth = 595;
  const left = 42;
  const right = 553;
  const centerTextX = (text: string, size: number, font = regular) =>
    (pageWidth - font.widthOfTextAtSize(text, size)) / 2;
  let cursor = 804;

  page.drawRectangle({ x: 0, y: 734, width: pageWidth, height: 108, color: navy });
  const logoResult = await fetchBytes(dailyGearLogo);
  if (logoResult?.contentType.includes("jpeg") || logoResult?.contentType.includes("jpg")) {
    try {
      const logo = await pdf.embedJpg(logoResult.bytes);
      const ratio = logo.height / logo.width;
      page.drawImage(logo, { x: left, y: 770, width: 92, height: 92 * ratio });
    } catch {
      page.drawText("DAILYGEAR", { x: left, y: 780, size: 20, font: bold, color: white });
    }
  } else {
    page.drawText("DAILYGEAR", { x: left, y: 780, size: 20, font: bold, color: white });
  }
  page.drawText("Sell more. Grow daily.", {
    x: left,
    y: 748,
    size: 8,
    font: regular,
    color: rgb(0.82, 0.9, 0.92),
  });
  const headerTitle = "ORDER CONFIRMATION";
  page.drawText(headerTitle, {
    x: centerTextX(headerTitle, 16, bold),
    y: 783,
    size: 16,
    font: bold,
    color: white,
  });
  page.drawText(input.orderNumber, {
    x: centerTextX(input.orderNumber, 9),
    y: 762,
    size: 9,
    font: regular,
    color: rgb(0.82, 0.9, 0.92),
  });

  cursor = 704;
  const confirmationTitle = "Thank you for your order";
  page.drawText(confirmationTitle, {
    x: centerTextX(confirmationTitle, 18, bold),
    y: cursor,
    size: 18,
    font: bold,
    color: ink,
  });
  const greeting = `Hello ${input.customerName || "Customer"}, your order has been received.`;
  page.drawText(greeting, {
    x: centerTextX(greeting, 10),
    y: cursor - 22,
    size: 10,
    font: regular,
    color: muted,
  });
  const isYjOrder = input.items.some((item) => /YJ Baby|school backpack/i.test(item.name));
  if (isYjOrder) {
    const yjHeadline =
      "Stop the morning scramble. Give your child’s school essentials one reliable place.";
    page.drawText(yjHeadline, {
      x: centerTextX(yjHeadline, 8.5),
      y: cursor - 38,
      size: 8.5,
      font: bold,
      color: teal,
      maxWidth: 511,
    });
  }
  cursor -= isYjOrder ? 70 : 54;

  const firstImage = input.items.find((item) => item.imageUrl)?.imageUrl;
  if (firstImage) {
    const imageResult = await fetchBytes(firstImage);
    if (imageResult) {
      try {
        const image = imageResult.contentType.includes("png")
          ? await pdf.embedPng(imageResult.bytes)
          : imageResult.contentType.includes("jpeg") || imageResult.contentType.includes("jpg")
            ? await pdf.embedJpg(imageResult.bytes)
            : null;
        if (image) {
          const scale = Math.min(150 / image.width, 120 / image.height);
          page.drawImage(image, {
            x: right - image.width * scale,
            y: cursor - image.height * scale + 8,
            width: image.width * scale,
            height: image.height * scale,
          });
        }
      } catch {
        // The PDF remains useful when a remote image is unavailable or unsupported.
      }
    }
  }

  const customerHeading = "Customer and delivery details";
  page.drawText(customerHeading, {
    x: centerTextX(customerHeading, 11, bold),
    y: cursor,
    size: 11,
    font: bold,
    color: ink,
  });
  page.drawText(`Phone: ${input.customerPhone || "—"}`, {
    x: left,
    y: cursor - 18,
    size: 9,
    font: regular,
    color: muted,
  });
  page.drawText(`Email: ${input.customerEmail || "—"}`, {
    x: left,
    y: cursor - 34,
    size: 9,
    font: regular,
    color: muted,
  });
  page.drawText(`Delivery: ${input.town || "—"}, ${input.county || "—"}`, {
    x: left,
    y: cursor - 50,
    size: 9,
    font: regular,
    color: muted,
  });
  page.drawText(`Address: ${input.address || "—"}`, {
    x: left,
    y: cursor - 66,
    size: 9,
    font: regular,
    color: muted,
    maxWidth: 285,
  });
  if (input.deliveryDetails)
    page.drawText(`Note: ${input.deliveryDetails}`, {
      x: left,
      y: cursor - 82,
      size: 8,
      font: regular,
      color: muted,
      maxWidth: 285,
    });
  cursor -= 105;

  page.drawRectangle({ x: left, y: cursor - 22, width: 511, height: 28, color: pale });
  page.drawText("ITEM", { x: 52, y: cursor - 12, size: 8, font: bold, color: muted });
  page.drawText("SKU", { x: 325, y: cursor - 12, size: 8, font: bold, color: muted });
  page.drawText("QTY", { x: 420, y: cursor - 12, size: 8, font: bold, color: muted });
  page.drawText("AMOUNT", { x: 475, y: cursor - 12, size: 8, font: bold, color: muted });
  cursor -= 48;
  for (const item of input.items) {
    const itemLines = wrapText(item.name, 40);
    page.drawText(itemLines[0] || "Item", {
      x: 52,
      y: cursor,
      size: 9,
      font: regular,
      color: ink,
      maxWidth: 255,
    });
    if (itemLines.length > 1)
      page.drawText(itemLines.slice(1).join(" "), {
        x: 52,
        y: cursor - 11,
        size: 8,
        font: regular,
        color: muted,
        maxWidth: 255,
      });
    page.drawText(item.sku || "—", {
      x: 325,
      y: cursor,
      size: 8,
      font: regular,
      color: muted,
      maxWidth: 78,
    });
    page.drawText(String(item.quantity), { x: 425, y: cursor, size: 9, font: regular, color: ink });
    page.drawText(money(input.currency, item.lineTotal), {
      x: 475,
      y: cursor,
      size: 9,
      font: regular,
      color: ink,
    });
    cursor -= itemLines.length > 1 ? 30 : 22;
  }
  page.drawLine({
    start: { x: left, y: cursor + 7 },
    end: { x: right, y: cursor + 7 },
    thickness: 1,
    color: line,
  });
  cursor -= 14;
  const subtotal = input.items.reduce((sum, item) => sum + Number(item.lineTotal || 0), 0);
  const deliveryFee = Math.max(0, Number(input.shippingFee || 0));
  const totals: Array<[string, number]> = [
    ["Subtotal", subtotal],
    [deliveryFee > 0 ? "Delivery" : "Delivery (free)", deliveryFee],
    ["Total", input.total],
  ];
  for (const [label, amount] of totals) {
    const totalRow = label === "Total";
    page.drawText(label, {
      x: 385,
      y: cursor,
      size: totalRow ? 11 : 9,
      font: totalRow ? bold : regular,
      color: totalRow ? ink : muted,
    });
    page.drawText(money(input.currency, amount), {
      x: 475,
      y: cursor,
      size: totalRow ? 11 : 9,
      font: totalRow ? bold : regular,
      color: totalRow ? teal : ink,
    });
    cursor -= totalRow ? 27 : 19;
  }

  const paymentLines = paymentInstructions(input);
  const paymentBoxHeight = input.paymentMethod === "mpesa" && mpesaQrBytes ? 104 : 78;
  page.drawRectangle({
    x: left,
    y: cursor - paymentBoxHeight - 10,
    width: 511,
    height: paymentBoxHeight,
    color: pale,
    borderColor: line,
    borderWidth: 1,
  });
  const paymentHeading = paymentLines[0] || "Payment instructions";
  page.drawText(paymentHeading, {
    x: centerTextX(paymentHeading, 9, bold),
    y: cursor - 26,
    size: 9,
    font: bold,
    color: ink,
  });
  paymentLines.slice(1).forEach((text, index) => {
    page.drawText(text, {
      x: 56,
      y: cursor - 44 - index * 15,
      size: 7.5,
      font: regular,
      color: index === 0 && input.paymentMethod === "mpesa" ? teal : muted,
      maxWidth: mpesaQrBytes ? 360 : 475,
    });
  });
  if (mpesaQrBytes) {
    try {
      const qr = await pdf.embedPng(mpesaQrBytes);
      page.drawImage(qr, { x: 466, y: cursor - 86, width: 70, height: 70 });
      page.drawText("Scan for details", {
        x: 464,
        y: cursor - 96,
        size: 6.5,
        font: regular,
        color: muted,
      });
    } catch {
      // Keep the payment text when QR embedding is unavailable.
    }
  }
  cursor -= paymentBoxHeight + 28;
  page.drawText(
    "This document confirms the order details. It is not proof of payment unless payment is separately confirmed.",
    { x: left, y: cursor, size: 7.5, font: bold, color: muted, maxWidth: 511 },
  );
  page.drawText("Thank you for choosing DailyGear.", {
    x: left,
    y: cursor - 20,
    size: 9,
    font: regular,
    color: muted,
  });
  page.drawText(
    `${requiredEnv("DAILYGEAR_EMAIL_FROM") || "DailyGear"} · ${requiredEnv("DAILYGEAR_SUPPORT_PHONE") || "0722658824"}`,
    { x: left, y: 32, size: 8, font: regular, color: muted },
  );

  return pdf.save();
}

function plainText(input: OrderNotificationInput, audience: "customer" | "owner") {
  const greeting =
    audience === "customer" ? `Hello ${input.customerName},` : "Hello DailyGear team,";
  const itemLines = input.items
    .map(
      (item) =>
        `- ${item.name}${item.sku ? ` (SKU ${item.sku})` : ""} × ${item.quantity} — ${money(input.currency, item.lineTotal)}`,
    )
    .join("\n");
  return [
    greeting,
    "",
    audience === "customer"
      ? "Your DailyGear order has been received. A branded PDF confirmation is attached."
      : "A new DailyGear order is ready for fulfilment review:",
    "",
    `Order number: ${input.orderNumber}`,
    `Order total: ${money(input.currency, input.total)}`,
    `Payment method: ${input.paymentMethod.toUpperCase()}`,
    "",
    "What you ordered:",
    itemLines || "- Item details are available in the Orders workspace.",
    "",
    "Where we're delivering:",
    `${input.county} — ${input.town}`,
    `Address: ${input.address}`,
    input.deliveryDetails ? `Delivery details: ${input.deliveryDetails}` : "",
    ...(audience === "customer" ? paymentInstructions(input) : []),
    "",
    audience === "customer"
      ? "DailyGear will contact you to confirm delivery and payment collection where applicable."
      : `Customer phone: ${input.customerPhone}`,
    input.customerEmail ? `Customer email: ${input.customerEmail}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function toBase64(bytes: Uint8Array) {
  let binary = "";
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }
  return btoa(binary);
}

async function sendEmail(
  apiKey: string,
  from: string,
  to: string,
  subject: string,
  text: string,
  pdf: Uint8Array,
  orderNumber: string,
) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      text,
      attachments: [{ filename: `dailygear-order-${orderNumber}.pdf`, content: toBase64(pdf) }],
    }),
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

  const pdf = await createOrderPdf(input);
  if (input.customerEmail)
    await sendEmail(
      apiKey,
      from,
      input.customerEmail,
      `Order ${input.orderNumber} is confirmed | DailyGear`,
      plainText(input, "customer"),
      pdf,
      input.orderNumber,
    );
  if (input.ownerEmail && input.ownerEmail !== input.customerEmail)
    await sendEmail(
      apiKey,
      from,
      input.ownerEmail,
      `New DailyGear order ${input.orderNumber}`,
      plainText(input, "owner"),
      pdf,
      input.orderNumber,
    );
  return { sent: true as const, recipients };
}
