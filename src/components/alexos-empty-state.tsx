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
    <div className="max-w-2xl mx-auto py-16 space-y-10 animate-in fade-in duration-500">
      <div className="flex items-start gap-5">
        <div className="h-14 w-14 shrink-0 rounded-2xl bg-gradient-to-br from-primary/15 to-[var(--orion-purple)]/15 text-primary flex items-center justify-center ring-1 ring-primary/10">
          <Icon className="h-7 w-7" />
        </div>
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-2 max-w-xl text-muted-foreground leading-7">{description}</p>
        </div>
      </div>

      <div className="rounded-3xl border border-primary/15 bg-gradient-to-br from-primary/[0.04] via-background to-[var(--orion-purple)]/[0.04] p-8 space-y-5">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/[0.08] px-3 py-1.5 text-xs font-semibold text-primary">
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          {statusLabel}
        </div>
        <p className="text-sm leading-7 text-muted-foreground max-w-lg">
          This module is part of the AlexOS roadmap. When activated, it will integrate
          with your workspace data and surface actionable intelligence across all your
          operations.
        </p>
        <div className="grid gap-3 sm:grid-cols-3 pt-2">
          {[
            { label: "Integration", detail: "Connected to workspace" },
            { label: "Intelligence", detail: "Auren-powered signals" },
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
