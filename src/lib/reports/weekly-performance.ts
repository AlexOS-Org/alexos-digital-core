import { formatDate } from "@/lib/money/format";
import { summarizeCurrencySafety } from "@/lib/money/currency-safety";
import type { Account, Expected, Transaction } from "@/lib/money/api";
import type { DailyGearProfitCashFlowResponse } from "@/lib/dailygear/profit-cash-flow.server";

export interface WeekPeriod {
  from: string; // YYYY-MM-DD
  until: string; // YYYY-MM-DD
  label: string;
  formattedRange: string;
  isCurrentWeek: boolean;
}

const NOTIFICATION_PREFS_KEY = "alexos-settings-notification-prefs-v1";

export function getWeeklySummaryPreference(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const raw = window.localStorage.getItem(NOTIFICATION_PREFS_KEY);
    if (!raw) return true;
    const parsed = JSON.parse(raw) as { weeklySummary?: boolean };
    return parsed.weeklySummary ?? true;
  } catch {
    return true;
  }
}

export function toDateString(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Calculates explicit weekly boundaries using ISO standard (Monday start, Sunday end).
 * Offset 0 is current week; offset -1 is previous week.
 */
export function getWeekBoundaries(referenceDate = new Date(), offsetWeeks = 0): WeekPeriod {
  const ref = new Date(referenceDate);
  ref.setHours(0, 0, 0, 0);

  const dayOfWeek = ref.getDay(); // 0 (Sun) to 6 (Sat)
  const diffToMonday = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek;

  const monday = new Date(ref);
  monday.setDate(ref.getDate() + diffToMonday + offsetWeeks * 7);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const from = toDateString(monday);
  const until = toDateString(sunday);

  const isCurrentWeek = offsetWeeks === 0;
  const label = isCurrentWeek ? "This Week" : "Last Week";
  const formattedRange = `${formatDate(monday)} – ${formatDate(sunday)}`;

  return {
    from,
    until,
    label,
    formattedRange,
    isCurrentWeek,
  };
}

export interface WeeklyFinancialSummary {
  currency: string | null;
  isMixedCurrency: boolean;
  warning: string | null;
  income: number | null;
  expenses: number | null;
  netCashFlow: number | null;
  transactionCount: number;
  hasTransactions: boolean;
  expectedPendingCount: number;
  expectedPendingTotal: number | null;
}

export function computeWeeklyFinancials(
  transactions: Transaction[],
  accounts: Account[],
  expected: Expected[],
  from: string,
  until: string,
): WeeklyFinancialSummary {
  const currencySafety = summarizeCurrencySafety(accounts);

  const weekTransactions = transactions.filter((t) => {
    if (t.status !== "posted" || !t.occurred_at) return false;
    const day = t.occurred_at.slice(0, 10);
    return day >= from && day <= until;
  });

  const pendingExpectedInPeriod = expected.filter((e) => {
    if (e.status !== "pending") return false;
    if (!e.expected_date) return true;
    const day = e.expected_date.slice(0, 10);
    return day >= from && day <= until;
  });

  const rawExpectedTotal = pendingExpectedInPeriod.reduce(
    (sum, e) => sum + Number(e.amount || 0),
    0,
  );

  if (currencySafety.isMixed) {
    return {
      currency: null,
      isMixedCurrency: true,
      warning:
        "Active accounts use multiple currencies. Aggregated cash flow totals withheld to prevent inaccurate figures. Review account-specific balances.",
      income: null,
      expenses: null,
      netCashFlow: null,
      transactionCount: weekTransactions.length,
      hasTransactions: weekTransactions.length > 0,
      expectedPendingCount: pendingExpectedInPeriod.length,
      expectedPendingTotal: null,
    };
  }

  const hasTransactions = weekTransactions.length > 0;
  const incomeTxs = weekTransactions.filter((t) => t.type === "income");
  const expenseTxs = weekTransactions.filter((t) => t.type === "expense");

  const rawIncome = incomeTxs.reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const rawExpense = expenseTxs.reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const rawNetFlow = rawIncome - rawExpense;

  return {
    currency: currencySafety.currency ?? "KES",
    isMixedCurrency: false,
    warning: null,
    income: hasTransactions ? rawIncome : null,
    expenses: hasTransactions ? rawExpense : null,
    netCashFlow: hasTransactions ? rawNetFlow : null,
    transactionCount: weekTransactions.length,
    hasTransactions,
    expectedPendingCount: pendingExpectedInPeriod.length,
    expectedPendingTotal: pendingExpectedInPeriod.length > 0 ? rawExpectedTotal : null,
  };
}

export interface WeeklyEcommerceSummary {
  orders: number;
  paidOrders: number;
  revenue: number | null;
  cogs: number | null;
  grossProfit: number | null;
  grossMarginPct: number | null;
  operatingExpenses: number | null;
  operatingProfit: number | null;
  operatingMarginPct: number | null;
  currency: string | null;
  metaSpend: number | null;
  metaSpendStatus: "available" | "unavailable";
  metaSpendReason: string | null;
  hasOrders: boolean;
  warnings: string[];
}

export function summarizeWeeklyEcommerce(
  response: DailyGearProfitCashFlowResponse | null,
): WeeklyEcommerceSummary {
  if (!response) {
    return {
      orders: 0,
      paidOrders: 0,
      revenue: null,
      cogs: null,
      grossProfit: null,
      grossMarginPct: null,
      operatingExpenses: null,
      operatingProfit: null,
      operatingMarginPct: null,
      currency: null,
      metaSpend: null,
      metaSpendStatus: "unavailable",
      metaSpendReason: "Financial data not loaded or unavailable.",
      hasOrders: false,
      warnings: [],
    };
  }

  const fin = response.financials;
  const hasOrders = fin.orders > 0;
  const meta = response.meta;

  const metaSpendStatus = meta.available ? "available" : "unavailable";
  const metaSpendReason = meta.available
    ? null
    : meta.error || "Meta Graph API sync not connected.";
  const metaSpend = meta.available ? fin.adSpend : null;

  return {
    orders: fin.orders,
    paidOrders: fin.paidOrders,
    revenue: hasOrders ? fin.revenue : null,
    cogs: hasOrders ? fin.cogs : null,
    grossProfit: hasOrders ? fin.grossProfit : null,
    grossMarginPct: hasOrders ? fin.grossMarginPct : null,
    operatingExpenses: hasOrders ? fin.operatingExpenses : null,
    operatingProfit: hasOrders ? fin.operatingProfit : null,
    operatingMarginPct: hasOrders ? fin.operatingMarginPct : null,
    currency: fin.currency,
    metaSpend,
    metaSpendStatus,
    metaSpendReason,
    hasOrders,
    warnings: fin.dataQuality?.warnings || [],
  };
}

export interface WebVitalsSummary {
  totalEvents: number;
  status: "ready" | "no_data";
  goodCount: number;
  needsImprovementCount: number;
  poorCount: number;
  metrics: {
    cls: { count: number; rating: string } | null;
    fcp: { count: number; rating: string } | null;
    inp: { count: number; rating: string } | null;
    lcp: { count: number; rating: string } | null;
  };
}

export interface WebVitalRawEvent {
  metric_name: string;
  metric_rating: string;
  metric_value: number;
  created_at: string;
}

export function summarizeWeeklyWebVitals(events: WebVitalRawEvent[]): WebVitalsSummary {
  if (!events || events.length === 0) {
    return {
      totalEvents: 0,
      status: "no_data",
      goodCount: 0,
      needsImprovementCount: 0,
      poorCount: 0,
      metrics: { cls: null, fcp: null, inp: null, lcp: null },
    };
  }

  let goodCount = 0;
  let needsImprovementCount = 0;
  let poorCount = 0;

  const countByMetric: Record<string, { count: number; ratingCounts: Record<string, number> }> = {
    CLS: { count: 0, ratingCounts: {} },
    FCP: { count: 0, ratingCounts: {} },
    INP: { count: 0, ratingCounts: {} },
    LCP: { count: 0, ratingCounts: {} },
  };

  for (const e of events) {
    if (e.metric_rating === "good") goodCount++;
    else if (e.metric_rating === "needs-improvement") needsImprovementCount++;
    else if (e.metric_rating === "poor") poorCount++;

    const bucket = countByMetric[e.metric_name];
    if (bucket) {
      bucket.count++;
      bucket.ratingCounts[e.metric_rating] = (bucket.ratingCounts[e.metric_rating] || 0) + 1;
    }
  }

  const getDominantRating = (metricKey: "CLS" | "FCP" | "INP" | "LCP") => {
    const bucket = countByMetric[metricKey];
    if (!bucket || bucket.count === 0) return null;
    const entries = Object.entries(bucket.ratingCounts);
    entries.sort((a, b) => b[1] - a[1]);
    return { count: bucket.count, rating: entries[0]?.[0] || "unknown" };
  };

  return {
    totalEvents: events.length,
    status: "ready",
    goodCount,
    needsImprovementCount,
    poorCount,
    metrics: {
      cls: getDominantRating("CLS"),
      fcp: getDominantRating("FCP"),
      inp: getDominantRating("INP"),
      lcp: getDominantRating("LCP"),
    },
  };
}

export interface AurenWeeklyObservation {
  id: string;
  tone: "positive" | "attention" | "informational";
  title: string;
  detail: string;
}

export function generateAurenWeeklyObservations(
  financials: WeeklyFinancialSummary,
  ecommerce: WeeklyEcommerceSummary,
  vitals: WebVitalsSummary,
): AurenWeeklyObservation[] {
  const observations: AurenWeeklyObservation[] = [];

  // Multi-currency observation
  if (financials.isMixedCurrency) {
    observations.push({
      id: "obs-currency-safety",
      tone: "attention",
      title: "Mixed currency accounts detected",
      detail:
        "Active accounts hold multiple currencies. Financial aggregates are withheld to prevent currency mixing.",
    });
  } else if (financials.hasTransactions && financials.netCashFlow !== null) {
    const isPositive = financials.netCashFlow >= 0;
    observations.push({
      id: "obs-cash-flow",
      tone: isPositive ? "positive" : "attention",
      title: isPositive ? "Positive weekly cash flow" : "Net cash outflow this week",
      detail: `${financials.transactionCount} posted transaction${
        financials.transactionCount === 1 ? "" : "s"
      } recorded with net cash flow of ${financials.currency ?? "KES"} ${financials.netCashFlow.toLocaleString(
        undefined,
        { maximumFractionDigits: 0 },
      )}.`,
    });
  } else {
    observations.push({
      id: "obs-financial-waiting",
      tone: "informational",
      title: "Auren is waiting for transaction data",
      detail:
        "No posted income or expense transactions occurred during this week. Cash flow direction cannot be judged without posted activity.",
    });
  }

  // E-commerce observation
  if (ecommerce.hasOrders && ecommerce.revenue !== null) {
    observations.push({
      id: "obs-ecommerce-performance",
      tone: "positive",
      title: "DailyGear order activity recognized",
      detail: `${ecommerce.orders} order${ecommerce.orders === 1 ? "" : "s"} recognized with ${
        ecommerce.currency ?? "KES"
      } ${ecommerce.revenue.toLocaleString(undefined, {
        maximumFractionDigits: 0,
      })} recognized revenue.`,
    });
  } else {
    observations.push({
      id: "obs-ecommerce-waiting",
      tone: "informational",
      title: "No e-commerce sales recognized",
      detail:
        "No new recognized customer orders were recorded for DailyGear in this weekly period.",
    });
  }

  // Meta Ads observation
  if (ecommerce.metaSpendStatus === "unavailable") {
    observations.push({
      id: "obs-meta-unavailable",
      tone: "informational",
      title: "Meta Ads telemetry unavailable",
      detail:
        ecommerce.metaSpendReason ||
        "Meta Ads spend is not synced for this period. Spend cannot be fabricated.",
    });
  }

  // Web vitals observation
  if (vitals.status === "ready") {
    observations.push({
      id: "obs-vitals-ready",
      tone: vitals.poorCount > 0 ? "attention" : "positive",
      title: "Web Vitals telemetry collected",
      detail: `${vitals.totalEvents} performance event${
        vitals.totalEvents === 1 ? "" : "s"
      } recorded (${vitals.goodCount} rated good, ${vitals.needsImprovementCount} needs improvement, ${vitals.poorCount} poor).`,
    });
  } else {
    observations.push({
      id: "obs-vitals-waiting",
      tone: "informational",
      title: "Web Vitals waiting for telemetry",
      detail:
        "No Web Vitals performance events captured on /e-commerce routes for this weekly period.",
    });
  }

  return observations;
}
