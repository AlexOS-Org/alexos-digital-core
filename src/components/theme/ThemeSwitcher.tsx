import { Check, Moon, Smartphone, Sun } from "lucide-react";
import { useTheme } from "@/components/theme/ThemeProvider";
import { cn } from "@/lib/utils";

const options = [
  { value: "system" as const, label: "System", icon: Smartphone },
  { value: "light" as const, label: "Light", icon: Sun },
  { value: "dark" as const, label: "Dark", icon: Moon },
];

export function ThemeSwitcher({ compact = false }: { compact?: boolean }) {
  const { theme } = useTheme();

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-2xl border border-border/70 bg-card/90 p-1 shadow-sm backdrop-blur-md",
        compact ? "gap-0.5" : "gap-1",
      )}
      aria-label="Appearance mode"
    >
      {options.map(({ value, label, icon: Icon }) => {
        const active = theme === value;
        return (
          <button
            key={value}
            type="button"
            aria-pressed={active}
            aria-label={`${label} appearance`}
            title={label}
            onClick={() => useTheme().setTheme(value)}
            className={cn(
              "inline-flex items-center justify-center gap-1.5 rounded-xl px-2.5 py-2 text-xs font-medium transition-all duration-200",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
              compact ? "min-w-9 px-2" : "min-w-16",
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {!compact && <span>{label}</span>}
            {active && <Check className="hidden h-3 w-3 sm:block" />}
          </button>
        );
      })}
    </div>
  );
}
