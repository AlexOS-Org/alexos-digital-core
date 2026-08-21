import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  RefreshCw,
  Banknote,
  CircleDollarSign,
  Loader2,
  Megaphone,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { getDailyGearProfitCashFlow } from "@/lib/dailygear/profit-cash-flow.functions";
import type { DailyGearProfitCashFlowResponse } from "@/lib/dailygear/profit-cash-flow.server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const AUTO_REFRESH_INTERVAL_MS = 60_000;

const PERIODS = [
  { value: "this_month", label: "This month" },
  { value: "last_30d", label: "Last 30 days" },
  { value: "last_90d", label: "Last 90 days" },
  { value: "this_year", label: "This year" },
] as const;

type Period = (typeof PERIODS)[number]["value"];

const money = (value: number, currency: string | null) =>
  currency
    ? `${currency} ${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
    : "Data not available";

const percent = (value: number | null) =>
  value === null ? "Data not available" : `${value.toFixed(1)}%`;

function Metric({
  label,
  value,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: string;
  icon: typeof CircleDollarSign;
  tone?: "default" | "positive" | "negative";
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card/70 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <p
        className={`mt-2 text-xl font-black tabular-nums ${
          tone === "positive"
            ? "text-emerald-600 dark:text-emerald-400"
            : tone === "negative"
              ? "text-rose-600 dark:text-rose-400"
              : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}

export function ProfitCashFlowPanel() {
  const [period, setPeriod] = useState<Period>("this_month");
  const [response, setResponse] = useState<DailyGearProfitCashFlowResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshNonce, setRefreshNonce] = useState(0);
  const forceRefreshRef = useRef(false);

  useEffect(() => {
    const forceRefresh = forceRefreshRef.current;
    forceRefreshRef.current = false;
    let active = true;
    setLoading(true);
    setError(null);
    getDailyGearProfitCashFlow({
      data: {
        datePreset: period,
        includeInsights: true,
        maxPages: 10,
        forceRefresh,
      },
    })
      .then((result) => {
        if (active) setResponse(result);
      })
      .catch((cause: unknown) => {
        if (!active) return;
        setResponse(null);
        setError(cause instanceof Error ? cause.message : "Financial data could not be loaded.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [period, refreshNonce]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setRefreshNonce((value) => value + 1);
    }, AUTO_REFRESH_INTERVAL_MS);
    return () => window.clearInterval(interval);
  }, []);

  const financials = response?.financials;
  const maxDailyRevenue = useMemo(
    () => Math.max(...(financials?.daily.map((day) => day.revenue) ?? [0]), 1),
    [financials?.daily],
  );

  return (
    <Card className="rounded-3xl border-border/60 soft-shadow">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 pb-3">
        <div>
          <CardTitle className="flex items-center gap-2 text-base font-bold">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary/10 text-primary">
              <Banknote className="h-4 w-4" />
            </span>
            Profit and cash flow
          </CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            Revenue, COGS, Meta Spend, operating profit, and cash conversion.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-xl"
            onClick={() => {
              forceRefreshRef.current = true;
              setRefreshNonce((value) => value + 1);
            }}
            disabled={loading}
          >
            <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <select
            value={period}
            onChange={(event) => setPeriod(event.target.value as Period)}
            className="rounded-xl border border-border/70 bg-background px-3 py-2 text-xs font-medium outline-none focus:ring-2 focus:ring-primary/30"
            aria-label="Profit and cash-flow period"
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
          <div className="flex min-h-44 items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading orders, fulfilment costs and Meta Spend…
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-amber-300/60 bg-amber-50/70 p-4 text-sm dark:border-amber-500/30 dark:bg-amber-950/20">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <div>
                <p className="font-semibold">Financial data is unavailable</p>
                <p className="mt-1 text-xs text-muted-foreground">{error}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  No values are estimated. Confirm the server Meta token and Ads Manager read
                  permissions.
                </p>
              </div>
            </div>
          </div>
        ) : financials ? (
          <>
            {!response.meta.available ? (
              <div className="rounded-2xl border border-amber-300/60 bg-amber-50/70 p-4 text-sm dark:border-amber-500/30 dark:bg-amber-950/20">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                  <div>
                    <p className="font-semibold">Meta spend is unavailable</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Revenue, COGS, fulfilment expenses and cash flow below come from DailyGear and
                      Money Center records. Operating profit excludes Meta spend until the server
                      Meta token and Ads Manager read permission are configured; no spend value is
                      estimated.
                    </p>
                  </div>
                </div>
              </div>
            ) : null}
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Metric
                label="Revenue"
                value={money(financials.revenue, financials.currency)}
                icon={CircleDollarSign}
              />
              <Metric
                label="Operating profit"
                value={money(financials.operatingProfit, financials.currency)}
                icon={financials.operatingProfit >= 0 ? TrendingUp : TrendingDown}
                tone={financials.operatingProfit >= 0 ? "positive" : "negative"}
              />
              <Metric
                label={response.meta.available ? "Spend" : "Spend (unavailable)"}
                value={
                  response.meta.available
                    ? money(financials.adSpend, financials.currency)
                    : "Data not available"
                }
                icon={Megaphone}
              />
              <Metric
                label="Net cash flow"
                value={money(financials.netCashFlow, financials.currency)}
                icon={financials.netCashFlow >= 0 ? TrendingUp : TrendingDown}
                tone={financials.netCashFlow >= 0 ? "positive" : "negative"}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Stat label="COGS" value={money(financials.cogs, financials.currency)} />
              <Stat label="Gross margin" value={percent(financials.grossMarginPct)} />
              <Stat label="Operating margin" value={percent(financials.operatingMarginPct)} />
              <Stat label="Cash conversion" value={percent(financials.cashConversionPct)} />
            </div>

            <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
              <div className="rounded-2xl border border-border/60 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">Daily revenue and cash flow</p>
                    <p className="text-xs text-muted-foreground">
                      Only returned order and sync data is shown.
                    </p>
                  </div>
                  <Badge variant="outline">{financials.orders} orders</Badge>
                </div>
                {financials.daily.length === 0 ? (
                  <p className="py-10 text-center text-sm text-muted-foreground">
                    No financial data for this period.
                  </p>
                ) : (
                  <div className="mt-4 space-y-3">
                    {financials.daily.slice(-14).map((day) => (
                      <div
                        key={day.date}
                        className="grid grid-cols-[4.5rem_1fr_auto] items-center gap-3 text-xs"
                      >
                        <span className="text-muted-foreground">{day.date.slice(5)}</span>
                        <div className="h-2 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{
                              width: `${Math.min((day.revenue / maxDailyRevenue) * 100, 100)}%`,
                            }}
                          />
                        </div>
                        <span className="tabular-nums">
                          {money(day.netCashFlow, financials.currency)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="rounded-2xl border border-border/60 p-4">
                <p className="text-sm font-semibold">Decision signals</p>
                <div className="mt-3 space-y-3 text-sm">
                  <Signal
                    label="Revenue / Spend"
                    value={
                      financials.revenuePerAdSpend === null
                        ? "Data not available"
                        : `${financials.revenuePerAdSpend.toFixed(2)}x`
                    }
                  />
                  <Signal
                    label="Profit after Spend"
                    value={money(financials.profitAfterAdSpend, financials.currency)}
                  />
                  <Signal
                    label="Cash received"
                    value={money(financials.cashReceived, financials.currency)}
                  />
                  <Signal
                    label="Cash outflows"
                    value={money(financials.cashOutflows, financials.currency)}
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="secondary">
                {response.meta.available ? "Read-only Meta sync" : "Meta sync unavailable"}
              </Badge>
              <Badge variant="outline">{response.meta.cache.hit ? "Cached" : "Fresh"}</Badge>
              <span>Auto-updates every minute</span>
              <span>
                Updated{" "}
                {new Date(response.meta.cache.fetchedAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
              <span>{response.meta.accountCount} account(s)</span>
              <span>{response.meta.campaignCount} campaign(s)</span>
              <span>{response.meta.insightCount} insight row(s)</span>
              {financials.dataQuality.warnings.length > 0 && (
                <Badge
                  variant="outline"
                  className="border-amber-400/60 text-amber-700 dark:text-amber-300"
                >
                  {financials.dataQuality.warnings.length} data warning(s)
                </Badge>
              )}
            </div>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-muted/40 px-3 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-sm font-bold tabular-nums">{value}</p>
    </div>
  );
}

function Signal({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/50 pb-2 last:border-0 last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold tabular-nums">{value}</span>
    </div>
  );
}
