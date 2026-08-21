import { cn } from "@/lib/utils";

type DailyGearBrandProps = {
  className?: string;
  compact?: boolean;
  tone?: "default" | "sidebar";
};

export function DailyGearBrand({
  className,
  compact = false,
  tone = "default",
}: DailyGearBrandProps) {
  return (
    <div
      className={cn(
        "min-w-0 leading-none",
        compact ? "max-w-full" : "flex flex-col items-center",
        className,
      )}
      aria-label="DailyGear — Sell more. Grow daily."
    >
      <span
        className={cn(
          "block whitespace-nowrap font-black tracking-[-0.08em]",
          tone === "sidebar" ? "text-sidebar-foreground" : "text-foreground",
          compact ? "text-[1.2rem]" : "text-[1.35rem] italic",
        )}
      >
        Daily<span className="text-red-500">Gear</span>
      </span>
      <span
        className={cn(
          "block whitespace-nowrap font-semibold uppercase tracking-[0.2em]",
          tone === "sidebar" ? "text-sidebar-foreground/60" : "text-muted-foreground",
          compact ? "mt-1 text-[8px]" : "mt-1 text-[9px]",
        )}
      >
        Sell more. Grow daily.
      </span>
    </div>
  );
}
