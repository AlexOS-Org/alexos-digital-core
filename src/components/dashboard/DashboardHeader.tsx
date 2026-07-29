import { Bell, Sparkles, BookOpen, Quote, Bot, ArrowUpRight, Palette, Sun, Moon, CloudSun, Sunset } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getDailyInspiration } from "@/lib/dashboard/inspiration";

type Atmosphere = "auto" | "morning" | "day" | "evening" | "night";
const ATMOSPHERE_KEY = "alexos-dashboard-atmosphere";

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
      background: "linear-gradient(145deg, #536d8d 0%, #c48c73 40%, #f0c67f 67%, #647493 100%)",
      sun: "rgba(255, 221, 151, 0.98)",
      horizon: "linear-gradient(180deg, rgba(54,52,73,0) 0%, rgba(27,31,55,0.68) 100%)",
      glow: "rgba(255, 195, 116, 0.22)",
    },
    day: {
      background: "linear-gradient(145deg, #285f86 0%, #69b5d7 46%, #cfe5df 75%, #5c8294 100%)",
      sun: "rgba(255, 247, 207, 0.98)",
      horizon: "linear-gradient(180deg, rgba(26,59,73,0) 0%, rgba(12,36,53,0.58) 100%)",
      glow: "rgba(255, 241, 185, 0.18)",
    },
    evening: {
      background: "linear-gradient(145deg, #29375f 0%, #875978 37%, #df8967 61%, #394365 100%)",
      sun: "rgba(255, 182, 116, 0.98)",
      horizon: "linear-gradient(180deg, rgba(45,35,67,0) 0%, rgba(17,22,47,0.78) 100%)",
      glow: "rgba(255, 128, 91, 0.24)",
    },
    night: {
      background: "linear-gradient(145deg, #050b1d 0%, #101d3e 45%, #292452 72%, #071126 100%)",
      sun: "rgba(218, 227, 255, 0.88)",
      horizon: "linear-gradient(180deg, rgba(4,10,29,0) 0%, rgba(3,8,23,0.92) 100%)",
      glow: "rgba(129, 140, 248, 0.18)",
    },
  } as const;
  return styles[atmosphere];
}

function formatTime(date: Date) {
  return date.toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit", hour12: true });
}

const atmosphereIcon = {
  morning: CloudSun,
  day: Sun,
  evening: Sunset,
  night: Moon,
} as const;

export function DashboardHeader() {
  const [now, setNow] = useState(() => new Date());
  const [atmosphere, setAtmosphere] = useState<Atmosphere>(() => {
    if (typeof window === "undefined") return "auto";
    const saved = window.localStorage.getItem(ATMOSPHERE_KEY);
    return saved === "morning" || saved === "day" || saved === "evening" || saved === "night" ? saved : "auto";
  });
  const [showAtmosphereMenu, setShowAtmosphereMenu] = useState(false);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const hour = now.getHours();
  const activeAtmosphere = atmosphere === "auto" ? getTimeAtmosphere(hour) : atmosphere;
  const visual = getAtmosphereStyle(activeAtmosphere);
  const AtmosphereIcon = atmosphereIcon[activeAtmosphere];
  const greeting = getGreeting(hour);
  const today = now.toLocaleDateString("en-KE", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const inspiration = getDailyInspiration();

  const setAtmospherePreference = (value: Atmosphere) => {
    setAtmosphere(value);
    window.localStorage.setItem(ATMOSPHERE_KEY, value);
    setShowAtmosphereMenu(false);
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      <section
        className="relative min-h-[320px] overflow-hidden rounded-[1.75rem] border border-white/15 text-white shadow-[0_24px_70px_-30px_rgba(37,99,235,0.55)] transition-[background] duration-[1800ms] ease-in-out sm:min-h-[330px] sm:rounded-[2rem]"
        style={{ background: visual.background }}
      >
        <div className="pointer-events-none absolute -right-10 top-[8%] h-36 w-36 rounded-full opacity-90 blur-[1px] transition-all duration-[1800ms] sm:right-[12%] sm:top-[13%] sm:h-28 sm:w-28" style={{ background: visual.sun, boxShadow: `0 0 70px 18px ${visual.sun}` }} />
        <div className="pointer-events-none absolute left-[8%] top-[18%] h-10 w-24 rounded-full bg-white/10 blur-xl sm:left-[14%]" />
        <div className="pointer-events-none absolute left-[30%] top-[28%] h-7 w-20 rounded-full bg-white/10 blur-lg sm:left-[35%]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2" style={{ background: visual.horizon }} />
        <div className="pointer-events-none absolute inset-0 transition-colors duration-[1800ms]" style={{ background: `radial-gradient(circle_at_78%_20%,${visual.glow},transparent_32%),radial-gradient(circle_at_35%_100%,rgba(59,130,246,0.15),transparent_34%)` }} />
        {activeAtmosphere === "night" && <div className="pointer-events-none absolute inset-0 opacity-70" style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,.7) 1px, transparent 1px)", backgroundSize: "52px 52px" }} />}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#061126]/80 via-[#071329]/15 to-transparent" />

        <div className="relative flex min-h-[320px] flex-col justify-between p-5 sm:min-h-[330px] sm:p-8 lg:p-10">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/20 px-3 py-1.5 text-xs font-medium text-blue-50 backdrop-blur-md"><span className="h-1.5 w-1.5 rounded-full bg-blue-300 shadow-[0_0_12px_rgba(147,197,253,0.9)]" />Orion is online</span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/20 px-3 py-1.5 text-xs font-medium text-white/80 backdrop-blur-md"><AtmosphereIcon className="h-3.5 w-3.5" />{activeAtmosphere[0].toUpperCase() + activeAtmosphere.slice(1)}</span>
            </div>
            <div className="relative shrink-0">
              <Button size="icon" variant="ghost" className="border border-white/15 bg-black/20 text-white backdrop-blur-md hover:bg-white/10 hover:text-white" aria-label="Change dashboard atmosphere" aria-expanded={showAtmosphereMenu} onClick={() => setShowAtmosphereMenu((open) => !open)}><Palette className="h-5 w-5" /></Button>
              {showAtmosphereMenu && <div className="absolute right-0 top-12 z-40 w-40 rounded-2xl border border-white/10 bg-[#09152d]/95 p-2 shadow-2xl backdrop-blur-xl"><p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-white/45">Atmosphere</p>{(["auto", "morning", "day", "evening", "night"] as Atmosphere[]).map((option) => <button key={option} type="button" onClick={() => setAtmospherePreference(option)} className={`w-full rounded-xl px-2 py-2 text-left text-xs transition-colors ${atmosphere === option ? "bg-white/10 text-white" : "text-white/65 hover:bg-white/5 hover:text-white"}`}>{option === "auto" ? "Auto · Follow time" : option[0].toUpperCase() + option.slice(1)}</button>)}</div>}
            </div>
          </div>

          <div className="max-w-3xl pb-1 sm:pb-0">
            <p className="text-[11px] font-medium text-white/65 sm:text-sm">{today} · {formatTime(now)}</p>
            <h1 className="mt-1.5 text-[1.9rem] font-semibold leading-tight tracking-tight sm:mt-2 sm:text-4xl lg:text-5xl">{greeting}, Alex.</h1>
            <p className="mt-2 max-w-2xl text-[14px] leading-6 text-white/90 sm:mt-4 sm:text-lg sm:leading-7">You know what matters. Now let’s move it forward.</p>
            <div className="mt-4 flex gap-2 sm:mt-5"><Button className="bg-white text-slate-950 shadow-lg hover:bg-slate-100"><Sparkles className="mr-2 h-4 w-4 text-[var(--orion-purple)]" />Ask Orion</Button><Button size="icon" variant="ghost" className="border border-white/15 bg-black/20 text-white backdrop-blur-md hover:bg-white/10 hover:text-white" aria-label="Notifications"><Bell className="h-5 w-5" /></Button></div>
          </div>
        </div>
      </section>

      <Card className="relative overflow-hidden rounded-3xl border border-[var(--orion-purple)]/20 bg-gradient-to-br from-[#0b1730] via-[#101b3c] to-[#18133a] text-white shadow-[0_18px_50px_-28px_rgba(124,58,237,0.65)]">
        <div className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-[var(--orion-purple)]/15 blur-3xl" />
        <CardContent className="relative p-4 sm:p-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-start gap-3"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.07]"><Bot className="h-5 w-5 text-violet-300" /></div><div><div className="flex items-center gap-2"><h2 className="font-semibold tracking-tight">Orion sees what matters.</h2><span className="rounded-full bg-violet-400/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-violet-200">Live</span></div><p className="mt-1 text-sm leading-6 text-slate-300">Your financial position, business activity and priorities are being brought into focus.</p></div></div><Button variant="ghost" className="w-full justify-between text-violet-200 hover:bg-white/5 hover:text-white sm:w-fit">Open intelligence<ArrowUpRight className="ml-2 h-4 w-4" /></Button></div></CardContent>
      </Card>

      <div className="grid gap-3 sm:gap-4 lg:grid-cols-2">
        <Card className="rounded-3xl border-border/60 bg-gradient-to-br from-emerald-50/90 to-background shadow-sm"><CardContent className="p-4 sm:p-6"><div className="mb-3 flex items-center gap-2 text-sm font-semibold text-emerald-700"><BookOpen className="h-4 w-4" /><span>Today’s anchor</span></div><p className="text-[15px] leading-7 text-foreground/80">{inspiration.verse.text}</p><p className="mt-3 text-sm font-semibold text-emerald-700">{inspiration.verse.reference}</p></CardContent></Card>
        <Card className="rounded-3xl border-border/60 bg-gradient-to-br from-violet-50/80 to-background shadow-sm"><CardContent className="p-4 sm:p-6"><div className="mb-3 flex items-center gap-2 text-sm font-semibold text-violet-700"><Quote className="h-4 w-4" /><span>One thought worth carrying</span></div><p className="text-[15px] italic leading-7 text-foreground/80">“{inspiration.quote.text}”</p><p className="mt-3 text-sm font-semibold text-violet-700">— {inspiration.quote.author}</p></CardContent></Card>
      </div>
    </div>
  );
}
