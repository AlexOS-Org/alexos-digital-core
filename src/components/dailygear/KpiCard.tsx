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

export function KpiCard({
  label,
  value,
  icon: Icon,
  changePct,
  hint,
  loading,
  tone = "default",
}: KpiCardProps) {
  const toneClass =
    tone === "positive"
      ? "bg-success/10 text-success"
      : tone === "warning"
        ? "bg-destructive/10 text-destructive"
        : "bg-primary/10 text-primary";

  return (
    <Card className="rounded-2xl border-border/70 shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {label}
            </p>
            {loading ? (
              <Skeleton className="mt-2 h-7 w-24" />
            ) : (
              <p className="mt-1.5 text-2xl font-semibold tracking-tight truncate">{value}</p>
            )}
            {hint && !loading && (
              <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
            )}
          </div>
          <div className={cn("rounded-xl p-2.5", toneClass)}>
            <Icon className="h-5 w-5" />
          </div>
        </div>

        {typeof changePct === "number" && !loading && (
          <div
            className={cn(
              "mt-3 inline-flex items-center gap-1 text-xs font-medium",
              changePct >= 0 ? "text-success" : "text-destructive",
            )}
          >
            {changePct >= 0 ? (
              <TrendingUp className="h-3.5 w-3.5" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5" />
            )}
            {Math.abs(changePct).toFixed(1)}% vs previous period
          </div>
        )}
      </CardContent>
    </Card>
  );
}
