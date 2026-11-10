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

export const BUSINESS_MODULE_MAP: Readonly<Record<string, string>> = {};

export function getBusinessUrlSlug(slug: string): string {
  return slug.toLowerCase().trim();
}

export function businessTypeFromSlug(_slug: string): BusinessType {
  return null;
}
