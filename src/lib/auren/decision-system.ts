import type { Json } from "@/integrations/supabase/types";

export type AurenEvidenceLabel = "verified" | "calculated" | "scenario" | "unavailable";
export type AurenDecisionPriority = "critical" | "high" | "medium" | "low";
export type AurenDecisionStatus = "informational" | "approval_required" | "blocked";
export type AurenSourceScope =
  "account" | "campaign" | "adset" | "ad" | "storefront" | "order" | "portfolio";

export interface AurenEvidenceMeta {
  sourceType: string;
  sourceKey: string;
  sourceUrl: string | null;
  sourceScope: AurenSourceScope;
  observedAt: string;
  windowStart: string | null;
  windowEnd: string | null;
  status: "ok" | "partial" | "unavailable";
  confidence: "high" | "medium" | "low" | "insufficient";
  label: AurenEvidenceLabel;
  freshnessSeconds: number | null;
  payload: Json;
}

export interface AurenDecision {
  id: string;
  priority: AurenDecisionPriority;
  area: "money" | "growth" | "funnel" | "inventory" | "data";
  title: string;
  evidence: string;
  recommendation: string;
  status: AurenDecisionStatus;
  approvalRequired: boolean;
  sourceKeys: string[];
  missingData: string[];
}

export interface AurenReconciliationResult {
  label: AurenEvidenceLabel;
  status: "consistent" | "mismatch" | "unavailable";
  summary: string;
  sourceKeys: string[];
  missingData: string[];
}

export interface AurenFreshnessResult {
  label: AurenEvidenceLabel;
  state: "fresh" | "aging" | "stale" | "unavailable";
  ageSeconds: number | null;
  message: string;
}

export interface AurenDecisionInput {
  now: Date;
  evidence: AurenEvidenceMeta[];
  accountMetrics?: {
    amountSpent: number | null;
    impressions: number | null;
    reach: number | null;
    clicksAll: number | null;
    linkClicks: number | null;
  };
  funnelEvents?: {
    pageView: number | null;
    viewContent: number | null;
    addToCart: number | null;
    initiateCheckout: number | null;
    purchase: number | null;
  };
  inventoryWarnings: number | null;
  cashAvailable: number | null;
  netCashFlow: number | null;
}

const MAX_FRESH_SECONDS = 6 * 60 * 60;
const MAX_AGING_SECONDS = 24 * 60 * 60;

function finiteOrNull(value: number | null | undefined): number | null {
  return value !== null && value !== undefined && Number.isFinite(value) ? value : null;
}

function ageSeconds(now: Date, observedAt: string): number | null {
  const observed = Date.parse(observedAt);
  if (!Number.isFinite(observed)) return null;
  return Math.max(0, Math.floor((now.getTime() - observed) / 1000));
}

export function classifyEvidenceLabel(
  meta: Pick<AurenEvidenceMeta, "status" | "confidence">,
): AurenEvidenceLabel {
  if (meta.status === "unavailable" || meta.confidence === "insufficient") return "unavailable";
  if (meta.status === "partial") return "calculated";
  return "verified";
}

export function assessFreshness(
  now: Date,
  meta: Pick<AurenEvidenceMeta, "observedAt" | "status">,
): AurenFreshnessResult {
  if (meta.status === "unavailable") {
    return {
      label: "unavailable",
      state: "unavailable",
      ageSeconds: null,
      message: "Source data is unavailable.",
    };
  }
  const age = ageSeconds(now, meta.observedAt);
  if (age === null) {
    return {
      label: "unavailable",
      state: "unavailable",
      ageSeconds: null,
      message: "Source observation time is unavailable.",
    };
  }
  if (age <= MAX_FRESH_SECONDS) {
    return {
      label: "verified",
      state: "fresh",
      ageSeconds: age,
      message: "Source snapshot is fresh.",
    };
  }
  if (age <= MAX_AGING_SECONDS) {
    return {
      label: "calculated",
      state: "aging",
      ageSeconds: age,
      message: "Source snapshot is aging; refresh before acting.",
    };
  }
  return {
    label: "unavailable",
    state: "stale",
    ageSeconds: age,
    message: "Source snapshot is stale; do not use it for an operating decision.",
  };
}

export function stageRate(later: number | null, prior: number | null): number | null {
  const laterValue = finiteOrNull(later);
  const priorValue = finiteOrNull(prior);
  if (laterValue === null || priorValue === null || priorValue <= 0) return null;
  return laterValue / priorValue;
}

export function reconcileCounts(
  left: { count: number | null; sourceKey: string },
  right: { count: number | null; sourceKey: string },
  label: string,
): AurenReconciliationResult {
  if (left.count === null || right.count === null) {
    return {
      label: "unavailable",
      status: "unavailable",
      summary: `${label} cannot be reconciled because one or more source counts are unavailable.`,
      sourceKeys: [left.sourceKey, right.sourceKey],
      missingData: [
        left.count === null ? left.sourceKey : "",
        right.count === null ? right.sourceKey : "",
      ].filter(Boolean),
    };
  }
  if (left.count < 0 || right.count < 0) {
    return {
      label: "unavailable",
      status: "unavailable",
      summary: `${label} contains an invalid negative count and is withheld.`,
      sourceKeys: [left.sourceKey, right.sourceKey],
      missingData: ["non-negative event counts"],
    };
  }
  return {
    label: "calculated",
    status: left.count === right.count ? "consistent" : "mismatch",
    summary:
      left.count === right.count
        ? `${label} agrees across both sources.`
        : `${label} differs across sources; investigate attribution or date-window differences before acting.`,
    sourceKeys: [left.sourceKey, right.sourceKey],
    missingData: [],
  };
}

function decision(
  input: Omit<AurenDecision, "approvalRequired" | "status"> & {
    status?: AurenDecisionStatus;
    approvalRequired?: boolean;
  },
): AurenDecision {
  return {
    ...input,
    status: input.status ?? "approval_required",
    approvalRequired: input.approvalRequired ?? true,
  };
}

export function buildAurenDecisions(input: AurenDecisionInput): AurenDecision[] {
  const decisions: AurenDecision[] = [];
  const funnel = input.funnelEvents;
  const missingFunnel = funnel
    ? Object.entries(funnel)
        .filter(([, value]) => value === null)
        .map(([key]) => key)
    : ["all funnel events"];

  if (missingFunnel.length > 0) {
    decisions.push(
      decision({
        id: "data-funnel-coverage",
        priority: "high",
        area: "data",
        title: "Complete funnel measurement before optimizing spend",
        evidence:
          "One or more funnel event counts are unavailable, so stage conversion and drop-off cannot be calculated honestly.",
        recommendation:
          "Refresh the connected event source and verify the PageView, ViewContent, AddToCart, InitiateCheckout, and confirmed Purchase date windows before making a funnel decision.",
        sourceKeys: input.evidence
          .filter((item) => item.sourceType.includes("meta") || item.sourceType === "storefront")
          .map((item) => item.sourceKey),
        missingData: missingFunnel,
      }),
    );
  }

  if (input.inventoryWarnings !== null && input.inventoryWarnings > 0) {
    decisions.push(
      decision({
        id: "inventory-review-required",
        priority: "high",
        area: "inventory",
        title: "Review inventory risk",
        evidence: `${input.inventoryWarnings} active inventory warning(s) were returned by AlexOS records.`,
        recommendation:
          "Verify real supplier availability and demand evidence before changing publication or purchasing stock.",
        sourceKeys: ["alexos:inventory"],
        missingData: [],
      }),
    );
  }

  if (input.netCashFlow !== null && input.netCashFlow < 0) {
    decisions.push(
      decision({
        id: "cash-flow-under-pressure",
        priority: "critical",
        area: "money",
        title: "Protect cash before new commitments",
        evidence: `Recorded net cash flow is ${input.netCashFlow}, which is below zero for the selected scope and window.`,
        recommendation:
          "Review upcoming commitments and expected-income timing; no payment, transfer, or budget change is performed automatically.",
        sourceKeys: ["alexos:transactions", "alexos:expected_money"],
        missingData: input.cashAvailable === null ? ["cashAvailable"] : [],
      }),
    );
  }

  if (decisions.length === 0) {
    decisions.push(
      decision({
        id: "decision-baseline-healthy",
        priority: "low",
        area: "data",
        title: "Keep building the operating baseline",
        evidence:
          "No deterministic risk condition was triggered by the currently available, scoped records.",
        recommendation:
          "Continue refreshing verified sources so Auren can distinguish durable trends from incomplete or stale observations.",
        status: "informational",
        approvalRequired: false,
        sourceKeys: input.evidence.map((item) => item.sourceKey),
        missingData: [],
      }),
    );
  }

  return decisions.slice(0, 12);
}

export function normalizeEvidenceMeta(
  row: {
    source_type: string;
    source_key: string;
    source_url?: string | null;
    source_scope?: AurenSourceScope | null;
    observed_at: string;
    window_start?: string | null;
    window_end?: string | null;
    status: "ok" | "partial" | "unavailable";
    confidence: "high" | "medium" | "low" | "insufficient";
    payload: Json;
  },
  now: Date,
): AurenEvidenceMeta {
  const freshness = assessFreshness(now, {
    observedAt: row.observed_at,
    status: row.status,
  });
  return {
    sourceType: row.source_type,
    sourceKey: row.source_key,
    sourceUrl: row.source_url ?? null,
    sourceScope: row.source_scope ?? "portfolio",
    observedAt: row.observed_at,
    windowStart: row.window_start ?? null,
    windowEnd: row.window_end ?? null,
    status: row.status,
    confidence: row.confidence,
    label:
      row.status === "unavailable"
        ? "unavailable"
        : freshness.state === "stale"
          ? "unavailable"
          : classifyEvidenceLabel(row),
    freshnessSeconds: freshness.ageSeconds,
    payload: row.payload,
  };
}

export function decisionSystemSummary(decisions: AurenDecision[]): {
  requiresApproval: number;
  blocked: number;
  informational: number;
} {
  return decisions.reduce(
    (summary, item) => {
      if (item.approvalRequired) summary.requiresApproval += 1;
      if (item.status === "blocked") summary.blocked += 1;
      if (item.status === "informational") summary.informational += 1;
      return summary;
    },
    { requiresApproval: 0, blocked: 0, informational: 0 },
  );
}
