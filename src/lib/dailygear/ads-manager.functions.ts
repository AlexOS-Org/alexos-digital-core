import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  syncDailyGearAdsManager,
  type DailyGearAdsManagerSyncOptions,
} from "@/server/meta/dailygear-ads-manager-sync";

const DATE_PRESETS = new Set<NonNullable<DailyGearAdsManagerSyncOptions["datePreset"]>>([
  "today",
  "yesterday",
  "this_week_sun_today",
  "this_week_mon_today",
  "last_week_mon_sun",
  "last_week_sun_sat",
  "last_3d",
  "last_7d",
  "last_14d",
  "last_28d",
  "last_30d",
  "last_90d",
  "this_month",
  "last_month",
  "this_quarter",
  "last_quarter",
  "this_year",
  "last_year",
  "maximum",
]);

function validateAdsRequest(
  raw: unknown,
): Pick<DailyGearAdsManagerSyncOptions, "datePreset" | "maxPages" | "forceRefresh"> {
  const input = (raw ?? {}) as Record<string, unknown>;
  const datePreset =
    typeof input.datePreset === "string" && DATE_PRESETS.has(input.datePreset as never)
      ? (input.datePreset as DailyGearAdsManagerSyncOptions["datePreset"])
      : "this_month";
  const maxPages = input.maxPages === undefined ? 5 : Number(input.maxPages);
  if (!Number.isInteger(maxPages) || maxPages < 1 || maxPages > 10) {
    throw new Error("maxPages must be an integer between 1 and 10.");
  }
  return {
    datePreset,
    maxPages,
    forceRefresh: input.forceRefresh === true,
  };
}

/** Serializable, read-only Meta performance data for the authenticated DailyGear owner. */
export type DailyGearAdsManagerResponse = {
  readOnly: true;
  source: "meta-graph-api";
  startedAt: string;
  completedAt: string;
  accounts: Array<{
    currency: string | null;
    account: { external_id: string; name: string | null; status: string | null };
    campaigns: Array<{ external_id: string; name: string | null }>;
    insights: Array<{
      date: string;
      entity_id: string;
      spend: number;
      impressions: number;
      reach: number | null;
      clicks_all: number;
      conversions: number | null;
      conversion_value: number | null;
      roas: number | null;
      currency: string | null;
    }>;
  }>;
  cache: { hit: boolean; fetchedAt: string; expiresAt: string; ttlMs: number };
};

export const getDailyGearAdsManager = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(validateAdsRequest)
  .handler(async ({ data }): Promise<DailyGearAdsManagerResponse> => {
    const result = await syncDailyGearAdsManager({
      datePreset: data.datePreset,
      includeInsights: true,
      maxPages: data.maxPages,
      forceRefresh: data.forceRefresh,
    });
    return {
      readOnly: true,
      source: "meta-graph-api",
      startedAt: result.startedAt,
      completedAt: result.completedAt,
      cache: result.cache,
      accounts: result.accounts.map((account) => ({
        currency: account.currency,
        account: {
          external_id: account.account.external_id,
          name: account.account.name,
          status: account.account.status,
        },
        campaigns: account.campaigns.map((campaign) => ({
          external_id: campaign.external_id,
          name: campaign.name,
        })),
        insights: account.insights.map((insight) => ({
          date: insight.date,
          entity_id: insight.entity_id,
          spend: insight.spend,
          impressions: insight.impressions,
          reach: insight.reach,
          clicks_all: insight.clicks_all,
          conversions: insight.conversions,
          conversion_value: insight.conversion_value,
          roas: insight.roas,
          currency: insight.currency,
        })),
      })),
    };
  });
