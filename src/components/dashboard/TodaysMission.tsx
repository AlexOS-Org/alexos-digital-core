import { Link } from "@tanstack/react-router";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUpRight, CheckCircle2, Clock3, Zap } from "lucide-react";
import { useTodaysPriorities } from "@/lib/intelligence/api";

const TONES: Record<string, string> = {
  amber: "bg-amber-400/10 text-amber-300",
  blue: "bg-blue-400/10 text-blue-300",
  violet: "bg-violet-400/10 text-violet-300",
  emerald: "bg-emerald-400/10 text-emerald-300",
};

export default function TodaysMission() {
  const { data: priorities = [], isLoading, isError } = useTodaysPriorities();

  const activeCount = priorities.filter((priority) => priority.count > 0).length;

  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#071329] text-white shadow-[0_24px_70px_-35px_rgba(37,99,235,.6)]">
      <div className="p-5 sm:p-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Today's Mission</h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              AlexOS is surfacing the few things most likely to matter today. Ranked from your live
              money, pipeline and business data.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs text-slate-300">
            <Zap className="h-3.5 w-3.5 text-violet-300" />
            {isLoading ? "Calculating" : `${activeCount} active priorities`}
          </div>
        </div>

        {isError ? (
          <p className="mt-7 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-slate-300">
            Priorities are unavailable right now. Refresh to retry.
          </p>
        ) : (
          <div className="mt-7 grid gap-3 lg:grid-cols-3">
            {isLoading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-[140px] rounded-2xl bg-white/[0.06]" />
                ))
              : priorities.map((task, index) => (
                  <Link
                    key={task.id}
                    to={task.to}
                    className="rounded-2xl border border-white/10 bg-white/[0.045] p-4 backdrop-blur-sm transition-colors hover:bg-white/[0.07]"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                          task.count > 0 ? TONES[task.tone] : "bg-emerald-400/10 text-emerald-300"
                        }`}
                      >
                        {task.count > 0 ? (
                          <Clock3 className="h-5 w-5" />
                        ) : (
                          <CheckCircle2 className="h-5 w-5" />
                        )}
                      </div>

                      <span className="text-3xl font-bold tracking-tight">{task.count}</span>
                    </div>

                    <p className="mt-5 text-sm font-semibold">
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
