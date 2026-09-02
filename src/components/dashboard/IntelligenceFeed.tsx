import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUpRight, Radar, ShieldCheck, TriangleAlert } from "lucide-react";
import { useAurenDailyBriefing } from "@/lib/auren/daily-briefing.api";
import type { DailyBriefingItem } from "@/lib/auren/daily-briefing";

function Shell({ children, badge }: { children: ReactNode; badge: ReactNode }) {
  return (
    <Card className="h-full overflow-hidden rounded-[1.8rem] border-[var(--alexos-purple)]/20 bg-gradient-to-br from-[#0a1530] via-[#101a38] to-[#171333] text-white shadow-[0_22px_60px_-35px_rgba(124,58,237,.7)]">
      <CardHeader className="relative flex flex-row items-center justify-between gap-3 border-b border-white/10 pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-violet-300/15 bg-violet-400/10 text-violet-200">
            <Radar className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-base text-white">Auren Daily Briefing</CardTitle>
            <p className="mt-0.5 text-xs text-slate-400">
              Owner-scoped CRM priorities and pipeline signals
            </p>
          </div>
        </div>
        {badge}
      </CardHeader>
      <CardContent className="relative space-y-2 p-4 sm:p-5">{children}</CardContent>
    </Card>
  );
}

function BriefingItem({ item }: { item: DailyBriefingItem }) {
  return (
    <div className="flex gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.035] p-3.5">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-400/10 text-violet-200">
        <ArrowUpRight className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
            {item.type}
          </span>
          <span className="rounded-full border border-violet-300/20 bg-violet-400/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-violet-200">
            {item.priority}
          </span>
        </div>
        <p className="mt-1.5 text-sm font-semibold">{item.title}</p>
        <p className="mt-1 text-xs leading-5 text-slate-400">{item.detail}</p>
      </div>
    </div>
  );
}

export default function IntelligenceFeed() {
  const { data, isLoading, isError } = useAurenDailyBriefing();
  const briefing = data?.briefing;

  if (isLoading) {
    return (
      <Shell
        badge={
          <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] uppercase tracking-wider text-slate-300">
            Loading
          </span>
        }
      >
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-[74px] rounded-2xl bg-white/[0.06]" />
        ))}
      </Shell>
    );
  }

  if (isError || !data || !briefing) {
    return (
      <Shell
        badge={
          <span className="rounded-full border border-rose-300/20 bg-rose-400/10 px-2.5 py-1 text-[10px] uppercase tracking-wider text-rose-200">
            Unavailable
          </span>
        }
      >
        <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <TriangleAlert className="mt-0.5 h-4 w-4 text-rose-300" />
          <div>
            <p className="text-sm font-semibold">Daily briefing unavailable</p>
            <p className="mt-1 text-xs text-slate-400">
              Your data is safe. Refresh to retry the owner-scoped analysis.
            </p>
          </div>
        </div>
      </Shell>
    );
  }

  if (briefing.status === "no_data") {
    return (
      <Shell
        badge={
          <span className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-2.5 py-1 text-[10px] uppercase tracking-wider text-emerald-200">
            Waiting for data
          </span>
        }
      >
        <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <ShieldCheck className="mt-0.5 h-4 w-4 text-emerald-300" />
          <div>
            <p className="text-sm font-semibold">No CRM priorities yet</p>
            <p className="mt-1 text-xs leading-5 text-slate-400">
              Record a lead, task, or activity and Auren will build the next briefing.
            </p>
          </div>
        </div>
      </Shell>
    );
  }

  const alertItems: DailyBriefingItem[] = [
    ...briefing.pipelineAlerts.closingSoon.slice(0, 2).map((alert) => ({
      type: "lead" as const,
      id: alert.id,
      title: alert.title,
      detail: alert.reason,
      priority:
        alert.expectedCloseDate === new Date().toISOString().slice(0, 10)
          ? ("urgent" as const)
          : ("medium" as const),
      leadId: alert.id,
    })),
    ...briefing.pipelineAlerts.stale.slice(0, 2).map((alert) => ({
      type: "lead" as const,
      id: `stale-${alert.id}`,
      title: alert.title,
      detail: alert.reason,
      priority: "medium" as const,
      leadId: alert.id,
    })),
  ];
  const items = [briefing.topPriority, ...alertItems]
    .filter(
      (item, index, all): item is DailyBriefingItem =>
        Boolean(item) && all.findIndex((candidate) => candidate?.id === item?.id) === index,
    )
    .slice(0, 3);

  return (
    <Shell
      badge={
        <span className="rounded-full border border-violet-300/15 bg-violet-400/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-violet-200">
          {briefing.metrics.meetingsToday} meetings · {briefing.metrics.actionItems} actions
        </span>
      }
    >
      {items.map((item) => (
        <BriefingItem key={item.id} item={item} />
      ))}
      <p className="pt-2 text-[10px] text-slate-500">
        Observed {new Date(data.evidence.observedAt).toLocaleString()} · {data.evidence.confidence}{" "}
        confidence · read-only
      </p>
    </Shell>
  );
}
