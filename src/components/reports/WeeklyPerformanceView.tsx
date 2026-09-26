import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  Bell,
  CheckCircle2,
  Clock,
  HelpCircle,
  Info,
  RefreshCw,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAccounts, useDeliveryPrepayments, useExpected, useTransactions } from "@/lib/money/api";
import { formatMoney } from "@/lib/money/format";
import { getDailyGearProfitCashFlow } from "@/lib/dailygear/profit-cash-flow.functions";
import type { DailyGearProfitCashFlowResponse } from "@/lib/dailygear/profit-cash-flow.server";
import { supabase } from "@/integrations/supabase/client";
import {
  computeWeeklyFinancials,
  generateAurenWeeklyObservations,
  getWeekBoundaries,
  getWeeklySummaryPreference,
  summarizeWeeklyEcommerce,
  summarizeWeeklyWebVitals,
  type WebVitalRawEvent,
} from "@/lib/reports/weekly-performance";

export function WeeklyPerformanceView() {
  const [offsetWeeks, setOffsetWeeks] = useState<0 | -1>(0);
  const [refreshNonce, setRefreshNonce] = useState(0);

  // Week period computation
  const period = useMemo(() => getWeekBoundaries(new Date(), offsetWeeks), [offsetWeeks]);

  // Financial data hooks
  const { data: transactions = [], isLoading: txLoading } = useTransactions({});
  const { data: accounts = [], isLoading: accountsLoading } = useAccounts();
  const { data: expected = [], isLoading: expectedLoading } = useExpected();
  const previousPeriod = useMemo(() => getWeekBoundaries(new Date(), -1), []);
  const { data: courierPrepayments = [], isLoading: courierLoading } = useDeliveryPrepayments(
    previousPeriod.from,
    period.until,
  );

  // E-commerce state
  const [ecommerceData, setEcommerceData] = useState<DailyGearProfitCashFlowResponse | null>(null);
  const [ecommerceLoading, setEcommerceLoading] = useState(true);
  const [ecommerceError, setEcommerceError] = useState<string | null>(null);

  // Web Vitals state
  const [vitalsEvents, setVitalsEvents] = useState<WebVitalRawEvent[]>([]);
  const [vitalsLoading, setVitalsLoading] = useState(true);

  // Preference status
  const [weeklyPref, setWeeklyPref] = useState(true);

  useEffect(() => {
    setWeeklyPref(getWeeklySummaryPreference());
  }, []);

  // Fetch DailyGear E-Commerce financials for the week
  useEffect(() => {
    let active = true;
    setEcommerceLoading(true);
    setEcommerceError(null);

    getDailyGearProfitCashFlow({
      data: {
        from: period.from,
        until: period.until,
        includeInsights: true,
        maxPages: 10,
      },
    })
      .then((res) => {
        if (active) setEcommerceData(res);
      })
      .catch((err: unknown) => {
        if (active) {
          setEcommerceData(null);
          setEcommerceError(
            err instanceof Error ? err.message : "Failed to load e-commerce weekly performance.",
          );
        }
      })
      .finally(() => {
        if (active) setEcommerceLoading(false);
      });

    return () => {
      active = false;
    };
  }, [period.from, period.until, refreshNonce]);

  // Fetch Web Vitals events for the week
  useEffect(() => {
    let active = true;
    setVitalsLoading(true);

    void supabase
      .from("web_vitals_events")
      .select("metric_name, metric_rating, metric_value, created_at")
      .gte("created_at", `${period.from}T00:00:00Z`)
      .lte("created_at", `${period.until}T23:59:59Z`)
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          setVitalsEvents([]);
        } else {
          setVitalsEvents(
            (data ?? []).map((row) => ({
              metric_name: String(row.metric_name),
              metric_rating: String(row.metric_rating),
              metric_value: Number(row.metric_value),
              created_at: String(row.created_at),
            })),
          );
        }
        setVitalsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [period.from, period.until, refreshNonce]);

  // Derived summaries
  const financialSummary = useMemo(
    () =>
      computeWeeklyFinancials(
        transactions,
        accounts,
        expected,
        period.from,
        period.until,
        courierPrepayments,
      ),
    [transactions, accounts, expected, period.from, period.until, courierPrepayments],
  );

  const ecommerceSummary = useMemo(() => summarizeWeeklyEcommerce(ecommerceData), [ecommerceData]);

  const vitalsSummary = useMemo(() => summarizeWeeklyWebVitals(vitalsEvents), [vitalsEvents]);

  const aurenObservations = useMemo(
    () => generateAurenWeeklyObservations(financialSummary, ecommerceSummary, vitalsSummary),
    [financialSummary, ecommerceSummary, vitalsSummary],
  );

  const isInitialLoading = txLoading || accountsLoading || expectedLoading || courierLoading;

  return (
    <div className="space-y-6">
      {/* Period Selector & Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              Weekly Performance
            </h2>
            <Badge variant="outline" className="text-xs">
              {period.label}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Reporting period:{" "}
            <span className="font-medium text-foreground">{period.formattedRange}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-xl border border-border/60 bg-muted/40 p-1">
            <Button
              type="button"
              size="sm"
              variant={offsetWeeks === 0 ? "secondary" : "ghost"}
              className="h-8 rounded-lg text-xs font-medium"
              onClick={() => setOffsetWeeks(0)}
            >
              This Week
            </Button>
            <Button
              type="button"
              size="sm"
              variant={offsetWeeks === -1 ? "secondary" : "ghost"}
              className="h-8 rounded-lg text-xs font-medium"
              onClick={() => setOffsetWeeks(-1)}
            >
              Last Week
            </Button>
          </div>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-9 w-9 rounded-xl border border-border/60"
            title="Refresh weekly data"
            onClick={() => setRefreshNonce((n) => n + 1)}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Notification preference banner */}
      <div className="flex items-start gap-3 rounded-2xl border border-border/60 bg-card/60 p-4 text-xs text-muted-foreground">
        <Bell className="mt-0.5 h-4 w-4 text-primary shrink-0" />
        <div>
          <span className="font-medium text-foreground">
            Weekly Summary is {weeklyPref ? "enabled" : "disabled"} on this device.
          </span>{" "}
          Push, email, and WhatsApp delivery channels are not connected yet. This in-app report
          reflects verified live data.
        </div>
      </div>

      {/* Mixed currency warning */}
      {financialSummary.isMixedCurrency && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-900 dark:text-amber-100"
        >
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
          <div>
            <p className="font-semibold">Multi-Currency Protection Active</p>
            <p className="mt-0.5 text-xs text-amber-800 dark:text-amber-200">
              {financialSummary.warning}
            </p>
          </div>
        </div>
      )}

      {/* Financial Performance Section */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Banknote className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
            Financial Performance
          </h3>
        </div>

        {isInitialLoading ? (
          <div className="grid gap-4 sm:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="rounded-2xl border-border/60">
                <CardContent className="p-5">
                  <div className="h-4 w-20 animate-pulse rounded bg-muted" />
                  <div className="mt-3 h-7 w-32 animate-pulse rounded bg-muted" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : !financialSummary.hasTransactions ? (
          <Card className="rounded-2xl border-dashed border-border/60">
            <CardContent className="flex flex-col items-center justify-center p-8 text-center">
              <Clock className="h-8 w-8 text-muted-foreground/50" />
              <p className="mt-2 font-medium text-foreground">
                No posted financial activity this week
              </p>
              <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                No income, expense, or transfer records were posted between {period.from} and{" "}
                {period.until}.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-3">
            {/* Income */}
            <Card className="rounded-2xl border-border/60">
              <CardHeader className="p-5 pb-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Weekly Income</span>
                  <ArrowUpRight className="h-4 w-4 text-emerald-500" />
                </div>
              </CardHeader>
              <CardContent className="p-5 pt-0">
                <p className="text-2xl font-bold tabular-nums text-foreground">
                  {financialSummary.income !== null
                    ? formatMoney(financialSummary.income, financialSummary.currency || "KES")
                    : "Unavailable"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  From posted income transactions
                </p>
              </CardContent>
            </Card>

            {/* Expenses */}
            <Card className="rounded-2xl border-border/60">
              <CardHeader className="p-5 pb-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Weekly Expenses</span>
                  <ArrowDownRight className="h-4 w-4 text-rose-500" />
                </div>
              </CardHeader>
              <CardContent className="p-5 pt-0">
                <p className="text-2xl font-bold tabular-nums text-foreground">
                  {financialSummary.expenses !== null
                    ? formatMoney(financialSummary.expenses, financialSummary.currency || "KES")
                    : "Unavailable"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  From posted expense transactions
                </p>
              </CardContent>
            </Card>

            {/* Net Cash Flow */}
            <Card className="rounded-2xl border-border/60">
              <CardHeader className="p-5 pb-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Net Cash Flow</span>
                  <Activity className="h-4 w-4 text-primary" />
                </div>
              </CardHeader>
              <CardContent className="p-5 pt-0">
                <p
                  className={`text-2xl font-bold tabular-nums ${
                    financialSummary.netCashFlow !== null && financialSummary.netCashFlow >= 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : financialSummary.netCashFlow !== null && financialSummary.netCashFlow < 0
                        ? "text-rose-600 dark:text-rose-400"
                        : "text-foreground"
                  }`}
                >
                  {financialSummary.netCashFlow !== null
                    ? formatMoney(financialSummary.netCashFlow, financialSummary.currency || "KES")
                    : "Unavailable"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Income minus expenses for the period
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Banknote className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Courier prepayments
          </h3>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="rounded-2xl border-border/60">
            <CardHeader className="p-5 pb-2">
              <span className="text-xs font-medium text-muted-foreground">Paid this period</span>
            </CardHeader>
            <CardContent className="p-5 pt-0">
              <p className="text-2xl font-bold tabular-nums text-foreground">
                {financialSummary.courierPrepaymentTotal !== null
                  ? formatMoney(
                      financialSummary.courierPrepaymentTotal,
                      financialSummary.currency || "KES",
                    )
                  : "No activity"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {financialSummary.courierPrepaymentCount} ledger payment
                {financialSummary.courierPrepaymentCount === 1 ? "" : "s"} posted
              </p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-border/60">
            <CardHeader className="p-5 pb-2">
              <span className="text-xs font-medium text-muted-foreground">Due on delivery</span>
            </CardHeader>
            <CardContent className="p-5 pt-0">
              <p className="text-2xl font-bold tabular-nums text-foreground">
                {financialSummary.courierAmountDue !== null
                  ? formatMoney(
                      financialSummary.courierAmountDue,
                      financialSummary.currency || "KES",
                    )
                  : "No balance"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Outstanding after courier prepayments
              </p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-border/60">
            <CardHeader className="p-5 pb-2">
              <span className="text-xs font-medium text-muted-foreground">Settlement rule</span>
            </CardHeader>
            <CardContent className="p-5 pt-0">
              <p className="text-sm font-semibold text-foreground">Separate from sales revenue</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Courier receipts are tagged independently in Money Center.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* E-Commerce (DailyGear) Performance Section */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <ShoppingBag className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
            E-Commerce Performance (DailyGear)
          </h3>
        </div>

        {ecommerceLoading ? (
          <div className="grid gap-4 sm:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="rounded-2xl border-border/60">
                <CardContent className="p-5">
                  <div className="h-4 w-20 animate-pulse rounded bg-muted" />
                  <div className="mt-3 h-7 w-28 animate-pulse rounded bg-muted" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : ecommerceError ? (
          <Card className="rounded-2xl border-border/60">
            <CardContent className="flex items-center gap-3 p-5 text-sm text-rose-600">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <span>{ecommerceError}</span>
            </CardContent>
          </Card>
        ) : !ecommerceSummary.hasOrders ? (
          <Card className="rounded-2xl border-dashed border-border/60">
            <CardContent className="flex flex-col items-center justify-center p-8 text-center">
              <ShoppingBag className="h-8 w-8 text-muted-foreground/50" />
              <p className="mt-2 font-medium text-foreground">No customer orders this week</p>
              <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                No customer orders were placed for DailyGear during this weekly period.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Orders */}
            <Card className="rounded-2xl border-border/60">
              <CardHeader className="p-4 pb-1">
                <span className="text-xs font-medium text-muted-foreground">Orders Placed</span>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-2xl font-bold tabular-nums text-foreground">
                  {ecommerceSummary.orders}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {ecommerceSummary.paidOrders} confirmed paid
                </p>
              </CardContent>
            </Card>

            {/* Recognized Revenue */}
            <Card className="rounded-2xl border-border/60">
              <CardHeader className="p-4 pb-1">
                <span className="text-xs font-medium text-muted-foreground">
                  Recognized Revenue
                </span>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-2xl font-bold tabular-nums text-foreground">
                  {ecommerceSummary.revenue !== null
                    ? formatMoney(ecommerceSummary.revenue, ecommerceSummary.currency || "KES")
                    : "No data"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">Excludes cancelled/refunded</p>
              </CardContent>
            </Card>

            {/* Operating Profit */}
            <Card className="rounded-2xl border-border/60">
              <CardHeader className="p-4 pb-1">
                <span className="text-xs font-medium text-muted-foreground">Operating Profit</span>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-2xl font-bold tabular-nums text-foreground">
                  {ecommerceSummary.operatingProfit !== null
                    ? formatMoney(
                        ecommerceSummary.operatingProfit,
                        ecommerceSummary.currency || "KES",
                      )
                    : "No data"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {ecommerceSummary.operatingMarginPct !== null
                    ? `${ecommerceSummary.operatingMarginPct.toFixed(1)}% operating margin`
                    : "After COGS and operating costs"}
                </p>
              </CardContent>
            </Card>

            {/* Meta Ads Spend */}
            <Card className="rounded-2xl border-border/60">
              <CardHeader className="p-4 pb-1">
                <span className="text-xs font-medium text-muted-foreground">Meta Ads Spend</span>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                {ecommerceSummary.metaSpendStatus === "available" &&
                ecommerceSummary.metaSpend !== null ? (
                  <>
                    <p className="text-2xl font-bold tabular-nums text-foreground">
                      {formatMoney(ecommerceSummary.metaSpend, ecommerceSummary.currency || "KES")}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">Meta Graph API verified</p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-semibold text-muted-foreground">Unavailable</p>
                    <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                      {ecommerceSummary.metaSpendReason || "Meta Ads sync not connected"}
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </section>

      {/* Operational Signals & Web Vitals Section */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
            Operational & Web Vitals Signals
          </h3>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Web Vitals Card */}
          <Card className="rounded-2xl border-border/60">
            <CardHeader className="p-5 pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">
                  Storefront Experience (Web Vitals)
                </CardTitle>
                <Badge variant="outline" className="text-xs">
                  /e-commerce
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-5 pt-0">
              {vitalsLoading ? (
                <div className="space-y-2">
                  <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                  <div className="h-4 w-48 animate-pulse rounded bg-muted" />
                </div>
              ) : vitalsSummary.status === "no_data" ? (
                <div className="flex items-start gap-3 text-xs text-muted-foreground">
                  <Info className="mt-0.5 h-4 w-4 text-muted-foreground shrink-0" />
                  <p>
                    No Web Vitals performance telemetry captured during this week. Telemetry records
                    authentically when signed-in users visit /e-commerce pages.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Total telemetry events:</span>
                    <span className="font-semibold text-foreground">
                      {vitalsSummary.totalEvents}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Badge
                      variant="secondary"
                      className="text-xs text-emerald-600 dark:text-emerald-400"
                    >
                      {vitalsSummary.goodCount} Good
                    </Badge>
                    <Badge
                      variant="secondary"
                      className="text-xs text-amber-600 dark:text-amber-400"
                    >
                      {vitalsSummary.needsImprovementCount} Needs Imp.
                    </Badge>
                    <Badge variant="secondary" className="text-xs text-rose-600 dark:text-rose-400">
                      {vitalsSummary.poorCount} Poor
                    </Badge>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Data Quality & Warnings Card */}
          <Card className="rounded-2xl border-border/60">
            <CardHeader className="p-5 pb-3">
              <CardTitle className="text-base font-semibold">Data Quality & Safeguards</CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-0">
              {ecommerceSummary.warnings.length === 0 ? (
                <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>
                    All recognized orders have verified costs and single-currency consistency.
                  </span>
                </div>
              ) : (
                <ul className="space-y-1 text-xs text-amber-700 dark:text-amber-300">
                  {ecommerceSummary.warnings.map((w, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      <span>{w}</span>
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-3 text-[11px] text-muted-foreground">
                No metric is ever estimated or fabricated. Missing signals are explicitly marked as
                unavailable.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Auren Verified Weekly Observations */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
            Auren Verified Perspectives
          </h3>
        </div>

        <Card className="rounded-2xl border-border/60 bg-card/60">
          <CardHeader className="p-5 pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">
                Weekly Intelligence Synthesis
              </CardTitle>
              <Badge variant="outline" className="text-xs">
                Verified Data Only
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-5 pt-0 space-y-3">
            {aurenObservations.map((obs) => (
              <div
                key={obs.id}
                className="flex items-start gap-3 rounded-xl border border-border/40 bg-background/50 p-3"
              >
                {obs.tone === "positive" ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-500 shrink-0" />
                ) : obs.tone === "attention" ? (
                  <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-500 shrink-0" />
                ) : (
                  <HelpCircle className="mt-0.5 h-4 w-4 text-muted-foreground shrink-0" />
                )}
                <div className="space-y-0.5">
                  <p className="text-xs font-semibold text-foreground">{obs.title}</p>
                  <p className="text-xs text-muted-foreground">{obs.detail}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
