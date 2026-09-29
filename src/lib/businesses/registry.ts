import { DAILYGEAR_SECTIONS, type DailyGearSection } from "@/lib/dailygear/registry";

export type BusinessSection = DailyGearSection;

export interface BusinessSections {
  businessSlug: string;
  sections: BusinessSection[];
}

const BUSINESS_SECTIONS_MAP: Record<string, BusinessSection[]> = {
  dailygear: DAILYGEAR_SECTIONS,
  novera: [],
  carbaramotion: [],
};

export function getSectionsForBusiness(businessSlug: string | null): BusinessSection[] {
  if (!businessSlug) return [];
  return BUSINESS_SECTIONS_MAP[businessSlug] ?? [];
}

export function getBusinessSections(businessSlug: string): BusinessSections | null {
  if (!businessSlug) return null;
  const sections = BUSINESS_SECTIONS_MAP[businessSlug];
  if (!sections) return null;
  return { businessSlug, sections };
}
