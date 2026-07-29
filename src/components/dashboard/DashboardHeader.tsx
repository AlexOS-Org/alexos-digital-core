import { Bell, Sparkles, BookOpen, Quote, Bot, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getDailyInspiration } from "@/lib/dashboard/inspiration";

export function DashboardHeader() {
  const today = new Date().toLocaleDateString("en-KE", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const inspiration = getDailyInspiration();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#071329] text-white shadow-[0_24px_70px_-30px_rgba(37,99,235,0.55)]">
        <div className="pointer-events-none absolute -right-24 -top-28 h-80 w-80 rounded-full bg-[var(--orion-purple)]/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-[var(--orion-blue)]/20 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_78%_20%,rgba(139,92,246,0.20),transparent_30%),radial-gradient(circle_at_35%_100%,rgba(59,130,246,0.14),transparent_34%)]" />

        <div className="relative p-6 sm:p-8 lg:p-10">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-medium text-blue-100 backdrop-blur">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-400 shadow-[0_0_12px_rgba(96,165,250,0.9)]" />
                Orion is online
              </div>
              <p className="text-sm text-slate-400">{today}</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">{greeting()}, Alex.</h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
                See what matters. Move what matters. Keep your money, business and next move under control.
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button size="icon" variant="ghost" className="border border-white/10 bg-white/[0.06] text-white hover:bg-white/10 hover:text-white" aria-label="Notifications">
                <Bell className="h-5 w-5" />
              </Button>
              <Button className="bg-white text-slate-950 shadow-lg hover:bg-slate-100">
                <Sparkles className="mr-2 h-4 w-4 text-[var(--orion-purple)]" />
                Ask Orion
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
