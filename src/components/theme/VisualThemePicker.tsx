import { Download, Monitor, Moon, Palette, Sun } from "lucide-react";
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

const DISPLAY_MODES = [
  { value: "system", label: "System", description: "Follow your device setting", Icon: Monitor },
  { value: "light", label: "Light", description: "Use the light workspace", Icon: Sun },
  { value: "dark", label: "Dark", description: "Use the dark workspace", Icon: Moon },
] as const;

export function VisualThemePicker() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  const exportPreset = () => {
    const preset = {
      schema: "alexos.dashboard-preset",
      version: 1,
      exportedAt: new Date().toISOString(),
      theme: {
        mode: theme,
        resolvedMode: resolvedTheme,
        visualTheme: "alexos-premium",
      },
      safety: { includesBusinessData: false, includesSecrets: false },
    };
    const blob = new Blob([JSON.stringify(preset, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `alexos-dashboard-preset-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="tap-target rounded-xl text-muted-foreground hover:bg-accent/70 hover:text-foreground"
          aria-label="Display mode"
          title="Display mode"
        >
          {resolvedTheme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 rounded-2xl p-2">
        <DropdownMenuLabel className="flex items-center gap-2 px-2 py-1.5 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
          <Palette className="h-3.5 w-3.5" />
          Display mode
        </DropdownMenuLabel>
        <p className="px-2 pb-2 text-[11px] leading-4 text-muted-foreground">
          AlexOS Premium stays consistent while you choose how the workspace is displayed.
        </p>
        <DropdownMenuRadioGroup
          value={theme}
          onValueChange={(value) => setTheme(value as typeof theme)}
        >
          {DISPLAY_MODES.map(({ value, label, description, Icon }) => (
            <DropdownMenuRadioItem key={value} value={value} className="rounded-xl py-2">
              <Icon className="h-4 w-4 shrink-0" />
              <span className="min-w-0">
                <span className="block text-xs font-medium">{label}</span>
                <span className="block truncate text-[10px] text-muted-foreground">
                  {description}
                </span>
              </span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <button
          type="button"
          onClick={exportPreset}
          className="flex min-h-10 w-full items-center gap-2 rounded-xl px-2 text-left text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <Download className="h-3.5 w-3.5" />
          Export dashboard preset
        </button>
        <p className="px-2 pb-1 pt-2 text-[10px] leading-4 text-muted-foreground">
          Active: {theme === "system" ? `System (${resolvedTheme})` : labelFor(theme)}
        </p>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function labelFor(value: "system" | "light" | "dark") {
  return DISPLAY_MODES.find((mode) => mode.value === value)?.label ?? value;
}
