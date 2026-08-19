import {
  normalizeAd,
  normalizeAdAccount,
  normalizeAdSet,
  normalizeCampaign,
  normalizeInsight,
  type MetaAdAccountPayload,
  type MetaAdPayload,
  type MetaAdSetPayload,
  type MetaCampaignPayload,
  type MetaEntityLevel,
  type MetaInsightPayload,
  type NormalizedMetaEntity,
  type NormalizedMetaInsight,
} from "@/lib/meta/normalization";

const DEFAULT_GRAPH_API_VERSION = "v23.0";
const DEFAULT_TIMEOUT_MS = 15_000;

/**
 * These are the DailyGear accounts verified through the current authorized
 * Ads Manager connection. They are deliberately allowlisted so a caller
 * cannot use this service to read arbitrary ad accounts.
 */
export const DAILYGEAR_AD_ACCOUNT_IDS = [
  "act_753805746633479",
  "act_1180189530817052",
  "act_1894751687777822",
] as const;

export type DailyGearAdAccountId = (typeof DAILYGEAR_AD_ACCOUNT_IDS)[number];

export interface MetaGraphPage<T> {
  data: T[];
  paging?: {
    next?: string;
    cursors?: { before?: string; after?: string };
  };
}

export interface DailyGearAdsManagerSyncOptions {
  accountIds?: readonly string[];
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
  timeRange?: { since?: string; until?: string };
  includeInsights?: boolean;
  maxPages?: number;
  timeoutMs?: number;
}

export interface DailyGearAdsManagerSyncConfig {
  accessToken: string;
  graphApiVersion: string;
  timeoutMs: number;
}

export interface DailyGearAdsManagerAccountSnapshot {
  account: NormalizedMetaEntity;
  currency: string | null;
  campaigns: NormalizedMetaEntity[];
  adSets: NormalizedMetaEntity[];
  ads: NormalizedMetaEntity[];
  insights: NormalizedMetaInsight[];
}

export interface DailyGearAdsManagerSyncResult {
  readOnly: true;
  source: "meta-graph-api";
  startedAt: string;
  completedAt: string;
  accounts: DailyGearAdsManagerAccountSnapshot[];
}

interface RawInsight extends MetaInsightPayload {
  account_id?: string | null;
  actions?: Array<{ action_type?: string; value?: string | number }>;
  action_values?: Array<{ action_type?: string; value?: string | number }>;
}

const ACCOUNT_FIELDS = [
  "id",
  "name",
  "business_name",
  "currency",
  "account_status",
  "timezone_name",
].join(",");

const CAMPAIGN_FIELDS = [
  "id",
  "name",
  "effective_status",
  "objective",
  "daily_budget",
  "lifetime_budget",
  "start_time",
  "stop_time",
].join(",");

const ADSET_FIELDS = [
  "id",
  "campaign_id",
  "name",
  "effective_status",
  "optimization_goal",
  "billing_event",
  "daily_budget",
  "targeting",
].join(",");

const AD_FIELDS = ["id", "adset_id", "creative{id}", "name", "effective_status"].join(",");

const INSIGHT_FIELDS = [
  "date_start",
  "date_stop",
  "account_id",
  "campaign_id",
  "adset_id",
  "ad_id",
  "spend",
  "impressions",
  "reach",
  "frequency",
  "clicks",
  "link_clicks",
  "ctr",
  "cpc",
  "cpm",
  "actions",
  "action_values",
  "purchase_roas",
].join(",");

function trimAccountId(accountId: string): string {
  return accountId.replace(/^act_/, "");
}

function requireEnv(name: string, value: string | undefined): string {
  if (!value) throw new Error(`Missing required server environment variable: ${name}`);
  return value;
}

export function getDailyGearAdsManagerConfig(
  env: Record<string, string | undefined> = process.env,
): DailyGearAdsManagerSyncConfig {
  return {
    accessToken: requireEnv("META_ACCESS_TOKEN", env.META_ACCESS_TOKEN),
    graphApiVersion: env.META_GRAPH_API_VERSION ?? DEFAULT_GRAPH_API_VERSION,
    timeoutMs: Number(env.META_GRAPH_TIMEOUT_MS ?? DEFAULT_TIMEOUT_MS),
  };
}

function assertAllowedAccounts(accountIds: readonly string[]): DailyGearAdAccountId[] {
  const allowed = new Set<string>(DAILYGEAR_AD_ACCOUNT_IDS);
  const requested = accountIds.length > 0 ? accountIds : DAILYGEAR_AD_ACCOUNT_IDS;
  const invalid = requested.filter((id) => !allowed.has(id));
  if (invalid.length > 0) {
    throw new Error(`Ad account is not in the DailyGear allowlist: ${invalid.join(", ")}`);
  }
  return [...new Set(requested)] as DailyGearAdAccountId[];
}

function numberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function actionValue(actions: RawInsight["actions"], actionType: string): number | null {
  const match = actions?.find((action) => action.action_type === actionType);
  return numberOrNull(match?.value);
}

function addInsightDerivedFields(insight: RawInsight): MetaInsightPayload {
  const purchases = actionValue(insight.actions, "purchase");
  const purchaseValue = actionValue(insight.action_values, "purchase");
  const purchaseRoas =
    purchaseValue !== null && numberOrNull(insight.spend)
      ? purchaseValue / (numberOrNull(insight.spend) || 1)
      : null;

  return {
    ...insight,
    conversions: purchases,
    conversion_value: purchaseValue,
    roas: purchaseRoas,
  };
}

export class MetaGraphReadClient {
  constructor(
    private readonly config: DailyGearAdsManagerSyncConfig,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  async get<T>(pathOrUrl: string, params: Record<string, string | undefined> = {}): Promise<T> {
    const url = new URL(
      pathOrUrl.startsWith("http")
        ? pathOrUrl
        : `https://graph.facebook.com/${this.config.graphApiVersion}/${pathOrUrl.replace(/^\//, "")}`,
    );

    if (!url.searchParams.has("access_token")) {
      url.searchParams.set("access_token", this.config.accessToken);
    }
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) url.searchParams.set(key, value);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs);
    try {
      const response = await this.fetchImpl(url, {
        method: "GET",
        headers: { Accept: "application/json" },
        signal: controller.signal,
      });
      const body = (await response.json()) as {
        error?: { message?: string; type?: string; code?: number; fbtrace_id?: string };
      } & T;
      if (!response.ok || body.error) {
        const error = body.error;
        throw new Error(
          `Meta Graph API read failed (${response.status}): ${error?.message ?? "Unknown error"}`,
        );
      }
      return body as T;
    } finally {
      clearTimeout(timeout);
    }
  }
}

async function getAll<T>(
  client: MetaGraphReadClient,
  path: string,
  params: Record<string, string | undefined>,
  maxPages: number,
): Promise<T[]> {
  const rows: T[] = [];
  let nextUrl: string | undefined = path;
  let nextParams = params;

  for (let page = 0; nextUrl && page < maxPages; page += 1) {
    const response: MetaGraphPage<T> = await client.get<MetaGraphPage<T>>(nextUrl, nextParams);
    rows.push(...(response.data ?? []));
    nextUrl = response.paging?.next;
    nextParams = {};
  }

  return rows;
}

function insightEntity(
  row: RawInsight,
  accountId: string,
): { level: MetaEntityLevel; id: string } | null {
  if (row.ad_id) return { level: "ad", id: row.ad_id };
  if (row.adset_id) return { level: "adset", id: row.adset_id };
  if (row.campaign_id) return { level: "campaign", id: row.campaign_id };
  return { level: "account", id: row.account_id ?? accountId };
}

async function syncAccount(
  client: MetaGraphReadClient,
  accountId: DailyGearAdAccountId,
  options: Required<Pick<DailyGearAdsManagerSyncOptions, "includeInsights" | "maxPages">> &
    Pick<DailyGearAdsManagerSyncOptions, "datePreset" | "timeRange">,
): Promise<DailyGearAdsManagerAccountSnapshot> {
  const accountPayload = await client.get<MetaAdAccountPayload>(accountId, {
    fields: ACCOUNT_FIELDS,
  });
  const campaigns = await getAll<MetaCampaignPayload>(
    client,
    `${accountId}/campaigns`,
    { fields: CAMPAIGN_FIELDS, limit: "100" },
    options.maxPages,
  );
  const adSets = await getAll<MetaAdSetPayload>(
    client,
    `${accountId}/adsets`,
    { fields: ADSET_FIELDS, limit: "100" },
    options.maxPages,
  );
  const ads = await getAll<MetaAdPayload>(
    client,
    `${accountId}/ads`,
    { fields: AD_FIELDS, limit: "100" },
    options.maxPages,
  );

  const normalizedInsights: NormalizedMetaInsight[] = [];
  if (options.includeInsights) {
    const rawInsights = await getAll<RawInsight>(
      client,
      `${accountId}/insights`,
      {
        fields: INSIGHT_FIELDS,
        level: "campaign",
        limit: "100",
        date_preset: options.datePreset,
        time_range: options.timeRange ? JSON.stringify(options.timeRange) : undefined,
      },
      options.maxPages,
    );

    for (const rawInsight of rawInsights) {
      const entity = insightEntity(rawInsight, accountId);
      if (!entity) continue;
      const normalized = normalizeInsight(
        addInsightDerivedFields(rawInsight),
        entity.level,
        entity.id,
        accountId,
        accountPayload.currency ?? null,
      );
      if (normalized) normalizedInsights.push(normalized);
    }
  }

  return {
    account: normalizeAdAccount(accountPayload),
    currency: accountPayload.currency ?? null,
    campaigns: campaigns.map((campaign) => normalizeCampaign(campaign, accountId)),
    adSets: adSets.map((adSet) => normalizeAdSet(adSet, accountId)),
    ads: ads.map((ad) => normalizeAd(ad, accountId)),
    insights: normalizedInsights,
  };
}

/**
 * Read-only DailyGear synchronization entry point.
 *
 * It reads account, campaign, ad-set, ad, and campaign-level insight data from
 * the official Meta Graph API and returns normalized records. It intentionally
 * performs no Supabase writes, no campaign mutations, and no ad delivery calls.
 */
export async function syncDailyGearAdsManager(
  options: DailyGearAdsManagerSyncOptions = {},
  env: Record<string, string | undefined> = process.env,
  fetchImpl: typeof fetch = fetch,
): Promise<DailyGearAdsManagerSyncResult> {
  const startedAt = new Date().toISOString();
  const config = getDailyGearAdsManagerConfig(env);
  const accountIds = assertAllowedAccounts(options.accountIds ?? []);
  const client = new MetaGraphReadClient(config, fetchImpl);
  const syncOptions = {
    includeInsights: options.includeInsights ?? true,
    maxPages: options.maxPages ?? 10,
    datePreset: options.datePreset ?? "maximum",
    timeRange: options.timeRange,
  } as const;

  const accounts: DailyGearAdsManagerAccountSnapshot[] = [];
  for (const accountId of accountIds) {
    accounts.push(await syncAccount(client, accountId, syncOptions));
  }

  return {
    readOnly: true,
    source: "meta-graph-api",
    startedAt,
    completedAt: new Date().toISOString(),
    accounts,
  };
}
