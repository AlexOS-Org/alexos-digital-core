import { createHmac, timingSafeEqual } from "node:crypto";
import { DAILYGEAR_AD_ACCOUNT_IDS, type DailyGearAdAccountId } from "./dailygear-ads-manager-sync";

const WEBHOOK_EVENT_TTL_MS = 15 * 60 * 1000;
const seenEvents = new Map<string, number>();

export interface DailyGearAdsWebhookChange {
  field?: string;
  value?: Record<string, unknown>;
}

export interface DailyGearAdsWebhookEntry {
  id?: string;
  time?: number;
  changes?: DailyGearAdsWebhookChange[];
}

export interface DailyGearAdsWebhookPayload {
  object?: string;
  entry?: DailyGearAdsWebhookEntry[];
}

export interface AcceptedDailyGearAdsWebhook {
  eventKey: string;
  accountIds: DailyGearAdAccountId[];
  fields: string[];
  duplicate: boolean;
}

function normalizedAccountId(value: string): string {
  return value.startsWith("act_") ? value : `act_${value}`;
}

function isAllowedAccountId(value: string): value is DailyGearAdAccountId {
  return (DAILYGEAR_AD_ACCOUNT_IDS as readonly string[]).includes(value);
}

function pruneSeenEvents(now: number) {
  for (const [key, seenAt] of seenEvents) {
    if (now - seenAt > WEBHOOK_EVENT_TTL_MS) seenEvents.delete(key);
  }
}

export function verifyMetaWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
  appSecret: string,
): boolean {
  if (!signatureHeader?.startsWith("sha256=") || !appSecret) return false;
  const expected = createHmac("sha256", appSecret).update(rawBody, "utf8").digest("hex");
  const supplied = signatureHeader.slice("sha256=".length);
  if (!/^[a-f0-9]{64}$/i.test(supplied)) return false;
  return timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(supplied, "hex"));
}

export function parseDailyGearAdsWebhook(rawBody: string): AcceptedDailyGearAdsWebhook | null {
  let payload: DailyGearAdsWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as DailyGearAdsWebhookPayload;
  } catch {
    return null;
  }
  if (payload.object !== "ad_account" || !Array.isArray(payload.entry)) return null;

  const affectedEntries = payload.entry
    .map((entry) => ({
      accountId: typeof entry.id === "string" ? normalizedAccountId(entry.id) : null,
      time: typeof entry.time === "number" ? entry.time : null,
      changes: Array.isArray(entry.changes) ? entry.changes : [],
    }))
    .filter(
      (
        entry,
      ): entry is {
        accountId: DailyGearAdAccountId;
        time: number | null;
        changes: DailyGearAdsWebhookChange[];
      } => entry.accountId !== null && isAllowedAccountId(entry.accountId),
    );
  if (affectedEntries.length === 0) return null;

  const accountIds = [...new Set(affectedEntries.map((entry) => entry.accountId))];
  const fields = [
    ...new Set(
      affectedEntries.flatMap((entry) =>
        entry.changes.map((change) => change.field).filter(Boolean),
      ),
    ),
  ] as string[];
  const eventKey = JSON.stringify(
    affectedEntries.map((entry) => ({
      accountId: entry.accountId,
      time: entry.time,
      fields: entry.changes.map((change) => change.field ?? "unknown").sort(),
    })),
  );
  const now = Date.now();
  pruneSeenEvents(now);
  const duplicate = seenEvents.has(eventKey);
  seenEvents.set(eventKey, now);

  return { eventKey, accountIds, fields, duplicate };
}
