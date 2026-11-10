export interface BusinessSection {
  label: string;
  to: string;
  icon?: unknown;
  exact?: boolean;
}

export interface BusinessSections {
  businessSlug: string;
  sections: BusinessSection[];
}

const BUSINESS_SECTIONS_MAP: Record<string, BusinessSection[]> = {};

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
