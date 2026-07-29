import { Bell, Sparkles, BookOpen, Quote, Bot, ArrowUpRight, Palette, Clock3 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getDailyInspiration } from "@/lib/dashboard/inspiration";
import { DashboardWeather } from "@/components/dashboard/DashboardWeather";

type Atmosphere = "auto" | "morning" | "day" | "evening" | "night";
type TimeFormat = "12h" | "24h";

const ATMOSPHERE_KEY = "alexos-dashboard-atmosphere";
const TIME_FORMAT_KEY = "alexos-dashboard-time-format";

function getTimeAtmosphere(hour: number): Exclude<Atmosphere, "auto"> {
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

function getAtmosphereStyle(atmosphere: Exclude<Atmosphere, "auto">) {
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

  return styles[atmosphere];
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
  const [atmosphere, setAtmosphere] = useState<Atmosphere>(() => {
    if (typeof window === "undefined") return "auto";
    const saved = window.localStorage.getItem(ATMOSPHERE_KEY);
    return saved === "morning" || saved === "day" || saved === "evening" || saved === "night" ? saved : "auto";
  });
  const [timeFormat, setTimeFormat] = useState<TimeFormat>(() => {
    if (typeof window === "undefined") return "24h";
    return window.localStorage.getItem(TIME_FORMAT_KEY) === "12h" ? "12h" : "24h";
  });
  const [showAtmosphereMenu, setShowAtmosphereMenu] = useState(false);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const hour = now.getHours();
  const activeAtmosphere = atmosphere === "auto" ? getTimeAtmosphere(hour) : atmosphere;
  const visual = getAtmosphereStyle(activeAtmosphere);
  const greeting = getGreeting(hour);
  const today = now.toLocaleDateString("en-KE", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const inspiration = getDailyInspiration();

  const setAtmospherePreference = (value: Atmosphere) => {
    setAtmosphere(value);
    window.localStorage.setItem(ATMOSPHERE_KEY, value);
    setShowAtmosphereMenu(false);
  };

  const toggleTimeFormat = () => {
    const next: TimeFormat = timeFormat === "12h" ? "24h" : "12h";
    setTimeFormat(next);
    window.localStorage.setItem(TIME_FORMAT_KEY, next);
  };

  return (
    <div className="space-y-5">
      <section
        className="relative min-h-[360px] overflow-hidden rounded-[2rem] border border-white/15 text-white shadow-[0_24px_70px_-30px_rgba(37,99,235,0.42)] transition-[background] duration-[1800ms] ease-in-out sm:min-h-[330px]"
        style={{ background: visual.background }}
      >
        <div className="pointer-events-none absolute -left-20 top-8 h-44 w-44 rounded-full bg-emerald-300/15 blur-3xl" />
        <div className="pointer-events-none absolute left-[35%] -top-16 h-52 w-52 rounded-full bg-violet-400/15 blur-3xl" />
        <div className="pointer-events-none absolute -right-16 bottom-4 h-64 w-64 rounded-full bg-cyan-300/15 blur-3xl" />
        <div
          className="pointer-events-none absolute right-[12%] top-[13%] h-20 w-20 rounded-full opacity-90 blur-[1px] transition-all duration-[1800ms] sm:h-28 sm:w-28"
          style={{ background: visual.sun, boxShadow: `0 0 70px 18px ${visual.sun}` }}
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2" style={{ background: visual.horizon }} />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_78%_20%,rgba(139,92,246,0.22),transparent_30%),radial-gradient(circle_at_35%_100%,rgba(16,185,129,0.18),transparent_34%)]" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#061126]/80 via-[#071329]/15 to-transparent" />

        <div className="relative flex min-h-[360px] flex-col justify-between p-5 sm:min-h-[330px] sm:p-8 lg:p-10">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/20 px-3 py-1.5 text-xs font-medium text-emerald-50 backdrop-blur-md">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_12px_rgba(110,231,183,0.9)]" />
                Orion is online
              </span>
              <span className="rounded-full border border-white/15 bg-black/20 px-3 py-1.5 text-xs font-medium text-white/80 backdrop-blur-md">
                {activeAtmosphere[0].toUpperCase() + activeAtmosphere.slice(1)}
              </span>
            </div>

            <div className="relative flex shrink-0 gap-2">
              <Button
                size="icon"
                variant="ghost"
                className="border border-white/15 bg-black/20 text-white backdrop-blur-md hover:bg-white/10 hover:text-white"
                aria-label={`Switch to ${timeFormat === "12h" ? "24-hour" : "12-hour"} time`}
                title={`Use ${timeFormat === "12h" ? "24-hour" : "12-hour"} time`}
                onClick={toggleTimeFormat}
              >
                <Clock3 className="h-5 w-5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="border border-white/15 bg-black/20 text-white backdrop-blur-md hover:bg-white/10 hover:text-white"
                aria-label="Change dashboard atmosphere"
                aria-expanded={showAtmosphereMenu}
                onClick={() => setShowAtmosphereMenu((open) => !open)}
              >
                <Palette className="h-5 w-5" />
              </Button>
              {showAtmosphereMenu && (
                <div className="absolute right-0 top-12 z-40 w-44 rounded-2xl border border-white/10 bg-[#09152d]/95 p-2 shadow-2xl backdrop-blur-xl">
                  <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-white/45">Atmosphere</p>
                  {(["auto", "morning", "day", "evening", "night"] as Atmosphere[]).map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setAtmospherePreference(option)}
                      className={`w-full rounded-xl px-2 py-2 text-left text-xs transition-colors ${atmosphere === option ? "bg-white/10 text-white" : "text-white/65 hover:bg-white/5 hover:text-white"}`}
                    >
                      {option === "auto" ? "Auto · Follow time" : option[0].toUpperCase() + option.slice(1)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="max-w-3xl pb-2 sm:pb-0">
            <p className="text-xs font-medium text-white/65 sm:text-sm">{today} · {formatTime(now, timeFormat)}</p>
            <h1 className="mt-2 text-[2rem] font-semibold leading-tight tracking-tight sm:text-4xl lg:text-5xl">{greeting}, Alex.</h1>
            <p className="mt-3 max-w-2xl text-[15px] leading-6 text-white/90 sm:mt-4 sm:text-lg sm:leading-7">
              You know what matters. Now let’s move it forward.
            </p>
            <DashboardWeather />
            <div className="mt-5 flex gap-2">
              <Button className="bg-white text-slate-950 shadow-lg hover:bg-slate-100">
                <Sparkles className="mr-2 h-4 w-4 text-[var(--orion-purple)]" />
                Ask Orion
              </Button>
              <Button size="icon" variant="ghost" className="border border-white/15 bg-black/20 text-white backdrop-blur-md hover:bg-white/10 hover:text-white" aria-label="Notifications">
                <Bell className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Card className="relative overflow-hidden rounded-3xl border border-[var(--orion-purple)]/20 bg-gradient-to-br from-[#0b1730] via-[#101b3c] to-[#18133a] text-white shadow-[0_18px_50px_-28px_rgba(124,58,237,0.65)]">
        <div className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-[var(--orion-purple)]/15 blur-3xl" />
        <CardContent className="relative p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.07]"><Bot className="h-5 w-5 text-violet-300" /></div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold tracking-tight">Orion sees what matters.</h2>
                  <span className="rounded-full bg-violet-400/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-violet-200">Live</span>
                </div>
                <p className="mt-1 text-sm leading-6 text-slate-300">Your financial position, business activity and priorities are being brought into focus.</p>
              </div>
            </div>
            <Button variant="ghost" className="w-fit text-violet-200 hover:bg-white/5 hover:text-white">Open intelligence<ArrowUpRight className="ml-2 h-4 w-4" /></Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-3xl border-border/60 bg-gradient-to-br from-emerald-50/90 to-background shadow-sm">
          <CardContent className="p-5 sm:p-6">
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-emerald-700"><BookOpen className="h-4 w-4" /><span>Today’s anchor</span></div>
            <p className="text-[15px] leading-7 text-foreground/80">{inspiration.verse.text}</p>
            <p className="mt-4 text-sm font-semibold text-emerald-700">{inspiration.verse.reference}</p>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border-border/60 bg-gradient-to-br from-violet-50/80 to-background shadow-sm">
          <CardContent className="p-5 sm:p-6">
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-violet-700"><Quote className="h-4 w-4" /><span>One thought worth carrying</span></div>
            <p className="text-[15px] italic leading-7 text-foreground/80">“{inspiration.quote.text}”</p>
            <p className="mt-4 text-sm font-semibold text-violet-700">— {inspiration.quote.author}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}