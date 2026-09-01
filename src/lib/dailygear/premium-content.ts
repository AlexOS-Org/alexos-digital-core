import type { Json } from "@/integrations/supabase/types";

/**
 * Structured premium content the owner edits in the admin product editor.
 *
 * The persisted shape lives inside the existing `attributes.premium` JSONB
 * container, so no schema change is required. Every field here is optional:
 * where content is absent the public premium page falls back to the factual
 * product data instead of inventing claims.
 */

export interface PremiumContentDraft {
  enabled: boolean;
  hero: string;
  images: string;
  featureImages: string;
  lifestyleImages: string;
  benefits: string;
  features: string;
  specs: string;
  faq: string;
}

export interface PremiumContentEntry {
  title: string;
  description: string;
}

export interface PremiumSpecEntry {
  label: string;
  value: string;
}

export interface PremiumFaqEntry {
  question: string;
  answer: string;
}

function splitLines(value: string | null | undefined): string[] {
  return (value ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function splitUrls(value: string | null | undefined): string[] {
  return splitLines(value)
    .map((line) => line.trim())
    .filter(Boolean);
}

export function parsePremiumUrlLines(value: string | null | undefined): string[] {
  return splitLines(value)
    .map((line) => line.trim())
    .filter(Boolean);
}

export function serializePremiumUrlLines(urls: string[]): string {
  return urls
    .map((url) => url.trim())
    .filter(Boolean)
    .join("\n");
}

export function parsePremiumContentLines(value: string | null | undefined): PremiumContentEntry[] {
  return splitLines(value).flatMap((line) => {
    const [title, ...rest] = line.split("|").map((part) => part.trim());
    const description = rest.join("|").trim();
    if (!title || !description) return [];
    return [{ title, description }];
  });
}

export function parsePremiumSpecLines(value: string | null | undefined): PremiumSpecEntry[] {
  return splitLines(value).flatMap((line) => {
    const [label, ...rest] = line.split("|").map((part) => part.trim());
    const val = rest.join("|").trim();
    if (!label || !val) return [];
    return [{ label, value: val }];
  });
}

export function parsePremiumFaqLines(value: string | null | undefined): PremiumFaqEntry[] {
  return splitLines(value).flatMap((line) => {
    const [question, ...rest] = line.split("|").map((part) => part.trim());
    const answer = rest.join("|").trim();
    if (!question || !answer) return [];
    return [{ question, answer }];
  });
}

export function buildPremiumAttributes(
  existingAttributes: Record<string, unknown> | null,
  draft: PremiumContentDraft,
): Record<string, unknown> {
  const attributes = existingAttributes ?? {};

  return {
    ...attributes,
    premium: {
      enabled: draft.enabled,
      ...(draft.hero.trim() ? { hero: draft.hero.trim() } : {}),
      ...(splitUrls(draft.images).length
        ? { images: splitUrls(draft.images) }
        : { images: [] as string[] }),
      ...(splitUrls(draft.featureImages).length
        ? { featureImages: splitUrls(draft.featureImages) }
        : { featureImages: [] as string[] }),
      ...(splitUrls(draft.lifestyleImages).length
        ? { lifestyleImages: splitUrls(draft.lifestyleImages) }
        : { lifestyleImages: [] as string[] }),
      benefits: parsePremiumContentLines(draft.benefits),
      features: parsePremiumContentLines(draft.features),
      specs: parsePremiumSpecLines(draft.specs),
      faq: parsePremiumFaqLines(draft.faq),
    },
  };
}

export function premiumAttributesFromProduct(
  attributes: Json | null,
): Record<string, unknown> | null {
  if (!attributes || typeof attributes !== "object" || Array.isArray(attributes)) return null;
  return attributes as Record<string, unknown>;
}

export function premiumEnabledFromAttributes(attributes: Json | null): boolean {
  const existing = premiumAttributesFromProduct(attributes);
  if (!existing) return false;
  const premium = existing.premium;
  if (!premium || typeof premium !== "object" || Array.isArray(premium)) return false;
  return (premium as Record<string, unknown>).enabled === true;
}

export function premiumContentFromAttributes(attributes: Json | null): PremiumContentDraft {
  const existing = premiumAttributesFromProduct(attributes);
  const premium =
    existing?.premium && typeof existing.premium === "object" && !Array.isArray(existing.premium)
      ? (existing.premium as Record<string, unknown>)
      : {};

  return {
    enabled: premium.enabled === true,
    hero: typeof premium.hero === "string" ? premium.hero : "",
    images: Array.isArray(premium.images)
      ? (premium.images as unknown[]).filter((v): v is string => typeof v === "string").join("\n")
      : "",
    featureImages: Array.isArray(premium.featureImages)
      ? (premium.featureImages as unknown[])
          .filter((v): v is string => typeof v === "string")
          .join("\n")
      : "",
    lifestyleImages: Array.isArray(premium.lifestyleImages)
      ? (premium.lifestyleImages as unknown[])
          .filter((v): v is string => typeof v === "string")
          .join("\n")
      : "",
    benefits: contentToString(premium.benefits),
    features: contentToString(premium.features),
    specs: specToString(premium.specs),
    faq: faqToString(premium.faq),
  };
}

function contentToString(value: unknown): string {
  if (!Array.isArray(value)) return "";
  return value
    .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object"))
    .map((item) => `${String(item.title ?? "")}|${String(item.description ?? "")}`)
    .filter((line) => line !== "|")
    .join("\n");
}

function specToString(value: unknown): string {
  if (!Array.isArray(value)) return "";
  return value
    .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object"))
    .map((item) => `${String(item.label ?? "")}|${String(item.value ?? "")}`)
    .filter((line) => line !== "|")
    .join("\n");
}

function faqToString(value: unknown): string {
  if (!Array.isArray(value)) return "";
  return value
    .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object"))
    .map((item) => `${String(item.question ?? "")}|${String(item.answer ?? "")}`)
    .filter((line) => line !== "|")
    .join("\n");
}
