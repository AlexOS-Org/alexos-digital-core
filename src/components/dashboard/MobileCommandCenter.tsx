import { Link } from "@tanstack/react-router";
import { ArrowUpRight, CircleAlert, Sparkles, TrendingUp, WalletCards } from "lucide-react";
import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardData } from "@/lib/dashboard/api";
import { formatMoney } from "@/lib/money/format";
import { guardAggregateMoneyValue } from "@/lib/money/currency-safety";
import { useIntelligenceSignals } from "@/lib/intelligence/api";
import { useAurenDailyBriefing } from "@/lib/auren/daily-briefing.api";
import { cn } from "@/lib/utils";

function MobileSectionHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: { label: string; to: string };
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
          {eyebrow}
        </p>
        <h2 className="mt-1 text-xl font-semibold tracking-tight">{title}</h2>
        {description ? (
          <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action ? (
        <Link
          to={action.to}
          className="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold text-primary transition-colors hover:bg-primary/10"
        >
          {action.label}
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      ) : null}
    </div>
  );
}

export function MobileAurenBriefing() {
  const { data, isLoading, isError } = useAurenDailyBriefing();
  const briefing = data?.briefing;
  const topPriority = briefing?.topPriority;
  return (
    <section className="alexos-mesh relative overflow-hidden rounded-[1.75rem] border border-[var(--alexos-purple)]/20 p-4 shadow-[0_18px_52px_-34px_var(--alexos-glow)] sm:p-5">
      <div className="pointer-events-none absolute -right-12 -top-16 h-36 w-36 rounded-full bg-[var(--alexos-purple)]/12 blur-3xl" />
      <div className="relative">
        <MobileSectionHeader
          eyebrow="Auren briefing"
          title="What matters today."
          description="Priorities from your owner-scoped CRM data."
          action={{ label: "View all", to: "/auren" }}
        />
        <div className="mt-4 space-y-2">
          {isLoading ? (
            Array.from({ length: 2 }).map((_, index) => (
              <Skeleton key={index} className="h-[68px] rounded-2xl" />
            ))
          ) : isError || !data || !briefing ? (
            <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-3 text-xs text-muted-foreground">
              Auren briefing is unavailable right now. Your data is safe; refresh to retry.
            </div>
          ) : briefing.status === "no_data" ? (
            <div className="flex items-start gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-3">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-300" />
              <div>
                <p className="text-sm font-semibold">No CRM priorities yet</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Record a lead, task, or activity and Auren will surface the next useful action.
                </p>
              </div>
            </div>
          ) : (
            <>
              {topPriority ? (
                <Link
                  to="/auren"
                  className="group flex items-center gap-3 rounded-2xl border border-primary/20 bg-card/75 p-3"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--alexos-purple)]/10 text-[var(--alexos-purple)]">
                    <ArrowUpRight className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      {topPriority.priority} priority · {topPriority.type}
                    </p>
                    <p className="mt-1 truncate text-sm font-semibold">{topPriority.title}</p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {topPriority.detail}
                    </p>
                  </div>
                </Link>
              ) : null}
              <p className="px-1 text-[10px] text-muted-foreground">
                {briefing.metrics.meetingsToday} meetings · {briefing.metrics.actionItems} open
                actions · read-only
              </p>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

export function MobileMetricTiles() {
  const { metrics, isLoading } = useDashboardData();
  const { data: signals = [] } = useIntelligenceSignals(3);
  const moneyValue = (value: number) => {
    const guarded = guardAggregateMoneyValue(value, metrics.money.currencySafety);
    return guarded === null
      ? "Data not available"
      : formatMoney(guarded, metrics.money.currencySafety.currency ?? undefined);
  };
  const alertCount =
    signals.length +
    metrics.money.lowBalanceAccounts.length +
    metrics.money.overdueBills.length +
    metrics.business.staleLeads.length;
  const tiles = [
    {
      label: "Money",
      value: moneyValue(metrics.money.cashAvailable),
      detail: "Cash available",
      icon: WalletCards,
      tone: "text-emerald-600 dark:text-emerald-300 bg-emerald-500/10 ring-emerald-500/15",
      to: "/money-center",
    },
    {
      label: "Pipeline",
      value: formatMoney(metrics.business.pipelineValue),
      detail: `${metrics.business.openLeads} open leads`,
      icon: TrendingUp,
      tone: "text-violet-600 dark:text-violet-300 bg-violet-500/10 ring-violet-500/15",
      to: "/people/leads",
    },
    {
      label: "Alerts",
      value: String(alertCount),
      detail: alertCount === 0 ? "No attention needed" : "Need attention",
      icon: CircleAlert,
      tone: "text-amber-600 dark:text-amber-300 bg-amber-500/10 ring-amber-500/15",
      to: "/notifications",
    },
  ];
  return (
    <section className="space-y-3">
      <MobileSectionHeader eyebrow="At a glance" title="Your operating picture." />
      <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
        {tiles.map((tile) => {
          const Icon = tile.icon;
          return (
            <Link key={tile.label} to={tile.to} className="group min-w-0">
              <Card className="relative h-full overflow-hidden rounded-2xl border-border/60 bg-card/85 transition-all hover:-translate-y-0.5 hover:shadow-md">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      {tile.label}
                    </p>
                    <div
                      className={cn(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ring-1",
                        tile.tone,
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                  </div>
                  {isLoading ? (
                    <Skeleton className="mt-4 h-6 w-20" />
                  ) : (
                    <p className="mt-4 truncate text-base font-bold tracking-tight sm:text-lg">
                      {tile.value}
                    </p>
                  )}
                  <p className="mt-1 truncate text-[10px] text-muted-foreground">{tile.detail}</p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export function MobileRevenueToday() {
  const { snapshot, metrics, isLoading } = useDashboardData();
  const values = useMemo(() => {
    const buckets = Array.from({ length: 12 }, () => 0);
    const todayKey = new Date().toISOString().slice(0, 10);
    for (const transaction of snapshot.transactions) {
      if (
        transaction.type !== "income" ||
        transaction.status !== "posted" ||
        String(transaction.occurred_at).slice(0, 10) !== todayKey
      )
        continue;
      const hour = new Date(transaction.occurred_at).getHours();
      buckets[Math.min(11, Math.floor(hour / 2))] += Number(transaction.amount) || 0;
    }
    return buckets;
  }, [snapshot.transactions]);
  const max = Math.max(...values, 1);
  const guardedRevenueToday = guardAggregateMoneyValue(
    metrics.money.revenueToday,
    metrics.money.currencySafety,
  );
  const hasRevenue = guardedRevenueToday !== null && guardedRevenueToday > 0;
  return (
    <section className="relative overflow-hidden rounded-[1.75rem] border border-border/60 bg-card/75 p-4 shadow-[0_18px_50px_-35px_var(--alexos-glow)] sm:p-5">
      <div className="alexos-visual-strip absolute inset-x-0 top-0 h-1 opacity-80" />
      <MobileSectionHeader
        eyebrow="Revenue today"
        title={
          guardedRevenueToday === null
            ? "Data not available"
            : formatMoney(guardedRevenueToday, metrics.money.currencySafety.currency ?? undefined)
        }
        description={
          hasRevenue
            ? "Posted income recorded since midnight."
            : "No posted income has been recorded since midnight."
        }
        action={{ label: "View money", to: "/money-center" }}
      />
      <div className="mt-5 flex h-24 items-end gap-1.5 rounded-2xl border border-border/50 bg-muted/30 px-3 py-3 sm:h-28">
        {values.map((value, index) => (
          <div key={index} className="flex h-full flex-1 items-end" aria-hidden="true">
            <div
              className={cn(
                "w-full rounded-t-md bg-gradient-to-t from-[var(--alexos-purple)]/70 to-[var(--alexos-blue)]/35 transition-[height] duration-500",
                !hasRevenue && "h-1.5 opacity-40",
              )}
              style={hasRevenue ? { height: `${Math.max(8, (value / max) * 100)}%` } : undefined}
            />
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between px-1 text-[10px] text-muted-foreground">
        <span>12AM</span>
        <span>6AM</span>
        <span>12PM</span>
        <span>6PM</span>
        <span>Now</span>
      </div>
      {isLoading ? <Skeleton className="mt-3 h-3 w-36" /> : null}
    </section>
  );
}
