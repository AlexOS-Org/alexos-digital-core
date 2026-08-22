import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { modules, moduleGroups } from "@/lib/modules";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import IntelligenceSearch from "@/components/dashboard/IntelligenceSearch";
import MoneySnapshot from "@/components/dashboard/MoneySnapshot";
import { QuickActions } from "@/components/dashboard/QuickActions";
import BusinessSnapshot from "@/components/dashboard/BusinessSnapshot";
import TodaysMission from "@/components/dashboard/TodaysMission";
import RecentActivity from "@/components/dashboard/RecentActivity";
import IntelligenceFeed from "@/components/dashboard/IntelligenceFeed";
import {
  MobileAurenBriefing,
  MobileMetricTiles,
  MobileRevenueToday,
} from "@/components/dashboard/MobileCommandCenter";
import { MobileDashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardKpiStrip } from "@/components/dashboard/DashboardKpiStrip";
import { AlexosDashboardFooter } from "@/components/dashboard/AlexosDashboardFooter";
import MoneyFlowChart from "@/components/dashboard/MoneyFlowChart";
import { Component, ErrorInfo, ReactNode } from "react";

export const Route = createFileRoute("/_authenticated/dashboard")({ component: Dashboard });

class DashboardPanelBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("AlexOS dashboard panel error:", error, info.componentStack);
  }
  render() {
    if (this.state.hasError)
      return (
        <Card className="rounded-3xl border-amber-500/20 bg-amber-500/5">
          <CardContent className="p-5">
            <p className="text-sm font-semibold">This panel is still loading.</p>
            <p className="mt-1 text-xs text-muted-foreground">
              The rest of your command center is available.
            </p>
          </CardContent>
        </Card>
      );
    return this.props.children;
  }
}

function SafePanel({ children }: { children: ReactNode }) {
  return <DashboardPanelBoundary>{children}</DashboardPanelBoundary>;
}

function DashboardSectionRail() {
  const sections = [
    ["Money", "#dashboard-money"],
    ["Priorities", "#dashboard-priorities"],
    ["Auren", "#dashboard-auren"],
    ["Activity", "#dashboard-activity"],
    ["Business", "#dashboard-business"],
    ["Actions", "#dashboard-actions"],
    ["Modules", "#dashboard-modules"],
    ["Footer", "#dashboard-footer"],
  ];

  return (
    <nav
      aria-label="Dashboard sections"
      className="sticky top-3 z-20 flex flex-col gap-2 rounded-2xl border border-border/60 bg-card/85 p-2 shadow-sm backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between"
    >
      <span className="shrink-0 px-2 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
        Jump to a working view
      </span>
      <div className="flex min-w-0 gap-1 overflow-x-auto">
        {sections.map(([label, href]) => (
          <a
            key={href}
            href={href}
            className="shrink-0 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {label}
          </a>
        ))}
      </div>
    </nav>
  );
}

function MobileDashboard() {
  return (
    <div className="space-y-5 pb-10">
      <MobileDashboardHeader />
      <MobileAurenBriefing />
      <SafePanel>
        <TodaysMission compact />
      </SafePanel>
      <MobileMetricTiles />
      <MobileRevenueToday />
      <SafePanel>
        <QuickActions compact />
      </SafePanel>
      <SafePanel>
        <RecentActivity />
      </SafePanel>
      <div id="dashboard-footer" className="scroll-mt-24">
        <AlexosDashboardFooter />
      </div>
    </div>
  );
}

function Dashboard() {
  const navModules = modules.filter((m) => m.url !== "/dashboard");
  const isMobile = useIsMobile();
  if (isMobile) return <MobileDashboard />;

  return (
    <div className="relative space-y-6 pb-10 animate-in fade-in duration-500">
      <SafePanel>
        <DashboardHeader />
      </SafePanel>
      <SafePanel>
        <DashboardKpiStrip />
      </SafePanel>
      <DashboardSectionRail />
      <SafePanel>
        <section className="relative overflow-hidden rounded-[1.75rem] border border-primary/15 bg-gradient-to-r from-primary/[0.08] via-background to-[var(--alexos-purple)]/[0.08] p-5 shadow-[0_20px_50px_-35px_var(--alexos-glow)] sm:p-6">
          <div className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
          <div className="relative grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.75fr)] lg:items-center">
            <div>
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                Your command center
              </div>
              <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
                Know what matters. Act on it.
              </h2>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
                Live signals, priorities, money and business performance in one view.
              </p>
            </div>
            <IntelligenceSearch />
          </div>
        </section>
      </SafePanel>
      <section className="grid gap-5 2xl:grid-cols-12">
        <div className="space-y-5 2xl:col-span-8">
          <SafePanel>
            <section
              id="dashboard-money"
              className="alexos-surface scroll-mt-24 rounded-[1.75rem] border border-border/60 p-5 shadow-[0_18px_50px_-35px_var(--alexos-glow)] sm:p-6"
            >
              <div className="mb-5">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                  Money
                </p>
                <h2 className="mt-1 text-2xl font-semibold tracking-tight">
                  Know where you stand.
                </h2>
                <p className="text-sm text-muted-foreground">
                  Cash, commitments and financial momentum — without the noise.
                </p>
              </div>
              <MoneySnapshot />
              <div className="mt-5 grid gap-5 2xl:grid-cols-[minmax(0,1.45fr)_minmax(260px,0.55fr)]">
                <MoneyFlowChart />
                <div className="rounded-[1.75rem] border border-border/60 bg-card/70 p-5 shadow-sm sm:p-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                    Reading the numbers
                  </p>
                  <h3 className="mt-2 text-lg font-semibold tracking-tight">
                    Cash in, cash out, and what remains
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Income increases the receiving account and operating result. Expenses reduce
                    cash and profit once. Transfers between your own accounts change location, not
                    profit.
                  </p>
                  <div className="mt-5 space-y-3 text-xs text-muted-foreground">
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-emerald-500/12 text-emerald-600 dark:text-emerald-300">
                        1
                      </span>
                      <span>
                        Confirm a customer payment against the exact account that received it.
                      </span>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-amber-500/12 text-amber-600 dark:text-amber-300">
                        2
                      </span>
                      <span>
                        Record supplier, delivery, and advertising costs as separate expenses.
                      </span>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-violet-500/12 text-violet-600 dark:text-violet-300">
                        3
                      </span>
                      <span>
                        Use Transfers when money moves from I&amp;M to M-Pesa or another business
                        account.
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </SafePanel>
          <div className="grid gap-5 lg:grid-cols-2">
            <section id="dashboard-priorities" className="scroll-mt-24">
              <SafePanel>
                <TodaysMission />
              </SafePanel>
            </section>
            <section id="dashboard-auren" className="scroll-mt-24">
              <SafePanel>
                <section className="relative h-full overflow-hidden rounded-[1.75rem] border border-[var(--alexos-purple)]/20 bg-gradient-to-br from-[var(--alexos-purple)]/[0.12] via-card to-primary/[0.05] p-5 shadow-[0_18px_50px_-35px_var(--alexos-glow)] sm:p-6">
                  <div className="pointer-events-none absolute -right-14 -top-16 h-40 w-40 rounded-full bg-[var(--alexos-purple)]/15 blur-3xl" />
                  <div className="relative mb-4 flex items-end justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-600 dark:text-violet-300">
                        Auren
                      </p>
                      <h2 className="mt-1 text-xl font-semibold tracking-tight">
                        What deserves your attention?
                      </h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Signals first. Noise later.
                      </p>
                    </div>
                    <Link
                      to="/auren"
                      className="inline-flex shrink-0 items-center text-xs font-semibold text-primary hover:underline"
                    >
                      Open Auren <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
                    </Link>
                  </div>
                  <IntelligenceFeed />
                </section>
              </SafePanel>
            </section>
          </div>
          <SafePanel>
            <section id="dashboard-activity" className="scroll-mt-24">
              <RecentActivity />
            </section>
          </SafePanel>
        </div>
        <div className="space-y-5 2xl:col-span-4">
          <SafePanel>
            <section
              id="dashboard-business"
              className="relative scroll-mt-24 overflow-hidden rounded-[1.75rem] border border-primary/15 bg-gradient-to-br from-card via-card to-primary/[0.08] p-5 shadow-[0_18px_50px_-35px_var(--alexos-glow)] sm:p-6"
            >
              <div className="alexos-visual-strip absolute inset-x-0 top-0 h-1 opacity-80" />
              <div className="relative mb-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--alexos-purple)]">
                  Business
                </p>
                <h2 className="mt-1 text-xl font-semibold tracking-tight">
                  Build what moves you forward.
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Customers, sales, revenue and growth.
                </p>
              </div>
              <BusinessSnapshot />
            </section>
          </SafePanel>
          <section id="dashboard-actions" className="scroll-mt-24">
            <SafePanel>
              <QuickActions />
            </SafePanel>
          </section>
        </div>
      </section>
      <SafePanel>
        <section
          id="dashboard-modules"
          className="scroll-mt-24 space-y-5 rounded-[1.75rem] border border-border/60 bg-card/45 p-5 shadow-sm sm:p-6"
        >
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Your operating system
              </p>
              <h2 className="text-2xl font-semibold tracking-tight">
                Everything you need. One place.
              </h2>
            </div>
            <span className="text-xs text-muted-foreground">
              {navModules.length} modules available
            </span>
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
                  {navModules
                    .filter((m) => m.group === group)
                    .map((m) => (
                      <Link key={m.url} to={m.url} className="group">
                        <Card className="h-full rounded-3xl border-border/60 bg-card/80 transition-all duration-200 hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5">
                          <CardContent className="space-y-4 p-5">
                            <div className="flex items-center justify-between">
                              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-[var(--alexos-purple)]/15 text-primary ring-1 ring-primary/10">
                                <m.icon className="h-5 w-5" />
                              </div>
                              <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold">{m.title}</p>
                              <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-muted-foreground">
                                {m.description}
                              </p>
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
      </SafePanel>
      <div id="dashboard-footer" className="scroll-mt-24">
        <AlexosDashboardFooter />
      </div>
    </div>
  );
}
