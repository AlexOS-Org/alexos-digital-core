import type { Database } from "@/integrations/supabase/types";

type StoreProduct = Database["public"]["Tables"]["dg_products"]["Row"];
type StoreVariant = Database["public"]["Tables"]["dg_product_variants"]["Row"];
type Storefront = Database["public"]["Tables"]["dg_storefronts"]["Row"];

export interface ProductJsonLd {
  "@context": "https://schema.org";
  "@type": "Product";
  name: string;
  description?: string;
  sku?: string;
  image?: string[];
  offers?: {
    "@type": "Offer";
    priceCurrency: string;
    price: string;
    availability: "https://schema.org/InStock" | "https://schema.org/OutOfStock";
    url: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

function effectivePrice(product: Pick<StoreProduct, "price" | "sale_price">): number {
  const base = Number(product.price);
  const sale = product.sale_price == null ? null : Number(product.sale_price);
  return sale != null && Number.isFinite(sale) && sale > 0 && sale < base ? sale : base;
}

function imageList(product: Pick<StoreProduct, "images" | "attributes">): string[] {
  return (product.images ?? [])
    .filter((url): url is string => typeof url === "string" && Boolean(url.trim()))
    .slice(0, 8);
}

/**
 * Builds Product structured data from first-party catalogue values only.
 *
 * Offers are emitted only when the authoritative price is positive. A product
 * in catalogue preparation (price KES 0 / unset) is still described as a
 * Product but is never advertised as a free sale. Ratings, reviews, review
 * counts and social proof are intentionally never generated.
 */
export function buildProductJsonLd(
  product: Pick<
    StoreProduct,
    | "id"
    | "name"
    | "slug"
    | "description"
    | "sku"
    | "image_alt_text"
    | "images"
    | "attributes"
    | "price"
    | "sale_price"
    | "currency"
    | "stock_quantity"
    | "seo_title"
    | "seo_description"
  >,
  store: Pick<Storefront, "slug" | "currency" | "name"> | null,
): ProductJsonLd | null {
  if (!product?.id || !product?.name?.trim()) return null;

  const entity: ProductJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name.trim(),
  };

  if (product.description?.trim()) entity.description = product.description.trim();
  if (product.sku?.trim()) entity.sku = product.sku.trim();
  const images = imageList(product);
  if (images.length) entity.image = images;

  const currency = product.currency?.trim() || store?.currency?.trim() || "KES";
  const price = effectivePrice(product);
  const stock = product.stock_quantity == null ? null : Number(product.stock_quantity);
  const inStock =
    stock != null && stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock";

  if (Number.isFinite(price) && price > 0) {
    entity.offers = {
      "@type": "Offer",
      priceCurrency: currency,
      price: String(price),
      availability: inStock,
      url: `/shop/product/${product.id}`,
      ...(product.seo_title?.trim() ? { name: product.seo_title.trim() } : {}),
    };
  }

  return entity;
}
