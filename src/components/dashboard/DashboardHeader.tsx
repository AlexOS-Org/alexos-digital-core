import { Bell, Clock3, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { DashboardWeather } from "@/components/dashboard/DashboardWeather";
import { useTheme } from "@/components/theme/ThemeProvider";
import { getVisualTheme } from "@/components/theme/visual-themes";
import alexosMountainWide from "@/assets/visuals/alexos-mountain-dusk-wide.webp";
import alexosMountainMobile from "@/assets/visuals/alexos-mountain-mobile.webp";

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
function getAtmosphereStyle(atmosphere: string) {
  const styles = {
    morning: {
      background: "linear-gradient(145deg, #365d68 0%, #4d8b82 42%, #d4a56f 70%, #294f63 100%)",
      sun: "rgba(255, 218, 143, 0.96)",
      horizon: "linear-gradient(180deg, rgba(54,52,73,0) 0%, rgba(18,35,48,0.72) 100%)",
    },
    day: {
      background: "linear-gradient(145deg, #164f58 0%, #2f8f78 44%, #91c9b5 74%, #326b73 100%)",
      sun: "rgba(255, 245, 201, 0.98)",
      horizon: "linear-gradient(180deg, rgba(26,59,73,0) 0%, rgba(12,36,53,0.58) 100%)",
    },
    evening: {
      background: "linear-gradient(145deg, #183b46 0%, #426d67 34%, #b86f55 65%, #252c4e 100%)",
      sun: "rgba(255, 184, 119, 0.98)",
      horizon: "linear-gradient(180deg, rgba(45,35,67,0) 0%, rgba(17,22,47,0.82) 100%)",
    },
    night: {
      background: "linear-gradient(145deg, #050b1d 0%, #111c3c 45%, #27224f 72%, #071126 100%)",
      sun: "rgba(216, 225, 255, 0.86)",
      horizon: "linear-gradient(180deg, rgba(4,10,29,0) 0%, rgba(3,8,23,0.9) 100%)",
    },
  } as const;
  return styles[atmosphere as keyof typeof styles] ?? styles.night;
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
  const { visualTheme } = useTheme();
  const selectedTheme = getVisualTheme(visualTheme);
  const activeAtmosphere = getTimeAtmosphere(now.getHours());
  const visual = getAtmosphereStyle(activeAtmosphere);
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
        className="relative min-h-[360px] overflow-hidden rounded-[2rem] border border-white/15 text-white shadow-[0_24px_70px_-30px_rgba(37,99,235,0.42)] transition-[background] duration-[1800ms] ease-in-out sm:min-h-[330px]"
        style={{ background: visual.background }}
      >
        {selectedTheme.backdrop === "mountains" ? (
          <picture className="alexos-dashboard-backdrop pointer-events-none absolute inset-0 block">
            <source media="(max-width: 640px)" srcSet={alexosMountainMobile} />
            <img
              src={alexosMountainWide}
              alt=""
              aria-hidden="true"
              fetchPriority="high"
              className="h-full w-full object-cover object-center opacity-85"
            />
          </picture>
        ) : null}
        <div className="pointer-events-none absolute -left-20 top-8 h-44 w-44 rounded-full bg-emerald-300/15 blur-3xl" />
        <div className="pointer-events-none absolute left-[35%] -top-16 h-52 w-52 rounded-full bg-violet-400/15 blur-3xl" />
        <div className="pointer-events-none absolute -right-16 bottom-4 h-64 w-64 rounded-full bg-cyan-300/15 blur-3xl" />
        <div
          className="pointer-events-none absolute right-[12%] top-[13%] h-20 w-20 rounded-full opacity-90 blur-[1px] transition-all duration-[1800ms] sm:h-28 sm:w-28"
          style={{ background: visual.sun, boxShadow: `0 0 70px 18px ${visual.sun}` }}
        />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2"
          style={{ background: visual.horizon }}
        />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_78%_20%,rgba(139,92,246,0.22),transparent_30%),radial-gradient(circle_at_35%_100%,rgba(16,185,129,0.18),transparent_34%)]" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#061126]/80 via-[#071329]/15 to-transparent" />
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
              {today} · {formatTime(now, timeFormat)} · {activeAtmosphere}
            </p>
            <h1 className="mt-2 text-[2rem] font-semibold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
              {greeting}, Alex.
            </h1>
            <p className="mt-3 max-w-2xl text-[15px] leading-6 text-white/90 sm:mt-4 sm:text-lg sm:leading-7">
              You know what matters. Now let’s move it forward.
            </p>
            <DashboardWeather />
            <div className="mt-5 flex flex-wrap gap-2">
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
    </div>
  );
}
