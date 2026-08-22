import { Moon, Palette, Sun, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "./ThemeProvider";
import { getVisualTheme, VISUAL_THEMES, type VisualThemeId } from "./visual-themes";
export function VisualThemePicker() {
  const {
    theme,
    setTheme,
    resolvedTheme,
    visualTheme,
    setVisualTheme,
    customAccent,
    setCustomAccent,
  } = useTheme();
  const selected = getVisualTheme(visualTheme);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="tap-target rounded-xl text-muted-foreground hover:bg-accent/70 hover:text-foreground"
          aria-label={`Visual theme: ${selected.label}`}
          title={`Visual theme: ${selected.label}`}
        >
          <Palette className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72 rounded-2xl p-2">
        <DropdownMenuLabel className="px-2 py-1.5 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
          Visual theme presets
        </DropdownMenuLabel>
        <p className="px-2 pb-2 text-[11px] leading-4 text-muted-foreground">
          Preview a palette and apply it across AlexOS, DailyGear, Money Center, and Auren.
        </p>
        <DropdownMenuRadioGroup
          value={visualTheme}
          onValueChange={(value) => setVisualTheme(value as VisualThemeId)}
        >
          {Object.values(VISUAL_THEMES).map((option) => (
            <DropdownMenuRadioItem key={option.id} value={option.id} className="rounded-xl py-2.5">
              <span
                aria-hidden="true"
                className="h-8 w-8 shrink-0 rounded-lg border border-white/20 shadow-inner"
                style={{
                  background: `linear-gradient(135deg, ${option.preview.start}, ${option.preview.end})`,
                  boxShadow: `inset 0 -3px 0 ${option.preview.accent}`,
                }}
              />
              <span className="min-w-0">
                <span className="block text-sm font-medium">{option.label}</span>
                <span className="block truncate text-[11px] text-muted-foreground">
                  {option.description}
                </span>
              </span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="px-2 py-1.5 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
          Custom accent
        </DropdownMenuLabel>
        <div className="flex items-center gap-3 rounded-xl px-2 py-2">
          <input
            type="color"
            value={customAccent}
            onChange={(event) => setCustomAccent(event.target.value)}
            aria-label="Choose custom accent colour"
            className="h-9 w-12 cursor-pointer rounded-lg border border-border bg-transparent p-0.5"
          />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium">Accent colour</p>
            <p className="text-[11px] text-muted-foreground">Used when Custom accent is selected</p>
          </div>
          <span
            aria-hidden="true"
            className="h-5 w-5 rounded-full border border-border"
            style={{ backgroundColor: customAccent }}
          />
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="px-2 py-1.5 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
          Appearance
        </DropdownMenuLabel>
        <div className="grid grid-cols-3 gap-1 rounded-xl bg-muted/60 p-1">
          {(
            [
              ["system", "System", Monitor],
              ["light", "Light", Sun],
              ["dark", "Dark", Moon],
            ] as const
          ).map(([value, label, Icon]) => (
            <button
              key={value}
              type="button"
              onClick={() => setTheme(value)}
              className={`flex min-h-10 flex-col items-center justify-center gap-1 rounded-lg px-2 text-[10px] font-medium ${theme === value ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              aria-pressed={theme === value}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>
        <p className="px-2 pb-1 pt-2 text-[10px] leading-4 text-muted-foreground">
          Current mode: {resolvedTheme}. Preferences are saved on this device.
        </p>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
