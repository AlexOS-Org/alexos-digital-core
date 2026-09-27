import type { ReactNode } from "react";

import { alexosStatusLabel, alexosStatusTone, type AlexOSTone } from "@/lib/ui/status";
import { cn } from "@/lib/utils";

/**
 * The one status badge for AlexOS.
 *
 * Takes the raw status string from any module and renders it with the shared
 * semantic tone, label and geometry. Screens no longer hand-write
 * `border-emerald-500/30 text-emerald-700` — those treatments did not survive
 * theme changes and drifted apart page by page.
 */
export function AlexOSStatusBadge({
  status,
  tone,
  label,
  size = "sm",
  variant = "tint",
  showDot = false,
  className,
  children,
}: {
  status?: string | null;
  /** Override the resolved tone when a status means something else in context. */
  tone?: AlexOSTone;
  label?: string;
  size?: "sm" | "md";
  variant?: "tint" | "solid" | "outline";
  showDot?: boolean;
  className?: string;
  children?: ReactNode;
}) {
  const resolvedTone = tone ?? alexosStatusTone(status);
  const resolvedLabel = label ?? (children ? null : alexosStatusLabel(status));

  return (
    <span
      data-tone={resolvedTone}
      className={cn(
        "alexos-badge",
        size === "md" && "alexos-badge-lg",
        variant === "solid" && "alexos-badge-solid",
        variant === "outline" && "alexos-badge-outline",
        className,
      )}
    >
      {showDot ? <span aria-hidden="true" className="alexos-badge-dot" /> : null}
      {children ?? resolvedLabel}
    </span>
  );
}

/** Inline tone swatch for dense lists where a full badge would be too heavy. */
export function AlexOSStatusDot({ status, tone }: { status?: string | null; tone?: AlexOSTone }) {
  return (
    <span
      data-tone={tone ?? alexosStatusTone(status)}
      className="alexos-badge-dot"
      style={{ width: "0.5rem", height: "0.5rem" }}
    />
  );
}
