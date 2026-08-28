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
    retrievedAt: "2026-08-28T04:10:29Z",
    confidence: "high",
    facts: [
      "The public store positions DailyGear around curated everyday gear, honest pricing and delivery customers can plan around.",
      "The public store links customers to the product catalogue and order tracking journeys.",
      "The live public store currently lists YJ Children’s School Backpack (KES 2,750), Leather School Shoes for Boys & Girls (KES 2,574), Four-Colour Everyday Tote Bag (KES 2,450), and Ladies Sandals — Sizes 37–43 (KES 2,540).",
      "The public store states Kenya delivery, no-account checkout, dispatch within 24 hours, and a 7-day return window.",
    ],
    limitations: [
      "This is brand and storefront context only; it does not prove product availability, stock, price, demand, delivery timing or revenue.",
      "These public listings and prices are context only and must not be used to overwrite private operator-catalogue, stock, order, revenue, or financial records.",
    ],
  },
  {
    business: "Car-Bar Motion.ke",
    status: "source_missing",
    sourceUrl: null,
    sourceTitle: "No entity-verified first-party public source found",
    retrievedAt: "2026-08-28T04:10:29Z",
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
    retrievedAt: "2026-08-28T04:10:29Z",
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
