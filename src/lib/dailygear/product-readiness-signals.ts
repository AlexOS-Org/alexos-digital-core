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
  return { result, missingPrice, lowStock, ready };
}

/**
 * Auren readiness signals from first-party catalogue data only.
 *
 * Each signal contains only facts the catalogue already holds plus an explicit
 * recommendation. This function is pure: it never writes to the database, never
 * changes a price, never publishes, and never creates stock.
 */
export function productReadinessSignals(ctx: IntelligenceContext): IntelligenceInsight[] {
  const signals: IntelligenceInsight[] = [];

  for (const product of ctx.products) {
    const { result, missingPrice, lowStock, ready } = readinessFlags(product);

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
      });
    }
  }

  return signals;
}
