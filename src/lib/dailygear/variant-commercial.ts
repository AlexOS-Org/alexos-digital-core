import type { ProductVariant } from "./types";

export interface VariantCommercialDraft {
  color: string;
  sex: string;
  imageUrl: string;
  sku: string;
  stock: string;
  price: string;
  salePrice: string;
  costPrice: string;
  available: boolean;
}

export type VariantCommercialPayload = Partial<
  Pick<
    ProductVariant,
    | "id"
    | "color"
    | "image_url"
    | "sku"
    | "stock_quantity"
    | "price"
    | "sale_price"
    | "cost_price"
    | "availability_confirmed"
    | "options"
  >
>;

function numeric(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

export function buildVariantCommercialPayload(
  id: string,
  draft: VariantCommercialDraft,
  existingOptions: Record<string, unknown> = {},
): VariantCommercialPayload {
  return {
    id,
    color: draft.color.trim() || null,
    image_url: draft.imageUrl.trim() || null,
    sku: draft.sku.trim() || null,
    stock_quantity: Number(draft.stock) || 0,
    price: numeric(draft.price),
    sale_price: numeric(draft.salePrice),
    cost_price: numeric(draft.costPrice),
    availability_confirmed: draft.available,
    options: {
      ...existingOptions,
      color: draft.color.trim() || undefined,
      sex: draft.sex || "Unisex",
    },
  };
}
