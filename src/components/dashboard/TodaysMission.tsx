import { Link } from "@tanstack/react-router";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUpRight, CheckCircle2, Clock3, Target, Zap } from "lucide-react";
import { useTodaysPriorities } from "@/lib/intelligence/api";

const TONES: Record<string, string> = {
  amber: "dashboard-tone-amber dashboard-tone-icon",
  blue: "dashboard-tone-blue dashboard-tone-icon",
  violet: "dashboard-tone-purple dashboard-tone-icon",
  emerald: "dashboard-tone-green dashboard-tone-icon",
};

export default function TodaysMission({ compact = false }: { compact?: boolean }) {
  const { data: priorities, isLoading, isError } = useTodaysPriorities();
  const activeCount = priorities.filter((p) => p.count > 0).length;

  return (
    <section
      className={`dashboard-priority-card relative overflow-hidden rounded-xl border ${compact ? "" : "sm:p-1"}`}
    >
      <div className={compact ? "relative p-4 sm:p-5" : "relative p-5 sm:p-6"}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="alexos-eyebrow mb-2 flex items-center gap-2 sm:mb-3">
              <Target aria-hidden="true" className="size-3.5" /> Today&apos;s priorities
            </p>
            <h2
              className={
                compact
                  ? "text-lg font-semibold tracking-tight sm:text-xl"
                  : "text-2xl font-semibold tracking-tight sm:text-3xl"
              }
            >
              {compact ? "Clear the blockers." : "Clear the blockers. Protect the momentum."}
            </h2>
            <p className="mt-1.5 max-w-2xl text-xs leading-5 dashboard-priority-muted sm:mt-2 sm:text-sm sm:leading-6">
              {compact
                ? "Ranked from your live money and business data."
                : "Ranked from your live money, pipeline and goal data."}
            </p>
          </div>
          <div className="flex w-fit items-center gap-2 rounded-full dashboard-priority-surface border px-3 py-1.5 text-xs dashboard-priority-muted">
            <Zap
              aria-hidden="true"
              className="size-3.5 dashboard-tone-purple dashboard-tone-text"
            />
            {isLoading ? "Calculating" : `${activeCount} active priorities`}
          </div>
        </div>

        {isError ? (
          <p className="mt-5 rounded-xl border dashboard-priority-surface p-4 text-sm dashboard-priority-muted">
            Priorities are unavailable right now. Refresh to retry.
          </p>
        ) : (
          <div
            className={`mt-4 grid gap-3 ${compact ? "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3" : "lg:grid-cols-3"}`}
          >
            {isLoading
              ? Array.from({ length: compact ? 2 : 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-[118px] rounded-xl dashboard-priority-surface" />
                ))
              : priorities.map((task, index) => (
                  <Link
                    key={task.id}
                    to={task.to}
                    className="alexos-focusable dashboard-priority-surface rounded-xl border p-3.5 transition-colors hover:bg-transparent sm:p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div
                        className={`grid size-9 place-items-center rounded-lg ${task.count > 0 ? TONES[task.tone] : "dashboard-tone-green dashboard-tone-icon"}`}
                      >
                        {task.count > 0 ? (
                          <Clock3 aria-hidden="true" className="size-4" />
                        ) : (
                          <CheckCircle2 aria-hidden="true" className="size-4" />
                        )}
                      </div>
                      <span className="text-2xl font-bold tabular-nums tracking-tight">
                        {task.count}
                      </span>
                    </div>
                    <p className="mt-2.5 text-sm font-semibold leading-5">
                      {index + 1}. {task.title}
                    </p>
                    <div className="mt-1 flex items-center justify-between gap-2 text-xs dashboard-priority-muted">
                      <span className="truncate">{task.detail}</span>
                      <ArrowUpRight aria-hidden="true" className="size-3.5 shrink-0" />
                    </div>
                  </Link>
                ))}
          </div>
        )}
      </div>
    </section>
  );
}
