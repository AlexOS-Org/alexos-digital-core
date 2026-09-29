import type { Database } from "@/integrations/supabase/types";

export type Business = Database["public"]["Tables"]["businesses"]["Row"] & {
  hostname: string | null;
};

export type BusinessType = "ecommerce" | "vehicle" | "service" | null;

export interface BusinessContext {
  business: Business | null;
  isActive: boolean;
  isPortfolio: boolean;
  businessType: BusinessType;
}

export interface BusinessContextValue extends BusinessContext {
  setBusiness: (business: Business | null) => void;
  clearBusiness: () => void;
}

export const BUSINESS_MODULE_MAP: Readonly<Record<string, string>> = {
  dailygear: "ecommerce",
  novera: "service",
  carbaramotion: "vehicle",
};

export function getBusinessUrlSlug(slug: string): string {
  const normalized = slug.toLowerCase().trim();
  if (normalized === "dailygear" || normalized === "dailygears") return "dailygear";
  if (normalized === "novera") return "novera";
  if (normalized === "carbaramotion" || normalized === "carbar_motion") return "carbaramotion";
  return normalized;
}

export function businessTypeFromSlug(slug: string): BusinessType {
  const normalized = getBusinessUrlSlug(slug);
  const type = BUSINESS_MODULE_MAP[normalized];
  if (type === "ecommerce") return "ecommerce";
  if (type === "vehicle") return "vehicle";
  if (type === "service") return "service";
  return null;
}
