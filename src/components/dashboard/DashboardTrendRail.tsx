import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { dashboardTrendRailMagnitudeClass } from "./DashboardTrendRail.utils";

type DashboardTrendRailProps = {
  change: number | null | undefined;
  tone?: "blue" | "green" | "purple" | "amber";
};

const toneClasses = {
  blue: "dashboard-tone-blue",
  green: "dashboard-tone-green",
  purple: "dashboard-tone-purple",
  amber: "dashboard-tone-amber",
} as const;

export function DashboardTrendRail({ change, tone = "blue" }: DashboardTrendRailProps) {
  if (change === null || change === undefined) {
    return (
      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-muted">
          <Minus className="h-2.5 w-2.5" aria-hidden="true" />
        </span>
        <span>No prior baseline</span>
      </div>
    );
  }

  const positive = change >= 0;
  const Icon = positive ? ArrowUpRight : ArrowDownRight;
  return (
    <div
      className={cn(
        "flex items-center gap-2 text-[10px] font-semibold",
        positive ? "text-success" : "text-destructive",
      )}
      aria-label={`${Math.abs(change).toFixed(1)} percent ${positive ? "increase" : "decrease"} versus last month`}
    >
      <span className="relative h-1.5 min-w-16 flex-1 overflow-hidden rounded-full bg-muted">
        <span
          className={cn(
            "absolute inset-y-0 left-0 rounded-full opacity-80",
            dashboardTrendRailMagnitudeClass(change),
            toneClasses[tone],
            "dashboard-tone-fill",
          )}
        />
      </span>
      <Icon className="h-3 w-3 shrink-0" aria-hidden="true" />
      <span className="whitespace-nowrap">{Math.abs(change).toFixed(1)}% vs last month</span>
    </div>
  );
}
