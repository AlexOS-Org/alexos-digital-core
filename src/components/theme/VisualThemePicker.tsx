import { Download, Moon, Palette, Sun, Monitor } from "lucide-react";
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
import {
  DASHBOARD_SCENES,
  GREETING_TRIGGERS,
  type DashboardSceneId,
  type GreetingTriggerId,
} from "./visual-scenes";
export function VisualThemePicker() {
  const {
    theme,
    setTheme,
    resolvedTheme,
    visualTheme,
    customAccent,
    customSurface,
    customSidebar,
    dashboardScene,
    setDashboardScene,
    greetingTrigger,
    setGreetingTrigger,
  } = useTheme();

  const exportPreset = () => {
    const preset = {
      schema: "alexos.dashboard-preset",
      version: 1,
      exportedAt: new Date().toISOString(),
      theme: {
        mode: theme,
        resolvedMode: resolvedTheme,
        visualTheme,
        dashboardScene,
        greetingTrigger,
        customAccent,
        customSurface,
        customSidebar,
      },
      layout: {
        dashboard: [
          "greetings",
          "inspiration",
          "command-snapshot",
          "today-priorities",
          "auren",
          "cash-flow",
          "reading-the-numbers",
        ],
        sidebar: {
          defaultCollapsed: true,
          scrollable: true,
          groups: [
            "Home",
            "Businesses",
            "Money Center",
            "Auren",
            "Growth",
            "Library",
            "Missions",
            "System",
          ],
        },
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
          aria-label="Dashboard scene and appearance settings"
          title="Dashboard scene and appearance settings"
        >
          <Palette className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72 rounded-2xl p-2">
        <DropdownMenuLabel className="px-2 py-1.5 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
          Dashboard appearance
        </DropdownMenuLabel>
        <p className="px-2 pb-2 text-[11px] leading-4 text-muted-foreground">
          AlexOS uses one consistent premium workspace. Choose only the background scene and display
          mode.
        </p>
        <DropdownMenuLabel className="px-2 py-1.5 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
          Greeting background scene
        </DropdownMenuLabel>
        <p className="px-2 pb-2 text-[11px] leading-4 text-muted-foreground">
          Choose a scene or let AlexOS rotate it with the time of day.
        </p>
        <DropdownMenuRadioGroup
          value={dashboardScene}
          onValueChange={(value) => setDashboardScene(value as DashboardSceneId)}
        >
          {Object.values(DASHBOARD_SCENES).map((scene) => (
            <DropdownMenuRadioItem key={scene.id} value={scene.id} className="rounded-xl py-2">
              <span
                aria-hidden="true"
                className="h-7 w-7 shrink-0 rounded-lg border border-white/20 shadow-inner"
                style={{
                  background: `linear-gradient(135deg, ${scene.preview.start}, ${scene.preview.end})`,
                  boxShadow: `inset 0 -3px 0 ${scene.preview.accent}`,
                }}
              />
              <span className="min-w-0">
                <span className="block text-xs font-medium">{scene.label}</span>
                <span className="block truncate text-[10px] text-muted-foreground">
                  {scene.description}
                </span>
              </span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="px-2 py-1.5 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
          Automatic scene trigger
        </DropdownMenuLabel>
        <p className="px-2 pb-2 text-[11px] leading-4 text-muted-foreground">
          Weather and geolocation use permission-based browser signals; time is the safe fallback.
        </p>
        <DropdownMenuRadioGroup
          value={greetingTrigger}
          onValueChange={(value) => setGreetingTrigger(value as GreetingTriggerId)}
        >
          {Object.values(GREETING_TRIGGERS).map((trigger) => (
            <DropdownMenuRadioItem key={trigger.id} value={trigger.id} className="rounded-xl py-2">
              <span className="min-w-0">
                <span className="block text-xs font-medium">{trigger.label}</span>
                <span className="block truncate text-[10px] text-muted-foreground">
                  {trigger.description}
                </span>
              </span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
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
          Current mode: {resolvedTheme}. Preferences are saved on this device.
        </p>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
