import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  AlertTriangle,
  Brain,
  CircleDollarSign,
  PackageSearch,
  RefreshCw,
  ShoppingBag,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAurenKpiSummary } from "@/lib/dailygear/auren-kpi.functions";
import type { AurenKpiPeriod, AurenKpiResponse } from "@/lib/dailygear/auren-kpi.server";

export const Route = createFileRoute("/_authenticated/auren")({
  component: AurenPage,
  head: () => ({
    meta: [{ title: "Auren · AlexOS" }],
  }),
});

const PERIODS: Array<{ value: AurenKpiPeriod; label: string }> = [
  { value: "last_7d", label: "Last 7 days" },
  { value: "last_30d", label: "Last 30 days" },
  { value: "this_month", label: "This month" },
];

function money(value: number, currency: string | null) {
  return currency && currency !== "mixed"
    ? `${currency} ${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
    : currency === "mixed"
      ? "Mixed currencies"
      : "Data not available";
}

function Metric({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof CircleDollarSign;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card/70 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <p className="mt-2 text-xl font-black tabular-nums">{value}</p>
    </div>
  );
}

function AurenPage() {
  const [period, setPeriod] = useState<AurenKpiPeriod>("last_30d");
  const [response, setResponse] = useState<AurenKpiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshNonce, setRefreshNonce] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    getAurenKpiSummary({ data: { period } })
      .then((result) => {
        if (active) setResponse(result);
      })
      .catch((cause: unknown) => {
        if (!active) return;
        setResponse(null);
        setError(cause instanceof Error ? cause.message : "Auren could not load DailyGear data.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [period, refreshNonce]);

  const snapshot = response?.snapshot;
  const statusLabel =
    response?.status === "ready"
      ? "AI summary ready"
      : response?.status === "ai_unavailable"
        ? "Deterministic snapshot available"
        : response?.status === "no_data"
          ? "Waiting for live data"
          : "Loading live data";

  return (
    <div className="space-y-6 pb-10">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/15 bg-[#071329] text-white shadow-[0_24px_70px_-30px_rgba(37,99,235,0.42)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,rgba(139,92,246,0.28),transparent_30%),linear-gradient(120deg,rgba(6,16,38,0.96),rgba(14,31,68,0.68))]" />
        <div className="relative grid gap-6 p-6 sm:p-8 lg:grid-cols-[1.35fr_0.65fr] lg:p-10">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/20 px-3 py-1.5 text-xs font-medium text-emerald-50 backdrop-blur-md">
                <Brain className="h-3.5 w-3.5 text-violet-200" />
                Auren
              </span>
              <Badge className="border-white/15 bg-white/10 text-white hover:bg-white/10">
                {statusLabel}
              </Badge>
            </div>
            <h1 className="mt-5 max-w-2xl text-3xl font-semibold tracking-tight sm:text-5xl">
              Auren turns real DailyGear activity into a clearer next move.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-200 sm:text-base">
              Auren reads only the connected DailyGear KPI snapshot. It never invents revenue,
              stock, customers or orders, and it stays quiet when there is not enough real data.
            </p>
          </div>
          <div className="flex items-end justify-start lg:justify-end">
            <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur-md">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/60">
                  Snapshot period
                </p>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="text-white hover:bg-white/10 hover:text-white"
                  onClick={() => setRefreshNonce((value) => value + 1)}
                  disabled={loading}
                  aria-label="Refresh Auren KPI summary"
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                </Button>
              </div>
              <select
                value={period}
                onChange={(event) => setPeriod(event.target.value as AurenKpiPeriod)}
                className="mt-3 w-full rounded-xl border border-white/15 bg-[#0d1b3c] px-3 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-violet-300/40"
                aria-label="Auren KPI period"
              >
                {PERIODS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {snapshot ? (
                <p className="mt-3 text-xs text-white/55">
                  {snapshot.period.from} → {snapshot.period.until}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {error ? (
        <Card className="rounded-3xl border-amber-300/60 bg-amber-50/70 dark:border-amber-500/30 dark:bg-amber-950/20">
          <CardContent className="flex items-start gap-3 p-5">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <div>
              <p className="font-semibold">Auren could not load DailyGear data.</p>
              <p className="mt-1 text-xs text-muted-foreground">{error}</p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {loading ? (
        <Card className="rounded-3xl border-border/60">
          <CardContent className="flex min-h-44 items-center justify-center gap-2 p-6 text-sm text-muted-foreground">
            <RefreshCw className="h-4 w-4 animate-spin" />
            Loading RLS-scoped DailyGear KPIs…
          </CardContent>
        </Card>
      ) : response?.status === "no_data" ? (
        <Card className="rounded-3xl border-dashed border-primary/30 bg-primary/[0.04]">
          <CardContent className="p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
                <Brain className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-semibold">Auren is ready for real DailyGear data.</h2>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
                  Add a published storefront, real products, and real orders to unlock an evidence-
                  based KPI summary. No values are estimated while the workspace is empty.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : snapshot ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Metric
              label="Revenue"
              value={money(snapshot.revenue, snapshot.currency)}
              icon={CircleDollarSign}
            />
            <Metric
              label="Orders"
              value={snapshot.orderCount.toLocaleString()}
              icon={ShoppingBag}
            />
            <Metric
              label="Inventory units"
              value={snapshot.inventoryUnits.toLocaleString()}
              icon={PackageSearch}
            />
            <Metric
              label="Customers"
              value={snapshot.customerCount.toLocaleString()}
              icon={Users}
            />
          </div>

          <Card className="rounded-3xl border-border/60 soft-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Brain className="h-4 w-4 text-violet-600 dark:text-violet-300" />
                Auren summary
                {response.status === "ai_unavailable" ? (
                  <Badge variant="outline" className="ml-auto text-xs">
                    AI unavailable
                  </Badge>
                ) : null}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {response.summary ? (
                <div className="rounded-2xl border border-violet-500/15 bg-violet-500/[0.05] p-5 text-sm leading-7 whitespace-pre-line">
                  {response.summary}
                </div>
              ) : (
                <p className="text-sm leading-6 text-muted-foreground">
                  The deterministic KPI snapshot is available, but Auren did not return a model
                  summary. No interpretation is shown as fact.
                </p>
              )}
              {snapshot.dataQuality.warnings.length ? (
                <div className="mt-4 space-y-1 text-xs text-muted-foreground">
                  {snapshot.dataQuality.warnings.map((warning) => (
                    <p key={warning}>Data note: {warning}</p>
                  ))}
                </div>
              ) : null}
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
