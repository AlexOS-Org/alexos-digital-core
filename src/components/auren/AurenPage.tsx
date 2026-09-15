import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Brain,
  CheckCircle2,
  CircleDollarSign,
  ExternalLink,
  PackageSearch,
  RefreshCw,
  ShieldCheck,
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
  AurenAdvisorPeriod,
  AurenAdvisorScope,
  AurenConfidence,
  AurenForecast,
  AurenForecastHorizon,
} from "@/lib/auren/advisor.server";
import type { AurenAdvisoryResponse } from "@/lib/auren/advisor.server";
import { buildAurenDataReadiness, summarizeReadiness } from "@/lib/auren/data-readiness";
import { AurenReadinessPanel } from "@/components/auren/AurenReadinessPanel";

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
      <p className="text-sm text-muted-foreground">
        Auren page body is loading components. If you see only this line, rebuild is incomplete.
      </p>
      {advisory && readinessFeeds.length > 0 ? (
        <AurenReadinessPanel
          feeds={readinessFeeds}
          summary={readinessSummary}
          responseStatus={response?.status}
        />
      ) : null}
      {loading ? (
        <Card className="rounded-3xl border-border/60">
          <CardContent className="flex min-h-44 items-center justify-center gap-2 p-6 text-sm text-muted-foreground">
            <RefreshCw className="h-4 w-4 animate-spin" />
            Loading RLS-scoped advisory data…
          </CardContent>
        </Card>
      ) : null}
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
      {statusLabel ? (
        <Badge variant="outline" className="text-xs">
          {statusLabel}
        </Badge>
      ) : null}
    </div>
  );
}
