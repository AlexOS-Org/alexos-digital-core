import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { TrendingDown, TrendingUp, type LucideIcon } from "lucide-react";

interface KpiCardProps {
  label: string;
  value: ReactNode;
  icon: LucideIcon;
  changePct?: number;
  hint?: string;
  loading?: boolean;
  tone?: "default" | "positive" | "warning";
}

const toneStyles = {
  default: {
    icon: "bg-alexos-blue/12 text-alexos-blue",
    glow: "bg-alexos-blue/12",
    bar: "from-alexos-blue via-cyan-400 to-transparent",
  },
  positive: {
    icon: "bg-success/12 text-success",
    glow: "bg-success/12",
    bar: "from-success via-emerald-300 to-transparent",
  },
  warning: {
    icon: "bg-alexos-coral/14 text-alexos-coral",
    glow: "bg-alexos-coral/12",
    bar: "from-alexos-coral via-alexos-amber to-transparent",
  },
} as const;

export function KpiCard({
  label,
  value,
  icon: Icon,
  changePct,
  hint,
  loading,
  tone = "default",
}: KpiCardProps) {
  const styles = toneStyles[tone];

  return (
    <Card
      data-tone={tone === "positive" ? "green" : tone === "warning" ? "danger" : "blue"}
      className="dashboard-kpi-card group relative overflow-hidden rounded-[1.35rem] backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-[0_20px_42px_-25px_var(--alexos-glow)]"
    >
      <div
        className={cn(
          "absolute inset-x-0 top-0 h-px bg-gradient-to-r opacity-90 transition-opacity group-hover:opacity-100",
          styles.bar,
        )}
      />
      <div
        className={cn(
          "pointer-events-none absolute -right-8 -top-10 h-24 w-24 rounded-full blur-2xl transition-transform duration-500 group-hover:scale-125",
          styles.glow,
        )}
      />
      <CardContent className="relative p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-primary/70" aria-hidden="true" />
              {label}
            </p>
            {loading ? (
              <Skeleton className="mt-3 h-8 w-28" />
            ) : (
              <p className="mt-2 truncate text-[1.65rem] font-bold tracking-tight tabular-nums sm:text-3xl">
                {value}
              </p>
            )}
            {hint && !loading && (
              <p className="mt-1.5 truncate text-xs text-muted-foreground">{hint}</p>
            )}
          </div>
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset ring-white/10 transition-transform duration-300 group-hover:scale-105",
              styles.icon,
            )}
          >
            <Icon className="h-[18px] w-[18px]" />
          </div>
        </div>

        {typeof changePct === "number" && !loading && (
          <div
            className={cn(
              "mt-4 inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold",
              changePct >= 0 ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive",
            )}
          >
            {changePct >= 0 ? (
              <TrendingUp className="h-3.5 w-3.5" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5" />
            )}
            {Math.abs(changePct).toFixed(1)}%
            <span className="font-normal opacity-75">vs previous period</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
