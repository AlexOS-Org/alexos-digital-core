import { env as workerEnv } from "cloudflare:workers";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/integrations/supabase/types";
import type { DashboardSnapshot } from "@/lib/dashboard/types";
import { computeDashboardMetrics } from "@/lib/dashboard/calculations";
import { generateSignals } from "@/lib/intelligence/signals";
import { getAurenPublicContext, type AurenPublicContextRecord } from "./public-context";
import {
  buildAurenDecisions,
  normalizeEvidenceMeta,
  type AurenDecision,
  type AurenEvidenceMeta,
} from "./decision-system";

const AI_MODEL = "@cf/meta/llama-3.2-3b-instruct";
const MAX_ROWS = 5000;
export type AurenAdvisorPeriod = "last_30d" | "last_90d";
export type AurenAdvisorScope = "portfolio" | "personal" | "businesses";
export type AurenForecastHorizon = 30 | 90;
export type AurenConfidence = "high" | "medium" | "low" | "insufficient";
export type AurenOutlook = "improving" | "stable" | "under_pressure" | "insufficient_data";
export interface AurenAdvisorRequest {
  period: AurenAdvisorPeriod;
  scope: AurenAdvisorScope;
  horizonDays: AurenForecastHorizon;
  businessId?: string | null;
}
export interface AurenBusinessRecord {
  id: string;
  name: string;
  slug: string;
  status: string | null;
}
export interface AurenAccountRecord {
  id: string;
  currency: string | null;
}
export interface AurenTransactionRecord {
  amount: number | string | null;
  type: string | null;
  status: string | null;
  occurred_at: string;
  business_id: string | null;
  business_name: string | null;
  financial_scope: string | null;
  deleted_at: string | null;
  account_id: string | null;
}
export interface AurenExpectedRecord {
  amount: number | string | null;
  probability: number | string | null;
  expected_date: string;
  status: string | null;
  business_id: string | null;
  financial_scope: string | null;
  deleted_at: string | null;
}
export interface AurenDailyGearRecord {
  products: Array<{
    id: string;
    stock_quantity: number;
    low_stock_threshold: number;
    status: string;
  }>;
  orders: Array<{
    id: string;
    status: string;
    payment_status: string;
    total: number;
    currency: string;
    placed_at: string;
  }>;
}
export interface AurenForecast {
  horizonDays: AurenForecastHorizon;
  lower: number | null;
  base: number | null;
  upper: number | null;
  currency: string | null;
  method: "current_run_rate_range" | "insufficient_data";
  confidence: AurenConfidence;
  assumptions: string[];
}
export interface AurenBusinessSummary {
  id: string | null;
  name: string;
  slug: string | null;
  currentIncome: number | null;
  previousIncome: number | null;
  currentExpenses: number | null;
  previousExpenses: number | null;
  currentNetCashFlow: number | null;
  incomeChangePct: number | null;
  expenseChangePct: number | null;
  outlook: AurenOutlook;
}
export interface AurenRecommendation {
  id: string;
  priority: "critical" | "high" | "medium" | "low";
  area: "money" | "business" | "dailygear" | "goals" | "data";
  title: string;
  evidence: string;
  recommendation: string;
  action?: { label: string; to: string };
  confidence: AurenConfidence;
}
export interface AurenLiveEvidenceRecord {
  sourceType:
    | "meta_ads_manager"
    | "instagram_insights"
    | "public_ads_library"
    | "public_competitor_page"
    | "first_party_funnel";
  sourceKey: string;
  sourceUrl: string | null;
  observedAt: string;
  status: "ok" | "partial" | "unavailable";
  confidence: AurenConfidence;
  summary: string | null;
  payload: Json;
}

export interface AurenAdvisorySnapshot {
  asOf: string;
  period: { from: string; until: string; days: number };
  scope: AurenAdvisorScope;
  currency: string | null;
  outlook: AurenOutlook;
  verified: {
    cashAvailable: number | null;
    income: number | null;
    expenses: number | null;
    netCashFlow: number | null;
    incomeChangePct: number | null;
    expenseChangePct: number | null;
    pendingExpectedCount: number;
    weightedExpected: number | null;
    openLeads: number;
    staleLeads: number;
    pipelineValue: number | null;
    weightedPipelineValue: number | null;
    dailyGearRevenue: number | null;
    dailyGearOrders: number;
    dailyGearLowStock: number;
  };
  forecasts: {
    income: AurenForecast;
    expenses: AurenForecast;
    netCashFlow: AurenForecast;
    dailyGearRevenue: AurenForecast;
  };
  businesses: AurenBusinessSummary[];
  recommendations: AurenRecommendation[];
  externalContext: AurenPublicContextRecord[];
  liveEvidence: AurenLiveEvidenceRecord[];
  evidenceMeta: AurenEvidenceMeta[];
  decisions: AurenDecision[];
  dataQuality: {
    warnings: string[];
    sourceRows: Record<string, number>;
    coverageDays: { current: number; previous: number };
  };
}
export interface AurenAdvisoryInput {
  request: AurenAdvisorRequest;
  now?: Date;
  businesses: AurenBusinessRecord[];
  accounts: AurenAccountRecord[];
  transactions: AurenTransactionRecord[];
  expected: AurenExpectedRecord[];
  dailyGear: AurenDailyGearRecord;
  dashboardSnapshot: DashboardSnapshot;
}
const num = (value: unknown) => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};
const dateOnly = (value: Date | string) =>
  (value instanceof Date ? value : new Date(value)).toISOString().slice(0, 10);
const shiftDate = (date: Date, days: number) => {
  const shifted = new Date(date);
  shifted.setUTCDate(shifted.getUTCDate() + days);
  return shifted;
};
const pctChange = (current: number, previous: number) =>
  previous > 0 ? ((current - previous) / previous) * 100 : null;
const inRange = (value: string | null | undefined, from: string, until: string) =>
  Boolean(value && value.slice(0, 10) >= from && value.slice(0, 10) <= until);
function bounds(now: Date, days: number) {
  return {
    from: dateOnly(shiftDate(now, -(days - 1))),
    until: dateOnly(now),
    previousFrom: dateOnly(shiftDate(now, -(days * 2 - 1))),
    previousUntil: dateOnly(shiftDate(now, -days)),
  };
}
function scopeMatches(
  scope: AurenAdvisorScope,
  row: { business_id: string | null; financial_scope: string | null },
) {
  return (
    scope === "portfolio" ||
    (scope === "personal"
      ? row.business_id === null && row.financial_scope === "personal"
      : row.business_id !== null || row.financial_scope === "business")
  );
}
function activeDays<T extends { occurred_at?: string; placed_at?: string }>(
  rows: T[],
  field: "occurred_at" | "placed_at",
) {
  return new Set(rows.map((row) => row[field]?.slice(0, 10)).filter(Boolean)).size;
}
function sumType(rows: AurenTransactionRecord[], type: "income" | "expense") {
  return rows.filter((row) => row.type === type).reduce((sum, row) => sum + num(row.amount), 0);
}
function confidence(current: number, previous: number): AurenConfidence {
  if (current < 7 || previous < 7) return "insufficient";
  if (current < 14 || previous < 14) return "low";
  if (current < 21 || previous < 21) return "medium";
  return "high";
}
function forecast(
  current: number,
  previous: number,
  currency: string | null,
  horizonDays: AurenForecastHorizon,
  currentDays: number,
  previousDays: number,
): AurenForecast {
  const level = confidence(currentDays, previousDays);
  if (!currency || currentDays === 0 || level === "insufficient")
    return {
      horizonDays,
      lower: null,
      base: null,
      upper: null,
      currency,
      method: "insufficient_data",
      confidence: level,
      assumptions: ["At least seven active days in both comparison periods are required."],
    };
  const base = (current / currentDays) * horizonDays;
  return {
    horizonDays,
    lower: Math.max(0, base * 0.75),
    base,
    upper: base * 1.25,
    currency,
    method: "current_run_rate_range",
    confidence: level,
    assumptions: [
      `Base case uses the current ${currentDays}-day active run-rate over ${horizonDays} days.`,
      "The range is ±25% operating variance, not a statistical confidence interval.",
      previous > 0
        ? `The comparison period direction was ${pctChange(current, previous)?.toFixed(1)}%.`
        : "No positive comparison-period baseline exists.",
    ],
  };
}
function outlookFor(
  income: number | null,
  expenses: number | null,
  net: number | null,
): AurenOutlook {
  if (income === null && expenses === null && net === null) return "insufficient_data";
  if (net !== null && net < 0) return "under_pressure";
  if (expenses !== null && expenses >= 15 && (income === null || expenses > income))
    return "under_pressure";
  if (income !== null && income >= 10 && (expenses === null || income > expenses))
    return "improving";
  return "stable";
}
function businessSummaries(
  businesses: AurenBusinessRecord[],
  rows: AurenTransactionRecord[],
  range: ReturnType<typeof bounds>,
  currency: string | null,
): AurenBusinessSummary[] {
  const businessRows = rows.filter((row) => scopeMatches("businesses", row));
  const names = new Map(businesses.map((business) => [business.id, business]));
  const keys = new Set(businesses.map((business) => business.id));
  businessRows.forEach((row) => {
    if (row.business_id) keys.add(row.business_id);
  });
  if (businessRows.some((row) => row.business_id === null)) keys.add("unassigned");
  return [...keys].map((key) => {
    const same = (row: AurenTransactionRecord) =>
      key === "unassigned" ? row.business_id === null : row.business_id === key;
    const current = businessRows.filter(
      (row) =>
        same(row) &&
        row.deleted_at === null &&
        row.status === "posted" &&
        inRange(row.occurred_at, range.from, range.until) &&
        (row.type === "income" || row.type === "expense"),
    );
    const previous = businessRows.filter(
      (row) =>
        same(row) &&
        row.deleted_at === null &&
        row.status === "posted" &&
        inRange(row.occurred_at, range.previousFrom, range.previousUntil) &&
        (row.type === "income" || row.type === "expense"),
    );
    const ci = sumType(current, "income");
    const pi = sumType(previous, "income");
    const ce = sumType(current, "expense");
    const pe = sumType(previous, "expense");
    return {
      id: key === "unassigned" ? null : key,
      name:
        names.get(key)?.name ??
        (key === "unassigned" ? "Unassigned business activity" : "Business activity"),
      slug: names.get(key)?.slug ?? null,
      currentIncome: currency ? ci : null,
      previousIncome: currency ? pi : null,
      currentExpenses: currency ? ce : null,
      previousExpenses: currency ? pe : null,
      currentNetCashFlow: currency ? ci - ce : null,
      incomeChangePct: currency ? pctChange(ci, pi) : null,
      expenseChangePct: currency ? pctChange(ce, pe) : null,
      outlook: outlookFor(
        currency ? pctChange(ci, pi) : null,
        currency ? pctChange(ce, pe) : null,
        currency ? ci - ce : null,
      ),
    };
  });
}
function recommendations(
  metrics: ReturnType<typeof computeDashboardMetrics>,
  scope: AurenAdvisorScope,
  outlook: AurenOutlook,
  dailyGear: AurenDailyGearRecord,
  warnings: string[],
): AurenRecommendation[] {
  const allowed =
    scope === "portfolio"
      ? null
      : scope === "personal"
        ? new Set(["money", "goals"])
        : new Set(["crm", "business"]);
  const result: AurenRecommendation[] = generateSignals(metrics)
    .filter((signal) => !allowed || allowed.has(signal.category))
    .slice(0, 6)
    .map((signal) => ({
      id: signal.id,
      priority: signal.priority,
      area: signal.category === "crm" ? "business" : signal.category,
      title: signal.title,
      evidence: signal.description,
      recommendation: signal.recommendation,
      action: signal.action,
      confidence: "high",
    }));
  if (outlook === "under_pressure")
    result.unshift({
      id: "forecast-protect-cash",
      priority: "critical",
      area: "money",
      title: "Protect cash before new commitments",
      evidence: "Recorded expense growth is outpacing income growth in the selected period.",
      recommendation:
        "Review non-essential spending and confirm expected-income timing before committing cash.",
      action: { label: "Open Money Center", to: "/money-center" },
      confidence: "medium",
    });
  if (scope !== "personal") {
    const low = dailyGear.products.filter(
      (product) =>
        product.status === "active" &&
        num(product.low_stock_threshold) > 0 &&
        num(product.stock_quantity) <= num(product.low_stock_threshold),
    ).length;
    if (low > 0)
      result.push({
        id: "dailygear-low-stock",
        priority: "high",
        area: "dailygear",
        title: "Protect DailyGear availability",
        evidence: `${low} active DailyGear product(s) are at or below their configured low-stock threshold.`,
        recommendation:
          "Verify supplier availability and replenish only products with current demand evidence; do not publish unverified stock.",
        action: { label: "Review inventory", to: "/e-commerce/inventory" },
        confidence: "high",
      });
  }
  if (result.length === 0)
    result.push({
      id: "data-build-baseline",
      priority: "low",
      area: "data",
      title: "Build a reliable decision baseline",
      evidence: warnings[0] ?? "No deterministic risk signal was triggered by the recorded data.",
      recommendation:
        "Keep recording transactions, pipeline updates and verified DailyGear orders so Auren can distinguish trend from noise.",
      action: { label: "Open Command Center", to: "/dashboard" },
      confidence: "insufficient",
    });
  return result.slice(0, 7);
}
export function validateAurenAdvisorRequest(raw: unknown): AurenAdvisorRequest {
  const input = (raw ?? {}) as Record<string, unknown>;
  const period = input.period ?? "last_30d";
  const scope = input.scope ?? "portfolio";
  const horizonDays = input.horizonDays ?? 30;
  const businessId =
    typeof input.businessId === "string" && input.businessId.trim() ? input.businessId : null;
  if (period !== "last_30d" && period !== "last_90d")
    throw new Error("period must be last_30d or last_90d.");
  if (scope !== "portfolio" && scope !== "personal" && scope !== "businesses")
    throw new Error("scope must be portfolio, personal, or businesses.");
  if (horizonDays !== 30 && horizonDays !== 90) throw new Error("horizonDays must be 30 or 90.");
  return { period, scope, horizonDays, businessId };
}
export function buildAurenAdvisory(input: AurenAdvisoryInput): AurenAdvisorySnapshot {
  const now = input.now ?? new Date();
  const days = input.request.period === "last_90d" ? 90 : 30;
  const range = bounds(now, days);
  const matches = (row: AurenTransactionRecord) =>
    row.deleted_at === null &&
    row.status === "posted" &&
    scopeMatches(input.request.scope, row) &&
    (row.type === "income" || row.type === "expense");
  const current = input.transactions.filter(
    (row) => matches(row) && inRange(row.occurred_at, range.from, range.until),
  );
  const previous = input.transactions.filter(
    (row) => matches(row) && inRange(row.occurred_at, range.previousFrom, range.previousUntil),
  );
  const accountMap = new Map(input.accounts.map((account) => [account.id, account]));
  const currencies = [
    ...new Set(
      [...current, ...previous].map(
        (row) => accountMap.get(row.account_id ?? "")?.currency ?? "unknown",
      ),
    ),
  ];
  const warnings: string[] = [];
  const currency = currencies.length === 1 && currencies[0] !== "unknown" ? currencies[0] : null;
  if (currencies.length > 1)
    warnings.push(
      "Multiple currencies are present; totals and forecasts are not combined without FX conversion.",
    );
  if (currencies.includes("unknown"))
    warnings.push(
      "Some transactions do not have a resolvable account currency; financial totals are withheld.",
    );
  const income = sumType(current, "income");
  const previousIncome = sumType(previous, "income");
  const expenses = sumType(current, "expense");
  const previousExpenses = sumType(previous, "expense");
  const net = income - expenses;
  const currentDays = activeDays(current, "occurred_at");
  const previousDays = activeDays(previous, "occurred_at");
  const metrics = computeDashboardMetrics(input.dashboardSnapshot, now);
  const validOrders = input.dailyGear.orders.filter(
    (order) => order.status !== "cancelled" && order.payment_status !== "refunded",
  );
  const dgCurrencies = [...new Set(validOrders.map((order) => order.currency).filter(Boolean))];
  const dgCurrency = dgCurrencies.length === 1 ? dgCurrencies[0] : null;
  if (dgCurrencies.length > 1)
    warnings.push(
      "DailyGear contains more than one order currency; its revenue forecast is withheld.",
    );
  const dgCurrent = validOrders.filter((order) =>
    inRange(order.placed_at, range.from, range.until),
  );
  const dgPrevious = validOrders.filter((order) =>
    inRange(order.placed_at, range.previousFrom, range.previousUntil),
  );
  const dgRevenue = dgCurrency ? dgCurrent.reduce((sum, order) => sum + num(order.total), 0) : 0;
  const dgPreviousRevenue = dgCurrency
    ? dgPrevious.reduce((sum, order) => sum + num(order.total), 0)
    : 0;
  const dgCurrentDays = activeDays(dgCurrent, "placed_at");
  const dgPreviousDays = activeDays(dgPrevious, "placed_at");
  const expectedRows = input.expected.filter(
    (row) =>
      row.deleted_at === null && row.status === "pending" && scopeMatches(input.request.scope, row),
  );
  const weightedExpected = expectedRows.reduce(
    (sum, row) => sum + (num(row.amount) * Math.max(0, Math.min(100, num(row.probability)))) / 100,
    0,
  );
  const outlook = outlookFor(
    pctChange(income, previousIncome),
    pctChange(expenses, previousExpenses),
    currency ? net : null,
  );
  const effectiveCurrency = currency ?? dgCurrency;
  if (
    current.length === 0 &&
    previous.length === 0 &&
    validOrders.length === 0 &&
    input.dashboardSnapshot.leads.length === 0
  )
    warnings.push("There is not enough recorded activity to make a performance prediction.");
  if (previousIncome <= 0 && income > 0)
    warnings.push(
      "Income has no positive comparison-period baseline; no percentage growth is stated.",
    );
  if (previousExpenses <= 0 && expenses > 0)
    warnings.push(
      "Expenses have no positive comparison-period baseline; no percentage growth is stated.",
    );
  return {
    asOf: dateOnly(now),
    period: { from: range.from, until: range.until, days },
    scope: input.request.scope,
    currency: effectiveCurrency,
    outlook,
    verified: {
      cashAvailable: input.request.scope === "portfolio" ? metrics.money.cashAvailable : null,
      income: currency ? income : null,
      expenses: currency ? expenses : null,
      netCashFlow: currency ? net : null,
      incomeChangePct: currency ? pctChange(income, previousIncome) : null,
      expenseChangePct: currency ? pctChange(expenses, previousExpenses) : null,
      pendingExpectedCount: expectedRows.length,
      weightedExpected: currency ? weightedExpected : null,
      openLeads: input.request.scope === "personal" ? 0 : metrics.business.openLeads,
      staleLeads: input.request.scope === "personal" ? 0 : metrics.business.staleLeads.length,
      pipelineValue: input.request.scope === "personal" ? null : metrics.business.pipelineValue,
      weightedPipelineValue:
        input.request.scope === "personal" ? null : metrics.business.weightedPipelineValue,
      dailyGearRevenue: dgCurrency ? dgRevenue : null,
      dailyGearOrders: dgCurrent.length,
      dailyGearLowStock: input.dailyGear.products.filter(
        (product) =>
          product.status === "active" &&
          num(product.low_stock_threshold) > 0 &&
          num(product.stock_quantity) <= num(product.low_stock_threshold),
      ).length,
    },
    forecasts: {
      income: forecast(
        income,
        previousIncome,
        currency,
        input.request.horizonDays,
        currentDays,
        previousDays,
      ),
      expenses: forecast(
        expenses,
        previousExpenses,
        currency,
        input.request.horizonDays,
        currentDays,
        previousDays,
      ),
      netCashFlow:
        currency && currentDays >= 7 && previousDays >= 7
          ? {
              ...forecast(
                Math.max(0, net),
                Math.max(0, previousIncome - previousExpenses),
                currency,
                input.request.horizonDays,
                currentDays,
                previousDays,
              ),
              lower: net >= 0 ? (net / currentDays) * input.request.horizonDays * 0.75 : null,
              base: (net / currentDays) * input.request.horizonDays,
              upper: net >= 0 ? (net / currentDays) * input.request.horizonDays * 1.25 : null,
            }
          : forecast(0, 0, currency, input.request.horizonDays, 0, 0),
      dailyGearRevenue: forecast(
        dgRevenue,
        dgPreviousRevenue,
        dgCurrency,
        input.request.horizonDays,
        dgCurrentDays,
        dgPreviousDays,
      ),
    },
    businesses:
      input.request.scope === "personal"
        ? []
        : businessSummaries(input.businesses, input.transactions, range, currency),
    recommendations: recommendations(
      metrics,
      input.request.scope,
      outlook,
      input.dailyGear,
      warnings,
    ),
    externalContext: getAurenPublicContext(input.request.scope),
    liveEvidence: [],
    evidenceMeta: [],
    decisions: [],
    dataQuality: {
      warnings,
      sourceRows: {
        transactions: input.transactions.length,
        expected: input.expected.length,
        leads: input.dashboardSnapshot.leads.length,
        dailyGearProducts: input.dailyGear.products.length,
        dailyGearOrders: input.dailyGear.orders.length,
      },
      coverageDays: { current: currentDays, previous: previousDays },
    },
  };
}
export interface AurenAdvisoryResponse {
  status: "ready" | "no_data" | "ai_unavailable";
  advisory: AurenAdvisorySnapshot;
  summary: string | null;
  model: string | null;
}
function extractAiText(value: unknown): string | null {
  if (!value || typeof value !== "object") return null;
  const payload = value as {
    response?: unknown;
    choices?: Array<{ message?: { content?: unknown } }>;
  };
  if (typeof payload.response === "string" && payload.response.trim())
    return payload.response.trim();
  const content = payload.choices?.[0]?.message?.content;
  return typeof content === "string" && content.trim() ? content.trim() : null;
}
function advisoryPrompt(advisory: AurenAdvisorySnapshot) {
  return [
    "You are Auren, the evidence-first business intelligence layer inside AlexOS.",
    "Write a concise owner-facing decision brief from the supplied advisory JSON.",
    "Use only values and names in the JSON. Never invent causes, numbers, customers, products, market facts or certainty.",
    "Forecast ranges are operating scenarios, not guaranteed predictions and not statistical confidence intervals.",
    "Distinguish verified values from recommendations. If a value is null or dataQuality warns about coverage, say that the data is not sufficient.",
    "External context is background only. It cannot prove current stock, orders, revenue, prices, demand, customer behavior or financial performance.",
    "When external context has a source URL, identify it as public context and do not present it as a live AlexOS record. When a source is missing, say that entity-verified public context is unavailable.",
    "Use exactly these three labels, each on its own line: Read: ; Risk: ; Next move: . Keep each line under 180 characters.",
    `Advisory JSON: ${JSON.stringify(advisory)}`,
  ].join("\n");
}
type FunnelEventName = "pageView" | "viewContent" | "addToCart" | "initiateCheckout" | "purchase";

type FunnelEventCounts = Record<FunnelEventName, number | null>;

function funnelEventsFromEvidence(evidence: AurenLiveEvidenceRecord[]): {
  counts: FunnelEventCounts;
  observedAt: string | null;
  rowCount: number;
} {
  const source = evidence.find((row) => row.sourceType === "first_party_funnel");
  const payload = source?.payload;
  const value = (name: FunnelEventName) => {
    const count =
      payload && typeof payload === "object"
        ? Number((payload as Record<string, unknown>)[name])
        : NaN;
    return Number.isInteger(count) && count >= 0 ? count : null;
  };
  const counts = {
    pageView: value("pageView"),
    viewContent: value("viewContent"),
    addToCart: value("addToCart"),
    initiateCheckout: value("initiateCheckout"),
    purchase: value("purchase"),
  };
  const rowCount =
    payload && typeof payload === "object"
      ? Number((payload as Record<string, unknown>).rowCount)
      : 0;
  return {
    counts,
    observedAt: source?.observedAt ?? null,
    rowCount: Number.isInteger(rowCount) && rowCount > 0 ? rowCount : 0,
  };
}

function noData(advisory: AurenAdvisorySnapshot) {
  return (
    Object.values(advisory.dataQuality.sourceRows).every((value) => value === 0) &&
    advisory.liveEvidence.length === 0
  );
}
export async function getAurenAdvisoryForUser(
  request: AurenAdvisorRequest,
  context: { supabase: SupabaseClient<Database>; userId: string },
): Promise<AurenAdvisoryResponse> {
  const userId = context.userId;
  const scoped = (table: string) =>
    context.supabase
      .from(table as never)
      .select("*")
      .eq("user_id", userId)
      .limit(MAX_ROWS);
  const [
    businessesResult,
    accountsResult,
    balancesResult,
    transactionsResult,
    expectedResult,
    billsResult,
    debtsResult,
    goalsResult,
    goalProgressResult,
    contactsResult,
    leadsResult,
    productsResult,
    ordersResult,
    liveEvidenceResult,
  ] = await Promise.all([
    context.supabase
      .from("businesses")
      .select("id, name, slug, status")
      .eq("user_id", userId)
      .limit(MAX_ROWS),
    scoped("accounts"),
    context.supabase.from("account_balances").select("*").eq("user_id", userId).limit(MAX_ROWS),
    scoped("transactions"),
    scoped("expected_money"),
    scoped("bills"),
    scoped("debts"),
    scoped("goals"),
    context.supabase.from("goal_progress").select("*").eq("user_id", userId).limit(MAX_ROWS),
    scoped("contacts"),
    scoped("leads"),
    scoped("dg_products"),
    context.supabase.from("dg_orders").select("*").eq("user_id", userId).limit(MAX_ROWS),
    context.supabase
      .from("auren_evidence_snapshots" as never)
      .select("source_type,source_key,source_url,observed_at,status,confidence,summary,payload")
      .eq("user_id", userId)
      .order("observed_at", { ascending: false })
      .limit(60),
  ]);
  const results = [
    businessesResult,
    accountsResult,
    balancesResult,
    transactionsResult,
    expectedResult,
    billsResult,
    debtsResult,
    goalsResult,
    goalProgressResult,
    contactsResult,
    leadsResult,
    productsResult,
    ordersResult,
    liveEvidenceResult,
  ];
  const failed = results.find((result) => result.error);
  if (failed?.error) throw failed.error;
  const liveEvidence = ((liveEvidenceResult.data ?? []) as Array<Record<string, unknown>>).map(
    (row) => ({
      sourceType: row.source_type as AurenLiveEvidenceRecord["sourceType"],
      sourceKey: String(row.source_key ?? ""),
      sourceUrl: typeof row.source_url === "string" ? row.source_url : null,
      observedAt: String(row.observed_at ?? new Date().toISOString()),
      status: row.status as AurenLiveEvidenceRecord["status"],
      confidence: row.confidence as AurenConfidence,
      summary: typeof row.summary === "string" ? row.summary : null,
      payload: (row.payload ?? {}) as Json,
    }),
  );
  const businesses = (businessesResult.data ?? []) as AurenBusinessRecord[];
  const selectedBusinessId = request.businessId ?? null;
  const selectedBusiness = selectedBusinessId
    ? businesses.find((business) => business.id === selectedBusinessId)
    : null;
  if (selectedBusinessId && !selectedBusiness) {
    throw new Error("The selected business is not available in this workspace.");
  }
  const accounts = (accountsResult.data ?? []) as AurenAccountRecord[];
  const allTransactions = (transactionsResult.data ?? []) as AurenTransactionRecord[];
  const allExpected = (expectedResult.data ?? []) as AurenExpectedRecord[];
  const transactions = selectedBusinessId
    ? allTransactions.filter((row) => row.business_id === selectedBusinessId)
    : allTransactions;
  const expected = selectedBusinessId
    ? allExpected.filter((row) => row.business_id === selectedBusinessId)
    : allExpected;
  const isDailyGear = selectedBusiness
    ? `${selectedBusiness.slug} ${selectedBusiness.name}`.toLowerCase().includes("dailygear")
    : true;
  const firstPartyFunnel = isDailyGear
    ? funnelEventsFromEvidence(liveEvidence)
    : {
        counts: {
          pageView: null,
          viewContent: null,
          addToCart: null,
          initiateCheckout: null,
          purchase: null,
        },
        observedAt: null,
        rowCount: 0,
      };
  const dailyGear: AurenDailyGearRecord = {
    products: isDailyGear ? ((productsResult.data ?? []) as AurenDailyGearRecord["products"]) : [],
    orders: isDailyGear ? ((ordersResult.data ?? []) as AurenDailyGearRecord["orders"]) : [],
  };
  const dashboardSnapshot = {
    accounts: accountsResult.data ?? [],
    balances: balancesResult.data ?? [],
    transactions,
    expected,
    bills: billsResult.data ?? [],
    debts: debtsResult.data ?? [],
    goals: goalsResult.data ?? [],
    goalProgress: goalProgressResult.data ?? [],
    contacts: contactsResult.data ?? [],
    leads: leadsResult.data ?? [],
  } as unknown as DashboardSnapshot;
  const advisory = buildAurenAdvisory({
    request,
    businesses,
    accounts,
    transactions,
    expected,
    dailyGear,
    dashboardSnapshot,
  });
  const firstPartyFunnelEvidence: AurenLiveEvidenceRecord = {
    sourceType: "first_party_funnel",
    sourceKey: "dailygear-first-party-funnel",
    sourceUrl: null,
    observedAt: firstPartyFunnel.observedAt ?? new Date().toISOString(),
    status: firstPartyFunnel.rowCount > 0 ? "ok" : "unavailable",
    confidence: firstPartyFunnel.rowCount > 0 ? "high" : "insufficient",
    summary:
      firstPartyFunnel.rowCount > 0
        ? "Owner-scoped first-party Meta Pixel daily event snapshot for DailyGear."
        : "No owner-scoped first-party funnel event rows are available for the selected period.",
    payload: { ...firstPartyFunnel.counts, rowCount: firstPartyFunnel.rowCount } as unknown as Json,
  };
  advisory.liveEvidence = [...liveEvidence, firstPartyFunnelEvidence];
  advisory.dataQuality.sourceRows.funnelEvents = firstPartyFunnel.rowCount;
  advisory.evidenceMeta = advisory.liveEvidence.map((row) =>
    normalizeEvidenceMeta(
      {
        source_type: row.sourceType,
        source_key: row.sourceKey,
        source_url: row.sourceUrl,
        source_scope: "portfolio",
        observed_at: row.observedAt,
        window_start: null,
        window_end: null,
        status: row.status,
        confidence: row.confidence,
        payload: row.payload,
      },
      new Date(),
    ),
  );
  advisory.decisions = buildAurenDecisions({
    now: new Date(),
    evidence: advisory.evidenceMeta,
    funnelEvents: firstPartyFunnel.counts,
    inventoryWarnings: advisory.verified.dailyGearLowStock,
    cashAvailable: advisory.verified.cashAvailable,
    netCashFlow: advisory.verified.netCashFlow,
  });
  if (noData(advisory)) return { status: "no_data", advisory, summary: null, model: null };
  const ai = workerEnv.AI;
  if (!ai) return { status: "ai_unavailable", advisory, summary: null, model: null };
  try {
    const result = await ai.run(AI_MODEL, {
      messages: [
        {
          role: "system",
          content: "You are Auren, the careful operational intelligence layer inside AlexOS.",
        },
        { role: "user", content: advisoryPrompt(advisory) },
      ],
      max_tokens: 220,
      temperature: 0.2,
    });
    const summary = extractAiText(result);
    return { status: "ready", advisory, summary, model: summary ? AI_MODEL : null };
  } catch (error) {
    console.warn("Auren advisory narrative unavailable:", error);
    return { status: "ai_unavailable", advisory, summary: null, model: null };
  }
}
