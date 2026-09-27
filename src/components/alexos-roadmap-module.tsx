import type { LucideIcon } from "lucide-react";

interface AlexOSRoadmapModuleProps {
  title: string;
  description: string;
  icon: LucideIcon;
  statusLabel?: string;
}

/**
 * Premium empty state for modules that are part of the AlexOS roadmap
 * but not yet fully built. Uses language consistent with the AlexOS brand.
 */
export function AlexOSRoadmapModule({
  title,
  description,
  icon: Icon,
  statusLabel = "Roadmap module",
}: AlexOSRoadmapModuleProps) {
  return (
    <div className="alexos-module-shell mx-auto max-w-3xl space-y-8 rounded-[2rem] p-1 sm:p-2 animate-in fade-in duration-500">
      <div className="dashboard-feature-surface relative overflow-hidden rounded-xl p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-14 -top-14 h-36 w-36 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative flex items-start gap-5">
          <div className="grid size-14 shrink-0 place-items-center rounded-xl border border-primary/15 bg-primary/10 text-primary">
            <Icon aria-hidden="true" className="size-7" />
          </div>
          <div>
            <p className="alexos-eyebrow mb-1">{statusLabel}</p>
            <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
            <p className="mt-2 max-w-xl leading-7 text-muted-foreground">{description}</p>
          </div>
        </div>
      </div>

      <div className="dashboard-surface alexos-module-card space-y-5 rounded-xl p-5 sm:p-8">
        <div className="alexos-badge alexos-badge-outline">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          Not connected to live data yet
        </div>
        <p className="max-w-lg text-sm leading-7 text-muted-foreground">
          This module is on the AlexOS roadmap. When implemented, it will use your workspace data
          and surface signals you can act on — without inventing readiness before the data path
          exists.
        </p>
        <div className="grid gap-3 pt-1 sm:grid-cols-3">
          {[
            { label: "Integration", detail: "Not connected" },
            { label: "Intelligence", detail: "No signals yet" },
            { label: "Status", detail: statusLabel },
          ].map((item) => (
            <div
              key={item.label}
              className="alexos-data-metric alexos-module-card rounded-xl px-4 py-3"
            >
              <div className="relative z-[1]">
                <p className="alexos-eyebrow">{item.label}</p>
                <p className="mt-1 text-sm font-medium">{item.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
