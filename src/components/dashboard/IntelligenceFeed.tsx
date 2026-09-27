import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUpRight, Radar, ShieldCheck, TriangleAlert } from "lucide-react";
import { useAurenDailyBriefing } from "@/lib/auren/daily-briefing.api";
import type { DailyBriefingItem } from "@/lib/auren/daily-briefing";

function Shell({ children, badge }: { children: ReactNode; badge: ReactNode }) {
  return (
    <Card className="dashboard-intelligence-shell h-full overflow-hidden">
      <CardHeader className="relative flex flex-row items-center justify-between gap-3 border-b border-[color-mix(in_oklch,var(--dashboard-intelligence-foreground)_12%,transparent)] pb-5">
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-lg dashboard-tone-purple dashboard-tone-icon border">
            <Radar aria-hidden="true" className="size-5" />
          </div>
          <div>
            <CardTitle className="text-base text-[var(--dashboard-intelligence-foreground)]">
              Auren Daily Briefing
            </CardTitle>
            <p className="mt-0.5 text-xs dashboard-intelligence-muted">
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
    <div className="flex gap-3 rounded-xl dashboard-intelligence-item border p-3.5">
      <div className="grid size-9 shrink-0 place-items-center rounded-lg dashboard-tone-purple dashboard-tone-icon">
        <ArrowUpRight aria-hidden="true" className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="alexos-eyebrow dashboard-intelligence-muted">{item.type}</span>
          <span className="alexos-badge dashboard-intelligence-badge">{item.priority}</span>
        </div>
        <p className="mt-1.5 text-sm font-semibold">{item.title}</p>
        <p className="mt-1 text-xs leading-5 dashboard-intelligence-muted">{item.detail}</p>
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
          <span className="alexos-badge dashboard-intelligence-badge dashboard-intelligence-muted">
            Loading
          </span>
        }
      >
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-[74px] rounded-xl dashboard-intelligence-item" />
        ))}
      </Shell>
    );
  }

  if (isError || !data || !briefing) {
    return (
      <Shell badge={<span className="alexos-badge dashboard-intelligence-badge">Unavailable</span>}>
        <div className="dashboard-intelligence-item flex items-start gap-3 rounded-xl border p-4">
          <TriangleAlert
            aria-hidden="true"
            className="dashboard-tone-danger dashboard-tone-text mt-0.5 size-4"
          />
          <div>
            <p className="text-sm font-semibold">Daily briefing unavailable</p>
            <p className="mt-1 text-xs dashboard-intelligence-muted">
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
        badge={<span className="alexos-badge dashboard-intelligence-badge">Waiting for data</span>}
      >
        <div className="dashboard-intelligence-item flex items-start gap-3 rounded-xl border p-4">
          <ShieldCheck
            aria-hidden="true"
            className="dashboard-tone-green dashboard-tone-text mt-0.5 size-4"
          />
          <div>
            <p className="text-sm font-semibold">No CRM priorities yet</p>
            <p className="mt-1 text-xs leading-5 dashboard-intelligence-muted">
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
        <span className="alexos-badge dashboard-intelligence-badge">
          {briefing.metrics.meetingsToday} meetings · {briefing.metrics.actionItems} actions
        </span>
      }
    >
      {items.map((item) => (
        <BriefingItem key={item.id} item={item} />
      ))}
      <p className="pt-2 text-[10px] dashboard-intelligence-muted">
        Observed {new Date(data.evidence.observedAt).toLocaleString()} · {data.evidence.confidence}{" "}
        confidence · read-only
      </p>
    </Shell>
  );
}
