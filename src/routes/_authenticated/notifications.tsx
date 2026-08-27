import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowUpRight,
  Bell,
  CheckCircle2,
  Radar,
  RefreshCw,
  ShieldCheck,
  Target,
  TriangleAlert,
  Zap,
} from "lucide-react";
import { useIntelligenceSignals, useTodaysPriorities } from "@/lib/intelligence/api";
import { CATEGORY_ACCENTS, PRIORITY_STYLES } from "@/lib/intelligence/constants";
import { relativeTime } from "@/lib/intelligence/calculations";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/notifications")({
  component: NotificationsPage,
  head: () => ({
    meta: [
      { title: "Notifications · AlexOS" },
      {
        name: "description",
        content: "Actionable alerts, updates and operational signals from across AlexOS.",
      },
    ],
  }),
});

function NotificationsPage() {
  const {
    data: signals,
    isLoading: signalsLoading,
    isError: signalsError,
    isEmpty: signalsEmpty,
  } = useIntelligenceSignals(50);
  const {
    data: priorities,
    isLoading: prioritiesLoading,
    isError: prioritiesError,
  } = useTodaysPriorities();

  const isLoading = signalsLoading || prioritiesLoading;
  const isError = signalsError || prioritiesError;
  const criticalCount = signals.filter((signal) => signal.priority === "critical").length;
  const activePriorityCount = priorities.filter((priority) => priority.count > 0).length;

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-5 sm:space-y-8 sm:px-6 sm:py-8 lg:px-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="alexos-visual-strip flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-primary-foreground shadow-lg shadow-primary/15">
            <Bell className="h-6 w-6" />
          </div>
          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
              AlexOS command center
            </p>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Notifications</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              Alerts, updates and system signals from your live money, pipeline, goals and business
              data.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <StatusPill icon={Radar} label={isLoading ? "Analysing" : "Live data"} />
          {!isLoading && criticalCount > 0 && (
            <StatusPill icon={AlertTriangle} label={`${criticalCount} critical`} tone="critical" />
          )}
          {!isLoading && criticalCount === 0 && (
            <StatusPill icon={ShieldCheck} label="No critical alerts" tone="clear" />
          )}
        </div>
      </header>

      {isError ? (
        <section className="rounded-[1.8rem] border border-destructive/20 bg-destructive/[0.06] p-5 sm:p-7">
          <div className="flex items-start gap-3">
            <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
            <div>
              <h2 className="font-semibold">Notifications are temporarily unavailable</h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Your records are safe. Refresh the page to retry loading the latest operational
                signals.
              </p>
              <Button className="mt-4" variant="outline" onClick={() => window.location.reload()}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh signals
              </Button>
            </div>
          </div>
        </section>
      ) : (
        <>
          <section className="rounded-[2rem] border border-primary/15 bg-gradient-to-br from-primary/[0.09] via-card to-card p-5 shadow-[0_24px_70px_-48px_var(--alexos-glow)] sm:p-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
                  <Target className="h-3.5 w-3.5" /> Today&apos;s priorities
                </div>
                <h2 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">
                  Clear the blockers first.
                </h2>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Ranked from the same live data that powers your AlexOS dashboard.
                </p>
              </div>
              <div className="flex w-fit items-center gap-2 rounded-full border border-border/70 bg-background/70 px-3 py-1.5 text-xs text-muted-foreground">
                <Zap className="h-3.5 w-3.5 text-primary" />
                {isLoading ? "Calculating" : `${activePriorityCount} active priorities`}
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {isLoading
                ? Array.from({ length: 3 }).map((_, index) => (
                    <Skeleton key={index} className="h-28 rounded-2xl" />
                  ))
                : priorities.map((priority, index) => (
                    <Link
                      key={priority.id}
                      to={priority.to}
                      className="group rounded-2xl border border-border/70 bg-background/70 p-4 transition-colors hover:border-primary/30 hover:bg-background"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/[0.1] text-primary">
                          {priority.count > 0 ? (
                            <Target className="h-4 w-4" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4" />
                          )}
                        </div>
                        <span className="text-2xl font-bold tracking-tight">{priority.count}</span>
                      </div>
                      <p className="mt-3 text-sm font-semibold leading-5">
                        {index + 1}. {priority.title}
                      </p>
                      <div className="mt-1 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                        <span className="truncate">{priority.detail}</span>
                        <ArrowUpRight className="h-3.5 w-3.5 shrink-0 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                      </div>
                    </Link>
                  ))}
            </div>
          </section>

          <section className="rounded-[2rem] border border-border/70 bg-card p-5 shadow-sm sm:p-7">
            <div className="flex flex-col gap-3 border-b border-border/70 pb-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  <Radar className="h-3.5 w-3.5 text-primary" /> Operational signal feed
                </div>
                <h2 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">
                  What deserves your attention
                </h2>
              </div>
              {!isLoading && (
                <span className="w-fit rounded-full border border-border/70 bg-muted/50 px-3 py-1.5 text-xs text-muted-foreground">
                  {signals.length} signals
                </span>
              )}
            </div>

            {isLoading ? (
              <div className="space-y-3 pt-5">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Skeleton key={index} className="h-32 rounded-2xl" />
                ))}
              </div>
            ) : signalsEmpty ? (
              <div className="flex flex-col items-center justify-center py-14 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-300">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <h3 className="mt-4 font-semibold">No signals right now</h3>
                <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                  AlexOS will surface a notification automatically when your live money, business or
                  goals data needs attention.
                </p>
              </div>
            ) : (
              <div className="space-y-3 pt-5">
                {signals.map((signal) => {
                  const Icon = signal.icon;
                  return (
                    <article
                      key={signal.id}
                      className="group flex gap-3 rounded-2xl border border-border/70 bg-muted/[0.28] p-4 transition-colors hover:border-primary/25 hover:bg-muted/50 sm:gap-4 sm:p-5"
                    >
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${CATEGORY_ACCENTS[signal.category]}`}
                      >
                        <Icon className="h-4.5 w-4.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                            {signal.categoryLabel}
                          </span>
                          <span
                            className={`rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${PRIORITY_STYLES[signal.priority]}`}
                          >
                            {signal.priority}
                          </span>
                          <span className="ml-auto text-[10px] text-muted-foreground">
                            {relativeTime(signal.timestamp)}
                          </span>
                        </div>
                        <h3 className="mt-2 text-sm font-semibold sm:text-base">{signal.title}</h3>
                        <p className="mt-1 text-xs leading-5 text-muted-foreground sm:text-sm">
                          {signal.description}
                        </p>
                        <p className="mt-2 text-xs leading-5 text-primary/90 sm:text-sm">
                          <span className="font-semibold">Recommended action:</span>{" "}
                          {signal.recommendation}
                        </p>
                        {signal.action && (
                          <Link
                            to={signal.action.to}
                            className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-foreground transition-colors hover:text-primary"
                          >
                            {signal.action.label}
                            <ArrowUpRight className="h-3.5 w-3.5" />
                          </Link>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
}

function StatusPill({
  icon: Icon,
  label,
  tone = "default",
}: {
  icon: typeof Bell;
  label: string;
  tone?: "default" | "critical" | "clear";
}) {
  const toneStyles = {
    default: "border-primary/20 bg-primary/[0.08] text-primary",
    critical: "border-destructive/20 bg-destructive/[0.08] text-destructive",
    clear: "border-emerald-500/20 bg-emerald-500/[0.08] text-emerald-700 dark:text-emerald-300",
  };

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 font-semibold ${toneStyles[tone]}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}
