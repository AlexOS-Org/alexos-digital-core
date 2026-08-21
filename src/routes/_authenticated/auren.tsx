import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowRight,
  Brain,
  CheckCircle2,
  CircleDollarSign,
  ExternalLink,
  PackageSearch,
  RefreshCw,
  ShieldCheck,
  ShoppingBag,
  Target,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAurenAdvisory } from "@/lib/auren/advisor.functions";
import type {
  AurenAdvisorySnapshot,
  AurenAdvisorPeriod,
  AurenAdvisorScope,
  AurenConfidence,
  AurenForecast,
  AurenForecastHorizon,
} from "@/lib/auren/advisor.server";
import type { AurenAdvisoryResponse } from "@/lib/auren/advisor.server";

export const Route = createFileRoute("/_authenticated/auren")({
  component: AurenPage,
  head: () => ({
    meta: [{ title: "Auren · AlexOS" }],
  }),
});

const PERIODS: Array<{ value: AurenAdvisorPeriod; label: string }> = [
  { value: "last_30d", label: "Last 30 days" },
  { value: "last_90d", label: "Last 90 days" },
];

const SCOPES: Array<{ value: AurenAdvisorScope; label: string }> = [
  { value: "portfolio", label: "Portfolio view" },
  { value: "businesses", label: "Businesses only" },
  { value: "personal", label: "Personal view" },
];

function money(value: number | null, currency: string | null): string {
  if (value === null || !currency || currency === "mixed") return "Not available";
  return `${currency} ${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function percentage(value: number | null): string {
  if (value === null) return "No comparable baseline";
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
}

function confidenceLabel(confidence: AurenConfidence): string {
  return confidence === "insufficient" ? "Insufficient data" : `${confidence} confidence`;
}

function outlookLabel(value: AurenAdvisorySnapshot["outlook"]): string {
  return value === "under_pressure"
    ? "Under pressure"
    : value === "improving"
      ? "Improving"
      : value === "stable"
        ? "Stable"
        : "Insufficient data";
}

function outlookClass(value: AurenAdvisorySnapshot["outlook"]): string {
  return value === "under_pressure"
    ? "border-rose-300/60 bg-rose-50 text-rose-800 dark:border-rose-500/30 dark:bg-rose-950/20 dark:text-rose-200"
    : value === "improving"
      ? "border-emerald-300/60 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-950/20 dark:text-emerald-200"
      : "border-border/60 bg-card text-foreground";
}

function Metric({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string;
  value: string;
  detail?: string;
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
      {detail ? <p className="mt-1 text-xs text-muted-foreground">{detail}</p> : null}
    </div>
  );
}

function ForecastCard({ label, forecast }: { label: string; forecast: AurenForecast }) {
  const valuesAvailable =
    forecast.base !== null && forecast.lower !== null && forecast.upper !== null;
  return (
    <div className="rounded-2xl border border-border/60 bg-card/70 p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold">{label}</p>
        <Badge variant="outline" className="text-[10px]">
          {confidenceLabel(forecast.confidence)}
        </Badge>
      </div>
      {valuesAvailable ? (
        <>
          <p className="mt-3 text-xl font-black tabular-nums">
            {money(forecast.base, forecast.currency)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Scenario range: {money(forecast.lower, forecast.currency)} –{" "}
            {money(forecast.upper, forecast.currency)}
          </p>
        </>
      ) : (
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          A forecast will appear after Auren has enough comparable activity.
        </p>
      )}
      <p className="mt-3 text-[11px] leading-5 text-muted-foreground">{forecast.assumptions[0]}</p>
    </div>
  );
}

function AurenPage() {
  const [period, setPeriod] = useState<AurenAdvisorPeriod>("last_30d");
  const [scope, setScope] = useState<AurenAdvisorScope>("portfolio");
  const [horizonDays, setHorizonDays] = useState<AurenForecastHorizon>(30);
  const [response, setResponse] = useState<AurenAdvisoryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshNonce, setRefreshNonce] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    getAurenAdvisory({ data: { period, scope, horizonDays } })
      .then((result) => {
        if (active) setResponse(result);
      })
      .catch((cause: unknown) => {
        if (!active) return;
        setResponse(null);
        setError(
          cause instanceof Error ? cause.message : "Auren could not load the advisory data.",
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [period, scope, horizonDays, refreshNonce]);

  const advisory = response?.advisory;
  const statusLabel =
    response?.status === "ready"
      ? "Grounded advisory ready"
      : response?.status === "ai_unavailable"
        ? "Deterministic advisory available"
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
                Auren Intelligence
              </span>
              <Badge className="border-white/15 bg-white/10 text-white hover:bg-white/10">
                {statusLabel}
              </Badge>
            </div>
            <h1 className="mt-5 max-w-3xl text-3xl font-semibold tracking-tight sm:text-5xl">
              Know what is happening, what may happen next and what deserves your attention.
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-200 sm:text-base">
              Auren combines the records already in AlexOS across Money Center, CRM, goals and
              DailyGear. It separates verified facts from run-rate scenarios and labels
              recommendations with their evidence.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-2 text-xs text-slate-300">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" /> User-scoped data access
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" /> No fabricated values
              </span>
            </div>
          </div>
          <div className="flex items-end justify-start lg:justify-end">
            <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur-md">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/60">
                  Decision lens
                </p>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="text-white hover:bg-white/10 hover:text-white"
                  onClick={() => setRefreshNonce((value) => value + 1)}
                  disabled={loading}
                  aria-label="Refresh Auren advisory"
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                </Button>
              </div>
              <select
                value={scope}
                onChange={(event) => setScope(event.target.value as AurenAdvisorScope)}
                className="mt-3 w-full rounded-xl border border-white/15 bg-[#0d1b3c] px-3 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-violet-300/40"
                aria-label="Auren advisory scope"
              >
                {SCOPES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <select
                  value={period}
                  onChange={(event) => setPeriod(event.target.value as AurenAdvisorPeriod)}
                  className="w-full rounded-xl border border-white/15 bg-[#0d1b3c] px-3 py-2.5 text-xs text-white outline-none focus:ring-2 focus:ring-violet-300/40"
                  aria-label="Auren comparison period"
                >
                  {PERIODS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <select
                  value={horizonDays}
                  onChange={(event) =>
                    setHorizonDays(Number(event.target.value) as AurenForecastHorizon)
                  }
                  className="w-full rounded-xl border border-white/15 bg-[#0d1b3c] px-3 py-2.5 text-xs text-white outline-none focus:ring-2 focus:ring-violet-300/40"
                  aria-label="Auren forecast horizon"
                >
                  <option value={30}>30-day outlook</option>
                  <option value={90}>90-day outlook</option>
                </select>
              </div>
              {advisory ? (
                <p className="mt-3 text-xs text-white/55">
                  As of {advisory.asOf} · {advisory.period.from} → {advisory.period.until}
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
              <p className="font-semibold">Auren could not load advisory data.</p>
              <p className="mt-1 text-xs text-muted-foreground">{error}</p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {loading && !advisory ? (
        <Card className="rounded-3xl border-border/60">
          <CardContent className="flex min-h-44 items-center justify-center gap-2 p-6 text-sm text-muted-foreground">
            <RefreshCw className="h-4 w-4 animate-spin" />
            Loading RLS-scoped advisory data…
          </CardContent>
        </Card>
      ) : advisory ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Metric
              label="Net cash flow"
              value={money(advisory.verified.netCashFlow, advisory.currency)}
              detail={`${percentage(advisory.verified.incomeChangePct)} income direction`}
              icon={CircleDollarSign}
            />
            <Metric
              label="Recorded income"
              value={money(advisory.verified.income, advisory.currency)}
              detail={`${advisory.dataQuality.coverageDays.current} active days`}
              icon={TrendingUp}
            />
            <Metric
              label="Recorded expenses"
              value={money(advisory.verified.expenses, advisory.currency)}
              detail={`${percentage(advisory.verified.expenseChangePct)} expense direction`}
              icon={TrendingDown}
            />
            <Metric
              label="Cash available"
              value={money(advisory.verified.cashAvailable, advisory.currency)}
              detail={`${advisory.verified.pendingExpectedCount} expected item(s) pending`}
              icon={Wallet}
            />
          </div>

          {response?.summary ? (
            <Card className="rounded-3xl border-violet-500/20 bg-violet-500/[0.04] soft-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Brain className="h-4 w-4 text-violet-600 dark:text-violet-300" /> Auren decision
                  brief{" "}
                  <Badge variant="outline" className="ml-auto text-xs">
                    {response.model ? "Workers AI + verified data" : "Verified data"}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-2xl border border-violet-500/15 bg-background/60 p-5 text-sm leading-7 whitespace-pre-line">
                  {response.summary}
                </div>
              </CardContent>
            </Card>
          ) : null}

          {advisory.externalContext.length > 0 ? (
            <Card className="rounded-3xl border-border/60 soft-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <ShieldCheck className="h-4 w-4 text-primary" /> Public context and source
                  coverage
                  <Badge variant="outline" className="ml-auto text-xs">
                    Background only
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-3">
                {advisory.externalContext.map((context) => (
                  <div
                    key={context.business}
                    className="rounded-2xl border border-border/60 bg-card/70 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold">{context.business}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{context.sourceTitle}</p>
                      </div>
                      <Badge
                        variant={
                          context.status === "verified_brand_context" ? "secondary" : "outline"
                        }
                      >
                        {context.status === "verified_brand_context" ? "Reviewed" : "Source needed"}
                      </Badge>
                    </div>
                    {context.facts.length > 0 ? (
                      <ul className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
                        {context.facts.map((fact) => (
                          <li key={fact}>• {fact}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-3 text-sm leading-6 text-muted-foreground">
                        No entity-verified public facts were added. Auren will rely on internal
                        records for this business.
                      </p>
                    )}
                    {context.sourceUrl ? (
                      <a
                        href={context.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                      >
                        View public source <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    ) : null}
                    <p className="mt-3 text-[11px] leading-5 text-muted-foreground">
                      Retrieved {context.retrievedAt.slice(0, 10)} · {context.confidence} confidence
                    </p>
                    <p className="mt-2 text-[11px] leading-5 text-muted-foreground">
                      Limitation: {context.limitations[0]}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}

          <div className="grid gap-6 lg:grid-cols-[1.05fr_1.95fr]">
            <Card className={`rounded-3xl ${outlookClass(advisory.outlook)}`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Target className="h-4 w-4 text-primary" /> Performance outlook
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-2xl font-black">{outlookLabel(advisory.outlook)}</p>
                  <Badge variant="outline">
                    {advisory.dataQuality.coverageDays.current}/
                    {advisory.dataQuality.coverageDays.previous} active days
                  </Badge>
                </div>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  This is a directional assessment from recorded income and expense movement. It is
                  not a guarantee or an investment recommendation.
                </p>
                <div className="mt-5 space-y-3 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Expected income, weighted</span>
                    <strong>{money(advisory.verified.weightedExpected, advisory.currency)}</strong>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Open pipeline</span>
                    <strong>
                      {money(advisory.verified.weightedPipelineValue, advisory.currency)}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">DailyGear orders</span>
                    <strong>{advisory.verified.dailyGearOrders.toLocaleString()}</strong>
                  </div>
                </div>
              </CardContent>
            </Card>
            <div className="grid gap-3 sm:grid-cols-2">
              <ForecastCard label="Income outlook" forecast={advisory.forecasts.income} />
              <ForecastCard label="Expense outlook" forecast={advisory.forecasts.expenses} />
              <ForecastCard
                label="Net cash-flow outlook"
                forecast={advisory.forecasts.netCashFlow}
              />
              <ForecastCard
                label="DailyGear revenue outlook"
                forecast={advisory.forecasts.dailyGearRevenue}
              />
            </div>
          </div>

          <Card className="rounded-3xl border-border/60 soft-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldCheck className="h-4 w-4 text-primary" /> What deserves attention
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 lg:grid-cols-2">
              {advisory.recommendations.map((recommendation) => (
                <div
                  key={recommendation.id}
                  className="rounded-2xl border border-border/60 bg-card/70 p-4"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant={recommendation.priority === "critical" ? "destructive" : "outline"}
                    >
                      {recommendation.priority}
                    </Badge>
                    <Badge variant="outline">{confidenceLabel(recommendation.confidence)}</Badge>
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {recommendation.area}
                    </span>
                  </div>
                  <h3 className="mt-3 font-semibold">{recommendation.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    Evidence: {recommendation.evidence}
                  </p>
                  <p className="mt-2 text-sm leading-6">{recommendation.recommendation}</p>
                  {recommendation.action ? (
                    <Link
                      to={recommendation.action.to}
                      className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                    >
                      {recommendation.action.label}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  ) : null}
                </div>
              ))}
            </CardContent>
          </Card>

          {advisory.businesses.length > 0 ? (
            <Card className="rounded-3xl border-border/60">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <ShoppingBag className="h-4 w-4 text-primary" /> Business performance view
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {advisory.businesses.map((business) => (
                  <div
                    key={`${business.id ?? "unassigned"}-${business.name}`}
                    className="rounded-2xl border border-border/60 bg-card/70 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="font-semibold">{business.name}</h3>
                      <Badge variant="outline">{outlookLabel(business.outlook)}</Badge>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">Income</p>
                        <p className="mt-1 font-semibold">
                          {money(business.currentIncome, advisory.currency)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Expenses</p>
                        <p className="mt-1 font-semibold">
                          {money(business.currentExpenses, advisory.currency)}
                        </p>
                      </div>
                    </div>
                    <p className="mt-3 text-xs text-muted-foreground">
                      Income {percentage(business.incomeChangePct)} · Expenses{" "}
                      {percentage(business.expenseChangePct)}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}

          <Card className="rounded-3xl border-dashed border-border/70">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <PackageSearch className="h-4 w-4 text-primary" /> Data quality and assumptions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                {Object.entries(advisory.dataQuality.sourceRows).map(([label, count]) => (
                  <div key={label} className="rounded-2xl bg-muted/50 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {label.replace(/([A-Z])/g, " $1")}
                    </p>
                    <p className="mt-1 text-lg font-bold tabular-nums">{count.toLocaleString()}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 space-y-1 text-xs leading-5 text-muted-foreground">
                {advisory.dataQuality.warnings.length > 0 ? (
                  advisory.dataQuality.warnings.map((warning) => (
                    <p key={warning}>Data note: {warning}</p>
                  ))
                ) : (
                  <p>No data-quality warnings were triggered for this view.</p>
                )}
                <p>
                  Forecast method: current recorded active-day run-rate with a ±25%
                  operating-variance range. Auren does not treat this range as a statistical
                  confidence interval.
                </p>
              </div>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
