import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { modules, moduleGroups } from "@/lib/modules";
import { ArrowUpRight, Sparkles } from "lucide-react";

import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import AskAlexBar from "@/components/dashboard/AskAlexBar";
import { AIBriefing } from "@/components/dashboard/AIBriefing";
import MoneySnapshot from "@/components/dashboard/MoneySnapshot";
import { QuickActions } from "@/components/dashboard/QuickActions";
import BusinessSnapshot from "@/components/dashboard/BusinessSnapshot";
import TodaysMission from "@/components/dashboard/TodaysMission";
import RecentActivity from "@/components/dashboard/RecentActivity";
import IntelligenceFeed from "@/components/dashboard/IntelligenceFeed";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const navModules = modules.filter((m) => m.url !== "/dashboard");

  return (
    <div className="relative space-y-10 pb-10 animate-in fade-in duration-500">
      <DashboardHeader />

      <section className="relative overflow-hidden rounded-3xl border border-primary/15 bg-gradient-to-r from-primary/[0.07] via-background to-[var(--orion-purple)]/[0.07] p-5 sm:p-6">
        <div className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Your command center
            </div>
            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">Know what matters. Act on it.</h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
              Orion brings your money, business signals and next priorities into one clear view.
            </p>
          </div>
          <div className="w-full lg:max-w-xl">
            <AskAlexBar />
          </div>
        </div>
      </section>

      <AIBriefing />

      <section className="space-y-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Money</p>
            <h2 className="text-2xl font-semibold tracking-tight">Know where you stand.</h2>
            <p className="text-sm text-muted-foreground">Cash, commitments and financial momentum — without the noise.</p>
          </div>
        </div>
        <MoneySnapshot />
      </section>

      <QuickActions />

      <section className="space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--orion-purple)]">Business</p>
          <h2 className="text-2xl font-semibold tracking-tight">Build what moves you forward.</h2>
          <p className="text-sm text-muted-foreground">See the signals behind customers, sales, revenue and growth.</p>
        </div>
        <BusinessSnapshot />
      </section>

      <TodaysMission />

      <section className="grid gap-5 lg:grid-cols-2">
        <RecentActivity />
        <IntelligenceFeed />
      </section>

      <section className="space-y-5">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Your operating system</p>
            <h2 className="text-2xl font-semibold tracking-tight">Everything you need. One place.</h2>
          </div>
          <span className="text-xs text-muted-foreground">{navModules.length} modules available</span>
        </div>

        <Tabs defaultValue={moduleGroups[0]} className="space-y-5">
          <TabsList className="flex h-auto w-full justify-start gap-1 overflow-x-auto rounded-2xl border border-border/60 bg-muted/50 p-1">
            {moduleGroups.map((group) => (
              <TabsTrigger key={group} value={group} className="rounded-xl px-4 py-2">
                {group}
              </TabsTrigger>
            ))}
          </TabsList>
          {moduleGroups.map((group) => (
            <TabsContent key={group} value={group}>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {navModules.filter((m) => m.group === group).map((m) => (
                  <Link key={m.url} to={m.url} className="group">
                    <Card className="h-full rounded-3xl border-border/60 bg-card/80 transition-all duration-200 hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5">
                      <CardContent className="space-y-4 p-5">
                        <div className="flex items-center justify-between">
                          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-[var(--orion-purple)]/15 text-primary ring-1 ring-primary/10">
                            <m.icon className="h-5 w-5" />
                          </div>
                          <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{m.title}</p>
                          <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-muted-foreground">{m.description}</p>
                        </div>
                        <span className="inline-flex rounded-full border border-border/60 bg-muted/60 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                          {m.group}
                        </span>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </section>
    </div>
  );
}
