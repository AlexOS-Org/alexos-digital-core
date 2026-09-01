import type { Product } from "./types";

/**
 * DailyGear commercial readiness model.
 *
 * This is intentionally separate from the coarse `getProductReadiness` helper
 * in `types.ts`. The legacy function only signals whether a product can be
 * *published* into the public catalogue. This module answers a stricter,
 * money-safe question: is the product actually *safe to sell*?
 *
 * The catalogue may legitimately contain a publicly-visible product with no
 * selling price yet. That product must be clearly "catalogue-ready but not
 * sales-ready". A zero/unset price must never silently become a KES 0 sale.
 */

export interface ProductReadinessResult {
  catalogueReady: boolean;
  salesReady: boolean;
  reasons: ProductReadinessReason[];
}

export type ProductReadinessReason =
  | "missing_name"
  | "missing_category"
  | "missing_description"
  | "missing_primary_image"
  | "missing_seo_title"
  | "missing_seo_description"
  | "missing_price"
  | "missing_currency"
  | "missing_stock_configuration"
  | "not_confirmed_available"
  | "not_active";

export type ProductReadinessShape = Pick<
  Product,
  | "name"
  | "description"
  | "seo_title"
  | "seo_description"
  | "price"
  | "currency"
  | "images"
  | "status"
  | "availability_confirmed"
  | "category_id"
> & {
  stock_quantity?: number | null;
  low_stock_threshold?: number | null;
};

const ACTIVE_STATUSES = new Set<Product["status"]>(["active"]);

export function assessProductReadiness(product: ProductReadinessShape): ProductReadinessResult {
  const reasons: ProductReadinessReason[] = [];

  if (!product.name?.trim()) reasons.push("missing_name");
  if (!product.category_id) reasons.push("missing_category");
  if (!product.description?.trim()) reasons.push("missing_description");
  if (!product.seo_title?.trim()) reasons.push("missing_seo_title");
  if (!product.seo_description?.trim()) reasons.push("missing_seo_description");

  const images = (product.images ?? []).filter((url) => typeof url === "string" && url.trim());
  if (images.length === 0) reasons.push("missing_primary_image");

  const price = Number(product.price);
  if (!Number.isFinite(price) || price <= 0) reasons.push("missing_price");
  if (!product.currency?.trim()) reasons.push("missing_currency");

  const stock = product.stock_quantity ?? null;
  const lowThreshold = product.low_stock_threshold ?? null;
  if (stock === null || !Number.isFinite(Number(stock))) {
    reasons.push("missing_stock_configuration");
  }

  if (product.availability_confirmed !== true) reasons.push("not_confirmed_available");
  if (!ACTIVE_STATUSES.has(product.status)) reasons.push("not_active");

  const catalogueBlockers: ProductReadinessReason[] = [
    "missing_name",
    "missing_category",
    "missing_description",
    "missing_primary_image",
    "missing_seo_title",
    "missing_seo_description",
  ];

  const catalogueReady = !catalogueBlockers.some((reason) => reasons.includes(reason));

  const salesBlockers: ProductReadinessReason[] = [
    ...catalogueBlockers,
    "missing_price",
    "missing_currency",
    "missing_stock_configuration",
    "not_confirmed_available",
    "not_active",
  ];

  const salesReady = !salesBlockers.some((reason) => reasons.includes(reason));

  return { catalogueReady, salesReady, reasons };
}

export function effectiveUnitPrice(product: Pick<Product, "price" | "sale_price">): number {
  const base = Number(product.price);
  const sale = product.sale_price == null ? null : Number(product.sale_price);
  return sale != null && Number.isFinite(sale) && sale > 0 && sale < base ? sale : base;
}

/** Price is a positive finite number and the unit is representable as KES > 0. */
export function hasSalesPrice(product: Pick<Product, "price" | "sale_price">): boolean {
  return Number.isFinite(effectiveUnitPrice(product)) && effectiveUnitPrice(product) > 0;
}

/**
 * Whether a product may be moved to the sellable `active` status.
 *
 * Catalogue preparation (draft/archive) may happen with a price left unset,
 * but a product cannot go live for sale without an explicit positive selling
 * price. This prevents a KES 0 catalogue row from becoming a free order.
 */
export function canActivateForSale(product: Pick<Product, "price" | "sale_price">): boolean {
  return hasSalesPrice(product);
}
