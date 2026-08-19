import type { SupabaseClient } from "@supabase/supabase-js";
import { syncDailyGearAdsManager } from "@/server/meta/dailygear-ads-manager-sync";
import type { Database } from "@/integrations/supabase/types";
import type { Order, OrderItem } from "./types";
import {
  calculateDailyGearProfitAndCashFlow,
  type DailyGearCashFlowEvent,
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
  cashEvents?: DailyGearCashFlowEvent[];
}

export interface DailyGearProfitCashFlowResponse {
  financials: DailyGearProfitCashFlowResult;
  meta: {
    readOnly: true;
    source: "meta-graph-api";
    accountCount: number;
    campaignCount: number;
    adSetCount: number;
    adCount: number;
    insightCount: number;
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
  const [{ data: orderRows, error: orderError }, { data: itemRows, error: itemError }] =
    await Promise.all([orderQuery, itemQuery]);
  if (orderError) throw orderError;
  if (itemError) throw itemError;

  const adSync = await syncDailyGearAdsManager({
    datePreset: request.datePreset,
    timeRange:
      request.from || request.until ? { since: request.from, until: request.until } : undefined,
    includeInsights: request.includeInsights,
    maxPages: request.maxPages,
  });
  const adInsights = adSync.accounts.flatMap((account) => account.insights);

  const financials = calculateDailyGearProfitAndCashFlow({
    orders: (orderRows ?? []) as Order[],
    orderItems: (itemRows ?? []) as OrderItem[],
    adInsights,
    cashEvents: request.cashEvents,
    from: request.from,
    until: request.until,
  });

  return {
    financials,
    meta: {
      readOnly: true,
      source: "meta-graph-api",
      accountCount: adSync.accounts.length,
      campaignCount: adSync.accounts.reduce(
        (count, account) => count + account.campaigns.length,
        0,
      ),
      adSetCount: adSync.accounts.reduce((count, account) => count + account.adSets.length, 0),
      adCount: adSync.accounts.reduce((count, account) => count + account.ads.length, 0),
      insightCount: adInsights.length,
    },
  };
}
