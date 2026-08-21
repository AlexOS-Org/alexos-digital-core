import type { LucideIcon } from "lucide-react";

interface AlexOSEmptyStateProps {
  title: string;
  description: string;
  icon: LucideIcon;
  statusLabel?: string;
}

/**
 * Premium empty state for modules that are part of the AlexOS roadmap
 * but not yet fully built. Uses language consistent with the AlexOS brand.
 */
export function AlexOSEmptyState({
  title,
  description,
  icon: Icon,
  statusLabel = "Module foundation ready",
}: AlexOSEmptyStateProps) {
  return (
    <div className="alexos-mesh mx-auto max-w-3xl space-y-10 rounded-[2rem] p-5 py-8 shadow-[0_24px_80px_-48px_var(--alexos-glow)] animate-in fade-in duration-500 sm:p-8 sm:py-12">
      <div className="flex items-start gap-5">
        <div className="alexos-visual-strip h-14 w-14 shrink-0 rounded-2xl p-[1px] text-primary-foreground shadow-lg shadow-primary/15">
          <div className="flex h-full w-full items-center justify-center rounded-[calc(1rem-1px)] bg-card/90 text-primary">
            <Icon className="h-7 w-7" />
          </div>
        </div>
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-2 max-w-xl text-muted-foreground leading-7">{description}</p>
        </div>
      </div>

      <div className="rounded-3xl border border-primary/15 bg-card/75 p-5 shadow-xl shadow-primary/5 backdrop-blur-sm space-y-5 sm:p-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/[0.08] px-3 py-1.5 text-xs font-semibold text-primary">
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          {statusLabel}
        </div>
        <p className="text-sm leading-7 text-muted-foreground max-w-lg">
          This module is part of the AlexOS roadmap. When activated, it will integrate with your
          workspace data and surface actionable intelligence across all your operations.
        </p>
        <div className="grid gap-3 sm:grid-cols-3 pt-2">
          {[
            { label: "Integration", detail: "Connection pending" },
            { label: "Intelligence", detail: "Signals unavailable" },
            { label: "Status", detail: statusLabel },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-border/60 bg-muted/40 px-4 py-3"
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {item.label}
              </p>
              <p className="mt-1 text-sm font-medium">{item.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
