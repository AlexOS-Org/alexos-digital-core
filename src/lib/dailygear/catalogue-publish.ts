/**
 * DailyGear catalogue publishing decisions.
 *
 * This intentionally separates two different owner actions:
 *
 * 1. Catalogue publish — the product becomes publicly visible. It may still
 *    have no selling price yet. Without a price the customer sees
 *    "Price coming soon" and add-to-cart/checkout stays blocked.
 * 2. Sales readiness — the product has the commercial configuration required
 *    for checkout. A positive price is required here.
 *
 * Keeping these separate means a legitimate draft can be prepared for the
 * catalogue without accidentally becoming a KES 0 sale.
 */

export const DEFAULT_PRODUCT_CURRENCY = "KES";
const CURRENCY_RE = /^[A-Z]{3}$/;

export interface CataloguePublishInput {
  hasName: boolean;
  hasCategory: boolean;
  hasConfirmedAvailability: boolean;
  hasEvidence: boolean;
  hasVariantReadiness: boolean;
  hasValidImageUrls: boolean;
  /** Whether a positive selling price exists. Used only for the sales gate. */
  hasSellablePrice: boolean;
}

export function cataloguePublicationBlockers(input: CataloguePublishInput): string[] {
  const blockers = [
    !input.hasName ? "a product name" : null,
    !input.hasCategory ? "a primary category" : null,
    !input.hasConfirmedAvailability ? "confirmed availability" : null,
    !input.hasEvidence ? "source evidence" : null,
    !input.hasVariantReadiness ? "every colour/SKU variant must have confirmed availability" : null,
    !input.hasValidImageUrls ? "valid HTTPS image URLs" : null,
  ];

  return blockers.filter((blocker): blocker is string => Boolean(blocker));
}

export function canPublishToCatalogue(input: CataloguePublishInput): boolean {
  return cataloguePublicationBlockers(input).length === 0;
}

/** Normalises a product currency code, defaulting to the Kenya Shilling. */
export function normalizeCurrencyCode(value: string | null | undefined): string {
  const normalized = value?.trim().toUpperCase() ?? "";
  return CURRENCY_RE.test(normalized) ? normalized : DEFAULT_PRODUCT_CURRENCY;
}
