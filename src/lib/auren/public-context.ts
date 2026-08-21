export type AurenPublicContextScope = "portfolio" | "businesses" | "personal";
export type AurenPublicContextStatus = "verified_brand_context" | "source_missing";

export interface AurenPublicContextRecord {
  business: "DailyGear" | "Car-Bar Motion.ke" | "Novera";
  status: AurenPublicContextStatus;
  sourceUrl: string | null;
  sourceTitle: string;
  retrievedAt: string;
  confidence: "high" | "medium" | "low" | "insufficient";
  facts: string[];
  limitations: string[];
}

/**
 * Firecrawl-reviewed public context. This registry is intentionally separate from
 * Supabase operational truth: it cannot contribute to revenue, stock, orders,
 * financial totals or forecasts.
 */
export const AUREN_PUBLIC_CONTEXT: readonly AurenPublicContextRecord[] = [
  {
    business: "DailyGear",
    status: "verified_brand_context",
    sourceUrl: "https://dailygear.co.ke/",
    sourceTitle: "DailyGear — Everyday essentials, delivered",
    retrievedAt: "2026-08-21T10:38:28.192Z",
    confidence: "high",
    facts: [
      "The public store positions DailyGear around curated everyday gear, honest pricing and delivery customers can plan around.",
      "The public store links customers to the product catalogue and order tracking journeys.",
      "At retrieval time, the public store stated that no products were published yet.",
    ],
    limitations: [
      "This is brand and storefront context only; it does not prove product availability, stock, price, demand, delivery timing or revenue.",
      "The public zero state must not be used to overwrite or infer private operator-catalogue records.",
    ],
  },
  {
    business: "Car-Bar Motion.ke",
    status: "source_missing",
    sourceUrl: null,
    sourceTitle: "No entity-verified first-party public source found",
    retrievedAt: "2026-08-21T10:39:09.713Z",
    confidence: "insufficient",
    facts: [],
    limitations: [
      "Firecrawl search results were unrelated automotive news, social pages and general vehicle content.",
      "Auren must not infer vehicle inventory, pricing, demand, leads or market claims from those results.",
    ],
  },
  {
    business: "Novera",
    status: "source_missing",
    sourceUrl: null,
    sourceTitle: "No entity-verified first-party public source found",
    retrievedAt: "2026-08-21T10:38:48.311Z",
    confidence: "insufficient",
    facts: [],
    limitations: [
      "Firecrawl returned an unrelated Serbian consulting company and other unrelated Novera results.",
      "Auren must not attribute those pages, services, locations or claims to the AlexOS Novera business.",
    ],
  },
];

export function getAurenPublicContext(scope: AurenPublicContextScope): AurenPublicContextRecord[] {
  return scope === "personal" ? [] : [...AUREN_PUBLIC_CONTEXT];
}
