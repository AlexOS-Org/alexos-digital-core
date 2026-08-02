import { Bell, Sparkles, BookOpen, Quote, ArrowUpRight, Palette, Clock3 } from "lucide-react";
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

    return saved === "morning" || saved === "day" || saved === "evening" || saved === "night"
      ? saved
      : "auto";
  });

  const [timeFormat, setTimeFormat] = useState<TimeFormat>(() => {
    if (typeof window === "undefined") return "24h";

    return window.localStorage.getItem(TIME_FORMAT_KEY) === "12h" ? "12h" : "24h";
  });

  const [showAtmosphereMenu, setShowAtmosphereMenu] = useState(false);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30000);

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
    const next = timeFormat === "12h" ? "24h" : "12h";

    setTimeFormat(next);
    window.localStorage.setItem(TIME_FORMAT_KEY, next);
  };

  return (
    <div className="space-y-5">
      <section
        className="relative min-h-[360px] overflow-hidden rounded-[2rem] border border-white/15 text-white shadow-[0_24px_70px_-30px_rgba(37,99,235,0.42)]"
        style={{ background: visual.background }}
      >
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#061126]/80 via-transparent to-transparent" />

        <div className="relative flex min-h-[360px] flex-col justify-between p-6 sm:p-8 lg:p-10">
          <div className="flex justify-between gap-3">
            <div className="flex gap-2">
              <span className="rounded-full border border-white/15 bg-black/20 px-3 py-1.5 text-xs backdrop-blur-md">
                Intelligence layer active
              </span>

              <span className="rounded-full border border-white/15 bg-black/20 px-3 py-1.5 text-xs backdrop-blur-md">
                {activeAtmosphere}
              </span>
            </div>

            <div className="relative flex gap-2">
              <Button
                size="icon"
                variant="ghost"
                onClick={toggleTimeFormat}
                className="border border-white/15 bg-black/20 text-white"
              >
                <Clock3 className="h-5 w-5" />
              </Button>

              <Button
                size="icon"
                variant="ghost"
                onClick={() => setShowAtmosphereMenu(!showAtmosphereMenu)}
                className="border border-white/15 bg-black/20 text-white"
              >
                <Palette className="h-5 w-5" />
              </Button>

              {showAtmosphereMenu && (
                <div className="absolute right-0 top-12 z-40 rounded-xl bg-[#09152d] p-2">
                  {(["auto", "morning", "day", "evening", "night"] as Atmosphere[]).map(
                    (option) => (
                      <button
                        key={option}
                        className="block w-full px-3 py-2 text-left text-xs text-white"
                        onClick={() => setAtmospherePreference(option)}
                      >
                        {option}
                      </button>
                    ),
                  )}
                </div>
              )}
            </div>
          </div>

          <div>
            <p className="text-sm text-white/70">
              {today} · {formatTime(now, timeFormat)}
            </p>

            <h1 className="mt-3 text-4xl font-semibold">{greeting}, Alex.</h1>

            <p className="mt-3 max-w-2xl text-lg text-white/90">
              Your Command Center is ready. Focus on what moves the business forward.
            </p>

            <DashboardWeather />

            <div className="mt-5 flex gap-2">
              <Button className="bg-white text-slate-950">
                <Sparkles className="mr-2 h-4 w-4 text-[var(--alexos-purple)]" />
                Intelligence
              </Button>

              <Button
                size="icon"
                variant="ghost"
                className="border border-white/15 bg-black/20 text-white"
              >
                <Bell className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Card className="rounded-3xl border border-[var(--alexos-purple)]/20 bg-gradient-to-br from-[#0b1730] via-[#101b3c] to-[#18133a] text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold">Intelligence surfaces what matters.</h2>

              <p className="mt-2 text-sm text-slate-300">
                Your money, business activity and priorities are connected into one operating view.
              </p>
            </div>

            <ArrowUpRight />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <BookOpen className="mb-3 h-5 w-5 text-emerald-600" />

            <p>{inspiration.verse.text}</p>

            <p className="mt-3 font-semibold">{inspiration.verse.reference}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <Quote className="mb-3 h-5 w-5 text-violet-600" />

            <p className="italic">“{inspiration.quote.text}”</p>

            <p className="mt-3 font-semibold">— {inspiration.quote.author}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
