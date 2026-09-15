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
  /** Concrete next step label when the owner can act in-app. */
  actionLabel?: string;
  /** In-app route that fills this feed. */
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
 * still waiting to receive — including decision benefits and where to add data.
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
        : "No income, expense, or transfer rows in this period yet. Add activity in Money Center so Auren can judge cash direction.",
    benefit: "Lets you judge cash direction, spend spikes, and whether new commitments are safe.",
    actionLabel: tx > 0 ? "Review transactions" : "Add transactions",
    actionTo: "/money-center/transactions",
    detail: tx > 0 ? `${tx.toLocaleString()} rows in scope` : "Next step: post at least one income or expense.",
  });

  const expected = rowCount(rows, "expected");
  feeds.push({
    id: "money-expected",
    source: "Money Center · expected income",
    status: expected > 0 ? "ready" : "waiting",
    waitingFor:
      expected > 0
        ? "Receiving pending expected inflows."
        : "No expected inflows logged. Track salary, invoices, or other pending money so near-term cash plans are grounded.",
    benefit: "Improves near-term cash planning and reduces surprise shortfalls.",
    actionLabel: expected > 0 ? "Review expected money" : "Add expected income",
    actionTo: "/money-center/expected",
    detail:
      expected > 0
        ? `${expected.toLocaleString()} expected item(s)`
        : "Next step: add pending inflows with dates and amounts.",
  });

  const leads = rowCount(rows, "leads");
  feeds.push({
    id: "crm-leads",
    source: "CRM · leads and pipeline",
    status: leads > 0 ? "ready" : "waiting",
    waitingFor:
      leads > 0
        ? "Receiving open pipeline and lead records."
        : "No leads in the pipeline yet. Add contacts and stages in People so Auren can surface deals that need follow-up.",
    benefit: "Shows which deals need attention and where revenue may close next.",
    actionLabel: leads > 0 ? "Open pipeline" : "Add leads",
    actionTo: "/people/leads",
    detail: leads > 0 ? `${leads.toLocaleString()} lead row(s)` : "Next step: create at least one lead with a stage.",
  });

  const dgOrders = rowCount(rows, "dailyGearOrders");
  const dgProducts = rowCount(rows, "dailyGearProducts");
  const dgReady = dgOrders > 0 || dgProducts > 0;
  feeds.push({
    id: "dailygear-commerce",
    source: "DailyGear · catalogue and orders",
    status: dgReady ? (dgOrders > 0 && dgProducts > 0 ? "ready" : "partial") : "waiting",
    waitingFor: dgReady
      ? dgOrders > 0 && dgProducts > 0
        ? "Receiving storefront catalogue and order evidence."
        : dgProducts > 0
          ? "Catalogue is present, but no orders in scope yet — revenue trend stays limited."
          : "Orders are present, but the product catalogue is thin — inventory risk stays limited."
      : "No storefront products or orders in scope. Add catalogue items and record orders under E-commerce.",
    benefit:
      "Supports inventory risk, storefront revenue trend, and fulfilment pressure decisions.",
    actionLabel: dgReady
      ? dgOrders === 0
        ? "Open orders"
        : "Open products"
      : "Open E-commerce products",
    actionTo: dgReady && dgOrders === 0 ? "/e-commerce/orders" : "/e-commerce/products",
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
        : liveTotal > 0
          ? "Snapshots exist but none are fully healthy. Check evidence refresh and ad connectors."
          : "No Meta, Instagram, or funnel snapshots in the last refresh window. Connect ads evidence or run a refresh from E-commerce.",
    benefit:
      "Lets you compare ad spend and funnel drop-off against real sales before changing budget.",
    actionLabel: liveOk > 0 ? "Review evidence" : "Open ads evidence",
    actionTo: "/e-commerce/evidence",
    detail:
      liveTotal > 0
        ? `${liveOk} ok · ${livePartial} partial · ${liveTotal} snapshot(s)`
        : "Next step: refresh evidence or connect Meta / Instagram when available.",
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
      : `${cap.label} is not live yet. The read contract exists, but no approved provider API is wired — Auren will not invent competitor or traffic numbers.`,
    benefit: competitorBenefit(cap.id) ?? cap.description,
    actionLabel: connected ? undefined : "See competitor workspace",
    actionTo: connected ? undefined : "/e-commerce/competitors",
    detail: connected
      ? "Adapter connected"
      : "Needs provider keys in production before this card can leave Waiting.",
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
      actionLabel: "Open Money Center",
      actionTo: "/money-center",
      detail: `${ctx.facts.length} public fact(s) · ${ctx.confidence} confidence`,
    };
  }
  return {
    id: `public-${ctx.business}`,
    source: `Public / competitor context · ${ctx.business}`,
    status: "waiting",
    waitingFor: `No entity-verified public source for ${ctx.business} yet. Unrelated web results are refused so Auren does not invent market claims.`,
    benefit:
      "Once a verified source exists, you can compare positioning and public offers without mixing them into private revenue numbers.",
    actionLabel: "Open competitors",
    actionTo: "/e-commerce/competitors",
    detail: ctx.sourceTitle ?? "Next step: approve a verified public source for this brand.",
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
      ? "All listed feeds have data in this view. Recommendations can stay grounded in verified records."
      : waiting > 0
        ? `${waiting} source${waiting === 1 ? "" : "s"} still need data. Use the links on each card to fill the gap — Auren will not invent values.`
        : `${partial} source${partial === 1 ? "" : "s"} only have partial coverage. Treat related recommendations as incomplete until they are fully ready.`;
  return { waiting, partial, ready, headline };
}
