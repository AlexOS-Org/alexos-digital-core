import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlexOSErrorState } from "@/components/alexos/states";
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
        <Card>
          <CardContent>
            <AlexOSErrorState
              title="This panel is still loading"
              description="The rest of your command center is available. Reload the page if it keeps failing."
              onRetry={() => this.setState({ hasError: false })}
            />
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
      className="dashboard-surface sticky top-3 z-20 flex flex-col gap-2 rounded-xl p-2 sm:flex-row sm:items-center sm:justify-between"
    >
      <span className="alexos-eyebrow shrink-0 px-2">Jump to a working view</span>
      <div className="flex min-w-0 gap-1 overflow-x-auto">
        {sections.map(([label, href]) => (
          <a
            key={href}
            href={href}
            className="alexos-focusable shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
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
    <div className="dashboard-canvas space-y-5 pb-10">
      <MobileDashboardHeader />
      <MobileAurenBriefing />
      <SafePanel>
        <TodaysMission compact />
      </SafePanel>
      <MobileMetricTiles />
      <MobileRevenueToday />
      <section id="dashboard-money-mobile" className="scroll-mt-24">
        <SafePanel>
          <MoneyFlowChart />
        </SafePanel>
      </section>
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
    <div className="dashboard-canvas relative space-y-6 pb-10 animate-in fade-in duration-500">
      <SafePanel>
        <DashboardHeader />
      </SafePanel>
      <SafePanel>
        <DashboardKpiStrip />
      </SafePanel>
      <DashboardSectionRail />
      <SafePanel>
        <section className="dashboard-feature-surface rounded-xl p-5 sm:p-6">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.75fr)] lg:items-center">
            <div>
              <p className="alexos-eyebrow alexos-eyebrow-accent mb-2 flex items-center gap-2">
                <Sparkles aria-hidden="true" className="size-3.5" />
                Your command center
              </p>
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
              className="dashboard-surface scroll-mt-24 rounded-xl p-5 sm:p-6"
            >
              <div className="mb-5">
                <p className="alexos-eyebrow alexos-eyebrow-accent">Money</p>
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
                <div className="dashboard-surface-muted rounded-xl p-5 sm:p-6">
                  <p className="alexos-eyebrow alexos-eyebrow-accent">Reading the numbers</p>
                  <h3 className="mt-2 text-lg font-semibold tracking-tight">
                    Cash in, cash out, and what remains
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Income increases the receiving account and operating result. Expenses reduce
                    cash and profit once. Transfers between your own accounts change location, not
                    profit.
                  </p>
                  <ol className="mt-5 space-y-3 text-xs text-muted-foreground">
                    <li className="flex items-start gap-3">
                      <span
                        data-tone="income"
                        className="alexos-tone-bg alexos-tone-text mt-0.5 grid size-7 shrink-0 place-items-center rounded-full text-[11px] font-bold"
                      >
                        1
                      </span>
                      <span>
                        Confirm a customer payment against the exact account that received it.
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span
                        data-tone="warning"
                        className="alexos-tone-bg alexos-tone-text mt-0.5 grid size-7 shrink-0 place-items-center rounded-full text-[11px] font-bold"
                      >
                        2
                      </span>
                      <span>
                        Record supplier, delivery, and advertising costs as separate expenses.
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span
                        data-tone="info"
                        className="alexos-tone-bg alexos-tone-text mt-0.5 grid size-7 shrink-0 place-items-center rounded-full text-[11px] font-bold"
                      >
                        3
                      </span>
                      <span>
                        Use Transfers when money moves from I&amp;M to M-Pesa or another business
                        account.
                      </span>
                    </li>
                  </ol>
                </div>
              </div>
            </section>
          </SafePanel>
          <div className="space-y-5">
            <section id="dashboard-priorities" className="scroll-mt-24">
              <SafePanel>
                <TodaysMission compact />
              </SafePanel>
            </section>
            <section id="dashboard-auren" className="scroll-mt-24">
              <SafePanel>
                <section className="dashboard-feature-surface h-full rounded-xl p-4 sm:p-5 lg:p-6">
                  <div className="mb-3 flex items-center justify-between gap-3 sm:mb-4">
                    <div>
                      <p
                        data-tone="info"
                        className="alexos-eyebrow alexos-tone-text flex items-center gap-2"
                      >
                        Auren
                      </p>
                      <h2 className="mt-1 text-lg font-semibold tracking-tight sm:text-xl">
                        What deserves your attention?
                      </h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Signals first. Noise later.
                      </p>
                    </div>
                    <Link
                      to="/auren"
                      className="alexos-focusable inline-flex shrink-0 items-center text-xs font-semibold text-primary hover:underline"
                    >
                      Open Auren
                      <ArrowUpRight aria-hidden="true" className="ml-1 size-3.5" />
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
              className="dashboard-surface relative scroll-mt-24 rounded-xl p-5 sm:p-6"
            >
              <div className="alexos-visual-strip absolute inset-x-0 top-0 h-1 opacity-80" />
              <div className="relative mb-4">
                <p className="alexos-eyebrow text-[var(--alexos-purple)]">Business</p>
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
          className="dashboard-surface scroll-mt-24 space-y-5 rounded-xl p-5 sm:p-6"
        >
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="alexos-eyebrow">Your operating system</p>
              <h2 className="text-2xl font-semibold tracking-tight">
                Everything you need. One place.
              </h2>
            </div>
            <span className="text-xs text-muted-foreground">
              {navModules.length} modules available
            </span>
          </div>
          <Tabs defaultValue={moduleGroups[0]} className="space-y-5">
            <TabsList className="flex h-auto w-full justify-start gap-1 overflow-x-auto rounded-xl border border-border/60 bg-muted/50 p-1">
              {moduleGroups.map((group) => (
                <TabsTrigger key={group} value={group} className="rounded-lg px-4 py-2">
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
                      <Link
                        key={m.url}
                        to={m.url}
                        className="alexos-focusable group block rounded-xl"
                      >
                        <Card className="dashboard-surface alexos-card-interactive h-full">
                          <CardContent className="space-y-4 p-5">
                            <div className="flex items-center justify-between">
                              <div className="grid size-11 place-items-center rounded-lg bg-primary/10 text-primary">
                                <m.icon aria-hidden="true" className="size-5" />
                              </div>
                              <ArrowUpRight
                                aria-hidden="true"
                                className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
                              />
                            </div>
                            <div>
                              <p className="text-sm font-semibold">{m.title}</p>
                              <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-muted-foreground">
                                {m.description}
                              </p>
                            </div>
                            <span className="alexos-badge alexos-badge-outline">{m.group}</span>
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
