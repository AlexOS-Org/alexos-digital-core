import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Database, Json } from "@/integrations/supabase/types";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getDailyGearAdsManagerConfig,
  MetaGraphReadClient,
  syncDailyGearAdsManager,
} from "@/server/meta/dailygear-ads-manager-sync";

type WorkerEnv = Record<string, string | undefined>;
type EvidenceStatus = "ok" | "partial" | "unavailable";

const PUBLIC_QUERIES = [
  "Kenya ecommerce Facebook Ads Library Jumia Kilimall active ads school bags",
  "Kenya Instagram ecommerce products trending school bags backpacks",
] as const;

function envRecord(): WorkerEnv {
  return process.env as WorkerEnv;
}

function database(): SupabaseClient<Database> {
  return supabaseAdmin as unknown as SupabaseClient<Database>;
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function numeric(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function compactMetaPayload(result: Awaited<ReturnType<typeof syncDailyGearAdsManager>>) {
  return {
    source: result.source,
    startedAt: result.startedAt,
    completedAt: result.completedAt,
    cache: result.cache,
    accounts: result.accounts.map((account) => ({
      id: account.account.external_id,
      name: account.account.name,
      currency: account.currency,
      campaigns: account.campaigns.slice(0, 30).map((campaign) => ({
        id: campaign.external_id,
        name: campaign.name,
        status: campaign.status,
      })),
      insights: account.insights.slice(0, 90),
    })),
  };
}

async function fetchInstagramSnapshot(env: WorkerEnv) {
  const accessToken = env.META_ACCESS_TOKEN;
  const graphApiVersion = env.META_GRAPH_API_VERSION ?? "v23.0";
  const instagramId = env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
  const pageId = env.META_PAGE_ID;
  if (!accessToken || (!instagramId && !pageId)) {
    return {
      status: "unavailable" as const,
      confidence: "insufficient" as const,
      summary:
        "Instagram refresh is not configured: set INSTAGRAM_BUSINESS_ACCOUNT_ID or META_PAGE_ID.",
      payload: { reason: "missing_instagram_identifier" },
      sourceUrl: "https://www.instagram.com/daily_gearz/",
    };
  }

  try {
    const client = new MetaGraphReadClient(getDailyGearAdsManagerConfig(env));
    let resolvedId = instagramId;
    if (!resolvedId && pageId) {
      const page = await client.get<{ instagram_business_account?: { id?: string } }>(pageId, {
        fields: "instagram_business_account",
      });
      resolvedId = page.instagram_business_account?.id;
    }
    if (!resolvedId)
      throw new Error("No Instagram Business Account was found for the configured Meta Page.");

    const media = await client.get<{
      data?: Array<{
        id: string;
        caption?: string;
        media_type?: string;
        permalink?: string;
        timestamp?: string;
        like_count?: number;
        comments_count?: number;
      }>;
      paging?: { next?: string };
    }>(`${resolvedId}/media`, {
      fields: "id,caption,media_type,permalink,timestamp,like_count,comments_count",
      limit: "50",
    });
    const posts = media.data ?? [];
    return {
      status: "ok" as const,
      confidence: "medium" as const,
      summary: `Read ${posts.length} recent Instagram media records for the connected DailyGear account.`,
      payload: {
        instagramBusinessAccountId: resolvedId,
        posts: posts.slice(0, 50),
        totals: {
          posts: posts.length,
          likes: posts.reduce((sum, post) => sum + numeric(post.like_count), 0),
          comments: posts.reduce((sum, post) => sum + numeric(post.comments_count), 0),
        },
      },
      sourceUrl: "https://www.instagram.com/daily_gearz/",
    };
  } catch (error) {
    return {
      status: "unavailable" as const,
      confidence: "insufficient" as const,
      summary: error instanceof Error ? error.message : "Instagram data was unavailable.",
      payload: { reason: "instagram_graph_api_error" },
      sourceUrl: "https://www.instagram.com/daily_gearz/",
    };
  }
}

async function fetchPublicEvidence(env: WorkerEnv) {
  const apiKey = env.FIRECRAWL_API_KEY;
  if (!apiKey) {
    return {
      status: "unavailable" as const,
      confidence: "insufficient" as const,
      summary: "Public-source refresh is not configured: set FIRECRAWL_API_KEY for the Worker.",
      payload: { reason: "missing_firecrawl_api_key", queries: PUBLIC_QUERIES },
      sourceUrl:
        "https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=KE&media_type=all",
    };
  }

  const results: Array<Record<string, unknown>> = [];
  const errors: string[] = [];
  for (const query of PUBLIC_QUERIES) {
    try {
      const response = await fetch("https://api.firecrawl.dev/v2/search", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          query,
          limit: 10,
          sources: [{ type: "web" }],
          location: "Kenya",
          country: "KE",
          tbs: "qdr:2d",
          scrapeOptions: { formats: [{ type: "markdown" }] },
        }),
      });
      const body = (await response.json()) as { data?: { web?: unknown[] }; error?: string };
      if (!response.ok)
        throw new Error(body.error ?? `Firecrawl returned HTTP ${response.status}.`);
      results.push({ query, web: (body.data?.web ?? []).slice(0, 10) });
    } catch (error) {
      errors.push(error instanceof Error ? error.message : "Public-source request failed.");
    }
  }
  return {
    status: results.length > 0 ? (errors.length > 0 ? "partial" : "ok") : "unavailable",
    confidence: results.length > 0 ? "low" : "insufficient",
    summary:
      results.length > 0
        ? `Captured ${results.length} public research query result set(s). Public evidence remains background context only.`
        : "No public research results were captured.",
    payload: { results, errors, followerThreshold: 2500, minimumAdAgeDays: 30 },
    sourceUrl:
      "https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=KE&media_type=all",
  } as const;
}

async function ownerIds(db: SupabaseClient<Database>): Promise<string[]> {
  const { data, error } = await db
    .from("dg_products")
    .select("user_id")
    .is("deleted_at", null)
    .limit(100);
  if (error) throw error;
  return unique((data ?? []).map((row: { user_id?: string }) => row.user_id ?? ""));
}

async function writeSnapshot(
  db: SupabaseClient<Database>,
  input: {
    userId: string;
    sourceType: string;
    sourceKey: string;
    sourceUrl: string | null;
    status: EvidenceStatus;
    confidence: string;
    summary: string;
    payload: Json;
    observedAt: string;
  },
) {
  const { error } = await db.from("auren_evidence_snapshots").insert({
    user_id: input.userId,
    source_type: input.sourceType,
    source_key: input.sourceKey,
    source_url: input.sourceUrl,
    observed_at: input.observedAt,
    status: input.status,
    confidence: input.confidence,
    summary: input.summary,
    payload: input.payload,
  });
  if (error) throw error;
}

export async function refreshAurenEvidence(env: WorkerEnv = envRecord()) {
  const db = database();
  const startedAt = new Date().toISOString();
  const { data: run, error: runError } = await db
    .from("auren_evidence_refresh_runs")
    .insert({ started_at: startedAt, status: "running", source_status: {} })
    .select("id")
    .maybeSingle();
  if (runError) throw runError;

  const owners = await ownerIds(db);
  const sourceStatus: Record<string, string> = {};
  let rowsWritten = 0;
  const observedAt = new Date().toISOString();

  let metaResult: Awaited<ReturnType<typeof syncDailyGearAdsManager>> | null = null;
  try {
    metaResult = await syncDailyGearAdsManager(
      { datePreset: "last_7d", includeInsights: true, maxPages: 3, forceRefresh: true },
      env,
    );
    sourceStatus.meta_ads_manager = "ok";
  } catch (error) {
    sourceStatus.meta_ads_manager = "unavailable";
  }

  const instagram = await fetchInstagramSnapshot(env);
  sourceStatus.instagram_insights = instagram.status;
  const publicEvidence = await fetchPublicEvidence(env);
  sourceStatus.public_research = publicEvidence.status;

  for (const userId of owners) {
    if (metaResult) {
      await writeSnapshot(db, {
        userId,
        sourceType: "meta_ads_manager",
        sourceKey: "dailygear-allowlisted-accounts",
        sourceUrl: "https://www.facebook.com/business/tools/ads-manager",
        status: "ok",
        confidence: "high",
        summary:
          "Read-only Meta Ads Manager account, campaign, and last-seven-day insight snapshot.",
        payload: compactMetaPayload(metaResult) as unknown as Json,
        observedAt,
      });
      rowsWritten += 1;
    }
    await writeSnapshot(db, {
      userId,
      sourceType: "instagram_insights",
      sourceKey: "daily_gearz",
      sourceUrl: instagram.sourceUrl,
      status: instagram.status,
      confidence: instagram.confidence,
      summary: instagram.summary,
      payload: instagram.payload as Json,
      observedAt,
    });
    rowsWritten += 1;
    await writeSnapshot(db, {
      userId,
      sourceType: "public_ads_library",
      sourceKey: "kenya-ecommerce-ads-library",
      sourceUrl: publicEvidence.sourceUrl,
      status: publicEvidence.status,
      confidence: publicEvidence.confidence,
      summary: publicEvidence.summary,
      payload: publicEvidence.payload as Json,
      observedAt,
    });
    rowsWritten += 1;
  }

  const overallStatus = Object.values(sourceStatus).every((status) => status === "ok")
    ? "completed"
    : Object.values(sourceStatus).some((status) => status === "ok")
      ? "partial"
      : "failed";
  if (run?.id) {
    const { error } = await db
      .from("auren_evidence_refresh_runs")
      .update({
        finished_at: new Date().toISOString(),
        status: overallStatus,
        source_status: sourceStatus,
        rows_written: rowsWritten,
      })
      .eq("id", run.id);
    if (error) throw error;
  }
  return { status: overallStatus, sourceStatus, rowsWritten, owners: owners.length };
}
