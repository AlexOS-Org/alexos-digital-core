import { ArrowUpRight, Bell, Bot, CloudSun, Moon, Palette, Sparkles, Sun, Sunset } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ThemeSwitcher } from "@/components/theme/ThemeSwitcher";

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
    morning: { background: "linear-gradient(145deg, #5b718c 0%, #c9977f 40%, #f0d09a 67%, #73829b 100%)", sun: "rgba(255, 224, 165, 0.98)", horizon: "linear-gradient(180deg, rgba(54,52,73,0) 0%, rgba(27,31,55,0.62) 100%)", glow: "rgba(255, 198, 129, 0.20)" },
    day: { background: "linear-gradient(145deg, #3b6f91 0%, #78b9d1 46%, #dce9e2 75%, #718e9d 100%)", sun: "rgba(255, 248, 211, 0.98)", horizon: "linear-gradient(180deg, rgba(26,59,73,0) 0%, rgba(12,36,53,0.50) 100%)", glow: "rgba(255, 241, 185, 0.16)" },
    evening: { background: "linear-gradient(145deg, #3b466b 0%, #956c82 37%, #d99a79 61%, #4c5775 100%)", sun: "rgba(255, 190, 130, 0.98)", horizon: "linear-gradient(180deg, rgba(45,35,67,0) 0%, rgba(17,22,47,0.72) 100%)", glow: "rgba(255, 139, 105, 0.20)" },
    night: { background: "linear-gradient(145deg, #071024 0%, #142344 45%, #2a2850 72%, #08142b 100%)", sun: "rgba(222, 230, 255, 0.88)", horizon: "linear-gradient(180deg, rgba(4,10,29,0) 0%, rgba(3,8,23,0.90) 100%)", glow: "rgba(135, 145, 244, 0.16)" },
  } as const;
  return styles[atmosphere];
}

function formatTime(date: Date) {
  return date.toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit", hour12: true });
}

const atmosphereIcon = { morning: CloudSun, day: Sun, evening: Sunset, night: Moon } as const;

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
  const today = now.toLocaleDateString("en-KE", { weekday: "long", month: "long", day: "numeric" });

  const setAtmospherePreference = (value: Atmosphere) => {
    setAtmosphere(value);
    window.localStorage.setItem(ATMOSPHERE_KEY, value);
    setShowAtmosphereMenu(false);
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      <section className="relative min-h-[300px] overflow-hidden rounded-[1.75rem] border border-white/15 text-white shadow-[0_24px_70px_-30px_rgba(37,99,235,0.45)] transition-[background] duration-[1800ms] ease-in-out sm:min-h-[320px] sm:rounded-[2rem]" style={{ background: visual.background }}>
        <div className="pointer-events-none absolute -right-10 top-[8%] h-36 w-36 rounded-full opacity-90 blur-[1px] transition-all duration-[1800ms] sm:right-[12%] sm:top-[13%] sm:h-28 sm:w-28" style={{ background: visual.sun, boxShadow: `0 0 70px 18px ${visual.sun}` }} />
        <div className="pointer-events-none absolute left-[8%] top-[18%] h-10 w-24 rounded-full bg-white/10 blur-xl sm:left-[14%]" />
        <div className="pointer-events-none absolute left-[30%] top-[28%] h-7 w-20 rounded-full bg-white/10 blur-lg sm:left-[35%]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2" style={{ background: visual.horizon }} />
        <div className="pointer-events-none absolute inset-0 transition-colors duration-[1800ms]" style={{ background: `radial-gradient(circle_at_78%_20%,${visual.glow},transparent_32%),radial-gradient(circle_at_35%_100%,rgba(59,130,246,0.12),transparent_34%)` }} />
        {activeAtmosphere === "night" && <div className="pointer-events-none absolute inset-0 opacity-60" style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,.7) 1px, transparent 1px)", backgroundSize: "52px 52px" }} />}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#061126]/75 via-[#071329]/10 to-transparent" />

        <div className="relative flex min-h-[300px] flex-col justify-between p-5 sm:min-h-[320px] sm:p-8 lg:p-10">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/15 px-3 py-1.5 text-xs font-medium text-blue-50 backdrop-blur-md"><span className="h-1.5 w-1.5 rounded-full bg-blue-200 shadow-[0_0_12px_rgba(191,219,254,0.9)]" />Orion is online</span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/15 px-3 py-1.5 text-xs font-medium text-white/85 backdrop-blur-md"><AtmosphereIcon className="h-3.5 w-3.5" />{activeAtmosphere[0].toUpperCase() + activeAtmosphere.slice(1)}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden sm:block"><ThemeSwitcher /></div>
              <div className="relative shrink-0">
                <Button size="icon" variant="ghost" className="border border-white/15 bg-black/15 text-white backdrop-blur-md hover:bg-white/10 hover:text-white" aria-label="Change dashboard atmosphere" aria-expanded={showAtmosphereMenu} onClick={() => setShowAtmosphereMenu((open) => !open)}><Palette className="h-5 w-5" /></Button>
                {showAtmosphereMenu && <div className="absolute right-0 top-12 z-40 w-40 rounded-2xl border border-white/10 bg-[#09152d]/95 p-2 shadow-2xl backdrop-blur-xl"><p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-white/45">Atmosphere</p>{(["auto", "morning", "day", "evening", "night"] as Atmosphere[]).map((option) => <button key={option} type="button" onClick={() => setAtmospherePreference(option)} className={`w-full rounded-xl px-2 py-2 text-left text-xs transition-colors ${atmosphere === option ? "bg-white/10 text-white" : "text-white/65 hover:bg-white/5 hover:text-white"}`}>{option === "auto" ? "Auto · Follow time" : option[0].toUpperCase() + option.slice(1)}</button>)}</div>}
              </div>
            </div>
          </div>

          <div className="max-w-3xl pb-1 sm:pb-0">
            <p className="text-[11px] font-medium text-white/65 sm:text-sm">{today} · {formatTime(now)}</p>
            <h1 className="mt-1.5 text-[1.9rem] font-semibold leading-tight tracking-tight sm:mt-2 sm:text-4xl lg:text-5xl">{greeting}, Alex.</h1>
            <p className="mt-2 max-w-2xl text-[14px] leading-6 text-white/90 sm:mt-4 sm:text-lg sm:leading-7">You know what matters. Now let’s move it forward.</p>
            <div className="mt-4 flex items-center gap-2 sm:mt-5">
              <Button className="bg-white text-slate-950 shadow-lg hover:bg-slate-100"><Sparkles className="mr-2 h-4 w-4 text-[var(--orion-purple)]" />Ask Orion</Button>
              <Button size="icon" variant="ghost" className="border border-white/15 bg-black/15 text-white backdrop-blur-md hover:bg-white/10 hover:text-white" aria-label="Notifications"><Bell className="h-5 w-5" /></Button>
              <div className="sm:hidden"><ThemeSwitcher compact /></div>
            </div>
          </div>
        </div>
      </section>

      <Card className="relative overflow-hidden rounded-3xl border border-primary/15 bg-gradient-to-br from-card via-card to-accent/25 text-card-foreground shadow-sm">
        <div className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-[var(--orion-purple)]/10 blur-3xl" />
        <CardContent className="relative p-4 sm:p-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-start gap-3"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-primary/10 bg-primary/10"><Bot className="h-5 w-5 text-[var(--orion-purple)]" /></div><div><div className="flex items-center gap-2"><h2 className="font-semibold tracking-tight">Orion sees what matters.</h2><span className="rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-success">Live</span></div><p className="mt-1 text-sm leading-6 text-muted-foreground">Your money, business activity and priorities are being brought into focus.</p></div></div><Button variant="ghost" className="w-full justify-between text-primary hover:bg-primary/5 hover:text-primary sm:w-fit">Open intelligence<ArrowUpRight className="ml-2 h-4 w-4" /></Button></div></CardContent>
      </Card>
    </div>
  );
}
