import type { StoreProduct, StoreVariant } from "./api";
import { yjColourImage } from "./yj-colours";

/**
 * Premium DailyGear presentation model.
 *
 * Pure, reusable, product-level. A product opts in through its existing
 * `attributes` JSONB container (`attributes.premium`). No new schema is
 * required and no public product can become premium by accident: it only
 * renders differently when the owner has explicitly enabled it.
 *
 * This module never fabricates marketing content. It only reads images,
 * benefits, features, specs and FAQ entries that the owner has stored in the
 * product config; where content is absent the public page surfaces the
 * factual product description instead of inventing claims.
 */

export interface PremiumVisual {
  hero: string | null;
  gallery: string[];
  featureImages: string[];
  lifestyleImages: string[];
}

export interface PremiumConfig {
  enabled: boolean;
  hero?: string;
  images?: string[];
  featureImages?: string[];
  lifestyleImages?: string[];
  benefits?: Array<{ title: string; description: string }>;
  features?: Array<{ title: string; description: string }>;
  specs?: Array<{ label: string; value: string }>;
  faq?: Array<{ question: string; answer: string }>;
}

export function isPremiumProduct(product: Pick<StoreProduct, "attributes">): boolean {
  const raw = product.attributes;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return false;
  const premium = (raw as Record<string, unknown>).premium;
  return (
    premium !== null &&
    typeof premium === "object" &&
    !Array.isArray(premium) &&
    (premium as Record<string, unknown>).enabled === true
  );
}

function asUrlArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string" && Boolean(item.trim()))
    .map((item) => item.trim());
}

function asContentArray(value: unknown): Array<{ title: string; description: string }> {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const record = item as Record<string, unknown>;
    const title: string = typeof record.title === "string" ? record.title.trim() : "";
    const description: string =
      typeof record.description === "string" ? record.description.trim() : "";
    if (!title || !description) return [];
    return [{ title, description }];
  });
}

function asSpecArray(value: unknown): Array<{ label: string; value: string }> {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const record = item as Record<string, unknown>;
    const label: string = typeof record.label === "string" ? record.label.trim() : "";
    const val: string = typeof record.value === "string" ? record.value.trim() : "";
    if (!label || !val) return [];
    return [{ label, value: val }];
  });
}

function asFaqArray(value: unknown): Array<{ question: string; answer: string }> {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const record = item as Record<string, unknown>;
    const question: string = typeof record.question === "string" ? record.question.trim() : "";
    const answer: string = typeof record.answer === "string" ? record.answer.trim() : "";
    if (!question || !answer) return [];
    return [{ question, answer }];
  });
}

export function getPremiumConfig(product: Pick<StoreProduct, "attributes">): PremiumConfig {
  const raw = product.attributes;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return { enabled: false };
  const premium = (raw as Record<string, unknown>).premium;
  if (!premium || typeof premium !== "object" || Array.isArray(premium)) return { enabled: false };

  const config = premium as Record<string, unknown>;
  return {
    enabled: config.enabled === true,
    hero: typeof config.hero === "string" ? config.hero : undefined,
    images: asUrlArray(config.images),
    featureImages: asUrlArray(config.featureImages),
    lifestyleImages: asUrlArray(config.lifestyleImages),
    benefits: asContentArray(config.benefits),
    features: asContentArray(config.features),
    specs: asSpecArray(config.specs),
    faq: asFaqArray(config.faq),
  };
}

export function getPremiumVisualPlan(
  product: Pick<StoreProduct, "attributes" | "images" | "name">,
  variants: StoreVariant[],
): PremiumVisual {
  const config = getPremiumConfig(product);
  const storedImages = (product.images ?? []).filter(
    (url): url is string => typeof url === "string" && Boolean(url.trim()),
  );
  const gallery = config.images?.length ? config.images : storedImages;

  // Variant-specific imagery precision: prefer the owner's exact variant URL,
  // then the known colour card mapping. This is used when a variant is selected.
  const hero =
    config.hero?.trim() ||
    storedImages[0] ||
    variants.find((variant) => variant.image_url)?.image_url ||
    null;

  return {
    hero,
    gallery,
    featureImages: config.featureImages ?? [],
    lifestyleImages: config.lifestyleImages ?? [],
  };
}

export function premiumVariantImage(
  product: Pick<StoreProduct, "name">,
  variant: StoreVariant | null,
): string | null {
  if (!variant) return null;
  if (variant.image_url) return variant.image_url;
  return yjColourImage({
    name: variant.name,
    color: variant.color ?? "",
    imageUrl: variant.image_url ?? "",
  });
}
