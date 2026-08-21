export interface FunnelLandingBenefit {
  title: string;
  body: string;
}

import type { Product } from "@/lib/dailygear/types";

export interface FunnelLandingContent {
  eyebrow: string;
  headline: string;
  subheadline: string;
  benefits: FunnelLandingBenefit[];
  proof: string[];
  deliveryNote: string;
  ctaLabel: string;
}

const MAX_TEXT = 420;
const MAX_SHORT_TEXT = 120;

function clean(value: unknown, fallback: string, limit = MAX_TEXT) {
  if (typeof value !== "string") return fallback;
  const next = value.trim().replace(/\s+/g, " ");
  return next ? next.slice(0, limit) : fallback;
}

function cleanList(value: unknown, fallback: string[], limit = 4) {
  if (!Array.isArray(value)) return fallback;
  const next = value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim().replace(/\s+/g, " ").slice(0, MAX_TEXT))
    .filter(Boolean)
    .slice(0, limit);
  return next.length > 0 ? next : fallback;
}

function cleanBenefits(value: unknown, fallback: FunnelLandingBenefit[]) {
  if (!Array.isArray(value)) return fallback;
  const next = value
    .filter((item): item is { title?: unknown; body?: unknown } =>
      Boolean(item && typeof item === "object"),
    )
    .map((item) => ({
      title: clean(item.title, "Practical by design", MAX_SHORT_TEXT),
      body: clean(item.body, "A clear, useful part of the DailyGear customer journey."),
    }))
    .filter((item) => item.title && item.body)
    .slice(0, 4);
  return next.length > 0 ? next : fallback;
}

export function defaultFunnelLandingContent(productName: string): FunnelLandingContent {
  const isCarryProduct = /backpack|laptop|travel|bag/i.test(productName);
  return {
    eyebrow: isCarryProduct ? "DailyGear carry edit" : "DailyGear product offer",
    headline: isCarryProduct ? "Carry the day with less compromise." : productName,
    subheadline: isCarryProduct
      ? `${productName} for workdays, commutes and short trips—so the essentials stay close and the next step stays simple.`
      : `${productName}, presented clearly with the details you need before you decide.`,
    benefits: isCarryProduct
      ? [
          {
            title: "Keep the essentials together",
            body: "A practical way to bring your everyday work and travel items into one considered carry.",
          },
          {
            title: "Move from work to weekend",
            body: "A versatile choice for the commute, short trips and the days that do not follow one plan.",
          },
          {
            title: "Choose with more confidence",
            body: "See the product, available options and checkout path before you place the order.",
          },
          {
            title: "A clear next step",
            body: "Select your option, review the order and keep delivery and payment details visible.",
          },
        ]
      : [
          {
            title: "Practical by design",
            body: "Focused on a real everyday need, with the key details kept easy to scan.",
          },
          {
            title: "Made for the routine",
            body: "A useful addition to your day, whether you are at home, at work or on the move.",
          },
          {
            title: "Choose with confidence",
            body: "Product information, availability and the next checkout step stay visible.",
          },
          {
            title: "A clear next step",
            body: "Review the order before payment and keep your order details close after checkout.",
          },
        ],
    proof: [
      "Canonical DailyGear product details",
      "Availability checked before checkout",
      "One clear order path",
    ],
    deliveryNote:
      "Delivery and payment options are confirmed in DailyGear checkout before you place the order.",
    ctaLabel: isCarryProduct ? "Choose this bag" : "Continue to checkout",
  };
}

/**
 * Creates a product-specific AIDA draft from the canonical catalogue record.
 * It intentionally uses only fields already maintained and verified in DailyGear;
 * it does not invent product specifications, warranties or delivery promises.
 */
export function improvedFunnelLandingContent(
  product: Pick<Product, "name" | "sku" | "description" | "short_description" | "seo_description">,
): FunnelLandingContent {
  const productName = clean(product.name, "Your DailyGear product", MAX_SHORT_TEXT);
  const verifiedDescription = clean(
    product.seo_description ?? product.short_description ?? product.description,
    `${productName}. Review the verified details, available options and checkout information before you order.`,
  );
  const skuProof = product.sku?.trim()
    ? `SKU ${product.sku.trim()}`
    : "Product details shown clearly";

  return {
    eyebrow: "DailyGear product edit",
    headline: `Choose ${productName} with the details in view.`,
    subheadline: verifiedDescription,
    benefits: [
      {
        title: "Start with verified details",
        body: verifiedDescription,
      },
      {
        title: "Review the available option",
        body: "Choose an available colour, size or SKU where the catalogue provides one before continuing.",
      },
      {
        title: "Keep the order path clear",
        body: "The product, price and delivery or payment note stay visible before you submit the order.",
      },
      {
        title: "Decide with confidence",
        body: "DailyGear checks availability again in the shared checkout before an order is created.",
      },
    ],
    proof: [
      "Verified DailyGear catalogue details",
      skuProof,
      "Availability checked before checkout",
    ],
    deliveryNote:
      "Delivery and payment options are confirmed in DailyGear checkout before you place the order.",
    ctaLabel: "Review and order",
  };
}

export function parseFunnelLandingContent(body: string | null | undefined, productName: string) {
  const fallback = defaultFunnelLandingContent(productName);
  if (!body) return fallback;
  try {
    const parsed: unknown = JSON.parse(body);
    if (!parsed || typeof parsed !== "object") return fallback;
    const value = parsed as Record<string, unknown>;
    return {
      eyebrow: clean(value.eyebrow, fallback.eyebrow, MAX_SHORT_TEXT),
      headline: clean(value.headline, fallback.headline, MAX_SHORT_TEXT),
      subheadline: clean(value.subheadline, fallback.subheadline),
      benefits: cleanBenefits(value.benefits, fallback.benefits),
      proof: cleanList(value.proof, fallback.proof, 4),
      deliveryNote: clean(value.deliveryNote, fallback.deliveryNote),
      ctaLabel: clean(value.ctaLabel, fallback.ctaLabel, MAX_SHORT_TEXT),
    } satisfies FunnelLandingContent;
  } catch {
    return fallback;
  }
}

export function serializeFunnelLandingContent(content: FunnelLandingContent) {
  return JSON.stringify({ version: 1, ...content });
}
