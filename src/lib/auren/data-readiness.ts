import type { AurenCapability, CapabilityId } from "./capability-gateway";
import type { AurenAdvisorySnapshot } from "./advisor.server";
import type { AurenPublicContextRecord } from "./public-context";

export type AurenDataFeedStatus = "ready" | "partial" | "waiting";

export interface AurenDataFeed {
  id: string;
  source: string;
  status: AurenDataFeedStatus;
  /** What Auren is waiting for when not ready. */
  waitingFor: string;
  /** Why this feed matters for decisions. */
  benefit: string;
  /** Where the owner can add or fix the data. */
  actionLabel?: string;
  actionTo?: string;
  detail?: string;
}

const COMPETITOR_CAPABILITY_IDS: readonly CapabilityId[] = [
  "seo-competitor:read",
  "similarweb:read",
  "content-gap:read",
  "analytics:read",
];

function rowCount(sourceRows: Record<string, number>, key: string): number {
  return Number(sourceRows[key] ?? 0);
}

/**
 * Build an honest catalog of what Auren can already use versus what it is
 * still waiting to receive — including decision benefits for each feed.
 */
export function buildAurenDataReadiness(
  advisory: AurenAdvisorySnapshot,
  _responseStatus: "ready" | "no_data" | "ai_unavailable" | null,
): AurenDataFeed[] {
  const rows = advisory.dataQuality.sourceRows;
  const feeds: AurenDataFeed[] = [];

  const tx = rowCount(rows, "transactions");
  feeds.push({
    id: "money-transactions",
    source: "Money Center · transactions",
    status: tx > 0 ? "ready" : "waiting",
    waitingFor:
      tx > 0
        ? "Receiving posted income, expense and transfer records."
        : "I am waiting to receive information from Money Center transactions (income, expenses, transfers).",
    benefit:
      "Lets you judge cash direction, spend spikes, and whether new commitments are safe.",
    actionLabel: "Open Money Center",
    actionTo: "/money-center",
    detail: tx > 0 ? `${tx.toLocaleString()} rows in scope` : undefined,
  });

  const expected = rowCount(rows, "expected");
  feeds.push({
    id: "money-expected",
    source: "Money Center · expected income",
    status: expected > 0 ? "ready" : "waiting",
    waitingFor:
      expected > 0
        ? "Receiving pending expected inflows."
        : "I am waiting to receive information from Expected Money (pending inflows and probabilities).",
    benefit: "Improves near-term cash planning and reduces surprise shortfalls.",
    actionLabel: "Track expected",
    actionTo: "/money-center/expected",
    detail: expected > 0 ? `${expected.toLocaleString()} expected item(s)` : undefined,
  });

  const leads = rowCount(rows, "leads");
  feeds.push({
    id: "crm-leads",
    source: "CRM · leads and pipeline",
    status: leads > 0 ? "ready" : "waiting",
    waitingFor:
      leads > 0
        ? "Receiving open pipeline and lead records."
        : "I am waiting to receive information from CRM leads (pipeline value, stages, follow-ups).",
    benefit: "Shows which deals need attention and where revenue may close next.",
    actionLabel: "Open pipeline",
    actionTo: "/people/leads",
    detail: leads > 0 ? `${leads.toLocaleString()} lead row(s)` : undefined,
  });

  const dgOrders = rowCount(rows, "dailyGearOrders");
  const dgProducts = rowCount(rows, "dailyGearProducts");
  const dgReady = dgOrders > 0 || dgProducts > 0;
  feeds.push({
    id: "dailygear-commerce",
    source: "DailyGear · catalogue and orders",
    status: dgReady ? (dgOrders > 0 && dgProducts > 0 ? "ready" : "partial") : "waiting",
    waitingFor: dgReady
      ? "Receiving storefront catalogue and/or order evidence."
      : "I am waiting to receive information from DailyGear products and orders.",
    benefit:
      "Supports inventory risk, storefront revenue trend, and fulfilment pressure decisions.",
    actionLabel: "Open DailyGear",
    actionTo: "/dailygear",
    detail: `Products ${dgProducts.toLocaleString()} · Orders ${dgOrders.toLocaleString()}`,
  });

  const liveOk = advisory.liveEvidence.filter((e) => e.status === "ok").length;
  const livePartial = advisory.liveEvidence.filter((e) => e.status === "partial").length;
  const liveTotal = advisory.liveEvidence.length;
  feeds.push({
    id: "live-evidence",
    source: "Live evidence · ads, social, funnel",
    status: liveOk > 0 ? "ready" : livePartial > 0 || liveTotal > 0 ? "partial" : "waiting",
    waitingFor:
      liveOk > 0
        ? "Receiving scheduled Meta / Instagram / funnel snapshots."
        : "I am waiting to receive information from live evidence refresh (Meta Ads, Instagram, public ads library, funnel events).",
    benefit:
      "Lets you compare ad spend and funnel drop-off against real sales before changing budget.",
    detail:
      liveTotal > 0
        ? `${liveOk} ok · ${livePartial} partial · ${liveTotal} snapshot(s)`
        : "No snapshots in the last refresh window",
  });

  const competitorCaps = advisory.capabilities.filter((c) =>
    COMPETITOR_CAPABILITY_IDS.includes(c.id),
  );
  for (const cap of competitorCaps) {
    feeds.push(capabilityToFeed(cap));
  }

  for (const ctx of advisory.externalContext) {
    feeds.push(publicContextToFeed(ctx));
  }

  feeds.sort((a, b) => statusRank(a.status) - statusRank(b.status));
  return feeds;
}

function statusRank(status: AurenDataFeedStatus): number {
  if (status === "waiting") return 0;
  if (status === "partial") return 1;
  return 2;
}

function capabilityToFeed(cap: AurenCapability): AurenDataFeed {
  const connected = cap.availability === "connected";
  return {
    id: `cap-${cap.id}`,
    source: cap.label,
    status: connected ? "ready" : "waiting",
    waitingFor: connected
      ? `Connected: ${cap.freshnessLabel}.`
      : `I am waiting to receive information from ${cap.label} (${cap.freshnessLabel}). The connector contract exists but no live provider is wired yet.`,
    benefit: competitorBenefit(cap.id) ?? cap.description,
    detail: connected ? "Adapter connected" : "Contract only — not live data",
  };
}

function competitorBenefit(id: CapabilityId): string | null {
  switch (id) {
    case "seo-competitor:read":
      return "Shows organic visibility and page-type gaps so you can prioritise content that competes for the same Kenya demand.";
    case "similarweb:read":
      return "Compares traffic, engagement and geography so you can see whether rivals are growing faster before you scale ads.";
    case "content-gap:read":
      return "Highlights topics competitors cover that you do not, so marketing spend targets missing demand.";
    case "analytics:read":
      return "Aggregates campaign performance from approved external tools without guessing results.";
    case "financial-analysis:read":
      return "Structures external company or market figures when a provider is approved — never invented.";
    default:
      return null;
  }
}

function publicContextToFeed(ctx: AurenPublicContextRecord): AurenDataFeed {
  if (ctx.status === "verified_brand_context" && ctx.facts.length > 0) {
    return {
      id: `public-${ctx.business}`,
      source: `Public context · ${ctx.business}`,
      status: "partial",
      waitingFor: `Reviewed public brand context for ${ctx.business} (not operational stock or revenue).`,
      benefit:
        "Gives background positioning only. Decisions on stock, price and revenue must still use Money Center and DailyGear records.",
      detail: `${ctx.facts.length} public fact(s) · ${ctx.confidence} confidence`,
    };
  }
  return {
    id: `public-${ctx.business}`,
    source: `Public / competitor context · ${ctx.business}`,
    status: "waiting",
    waitingFor: `I am waiting to receive an entity-verified public source for ${ctx.business}. Unrelated web results are refused so Auren does not invent market claims.`,
    benefit:
      "Once a verified source exists, you can compare positioning and public offers without mixing them into private revenue numbers.",
    detail: ctx.sourceTitle,
  };
}

export function summarizeReadiness(feeds: AurenDataFeed[]): {
  waiting: number;
  partial: number;
  ready: number;
  headline: string;
} {
  const waiting = feeds.filter((f) => f.status === "waiting").length;
  const partial = feeds.filter((f) => f.status === "partial").length;
  const ready = feeds.filter((f) => f.status === "ready").length;
  const headline =
    waiting === 0 && partial === 0
      ? "All listed first-party feeds have data in this view."
      : waiting > 0
        ? `Auren is waiting on ${waiting} data source(s) before some decisions can be fully grounded.`
        : `Auren has partial coverage on ${partial} source(s); treat those recommendations as incomplete.`;
  return { waiting, partial, ready, headline };
}
