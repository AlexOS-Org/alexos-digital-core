import type { SupabaseClient } from "@supabase/supabase-js";
import { syncDailyGearAdsManager } from "@/server/meta/dailygear-ads-manager-sync";
import type { Database } from "@/integrations/supabase/types";
import type { Order, OrderItem } from "./types";
import {
  calculateDailyGearProfitAndCashFlow,
  type DailyGearCashFlowEvent,
  type DailyGearOrderExpense,
  type DailyGearBusinessExpense,
  type DailyGearProfitCashFlowResult,
} from "./profit-cash-flow";

export interface DailyGearProfitCashFlowRequest {
  datePreset?:
    | "today"
    | "yesterday"
    | "this_week_sun_today"
    | "this_week_mon_today"
    | "last_week_mon_sun"
    | "last_week_sun_sat"
    | "last_3d"
    | "last_7d"
    | "last_14d"
    | "last_28d"
    | "last_30d"
    | "last_90d"
    | "this_month"
    | "last_month"
    | "this_quarter"
    | "last_quarter"
    | "this_year"
    | "last_year"
    | "maximum";
  from?: string;
  until?: string;
  includeInsights?: boolean;
  maxPages?: number;
  forceRefresh?: boolean;
  cashEvents?: DailyGearCashFlowEvent[];
}

export interface DailyGearProfitCashFlowResponse {
  financials: DailyGearProfitCashFlowResult;
  meta: {
    readOnly: true;
    source: "meta-graph-api" | "unavailable";
    available: boolean;
    error: string | null;
    accountCount: number;
    campaignCount: number;
    adSetCount: number;
    adCount: number;
    insightCount: number;
    cache: {
      hit: boolean;
      fetchedAt: string;
      expiresAt: string;
      ttlMs: number;
    };
  };
}

function validateDate(value: unknown, field: string): string | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`${field} must use YYYY-MM-DD format.`);
  }
  return value;
}

export function validateDailyGearProfitCashFlowRequest(
  raw: unknown,
): DailyGearProfitCashFlowRequest {
  const input = (raw ?? {}) as Record<string, unknown>;
  const from = validateDate(input.from, "from");
  const until = validateDate(input.until, "until");
  if (from && until && from > until) throw new Error("from must be before or equal to until.");

  const maxPages = input.maxPages === undefined ? 10 : Number(input.maxPages);
  if (!Number.isInteger(maxPages) || maxPages < 1 || maxPages > 100) {
    throw new Error("maxPages must be an integer between 1 and 100.");
  }

  return {
    datePreset:
      typeof input.datePreset === "string"
        ? (input.datePreset as DailyGearProfitCashFlowRequest["datePreset"])
        : "maximum",
    from,
    until,
    includeInsights: input.includeInsights !== false,
    maxPages,
    forceRefresh: input.forceRefresh === true,
    cashEvents: Array.isArray(input.cashEvents)
      ? (input.cashEvents as DailyGearCashFlowEvent[])
      : undefined,
  };
}

export async function calculateDailyGearProfitCashFlowForUser(
  request: DailyGearProfitCashFlowRequest,
  context: {
    supabase: SupabaseClient<Database>;
    userId: string;
  },
): Promise<DailyGearProfitCashFlowResponse> {
  const orderQuery = context.supabase
    .from("dg_orders")
    .select("*")
    .eq("user_id", context.userId)
    .is("deleted_at", null);
  const itemQuery = context.supabase
    .from("dg_order_items")
    .select("*")
    .eq("user_id", context.userId);
  const expenseQuery = context.supabase
    .from("dg_order_expenses")
    .select("id,order_id,cost_type,amount,created_at,description,money_transaction_id")
    .eq("user_id", context.userId);
  const businessExpenseQuery = context.supabase
    .from("transactions")
    .select("id,occurred_at,amount,description,source,financial_scope,status,deleted_at")
    .eq("user_id", context.userId)
    .eq("type", "expense")
    .eq("financial_scope", "business")
    .eq("status", "posted")
    .is("deleted_at", null);
  const [
    { data: orderRows, error: orderError },
    { data: itemRows, error: itemError },
    { data: expenseRows, error: expenseError },
    { data: businessExpenseRows, error: businessExpenseError },
  ] = await Promise.all([orderQuery, itemQuery, expenseQuery, businessExpenseQuery]);
  if (orderError) throw orderError;
  if (itemError) throw itemError;
  if (expenseError) throw expenseError;
  if (businessExpenseError) throw businessExpenseError;
  const currencyByOrder = new Map(
    (orderRows ?? []).map((order) => [order.id, order.currency ?? "KES"]),
  );
  const orderExpenses: DailyGearOrderExpense[] = (expenseRows ?? []).map((expense) => ({
    id: expense.id,
    orderId: expense.order_id,
    costType: expense.cost_type as DailyGearOrderExpense["costType"],
    amount: Number(expense.amount ?? 0),
    currency: currencyByOrder.get(expense.order_id) ?? "KES",
    date: expense.created_at,
    note: expense.description,
  }));
  const linkedOrderExpenseTransactions = new Set(
    (expenseRows ?? [])
      .map((expense) => expense.money_transaction_id)
      .filter((id): id is string => Boolean(id)),
  );
  const businessExpenses: DailyGearBusinessExpense[] = (businessExpenseRows ?? [])
    .filter((expense) => !linkedOrderExpenseTransactions.has(expense.id))
    .map((expense) => ({
      id: expense.id,
      amount: Number(expense.amount ?? 0),
      currency: "KES",
      date: expense.occurred_at,
      note: expense.description ?? expense.source,
    }));
  let adInsights: Awaited<
    ReturnType<typeof syncDailyGearAdsManager>
  >["accounts"][number]["insights"] = [];
  let adSyncError: string | null = null;
  let adSync: Awaited<ReturnType<typeof syncDailyGearAdsManager>> | null = null;
  try {
    adSync = await syncDailyGearAdsManager({
      datePreset: request.datePreset,
      timeRange:
        request.from || request.until ? { since: request.from, until: request.until } : undefined,
      includeInsights: request.includeInsights,
      maxPages: request.maxPages,
      forceRefresh: request.forceRefresh,
    });
    adInsights = adSync.accounts.flatMap((account) => account.insights);
  } catch (error) {
    adSyncError = error instanceof Error ? error.message : "Meta Ads spend is unavailable.";
  }

  const financials = calculateDailyGearProfitAndCashFlow({
    orders: (orderRows ?? []) as Order[],
    orderItems: (itemRows ?? []) as OrderItem[],
    orderExpenses,
    businessExpenses,
    adInsights,
    cashEvents: request.cashEvents,
    from: request.from,
    until: request.until,
  });

  if (adSyncError) financials.dataQuality.warnings.push(adSyncError);

  const emptyCache = {
    hit: false,
    fetchedAt: new Date().toISOString(),
    expiresAt: new Date().toISOString(),
    ttlMs: 0,
  };
  return {
    financials,
    meta: {
      readOnly: true,
      source: adSync ? "meta-graph-api" : "unavailable",
      available: Boolean(adSync),
      error: adSyncError,
      accountCount: adSync?.accounts.length ?? 0,
      campaignCount:
        adSync?.accounts.reduce((count, account) => count + account.campaigns.length, 0) ?? 0,
      adSetCount:
        adSync?.accounts.reduce((count, account) => count + account.adSets.length, 0) ?? 0,
      adCount: adSync?.accounts.reduce((count, account) => count + account.ads.length, 0) ?? 0,
      insightCount: adInsights.length,
      cache: adSync?.cache ?? emptyCache,
    },
  };
}
