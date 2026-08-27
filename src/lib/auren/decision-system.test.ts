import { describe, expect, it } from "vitest";
import {
  assessFreshness,
  buildAurenDecisions,
  decisionSystemSummary,
  normalizeEvidenceMeta,
  reconcileCounts,
  stageRate,
} from "./decision-system";

const now = new Date("2026-08-27T12:00:00.000Z");

describe("Auren decision system", () => {
  it("keeps missing denominators unavailable instead of converting them to zero", () => {
    expect(stageRate(2, null)).toBeNull();
    expect(stageRate(2, 0)).toBeNull();
    expect(stageRate(2, 4)).toBe(0.5);
  });

  it("classifies evidence freshness without inventing a source value", () => {
    expect(
      assessFreshness(now, { observedAt: "2026-08-27T10:00:00.000Z", status: "ok" }),
    ).toMatchObject({
      state: "fresh",
      label: "verified",
    });
    expect(
      assessFreshness(now, { observedAt: "2026-08-26T00:00:00.000Z", status: "ok" }),
    ).toMatchObject({
      state: "stale",
      label: "unavailable",
    });
    expect(
      assessFreshness(now, { observedAt: "2026-08-27T10:00:00.000Z", status: "unavailable" }),
    ).toMatchObject({
      state: "unavailable",
      label: "unavailable",
    });
  });

  it("flags source count mismatches as calculated reconciliation evidence", () => {
    expect(
      reconcileCounts(
        { count: 4, sourceKey: "meta:purchase" },
        { count: 3, sourceKey: "alexos:orders" },
        "Purchase count",
      ),
    ).toMatchObject({ status: "mismatch", label: "calculated" });
    expect(
      reconcileCounts(
        { count: null, sourceKey: "meta:purchase" },
        { count: 3, sourceKey: "alexos:orders" },
        "Purchase count",
      ),
    ).toMatchObject({ status: "unavailable", label: "unavailable" });
  });

  it("requires approval for operating decisions and never emits an automatic mutation", () => {
    const decisions = buildAurenDecisions({
      now,
      evidence: [
        {
          sourceType: "meta_ads_manager",
          sourceKey: "dailygear:meta",
          sourceUrl: null,
          sourceScope: "campaign",
          observedAt: now.toISOString(),
          windowStart: "2026-08-26",
          windowEnd: "2026-08-27",
          status: "partial",
          confidence: "low",
          label: "calculated",
          freshnessSeconds: 0,
          payload: {},
        },
      ],
      funnelEvents: {
        pageView: null,
        viewContent: null,
        addToCart: null,
        initiateCheckout: null,
        purchase: null,
      },
      inventoryWarnings: 1,
      cashAvailable: 2000,
      netCashFlow: -400,
    });

    expect(decisions.some((decision) => decision.id === "data-funnel-coverage")).toBe(true);
    expect(decisions.some((decision) => decision.id === "inventory-review-required")).toBe(true);
    expect(decisions.some((decision) => decision.id === "cash-flow-under-pressure")).toBe(true);
    expect(decisions.filter((decision) => decision.approvalRequired).length).toBeGreaterThan(0);
    expect(decisions.every((decision) => !("mutation" in decision))).toBe(true);
    expect(decisionSystemSummary(decisions).requiresApproval).toBeGreaterThan(0);
  });

  it("normalizes source metadata with a freshness-aware evidence label", () => {
    expect(
      normalizeEvidenceMeta(
        {
          source_type: "meta_ads_manager",
          source_key: "dailygear:campaign:123",
          source_url: null,
          source_scope: "campaign",
          observed_at: "2026-08-27T11:00:00.000Z",
          window_start: "2026-08-26",
          window_end: "2026-08-27",
          status: "partial",
          confidence: "low",
          payload: {},
        },
        now,
      ),
    ).toMatchObject({ sourceScope: "campaign", label: "calculated", freshnessSeconds: 3600 });
  });
});
