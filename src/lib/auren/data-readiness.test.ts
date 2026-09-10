import { describe, expect, it } from "vitest";
import { buildAurenDataReadiness, summarizeReadiness } from "./data-readiness";
import type { AurenAdvisorySnapshot } from "./advisor.server";
import { listReadOnlyCapabilities } from "./capability-gateway";

function emptyAdvisory(): AurenAdvisorySnapshot {
  return {
    asOf: "2026-09-10",
    period: { from: "2026-08-12", until: "2026-09-10", days: 30 },
    scope: "portfolio",
    currency: null,
    outlook: "insufficient_data",
    verified: {
      cashAvailable: null,
      income: null,
      expenses: null,
      netCashFlow: null,
      incomeChangePct: null,
      expenseChangePct: null,
      pendingExpectedCount: 0,
      weightedExpected: null,
      openLeads: 0,
      staleLeads: 0,
      pipelineValue: null,
      weightedPipelineValue: null,
      dailyGearRevenue: null,
      dailyGearOrders: 0,
      dailyGearLowStock: 0,
    },
    forecasts: {
      income: {
        horizonDays: 30,
        lower: null,
        base: null,
        upper: null,
        currency: null,
        confidence: "insufficient",
        assumptions: ["Need more activity"],
      },
      expenses: {
        horizonDays: 30,
        lower: null,
        base: null,
        upper: null,
        currency: null,
        confidence: "insufficient",
        assumptions: ["Need more activity"],
      },
      netCashFlow: {
        horizonDays: 30,
        lower: null,
        base: null,
        upper: null,
        currency: null,
        confidence: "insufficient",
        assumptions: ["Need more activity"],
      },
      dailyGearRevenue: {
        horizonDays: 30,
        lower: null,
        base: null,
        upper: null,
        currency: null,
        confidence: "insufficient",
        assumptions: ["Need more activity"],
      },
    },
    businesses: [],
    recommendations: [],
    externalContext: [
      {
        business: "Nuvora",
        status: "source_missing",
        sourceUrl: null,
        sourceTitle: "No entity-verified first-party public source found",
        retrievedAt: "2026-08-28T04:10:29Z",
        confidence: "insufficient",
        facts: [],
        limitations: ["Unrelated search results refused"],
      },
    ],
    liveEvidence: [],
    evidenceMeta: [],
    decisions: [],
    capabilities: listReadOnlyCapabilities(),
    dataQuality: {
      warnings: [],
      sourceRows: {
        transactions: 0,
        expected: 0,
        leads: 0,
        dailyGearProducts: 0,
        dailyGearOrders: 0,
      },
      coverageDays: { current: 0, previous: 0 },
    },
  };
}

describe("buildAurenDataReadiness", () => {
  it("states it is waiting for first-party money and CRM feeds when empty", () => {
    const feeds = buildAurenDataReadiness(emptyAdvisory(), "no_data");
    const money = feeds.find((f) => f.id === "money-transactions");
    expect(money?.status).toBe("waiting");
    expect(money?.waitingFor).toMatch(/I am waiting to receive information from Money Center/);
    expect(money?.benefit).toMatch(/cash direction/i);

    const seo = feeds.find((f) => f.id === "cap-seo-competitor:read");
    expect(seo?.status).toBe("waiting");
    expect(seo?.waitingFor).toMatch(/I am waiting to receive information/);
    expect(seo?.benefit).toMatch(/organic visibility/i);
  });

  it("summarizes waiting counts for the decision panel", () => {
    const feeds = buildAurenDataReadiness(emptyAdvisory(), "no_data");
    const summary = summarizeReadiness(feeds);
    expect(summary.waiting).toBeGreaterThan(0);
    expect(summary.headline).toMatch(/waiting on/i);
  });
});
