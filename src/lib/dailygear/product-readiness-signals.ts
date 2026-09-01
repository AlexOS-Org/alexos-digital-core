import { assessProductReadiness } from "./product-readiness";
import type { IntelligenceContext, IntelligenceInsight, Product } from "./types";

const num = (v: unknown) => Number(v ?? 0) || 0;

function readinessFlags(product: Product) {
  const result = assessProductReadiness(product);
  const missingPrice = result.reasons.includes("missing_price");
  const lowStock =
    num(product.stock_quantity) > 0 &&
    num(product.stock_quantity) <= num(product.low_stock_threshold);
  const ready = result.salesReady;
  const images = (product.images ?? []).filter(
    (url): url is string => typeof url === "string" && Boolean(url.trim()),
  );
  const premium = Boolean(
    product.attributes &&
    typeof product.attributes === "object" &&
    !Array.isArray(product.attributes) &&
    (product.attributes as Record<string, unknown>).premium &&
    typeof (product.attributes as Record<string, unknown>).premium === "object" &&
    ((product.attributes as Record<string, unknown>).premium as Record<string, unknown>).enabled ===
      true,
  );
  return { result, missingPrice, lowStock, ready, images, premium };
}

/**
 * Auren readiness signals from first-party catalogue data only.
 *
 * Every signal separates fact (what the catalogue holds), inference (what that
 * implies) and recommendation (what the owner may next do). This function is
 * pure: it never writes to the database, never changes a price, never
 * publishes, and never creates stock.
 */
export function productReadinessSignals(ctx: IntelligenceContext): IntelligenceInsight[] {
  const signals: IntelligenceInsight[] = [];

  for (const product of ctx.products) {
    const { result, missingPrice, lowStock, ready, images, premium } = readinessFlags(product);

    if (missingPrice) {
      signals.push({
        id: `readiness-price-missing-${product.id}`,
        kind: "market",
        title: `${product.name} is not sales-ready because price is missing`,
        summary:
          "The product has no positive selling price, so it cannot be sold through checkout.",
        tone: "warning",
        recommendation: "Enter a positive selling price before activating the product.",
        source: "Internal catalogue readiness",
        evidenceLevel: "fact",
      });
    }

    if (!product.sku?.trim()) {
      signals.push({
        id: `readiness-sku-missing-${product.id}`,
        kind: "market",
        title: `${product.name} has no SKU`,
        summary: "A SKU is required for order tracking and variant reconciliation.",
        tone: "neutral",
        recommendation: "Add a SKU so the catalogue remains order-trackable.",
        source: "Internal catalogue completeness",
        evidenceLevel: "fact",
      });
    }

    if (images.length === 0) {
      signals.push({
        id: `readiness-image-missing-${product.id}`,
        kind: "market",
        title: `${product.name} has no primary image`,
        summary: "Without a primary image the product cannot support a premium presentation.",
        tone: "warning",
        recommendation: "Add a primary HTTPS product image before activating a premium page.",
        source: "Internal visual readiness",
        evidenceLevel: "fact",
      });
    } else if (images.length === 1) {
      signals.push({
        id: `readiness-gallery-thin-${product.id}`,
        kind: "market",
        title: `${product.name} has only one product image`,
        summary: "A single-image gallery does not support a full premium visual hierarchy.",
        tone: "neutral",
        ...(premium
          ? { recommendation: "Add gallery, feature and lifestyle images for the premium page." }
          : { recommendation: "Add additional product images to improve conversion." }),
        source: "Internal visual readiness",
        evidenceLevel: "inference",
      });
    } else if (images.length < 4) {
      signals.push({
        id: `readiness-gallery-moderate-${product.id}`,
        kind: "market",
        title: `${product.name} has ${images.length} product images`,
        summary:
          "The gallery covers the primary product, but premium pages benefit from more depth.",
        tone: "neutral",
        recommendation: "Add feature and lifestyle images for a stronger premium page.",
        source: "Internal visual readiness",
        evidenceLevel: "fact",
      });
    }

    if (premium && images.length < 4) {
      signals.push({
        id: `readiness-premium-visuals-${product.id}`,
        kind: "market",
        title: `${product.name} is premium but under-visualised`,
        summary:
          "Premium presentation is enabled while the gallery is thinner than the recommended minimum.",
        tone: "warning",
        recommendation: "Complete the visual hierarchy before publishing the premium flow.",
        source: "Internal premium readiness",
        evidenceLevel: "inference",
      });
    }

    if (lowStock) {
      signals.push({
        id: `readiness-low-stock-${product.id}`,
        kind: "market",
        title: `${product.name} is approaching its low-stock threshold`,
        summary: `Current stock ${num(product.stock_quantity)} is at or below the configured threshold of ${num(product.low_stock_threshold)}.`,
        tone: "warning",
        recommendation: "Re-order before the next campaign to avoid selling out.",
        source: "Internal inventory readiness",
        evidenceLevel: "fact",
      });
    }

    if (ready && !missingPrice && !lowStock) {
      signals.push({
        id: `readiness-ok-${product.id}`,
        kind: "market",
        title: `${product.name} is sales-ready`,
        summary:
          "The product has a positive selling price, confirmed availability, category, copy and imagery.",
        tone: "positive",
        recommendation: "This product is ready for a campaign or featured placement.",
        source: "Internal catalogue readiness",
        evidenceLevel: "recommendation",
      });
    }
  }

  return signals;
}
