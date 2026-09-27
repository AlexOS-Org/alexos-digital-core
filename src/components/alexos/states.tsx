import type { LucideIcon } from "lucide-react";
import { AlertTriangle, Inbox, Loader2, PlugZap, RotateCcw, SearchX } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { AlexOSTone } from "@/lib/ui/status";
import { cn } from "@/lib/utils";

/**
 * Shared state surfaces.
 *
 * The audit found twelve hand-written empty states across Money Center alone,
 * with four different radii and a dozen different strings — several of them
 * "No data found", which tells an operator nothing about what to do next.
 * These components standardise the geometry and the tone, and every copy site
 * is expected to explain what is missing and what action resolves it.
 */
export function AlexOSState({
  icon: Icon,
  title,
  description,
  action,
  tone = "neutral",
  compact = false,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  tone?: AlexOSTone;
  compact?: boolean;
  className?: string;
}) {
  return (
    <div
      data-tone={tone}
      className={cn("alexos-state", compact && "alexos-state-compact", className)}
    >
      {Icon ? (
        <span className="alexos-state-icon">
          <Icon aria-hidden="true" className="size-5" />
        </span>
      ) : null}
      <p className="alexos-state-title">{title}</p>
      {description ? <p className="alexos-state-description">{description}</p> : null}
      {action ? <div className="mt-1.5 flex flex-wrap justify-center gap-2">{action}</div> : null}
    </div>
  );
}

export function AlexOSEmptyState(props: {
  title: string;
  description?: ReactNode;
  icon?: LucideIcon;
  action?: ReactNode;
  /** Distinguishes "you have nothing" from "your filters hid everything". */
  variant?: "no-records" | "no-results" | "not-configured";
  compact?: boolean;
  className?: string;
}) {
  const { variant = "no-records", ...rest } = props;
  if (variant === "no-results") {
    return <AlexOSState icon={SearchX} tone="info" {...rest} />;
  }
  if (variant === "not-configured") {
    return <AlexOSState icon={PlugZap} tone="warning" {...rest} />;
  }
  return <AlexOSState icon={Inbox} {...rest} />;
}

export function AlexOSErrorState({
  title = "Something went wrong",
  description,
  onRetry,
  className,
}: {
  title?: string;
  description?: ReactNode;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <AlexOSState
      className={className}
      icon={AlertTriangle}
      tone="danger"
      title={title}
      description={description ?? "Your data is safe. Retry to load this panel again."}
      action={
        onRetry ? (
          <Button type="button" size="sm" variant="outline" onClick={onRetry}>
            <RotateCcw aria-hidden="true" />
            Retry
          </Button>
        ) : null
      }
    />
  );
}

export function AlexOSNotConfiguredState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <AlexOSState
      className={className}
      icon={PlugZap}
      tone="warning"
      title={title}
      description={description}
      action={action}
    />
  );
}

/**
 * Loading placeholder. Prefer describing the shape of the incoming content
 * over a spinner — a table that will hold twelve rows should reserve twelve
 * rows, not spin.
 */
export function AlexOSLoadingState({
  label = "Loading",
  rows = 3,
  height = "h-12",
  className,
}: {
  label?: string;
  rows?: number;
  height?: string;
  className?: string;
}) {
  return (
    <div role="status" aria-live="polite" className={cn("space-y-2", className)}>
      <span className="sr-only">{label}</span>
      <span aria-hidden="true" className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-3.5 animate-spin" />
        {label}…
      </span>
      <div aria-hidden="true" className="space-y-2">
        {Array.from({ length: rows }, (_, index) => (
          <Skeleton key={index} className={cn("w-full rounded-lg", height)} />
        ))}
      </div>
    </div>
  );
}
