import type { LucideIcon } from "lucide-react";
import { TrendingDown, TrendingUp } from "lucide-react";
import type { ReactNode } from "react";

import { alexosAmountTone, type AlexOSTone } from "@/lib/ui/status";
import { cn } from "@/lib/utils";

/**
 * The AlexOS metric card.
 *
 * The audit found eight separate KPI implementations (DailyGear KpiCard,
 * Money Center inline cards, Dashboard KpiStrip, CRM StatCard, PipelineStat,
 * HeroMetric, MiniStat, dashboard tone panels) that disagreed on radius,
 * padding, label casing and number treatment. This replaces them.
 *
 * Hierarchy is deliberate: eyebrow label, then the value, then supporting
 * meta. The value uses tabular figures so a column of cards does not shift as
 * numbers refresh.
 */
export function AlexOSMetricCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "neutral",
  trend,
  footer,
  emphasis = false,
  className,
  children,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: LucideIcon;
  tone?: AlexOSTone;
  /** Signed change. Direction is expressed by the icon, not by colour alone. */
  trend?: { value: number; label?: string } | null;
  footer?: ReactNode;
  /** Opt into the larger display size. Reserve for the single most important
   * figure on a screen — everything else stays compact. */
  emphasis?: boolean;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <article data-tone={tone} className={cn("alexos-metric", className)}>
      <div className="alexos-metric-body flex h-full flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="alexos-metric-label">{label}</p>
            {hint ? <p className="alexos-metric-meta mt-1">{hint}</p> : null}
          </div>
          {Icon ? (
            <span className="alexos-tone-bg alexos-tone-border alexos-tone-text grid size-9 shrink-0 place-items-center rounded-lg border">
              <Icon aria-hidden="true" className="size-4" />
            </span>
          ) : null}
        </div>

        <p
          className={cn("alexos-amount alexos-metric-value", emphasis && "alexos-metric-value-lg")}
        >
          {value}
        </p>

        {trend ? <AlexOSMetricTrend {...trend} /> : null}
        {children}
        {footer ? <div className="alexos-metric-meta mt-auto pt-1">{footer}</div> : null}
      </div>
    </article>
  );
}

export function AlexOSMetricTrend({
  value,
  label,
  invert = false,
  className,
}: {
  value: number;
  label?: string;
  /** For metrics where a rise is bad (debt, overdue count, churn). */
  invert?: boolean;
  className?: string;
}) {
  const flat = value === 0;
  const rising = value > 0;
  const good = invert ? !rising : rising;
  const tone: AlexOSTone = flat ? "neutral" : good ? "income" : "expense";
  const Icon = rising ? TrendingUp : TrendingDown;
  const sign = rising ? "+" : "";

  return (
    <p data-tone={tone} className={cn("flex items-center gap-1.5 text-sm font-medium", className)}>
      <Icon aria-hidden="true" className="alexos-tone-text size-3.5" />
      <span className="alexos-amount alexos-tone-text">
        {sign}
        {value.toLocaleString()}
        {Number.isInteger(value) ? "" : "%"}
      </span>
      {label ? <span className="text-muted-foreground">{label}</span> : null}
    </p>
  );
}

/** Money display with the correct sign tone and tabular figures. */
export function AlexOSAmount({
  amount,
  formatted,
  tone,
  showSign = false,
  className,
}: {
  amount?: number | null;
  /** Pre-formatted string when the caller uses a module-specific formatter. */
  formatted?: string;
  tone?: AlexOSTone;
  showSign?: boolean;
  className?: string;
}) {
  const resolved = tone ?? alexosAmountTone(amount);
  const text =
    formatted ??
    (amount == null || !Number.isFinite(amount)
      ? "—"
      : `${showSign && amount > 0 ? "+" : ""}${Math.abs(amount).toLocaleString()}`);
  const signed = showSign && amount != null && amount > 0;

  return (
    <span
      data-tone={resolved}
      className={cn("alexos-amount", signed && "alexos-tone-text", className)}
    >
      {text}
    </span>
  );
}
