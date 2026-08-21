import type { Json } from "@/integrations/supabase/types";

export interface PublicFunnelProduct {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  shortDescription: string | null;
  price: number;
  salePrice: number | null;
  currency: string;
  images: string[];
  sku: string | null;
  stockQuantity: number;
  attributes: Json | null;
}

export interface PublicFunnelVariant {
  id: string;
  productId: string;
  name: string;
  sku: string | null;
  price: number | null;
  salePrice: number | null;
  stockQuantity: number;
  imageUrl: string | null;
  options: Json | null;
  color: string | null;
}

export interface PublicFunnelStep {
  id: string;
  stepType: string;
  position: number;
  title: string | null;
  body: string | null;
  productId: string | null;
  discountType: string;
  discountValue: number;
}

export interface PublicFunnel {
  id: string;
  name: string;
  slug: string;
  trafficSource: string | null;
  landingPath: string | null;
  thankYouHeading: string | null;
  thankYouBody: string | null;
  product: PublicFunnelProduct;
  offerProducts: PublicFunnelProduct[];
  variants: PublicFunnelVariant[];
  steps: PublicFunnelStep[];
}

function safeSlug(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase().slice(0, 120) : "";
}

export function validateFunnelSlug(data: unknown) {
  const slug = safeSlug((data as { slug?: unknown } | null)?.slug);
  if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new Error("This sales experience could not be found.");
  }
  return { slug };
}

export async function loadPublicFunnelImpl(slug: string): Promise<PublicFunnel | null> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: funnel, error: funnelError } = await supabaseAdmin
    .from("dg_funnels")
    .select(
      "id,name,slug,traffic_source,landing_path,thank_you_heading,thank_you_body,product_id,storefront_id,user_id",
    )
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (funnelError) throw funnelError;
  if (!funnel) return null;

  const { data: storefront, error: storefrontError } = await supabaseAdmin
    .from("dg_storefronts")
    .select("id")
    .eq("id", funnel.storefront_id)
    .eq("user_id", funnel.user_id)
    .eq("published", true)
    .maybeSingle();
  if (storefrontError) throw storefrontError;
  if (!storefront) return null;

  const { data: product, error: productError } = await supabaseAdmin
    .from("dg_products")
    .select(
      "id,name,slug,description,short_description,price,sale_price,currency,images,sku,stock_quantity,attributes,status,availability_confirmed,category_id,deleted_at,user_id",
    )
    .eq("id", funnel.product_id)
    .eq("user_id", funnel.user_id)
    .eq("status", "active")
    .eq("availability_confirmed", true)
    .is("deleted_at", null)
    .maybeSingle();
  if (productError) throw productError;
  if (!product || Number(product.stock_quantity ?? 0) < 1 || !product.category_id) return null;

  const { data: steps, error: stepError } = await supabaseAdmin
    .from("dg_funnel_steps")
    .select("id,step_type,position,title,body,product_id,discount_type,discount_value,enabled")
    .eq("funnel_id", funnel.id)
    .eq("user_id", funnel.user_id)
    .eq("enabled", true)
    .order("position", { ascending: true });
  if (stepError) throw stepError;

  const offerProductIds = (steps ?? [])
    .map((step) => step.product_id)
    .filter((id): id is string => Boolean(id) && id !== product.id);
  const productIds = [product.id, ...offerProductIds];
  const { data: verifiedEvidence, error: evidenceError } = await supabaseAdmin
    .from("dg_product_evidence")
    .select("product_id")
    .in("product_id", productIds)
    .eq("user_id", funnel.user_id)
    .eq("reconciliation_status", "verified");
  if (evidenceError) throw evidenceError;
  if (!verifiedEvidence?.some((record) => record.product_id === product.id)) return null;

  const { data: offerProducts, error: offerProductError } = offerProductIds.length
    ? await supabaseAdmin
        .from("dg_products")
        .select(
          "id,name,slug,description,short_description,price,sale_price,currency,images,sku,stock_quantity,attributes,status,availability_confirmed,category_id,deleted_at,user_id",
        )
        .in("id", offerProductIds)
        .eq("user_id", funnel.user_id)
        .eq("status", "active")
        .eq("availability_confirmed", true)
        .is("deleted_at", null)
    : { data: [], error: null };
  if (offerProductError) throw offerProductError;

  const eligibleOfferProducts = (offerProducts ?? []).filter(
    (offerProduct) =>
      offerProduct.category_id &&
      verifiedEvidence?.some((record) => record.product_id === offerProduct.id),
  );
  const eligibleProductIds = [
    product.id,
    ...eligibleOfferProducts.map((offerProduct) => offerProduct.id),
  ];

  const { data: variants, error: variantError } = await supabaseAdmin
    .from("dg_product_variants")
    .select(
      "id,product_id,name,sku,price,sale_price,stock_quantity,image_url,options,color,availability_confirmed,deleted_at,user_id",
    )
    .in("product_id", eligibleProductIds)
    .eq("user_id", funnel.user_id)
    .eq("availability_confirmed", true)
    .is("deleted_at", null)
    .order("sort_order", { ascending: true });
  if (variantError) throw variantError;

  return {
    id: funnel.id,
    name: funnel.name,
    slug: funnel.slug,
    trafficSource: funnel.traffic_source,
    landingPath: funnel.landing_path,
    thankYouHeading: funnel.thank_you_heading,
    thankYouBody: funnel.thank_you_body,
    product: {
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      shortDescription: product.short_description,
      price: Number(product.price ?? 0),
      salePrice: product.sale_price == null ? null : Number(product.sale_price),
      currency: product.currency ?? "KES",
      images: (product.images ?? []) as string[],
      sku: product.sku,
      stockQuantity: Number(product.stock_quantity ?? 0),
      attributes: product.attributes,
    },
    offerProducts: eligibleOfferProducts.map((offerProduct) => ({
      id: offerProduct.id,
      name: offerProduct.name,
      slug: offerProduct.slug,
      description: offerProduct.description,
      shortDescription: offerProduct.short_description,
      price: Number(offerProduct.price ?? 0),
      salePrice: offerProduct.sale_price == null ? null : Number(offerProduct.sale_price),
      currency: offerProduct.currency ?? "KES",
      images: (offerProduct.images ?? []) as string[],
      sku: offerProduct.sku,
      stockQuantity: Number(offerProduct.stock_quantity ?? 0),
      attributes: offerProduct.attributes,
    })),
    variants: (variants ?? []).map((variant) => ({
      id: variant.id,
      productId: variant.product_id,
      name: variant.name,
      sku: variant.sku,
      price: variant.price == null ? null : Number(variant.price),
      salePrice: variant.sale_price == null ? null : Number(variant.sale_price),
      stockQuantity: Number(variant.stock_quantity ?? 0),
      imageUrl: variant.image_url,
      options: variant.options,
      color: variant.color,
    })),
    steps: (steps ?? []).map((step) => ({
      id: step.id,
      stepType: step.step_type,
      position: step.position,
      title: step.title,
      body: step.body,
      productId: step.product_id,
      discountType: step.discount_type,
      discountValue: Number(step.discount_value ?? 0),
    })),
  };
}
