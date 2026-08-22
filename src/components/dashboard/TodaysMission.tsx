import { Link } from "@tanstack/react-router";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUpRight, CheckCircle2, Clock3, Target, Zap } from "lucide-react";
import { useTodaysPriorities } from "@/lib/intelligence/api";

const TONES: Record<string, string> = {
  amber: "bg-amber-400/10 text-amber-300",
  blue: "bg-blue-400/10 text-blue-300",
  violet: "bg-violet-400/10 text-violet-300",
  emerald: "bg-emerald-400/10 text-emerald-300",
};

export default function TodaysMission({ compact = false }: { compact?: boolean }) {
  const { data: priorities, isLoading, isError } = useTodaysPriorities();
  const activeCount = priorities.filter((p) => p.count > 0).length;

  return (
    <section
      className={`dashboard-priority-card relative overflow-hidden rounded-[2rem] border border-white/10 text-white ${compact ? "rounded-[1.5rem]" : ""}`}
    >
      <div className="dashboard-priority-orb dashboard-priority-orb-purple pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full blur-3xl" />
      <div className="dashboard-priority-orb dashboard-priority-orb-blue pointer-events-none absolute -bottom-28 left-1/3 h-56 w-56 rounded-full blur-3xl" />
      <div className={compact ? "relative p-4 sm:p-5" : "relative p-6 sm:p-7"}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-blue-200 sm:mb-3 sm:text-xs">
              <Target className="h-3.5 w-3.5" /> Today's priorities
            </div>
            <h2
              className={
                compact
                  ? "text-lg font-semibold tracking-tight sm:text-xl"
                  : "text-2xl font-semibold tracking-tight sm:text-3xl"
              }
            >
              {compact ? "Clear the blockers." : "Clear the blockers. Protect the momentum."}
            </h2>
            <p className="mt-1.5 max-w-2xl text-xs leading-5 text-slate-300 sm:mt-2 sm:text-sm sm:leading-6">
              {compact
                ? "Ranked from your live money and business data."
                : "Ranked from your live money, pipeline and goal data."}
            </p>
          </div>
          <div className="flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs text-slate-300">
            <Zap className="h-3.5 w-3.5 text-violet-300" />
            {isLoading ? "Calculating" : `${activeCount} active priorities`}
          </div>
        </div>

        {isError ? (
          <p className="mt-5 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-slate-300">
            Priorities are unavailable right now. Refresh to retry.
          </p>
        ) : (
          <div
            className={`mt-4 grid gap-3 ${compact ? "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3" : "lg:grid-cols-3"}`}
          >
            {isLoading
              ? Array.from({ length: compact ? 2 : 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-[118px] rounded-2xl bg-white/[0.06]" />
                ))
              : priorities.map((task, index) => (
                  <Link
                    key={task.id}
                    to={task.to}
                    className="rounded-2xl border border-white/10 bg-white/[0.045] p-3.5 backdrop-blur-sm transition-colors hover:bg-white/[0.07] sm:p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-xl ${task.count > 0 ? TONES[task.tone] : "bg-emerald-400/10 text-emerald-300"}`}
                      >
                        {task.count > 0 ? (
                          <Clock3 className="h-4.5 w-4.5" />
                        ) : (
                          <CheckCircle2 className="h-4.5 w-4.5" />
                        )}
                      </div>
                      <span className="text-2xl font-bold tracking-tight">{task.count}</span>
                    </div>
                    <p className="mt-2.5 text-sm font-semibold leading-5">
                      {index + 1}. {task.title}
                    </p>
                    <div className="mt-1 flex items-center justify-between gap-2 text-xs text-slate-400">
                      <span className="truncate">{task.detail}</span>
                      <ArrowUpRight className="h-3.5 w-3.5 shrink-0" />
                    </div>
                  </Link>
                ))}
          </div>
        )}
      </div>
    </section>
  );
}
