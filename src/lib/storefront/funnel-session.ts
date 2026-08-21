import type { FunnelAttribution } from "@/lib/dailygear/types";

const KEY = "dailygear.funnel-attribution.v1";
const MAX = 160;

function clean(value: unknown) {
  return typeof value === "string" ? value.trim().slice(0, MAX) : undefined;
}

function sanitize(value: FunnelAttribution): FunnelAttribution {
  return {
    source: clean(value.source),
    medium: clean(value.medium),
    campaign: clean(value.campaign),
    campaignId: clean(value.campaignId),
    adSet: clean(value.adSet),
    adSetId: clean(value.adSetId),
    ad: clean(value.ad),
    adId: clean(value.adId),
    creative: clean(value.creative),
    creativeId: clean(value.creativeId),
    landingPage: clean(value.landingPage),
    destinationUrl: clean(value.destinationUrl),
  };
}

export function rememberFunnelAttribution(value: FunnelAttribution) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(sanitize(value)));
  } catch {
    /* session storage can be unavailable in hardened browsers */
  }
}

export function readFunnelAttribution(): FunnelAttribution | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as FunnelAttribution;
    return sanitize(parsed);
  } catch {
    return null;
  }
}

export function clearFunnelAttribution() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
