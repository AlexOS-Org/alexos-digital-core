import { useEffect, useState } from "react";
import { AlertTriangle, Brain, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getAurenAdvisory } from "@/lib/auren/advisor.functions";
import type {
  AurenAdvisorPeriod,
  AurenAdvisorScope,
  AurenForecastHorizon,
} from "@/lib/auren/advisor.server";
import type { AurenAdvisoryResponse } from "@/lib/auren/advisor.server";
import { buildAurenDataReadiness, summarizeReadiness } from "@/lib/auren/data-readiness";
import { AurenReadinessPanel } from "@/components/auren/AurenReadinessPanel";

const PERIODS: Array<{ value: AurenAdvisorPeriod; label: string }> = [
  { value: "last_30d", label: "Last 30 days" },
  { value: "last_90d", label: "Last 90 days" },
];

const SCOPES: Array<{ value: AurenAdvisorScope; label: string }> = [
  { value: "portfolio", label: "Portfolio view" },
  { value: "businesses", label: "Businesses only" },
  { value: "personal", label: "Personal view" },
];

export function AurenPage() {
  const [period, setPeriod] = useState<AurenAdvisorPeriod>("last_30d");
  const [scope, setScope] = useState<AurenAdvisorScope>("portfolio");
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [horizonDays, setHorizonDays] = useState<AurenForecastHorizon>(30);
  const [response, setResponse] = useState<AurenAdvisoryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshNonce, setRefreshNonce] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    getAurenAdvisory({ data: { period, scope, horizonDays, businessId } })
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
  }, [businessId, period, scope, horizonDays, refreshNonce]);

  const advisory = response?.advisory;
  const readinessFeeds = advisory
    ? buildAurenDataReadiness(advisory, response?.status ?? null)
    : [];
  const readinessSummary = summarizeReadiness(readinessFeeds);
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
              When a source is empty, Auren says so clearly and links you to the page that fills it.
              It will not invent missing figures.
            </p>
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
                onChange={(event) => {
                  setScope(event.target.value as AurenAdvisorScope);
                  if (event.target.value !== "businesses") setBusinessId(null);
                }}
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

      {advisory && readinessFeeds.length > 0 ? (
        <AurenReadinessPanel
          feeds={readinessFeeds}
          summary={readinessSummary}
          responseStatus={response?.status}
        />
      ) : null}

      {loading && !advisory ? (
        <Card className="rounded-3xl border-border/60">
          <CardContent className="flex min-h-44 items-center justify-center gap-2 p-6 text-sm text-muted-foreground">
            <RefreshCw className="h-4 w-4 animate-spin" />
            Loading RLS-scoped advisory data…
          </CardContent>
        </Card>
      ) : null}

      {advisory && response?.summary ? (
        <Card className="rounded-3xl border-violet-500/20 bg-violet-500/[0.04] soft-shadow">
          <CardContent className="p-5 text-sm leading-7 whitespace-pre-line">{response.summary}</CardContent>
        </Card>
      ) : null}
    </div>
  );
}
