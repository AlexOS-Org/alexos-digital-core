import { useMemo, useState } from "react";
import { ArrowDownRight, ArrowUpRight, RefreshCw, Sparkles, Wallet } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAccounts, useExpected, useTransactions } from "@/lib/money/api";
import { formatMoney } from "@/lib/money/format";
import { computeWeeklyFinancials, getWeekBoundaries } from "@/lib/reports/weekly-performance";
import { cn } from "@/lib/utils";
import { useBalanceVisibility } from "@/components/money/BalanceVisibility";

export function WeeklyCashSummary() {
  const [offsetWeeks, setOffsetWeeks] = useState<0 | -1>(0);
  const { maskBalance } = useBalanceVisibility();
  const period = useMemo(() => getWeekBoundaries(new Date(), offsetWeeks), [offsetWeeks]);
  const {
    data: transactions = [],
    isLoading: transactionsLoading,
    refetch: refetchTransactions,
  } = useTransactions({});
  const {
    data: accounts = [],
    isLoading: accountsLoading,
    refetch: refetchAccounts,
  } = useAccounts();
  const {
    data: expected = [],
    isLoading: expectedLoading,
    refetch: refetchExpected,
  } = useExpected();

  const previousPeriod = useMemo(
    () => getWeekBoundaries(new Date(), (offsetWeeks - 1) as -1),
    [offsetWeeks],
  );
  const summary = useMemo(
    () => computeWeeklyFinancials(transactions, accounts, expected, period.from, period.until),
    [transactions, accounts, expected, period.from, period.until],
  );
  const previousSummary = useMemo(
    () =>
      computeWeeklyFinancials(
        transactions,
        accounts,
        expected,
        previousPeriod.from,
        previousPeriod.until,
      ),
    [transactions, accounts, expected, previousPeriod.from, previousPeriod.until],
  );
  const loading = transactionsLoading || accountsLoading || expectedLoading;
  const money = (value: number | null) =>
    value === null ? "Unavailable" : maskBalance(formatMoney(value, summary.currency ?? "KES"));

  return (
    <Card className="rounded-[1.5rem] border-border/60 shadow-sm">
      <CardHeader className="gap-4 pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">Weekly Cash Summary</CardTitle>
            <Badge variant="outline" className="text-xs">
              {period.label}
            </Badge>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Posted Money Center activity from {period.formattedRange}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-xl border border-border/60 bg-muted/40 p-1">
            <Button
              type="button"
              size="sm"
              variant={offsetWeeks === 0 ? "secondary" : "ghost"}
              className="h-8 rounded-lg text-xs"
              onClick={() => setOffsetWeeks(0)}
            >
              This Week
            </Button>
            <Button
              type="button"
              size="sm"
              variant={offsetWeeks === -1 ? "secondary" : "ghost"}
              className="h-8 rounded-lg text-xs"
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
            title="Refresh weekly cash summary"
            onClick={() => {
              void Promise.all([refetchTransactions(), refetchAccounts(), refetchExpected()]);
            }}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!summary.isMixedCurrency && !loading && (
          <PerformancePulse
            currentNet={summary.netCashFlow}
            previousNet={previousSummary.netCashFlow}
            currentExpenses={summary.expenses}
            previousExpenses={previousSummary.expenses}
            money={money}
          />
        )}
        {summary.isMixedCurrency ? (
          <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-900 dark:text-amber-100">
            <p className="font-semibold">Multiple currencies detected</p>
            <p className="mt-1 text-xs">{summary.warning}</p>
          </div>
        ) : loading ? (
          <div className="grid gap-3 sm:grid-cols-3">
            {["inflow", "expenditure", "net"].map((key) => (
              <div key={key} className="h-24 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-3">
            <CashMetric
              label="Cash Inflow"
              value={money(summary.income)}
              comparison={compare(summary.income, previousSummary.income, money)}
              hint="Posted income"
              icon={ArrowUpRight}
              className="text-emerald-600 dark:text-emerald-400"
            />
            <CashMetric
              label="Expenditure"
              value={money(summary.expenses)}
              comparison={compare(summary.expenses, previousSummary.expenses, money)}
              hint="Posted expenses"
              icon={ArrowDownRight}
              className="text-rose-600 dark:text-rose-400"
            />
            <CashMetric
              label="Net Cash Flow"
              value={money(summary.netCashFlow)}
              comparison={compare(summary.netCashFlow, previousSummary.netCashFlow, money)}
              hint={`${summary.transactionCount} posted transaction${summary.transactionCount === 1 ? "" : "s"}`}
              icon={Wallet}
              className={cn(
                summary.netCashFlow !== null && summary.netCashFlow >= 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-rose-600 dark:text-rose-400",
              )}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CashMetric({
  label,
  value,
  comparison,
  hint,
  icon: Icon,
  className,
}: {
  label: string;
  value: string;
  comparison: string;
  hint: string;
  icon: LucideIcon;
  className: string;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <Icon className={cn("h-4 w-4", className)} />
      </div>
      <p className="mt-2 text-xl font-semibold tabular-nums text-foreground">{value}</p>
      <p className="mt-1 text-[11px] font-medium text-muted-foreground">{comparison}</p>
      <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>
    </div>
  );
}

function PerformancePulse({
  currentNet,
  previousNet,
  currentExpenses,
  previousExpenses,
  money,
}: {
  currentNet: number | null;
  previousNet: number | null;
  currentExpenses: number | null;
  previousExpenses: number | null;
  money: (value: number | null) => string;
}) {
  const netChange = currentNet !== null && previousNet !== null ? currentNet - previousNet : null;
  const expenseChange =
    currentExpenses !== null && previousExpenses !== null
      ? currentExpenses - previousExpenses
      : null;
  const improved =
    netChange !== null && netChange >= 0 && (expenseChange === null || expenseChange <= 0);
  const title = improved ? "Performance improved" : "Performance needs attention";
  const detail =
    netChange === null
      ? "Add posted activity in both periods to unlock a complete performance read."
      : `${netChange >= 0 ? "Net cash flow improved" : "Net cash flow declined"} by ${money(Math.abs(netChange))} versus last week${expenseChange !== null ? `, while expenditure ${expenseChange <= 0 ? "fell" : "rose"} by ${money(Math.abs(expenseChange))}.` : "."}`;

  return (
    <div
      className={cn(
        "mb-4 flex items-start gap-3 rounded-2xl border p-4",
        improved
          ? "border-emerald-500/25 bg-gradient-to-r from-emerald-500/10 via-card to-cyan-500/5"
          : "border-amber-500/25 bg-gradient-to-r from-amber-500/10 via-card to-rose-500/5",
      )}
    >
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-background/80 shadow-sm">
        <Sparkles
          className={cn(
            "h-4 w-4",
            improved
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-amber-600 dark:text-amber-400",
          )}
        />
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{detail}</p>
      </div>
    </div>
  );
}

function compare(
  current: number | null,
  previous: number | null,
  money: (value: number | null) => string,
): string {
  if (current === null || previous === null) return "vs last week: unavailable";
  const difference = current - previous;
  const percentage =
    previous === 0 ? (current === 0 ? 0 : null) : (difference / Math.abs(previous)) * 100;
  const direction = difference > 0 ? "+" : "";
  const change = percentage === null ? "new activity" : `${direction}${percentage.toFixed(0)}%`;
  return `vs last week: ${money(previous)} (${change})`;
}
