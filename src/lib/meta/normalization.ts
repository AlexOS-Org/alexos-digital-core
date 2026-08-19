/**
 * Pure normalization contracts for the authorized Meta marketing connector.
 *
 * This module deliberately contains no credentials, network calls, or database
 * writes. It is the boundary between official Meta API payloads and AlexOS
 * business/CRM/financial persistence. Persistence belongs in a server-side
 * integration service after the Supabase business-id migration reconciliation.
 */

export type MetaEntityLevel = "account" | "campaign" | "adset" | "ad";

export interface MetaAdAccountPayload {
  id: string;
  name?: string | null;
  business_name?: string | null;
  currency?: string | null;
  account_status?: number | string | null;
  timezone_name?: string | null;
}

export interface MetaCampaignPayload {
  id: string;
  name?: string | null;
  effective_status?: string | null;
  objective?: string | null;
  daily_budget?: string | number | null;
  lifetime_budget?: string | number | null;
  start_time?: string | null;
  stop_time?: string | null;
}

export interface MetaAdSetPayload {
  id: string;
  campaign_id?: string | null;
  name?: string | null;
  effective_status?: string | null;
  optimization_goal?: string | null;
  billing_event?: string | null;
  daily_budget?: string | number | null;
  targeting?: Record<string, unknown> | null;
}

export interface MetaAdPayload {
  id: string;
  adset_id?: string | null;
  creative?: { id?: string | null } | null;
  name?: string | null;
  effective_status?: string | null;
}

export interface MetaInsightPayload {
  date_start?: string | null;
  date_stop?: string | null;
  account_id?: string | null;
  campaign_id?: string | null;
  adset_id?: string | null;
  ad_id?: string | null;
  spend?: string | number | null;
  impressions?: string | number | null;
  reach?: string | number | null;
  frequency?: string | number | null;
  clicks?: string | number | null;
  ctr?: string | number | null;
  cpc?: string | number | null;
  cpm?: string | number | null;
  conversions?: string | number | null;
  conversion_value?: string | number | null;
  cost_per_conversion?: string | number | null;
  roas?: string | number | null;
}

export interface NormalizedMetaEntity {
  external_id: string;
  entity_level: MetaEntityLevel;
  ad_account_id: string;
  name: string | null;
  status: string | null;
  raw: Record<string, unknown>;
}

export interface NormalizedMetaInsight {
  date: string;
  entity_level: MetaEntityLevel;
  entity_id: string;
  ad_account_id: string;
  spend: number;
  impressions: number;
  reach: number | null;
  frequency: number | null;
  clicks_all: number;
  link_clicks: number | null;
  ctr: number | null;
  cpc: number | null;
  cpm: number | null;
  conversions: number | null;
  conversion_value: number | null;
  cost_per_conversion: number | null;
  roas: number | null;
  currency: string | null;
}

function numberOrNull(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function requiredNumber(value: string | number | null | undefined): number {
  return numberOrNull(value) ?? 0;
}

function rawRecord(value: object): Record<string, unknown> {
  return { ...value } as Record<string, unknown>;
}

export function normalizeAdAccount(payload: MetaAdAccountPayload): NormalizedMetaEntity {
  return {
    external_id: payload.id,
    entity_level: "account",
    ad_account_id: payload.id,
    name: payload.name ?? null,
    status:
      payload.account_status === null || payload.account_status === undefined
        ? null
        : String(payload.account_status),
    raw: rawRecord(payload),
  };
}

export function normalizeCampaign(
  payload: MetaCampaignPayload,
  adAccountId: string,
): NormalizedMetaEntity {
  return {
    external_id: payload.id,
    entity_level: "campaign",
    ad_account_id: adAccountId,
    name: payload.name ?? null,
    status: payload.effective_status ?? null,
    raw: rawRecord(payload),
  };
}

export function normalizeAdSet(
  payload: MetaAdSetPayload,
  adAccountId: string,
): NormalizedMetaEntity {
  return {
    external_id: payload.id,
    entity_level: "adset",
    ad_account_id: adAccountId,
    name: payload.name ?? null,
    status: payload.effective_status ?? null,
    raw: rawRecord(payload),
  };
}

export function normalizeAd(payload: MetaAdPayload, adAccountId: string): NormalizedMetaEntity {
  return {
    external_id: payload.id,
    entity_level: "ad",
    ad_account_id: adAccountId,
    name: payload.name ?? null,
    status: payload.effective_status ?? null,
    raw: rawRecord(payload),
  };
}

export function normalizeInsight(
  payload: MetaInsightPayload,
  entityLevel: MetaEntityLevel,
  entityId: string,
  adAccountId: string,
  currency: string | null,
): NormalizedMetaInsight | null {
  const date = payload.date_start ?? payload.date_stop;
  if (!date) return null;

  return {
    date,
    entity_level: entityLevel,
    entity_id: entityId,
    ad_account_id: adAccountId,
    spend: requiredNumber(payload.spend),
    impressions: requiredNumber(payload.impressions),
    reach: numberOrNull(payload.reach),
    frequency: numberOrNull(payload.frequency),
    clicks_all: requiredNumber(payload.clicks),
    link_clicks: null,
    ctr: numberOrNull(payload.ctr),
    cpc: numberOrNull(payload.cpc),
    cpm: numberOrNull(payload.cpm),
    conversions: numberOrNull(payload.conversions),
    conversion_value: numberOrNull(payload.conversion_value),
    cost_per_conversion: numberOrNull(payload.cost_per_conversion),
    roas: numberOrNull(payload.roas),
    currency,
  };
}

/**
 * Maps an insight to the AlexOS financial meaning of paid acquisition cost.
 * Revenue, COGS, commission, and cash movement remain separate facts and must
 * be joined only after CRM/order attribution is verified.
 */
export function classifyPaidAcquisitionExpense(): "advertising" {
  return "advertising";
}
