import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Radar, ShieldCheck, TriangleAlert } from "lucide-react";
import { useIntelligenceSignals } from "@/lib/intelligence/api";
import { CATEGORY_ACCENTS, PRIORITY_STYLES } from "@/lib/intelligence/constants";
import { relativeTime } from "@/lib/intelligence/calculations";

function Shell({ children, badge }: { children: React.ReactNode; badge: React.ReactNode }) {
  return (
    <Card className="h-full overflow-hidden rounded-[1.8rem] border-[var(--alexos-purple)]/20 bg-gradient-to-br from-[#0a1530] via-[#101a38] to-[#171333] text-white shadow-[0_22px_60px_-35px_rgba(124,58,237,.7)]">
      <CardHeader className="relative flex flex-row items-center justify-between gap-3 border-b border-white/10 pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-violet-300/15 bg-violet-400/10 text-violet-200"><Radar className="h-5 w-5" /></div>
          <div>
            <CardTitle className="text-base text-white">Intelligence Feed</CardTitle>
            <p className="mt-0.5 text-xs text-slate-400">Operational signals from your live data</p>
          </div>
        </div>
        {badge}
      </CardHeader>
      <CardContent className="relative space-y-2 p-4 sm:p-5">{children}</CardContent>
    </Card>
  );
}

export default function IntelligenceFeed() {
  const { data: signals, isLoading, isError, isEmpty } = useIntelligenceSignals();

  if (isLoading) {
    return (
      <Shell badge={<span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] uppercase tracking-wider text-slate-300">Analysing</span>}>
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[74px] rounded-2xl bg-white/[0.06]" />)}
      </Shell>
    );
  }

  if (isError) {
    return (
      <Shell badge={<span className="rounded-full border border-rose-300/20 bg-rose-400/10 px-2.5 py-1 text-[10px] uppercase tracking-wider text-rose-200">Unavailable</span>}>
        <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <TriangleAlert className="mt-0.5 h-4 w-4 text-rose-300" />
          <div><p className="text-sm font-semibold">Signals could not be generated</p><p className="mt-1 text-xs text-slate-400">Your data is safe. Refresh to retry the analysis.</p></div>
        </div>
      </Shell>
    );
  }

  if (isEmpty) {
    return (
      <Shell badge={<span className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-2.5 py-1 text-[10px] uppercase tracking-wider text-emerald-200">All clear</span>}>
        <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <ShieldCheck className="mt-0.5 h-4 w-4 text-emerald-300" />
          <div>
            <p className="text-sm font-semibold">No signals right now</p>
            <p className="mt-1 text-xs leading-5 text-slate-400">Record transactions, bills or leads and signals will appear here automatically.</p>
          </div>
        </div>
      </Shell>
    );
  }

  return (
    <Shell badge={<span className="rounded-full border border-violet-300/15 bg-violet-400/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-violet-200">{signals.length} signals</span>}>
      {signals.map((signal) => {
        const Icon = signal.icon;
        return (
          <div key={signal.id} className="group flex gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.035] p-3.5 transition-all hover:border-violet-300/20 hover:bg-white/[0.07]">
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${CATEGORY_ACCENTS[signal.category]}`}><Icon className="h-4 w-4" /></div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">{signal.categoryLabel}</span>
                <span className={`rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${PRIORITY_STYLES[signal.priority]}`}>{signal.priority}</span>
                <span className="ml-auto text-[10px] text-slate-500">{relativeTime(signal.timestamp)}</span>
              </div>
              <p className="mt-1.5 text-sm font-semibold">{signal.title}</p>
              <p className="mt-1 text-xs leading-5 text-slate-400">{signal.description}</p>
              <p className="mt-1.5 text-xs leading-5 text-violet-200/80"><span className="font-semibold">Recommendation:</span> {signal.recommendation}</p>
              {signal.action && (
                <Link to={signal.action.to} className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-slate-200 transition-colors hover:text-white">
                  {signal.action.label}<ArrowUpRight className="h-3 w-3" />
                </Link>
              )}
            </div>
          </div>
        );
      })}
    </Shell>
  );
}
