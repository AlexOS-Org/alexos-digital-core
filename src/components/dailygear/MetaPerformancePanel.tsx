import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Facebook, Loader2, RefreshCw, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDailyGearAdsManager } from "@/lib/dailygear/ads-manager.functions";
import type { DailyGearAdsManagerResponse } from "@/lib/dailygear/ads-manager.functions";

const PERIODS = [
  { value: "this_month", label: "This month" },
  { value: "last_30d", label: "Last 30 days" },
  { value: "last_90d", label: "Last 90 days" },
  { value: "maximum", label: "All available history" },
] as const;

type Period = (typeof PERIODS)[number]["value"];

const number = (value: number | null | undefined) =>
  value === null || value === undefined ? "Data not available" : value.toLocaleString();
const money = (value: number, currency: string | null) =>
  currency
    ? `${currency} ${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
    : "Data not available";
const percent = (value: number | null | undefined) =>
  value === null || value === undefined ? "Data not available" : `${value.toFixed(2)}%`;

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card/70 p-4">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-xl font-black tabular-nums">{value}</p>
    </div>
  );
}

export function MetaPerformancePanel() {
  const [period, setPeriod] = useState<Period>("this_month");
  const [response, setResponse] = useState<DailyGearAdsManagerResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshNonce, setRefreshNonce] = useState(0);
  const forceRefresh = useRef(false);

  useEffect(() => {
    let active = true;
    const shouldForceRefresh = forceRefresh.current;
    forceRefresh.current = false;
    setLoading(true);
    setError(null);
    getDailyGearAdsManager({
      data: { datePreset: period, maxPages: 10, forceRefresh: shouldForceRefresh },
    })
      .then((result) => {
        if (active) setResponse(result);
      })
      .catch((cause: unknown) => {
        if (!active) return;
        setResponse(null);
        setError(cause instanceof Error ? cause.message : "Meta performance is unavailable.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [period, refreshNonce]);

  const summary = useMemo(() => {
    const insights = response?.accounts.flatMap((account) => account.insights) ?? [];
    const campaigns = response?.accounts.flatMap((account) => account.campaigns) ?? [];
    const campaignName = new Map(
      campaigns.map((campaign) => [campaign.external_id, campaign.name ?? campaign.external_id]),
    );
    const byCampaign = new Map<
      string,
      { spend: number; impressions: number; clicks: number; conversions: number; value: number }
    >();
    for (const insight of insights) {
      const row = byCampaign.get(insight.entity_id) ?? {
        spend: 0,
        impressions: 0,
        clicks: 0,
        conversions: 0,
        value: 0,
      };
      row.spend += insight.spend;
      row.impressions += insight.impressions;
      row.clicks += insight.clicks_all;
      row.conversions += insight.conversions ?? 0;
      row.value += insight.conversion_value ?? 0;
      byCampaign.set(insight.entity_id, row);
    }
    const spend = insights.reduce((total, row) => total + row.spend, 0);
    const impressions = insights.reduce((total, row) => total + row.impressions, 0);
    const reachValues = insights
      .map((row) => row.reach)
      .filter((value): value is number => value !== null);
    const clicks = insights.reduce((total, row) => total + row.clicks_all, 0);
    const conversions = insights.reduce((total, row) => total + (row.conversions ?? 0), 0);
    const conversionValue = insights.reduce((total, row) => total + (row.conversion_value ?? 0), 0);
    const top = [...byCampaign.entries()]
      .sort((a, b) => b[1].spend - a[1].spend)
      .slice(0, 6)
      .map(([id, row]) => ({ id, name: campaignName.get(id) ?? id, ...row }));
    return {
      insights,
      accountCount: response?.accounts.length ?? 0,
      spend,
      impressions,
      reach: reachValues.length ? Math.max(...reachValues) : null,
      clicks,
      conversions: insights.some((row) => row.conversions !== null) ? conversions : null,
      roas: spend > 0 && conversionValue > 0 ? conversionValue / spend : null,
      top,
    };
  }, [response]);

  return (
    <Card className="rounded-3xl border-border/60 soft-shadow">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 pb-3">
        <div>
          <CardTitle className="flex items-center gap-2 text-base font-bold">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-chart-2/10 text-chart-2">
              <Facebook className="h-4 w-4" />
            </span>
            Meta performance
          </CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            Read-only campaign evidence from the allowlisted DailyGear Ads Manager accounts.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-xl"
            onClick={() => {
              forceRefresh.current = true;
              setRefreshNonce((value) => value + 1);
            }}
            disabled={loading}
          >
            <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
          <select
            value={period}
            onChange={(event) => setPeriod(event.target.value as Period)}
            className="rounded-xl border border-border/70 bg-background px-3 py-2 text-xs font-medium"
            aria-label="Meta performance period"
          >
            {PERIODS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {loading ? (
          <div className="flex min-h-32 items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading verified Meta evidence…
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-amber-300/60 bg-amber-50/70 p-4 text-sm dark:border-amber-500/30 dark:bg-amber-950/20">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <div>
                <p className="font-semibold">Meta data unavailable</p>
                <p className="mt-1 text-xs text-muted-foreground">{error}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  No values are estimated. Verify the Worker Meta token and Ads Manager permissions.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700"
              >
                Live read-only
              </Badge>
              <span className="text-xs text-muted-foreground">
                {summary.accountCount} account(s) · {summary.insights.length} insight row(s)
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <Metric
                label="Spend"
                value={money(summary.spend, response?.accounts[0]?.currency ?? null)}
              />
              <Metric label="Reach" value={number(summary.reach)} />
              <Metric label="Impressions" value={number(summary.impressions)} />
              <Metric label="Conversions" value={number(summary.conversions)} />
              <Metric
                label="ROAS"
                value={summary.roas === null ? "Data not available" : `${summary.roas.toFixed(2)}x`}
              />
            </div>
            <div className="grid gap-5 lg:grid-cols-[1.35fr_1fr]">
              <div className="rounded-2xl border border-border/60 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">Highest-spend campaigns</p>
                    <p className="text-xs text-muted-foreground">
                      Sorted by historical spend in the selected period.
                    </p>
                  </div>
                  <TrendingUp className="h-4 w-4 text-primary" />
                </div>
                <div className="space-y-3">
                  {summary.top.length ? (
                    summary.top.map((campaign) => (
                      <div
                        key={campaign.id}
                        className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 text-sm"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-medium">{campaign.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {number(campaign.impressions)} impressions ·{" "}
                            {number(campaign.conversions)} conversions
                          </p>
                        </div>
                        <p className="font-semibold tabular-nums">
                          {money(campaign.spend, response?.accounts[0]?.currency ?? null)}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No campaign insight rows were returned for this period.
                    </p>
                  )}
                </div>
              </div>
              <div className="rounded-2xl border border-border/60 p-4">
                <p className="text-sm font-semibold">Evidence note</p>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                  Spend, impressions, reach, and conversions are displayed only when returned by
                  Meta. First-party orders and Meta results are not treated as the same denominator;
                  ROAS is shown only when conversion value is present.
                </p>
                <p className="mt-3 text-xs text-muted-foreground">
                  Fetched:{" "}
                  {response?.cache.fetchedAt
                    ? new Date(response.cache.fetchedAt).toLocaleString()
                    : "Data not available"}
                </p>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
