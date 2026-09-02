import { Bell, Clock3, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { DashboardWeather } from "@/components/dashboard/DashboardWeather";
import { DailyInspirationCards } from "@/components/dashboard/DailyInspirationCards";
import { useLocalWeather } from "@/components/dashboard/greeting-context";
import { useTheme } from "@/components/theme/ThemeProvider";
import { getVisualTheme } from "@/components/theme/visual-themes";
import { getDashboardSceneLabel, getGreetingScene } from "@/components/theme/visual-scenes";
import { getDashboardSceneAsset } from "@/components/theme/dashboard-scene-assets";
import alexosCommandCenterWide from "@/assets/visuals/alexos-command-center-wide.webp";
import alexosCommandCenterMobile from "@/assets/visuals/alexos-command-center-mobile.webp";

type TimeFormat = "12h" | "24h";
const TIME_FORMAT_KEY = "alexos-dashboard-time-format";
function getTimeAtmosphere(hour: number) {
  if (hour >= 5 && hour < 11) return "morning";
  if (hour >= 11 && hour < 17) return "day";
  if (hour >= 17 && hour < 21) return "evening";
  return "night";
}
function getGreeting(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}
function formatTime(date: Date, timeFormat: TimeFormat) {
  return date.toLocaleTimeString("en-KE", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: timeFormat === "12h",
  });
}
export function DashboardHeader() {
  const [now, setNow] = useState(() => new Date());
  const [timeFormat, setTimeFormat] = useState<TimeFormat>(() => {
    if (typeof window === "undefined") return "24h";
    return window.localStorage.getItem(TIME_FORMAT_KEY) === "12h" ? "12h" : "24h";
  });
  const { visualTheme, dashboardScene, greetingTrigger } = useTheme();
  const selectedTheme = getVisualTheme(visualTheme);
  const localWeather = useLocalWeather();
  const activeAtmosphere = getTimeAtmosphere(now.getHours());
  const activeScene =
    dashboardScene === "auto"
      ? getGreetingScene(
          greetingTrigger,
          now.getHours(),
          selectedTheme.backdrop,
          localWeather.weather
            ? { weatherCode: localWeather.weather.weatherCode, night: localWeather.night }
            : null,
          localWeather.location,
        )
      : dashboardScene;
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);
  const greeting = getGreeting(now.getHours());
  const today = now.toLocaleDateString("en-KE", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const toggleTimeFormat = () => {
    const next: TimeFormat = timeFormat === "12h" ? "24h" : "12h";
    setTimeFormat(next);
    window.localStorage.setItem(TIME_FORMAT_KEY, next);
  };
  return (
    <div>
      <section
        data-atmosphere={activeAtmosphere}
        data-scene={activeScene}
        className="alexos-dashboard-hero relative min-h-[360px] overflow-hidden rounded-[2rem] border border-white/15 text-white shadow-[0_24px_70px_-30px_var(--alexos-glow)] transition-[background] duration-[1800ms] ease-in-out sm:min-h-[330px]"
      >
        {activeScene !== "none" ? (
          <picture className="alexos-dashboard-backdrop pointer-events-none absolute inset-0 block">
            <source
              media="(max-width: 640px)"
              srcSet={
                activeScene === "mountains"
                  ? alexosCommandCenterMobile
                  : getDashboardSceneAsset(activeScene)
              }
            />
            <img
              src={
                activeScene === "mountains"
                  ? alexosCommandCenterWide
                  : getDashboardSceneAsset(activeScene)
              }
              alt=""
              aria-hidden="true"
              fetchPriority="high"
              sizes="(max-width: 640px) 100vw, (max-width: 1280px) 90vw, 1200px"
              className="block h-full w-full max-w-none object-cover object-center opacity-85"
            />
          </picture>
        ) : null}
        <div className="alexos-dashboard-orb alexos-dashboard-orb-left pointer-events-none absolute -left-20 top-8 h-44 w-44 rounded-full blur-3xl" />
        <div className="alexos-dashboard-orb alexos-dashboard-orb-center pointer-events-none absolute left-[35%] -top-16 h-52 w-52 rounded-full blur-3xl" />
        <div className="alexos-dashboard-orb alexos-dashboard-orb-right pointer-events-none absolute -right-16 bottom-4 h-64 w-64 rounded-full blur-3xl" />
        <div className="alexos-dashboard-sun pointer-events-none absolute right-[12%] top-[13%] h-20 w-20 rounded-full opacity-90 blur-[1px] transition-all duration-[1800ms] sm:h-28 sm:w-28" />
        <div className="alexos-dashboard-horizon pointer-events-none absolute inset-x-0 bottom-0 h-1/2" />
        <div className="alexos-dashboard-radial pointer-events-none absolute inset-0" />
        <div className="alexos-dashboard-overlay pointer-events-none absolute inset-0" />
        <div className="relative flex min-h-[360px] flex-col justify-between p-5 sm:min-h-[330px] sm:p-8 lg:p-10">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/20 px-3 py-1.5 text-xs font-medium text-emerald-50 backdrop-blur-md">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_12px_rgba(110,231,183,0.9)]" />
                Auren active
              </span>
              <span className="rounded-full border border-white/15 bg-black/20 px-3 py-1.5 text-xs font-medium text-white/80 backdrop-blur-md">
                {selectedTheme.label}
              </span>
            </div>
            <Button
              size="icon"
              variant="ghost"
              className="shrink-0 border border-white/15 bg-black/20 text-white backdrop-blur-md hover:bg-white/10 hover:text-white"
              aria-label={`Switch to ${timeFormat === "12h" ? "24-hour" : "12-hour"} time`}
              title={`Use ${timeFormat === "12h" ? "24-hour" : "12-hour"} time`}
              onClick={toggleTimeFormat}
            >
              <Clock3 className="h-5 w-5" />
            </Button>
          </div>
          <div className="max-w-3xl pb-2 sm:pb-0">
            <p className="text-xs font-medium text-white/65 sm:text-sm">
              {today} · {formatTime(now, timeFormat)} · {getDashboardSceneLabel(activeScene)}
            </p>
            <h1 className="mt-2 text-[2rem] font-semibold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
              {greeting}, Alex.
            </h1>
            <p className="mt-3 max-w-2xl text-[15px] leading-6 text-white/90 sm:mt-4 sm:text-lg sm:leading-7">
              You know what matters. Now let’s move it forward.
            </p>
            <div className="mt-4">
              <DashboardWeather snapshot={localWeather} />
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              <Button asChild className="bg-white text-slate-950 shadow-lg hover:bg-slate-100">
                <Link to="/auren">
                  <Sparkles className="mr-2 h-4 w-4 text-[var(--alexos-purple)]" />
                  Open Auren
                </Link>
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="border border-white/15 bg-black/20 text-white backdrop-blur-md hover:bg-white/10 hover:text-white"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>
      <div className="mt-6">
        <DailyInspirationCards />
      </div>
    </div>
  );
}
export function MobileDashboardHeader() {
  const [now, setNow] = useState(() => new Date());
  const { visualTheme, dashboardScene, greetingTrigger } = useTheme();
  const selectedTheme = getVisualTheme(visualTheme);
  const localWeather = useLocalWeather();
  const atmosphere = getTimeAtmosphere(now.getHours());
  const activeScene =
    dashboardScene === "auto"
      ? getGreetingScene(
          greetingTrigger,
          now.getHours(),
          selectedTheme.backdrop,
          localWeather.weather
            ? { weatherCode: localWeather.weather.weatherCode, night: localWeather.night }
            : null,
          localWeather.location,
        )
      : dashboardScene;

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const today = now.toLocaleDateString("en-KE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const greeting = getGreeting(now.getHours());

  return (
    <div className="space-y-4">
      <section
        data-atmosphere={atmosphere}
        data-scene={activeScene}
        className="alexos-dashboard-hero relative min-h-[250px] overflow-hidden rounded-[1.9rem] border border-white/15 p-5 text-white shadow-[0_22px_58px_-30px_var(--alexos-glow)]"
      >
        {activeScene !== "none" ? (
          <picture className="pointer-events-none absolute inset-0 block">
            <source
              media="(max-width: 640px)"
              srcSet={
                activeScene === "mountains"
                  ? alexosCommandCenterMobile
                  : getDashboardSceneAsset(activeScene)
              }
            />
            <img
              src={
                activeScene === "mountains"
                  ? alexosCommandCenterWide
                  : getDashboardSceneAsset(activeScene)
              }
              alt=""
              aria-hidden="true"
              decoding="async"
              sizes="100vw"
              className="block h-full w-full max-w-none object-cover object-center opacity-65"
            />
          </picture>
        ) : null}
        <div className="alexos-dashboard-overlay pointer-events-none absolute inset-0" />
        <div className="alexos-dashboard-orb alexos-dashboard-orb-right pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full blur-3xl" />
        <div className="alexos-dashboard-sun pointer-events-none absolute right-[13%] top-[16%] h-14 w-14 rounded-full blur-[1px]" />
        <div className="relative flex min-h-[210px] flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/20 px-3 py-1.5 text-[10px] font-semibold backdrop-blur-md">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_10px_rgba(110,231,183,0.9)]" />
              Auren active
            </span>
            <span className="rounded-full border border-white/15 bg-black/20 px-3 py-1.5 text-[10px] font-medium text-white/85 backdrop-blur-md">
              {selectedTheme.label}
            </span>
          </div>
          <div>
            <p className="text-[10px] font-medium text-white/70">
              {today} · {formatTime(now, "24h")} · {getDashboardSceneLabel(activeScene)}
            </p>
            <h1 className="mt-2 text-[2rem] font-semibold leading-tight tracking-tight">
              {greeting}, Alex.
            </h1>
            <p className="mt-2 max-w-[28rem] text-sm leading-5 text-white/90">
              You know what matters. Now let’s move it forward.
            </p>
            <div className="mt-3">
              <DashboardWeather snapshot={localWeather} />
            </div>
            <Button
              asChild
              className="mt-4 h-10 rounded-xl bg-white px-4 text-slate-950 shadow-lg hover:bg-slate-100"
            >
              <Link to="/auren">
                <Sparkles className="mr-2 h-4 w-4 text-[var(--alexos-purple)]" />
                Open Auren Intelligence
              </Link>
            </Button>
          </div>
        </div>
      </section>
      <div className="mt-4">
        <DailyInspirationCards />
      </div>
    </div>
  );
}
