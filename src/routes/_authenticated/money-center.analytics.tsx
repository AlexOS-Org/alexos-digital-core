import { lazy, Suspense, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlexOSPageHeader } from "@/components/alexos/page-header";
import {
  useAccountBalances,
  useAccounts,
  useBudgets,
  useExpected,
  useTransactions,
} from "@/lib/money/api";
import { formatMoney, monthKey } from "@/lib/money/format";
import { normalizeExpenseCategory } from "@/lib/money/constants";
import { summarizeCurrencySafety } from "@/lib/money/currency-safety";
import { aggregateExpectedMoney } from "@/lib/money/expected-money";

const MoneyCenterCharts = lazy(() =>
  import("@/components/money/MoneyCenterCharts").then((module) => ({
    default: module.MoneyCenterCharts,
  })),
);

export const Route = createFileRoute("/_authenticated/money-center/analytics")({
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const { data: txs = [] } = useTransactions({});
  const { data: accounts = [] } = useAccounts();
  const { data: balances = [] } = useAccountBalances();
  const { data: budgets = [] } = useBudgets(monthKey());
  const { data: expected = [] } = useExpected();
  const currencySafety = useMemo(() => summarizeCurrencySafety(accounts), [accounts]);

  const monthly = useMemo(() => {
    const map = new Map<string, { month: string; income: number; expense: number }>();
    for (const t of txs) {
      if (t.type !== "income" && t.type !== "expense") continue;
      const d = new Date(t.occurred_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const row = map.get(key) ?? { month: key, income: 0, expense: 0 };
      if (t.type === "income") row.income += Number(t.amount);
      else row.expense += Number(t.amount);
      map.set(key, row);
    }
    return [...map.values()]
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12)
      .map((r) => ({ ...r, cashflow: r.income - r.expense }));
  }, [txs]);

  const byCategory = useMemo(() => {
    const map: Record<string, number> = {};
    for (const t of txs) {
      if (t.type !== "expense") continue;
      const key = normalizeExpenseCategory(t.category);
      map[key] = (map[key] ?? 0) + Number(t.amount);
    }
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [txs]);

  const bySource = useMemo(() => {
    const map: Record<string, number> = {};
    for (const t of txs) {
      if (t.type !== "income") continue;
      const key = t.source ?? "Other";
      map[key] = (map[key] ?? 0) + Number(t.amount);
    }
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [txs]);

  const budgetActual = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const spent: Record<string, number> = {};
    for (const t of txs) {
      if (t.type !== "expense" || new Date(t.occurred_at) < monthStart) continue;
      const key = normalizeExpenseCategory(t.category);
      spent[key] = (spent[key] ?? 0) + Number(t.amount);
    }
    return budgets.map((b) => ({
      name: b.category,
      budget: Number(b.amount),
      actual: spent[b.category] ?? 0,
    }));
  }, [txs, budgets]);

  const accountBalanceData = balances.map((b) => ({
    name: accounts.find((a) => a.id === b.account_id)?.name ?? "?",
    balance: Number(b.balance),
  }));

  const netWorthTrend = useMemo(() => {
    const sorted = [...txs]
      .filter((t) => t.status === "posted")
      .sort((a, b) => new Date(a.occurred_at).getTime() - new Date(b.occurred_at).getTime());
    const opening = accounts.reduce((sum, account) => sum + Number(account.opening_balance), 0);
    let running = opening;
    const map = new Map<string, number>();
    for (const t of sorted) {
      const key = t.occurred_at.slice(0, 10);
      if (t.type === "income") running += Number(t.amount);
      else if (t.type === "expense") running -= Number(t.amount);
      else if (t.type === "adjustment") running += Number(t.amount);
      map.set(key, running);
    }
    return [...map.entries()].slice(-60).map(([date, value]) => ({ date, value }));
  }, [txs, accounts]);

  const expectedSummary = useMemo(() => {
    const pending = aggregateExpectedMoney(expected, accounts, (item) => item.status === "pending");
    const received = aggregateExpectedMoney(
      expected,
      accounts,
      (item) => item.status === "received",
    );
    const cancelled = aggregateExpectedMoney(
      expected,
      accounts,
      (item) => item.status === "cancelled",
    );
    if (pending === null || received === null || cancelled === null) {
      return { data: [], unavailable: true };
    }
    return {
      data: [
        { name: "Pending", value: pending },
        { name: "Received", value: received },
        { name: "Cancelled", value: cancelled },
      ],
      unavailable: false,
    };
  }, [expected, accounts]);

  const money = (value: number) => formatMoney(value);

  return (
    <div className="space-y-6">
      <AlexOSPageHeader
        title="Analytics"
        description="Visual trends across your money — cashflow, category spend, income sources, budget usage and net worth."
        breadcrumbs={[{ label: "Money Center", to: "/money-center" }, { label: "Analytics" }]}
      />
      {currencySafety.isMixed ? (
        <div
          role="alert"
          data-tone="warning"
          className="alexos-tone-bg alexos-tone-border flex items-start gap-2.5 rounded-xl border px-4 py-3"
        >
          <AlertTriangle aria-hidden="true" className="alexos-tone-text mt-0.5 size-4 shrink-0" />
          <p className="alexos-tone-text text-sm">
            Analytics totals are unavailable because active accounts use multiple currencies. Review
            each account separately rather than combining values as KES.
          </p>
        </div>
      ) : (
        <Suspense fallback={<ChartsLoadingState />}>
          <MoneyCenterCharts
            monthly={monthly}
            byCategory={byCategory}
            bySource={bySource}
            budgetActual={budgetActual}
            accountBalanceData={accountBalanceData}
            netWorthTrend={netWorthTrend}
            expectedVsReceived={expectedSummary.data}
            expectedUnavailable={expectedSummary.unavailable}
            expectedCount={expected.length}
            money={money}
          />
        </Suspense>
      )}
    </div>
  );
}

function ChartsLoadingState() {
  return (
    <div className="grid gap-4 lg:grid-cols-2" role="status" aria-live="polite">
      <span className="sr-only">Loading analytics charts</span>
      {Array.from({ length: 8 }, (_, index) => (
        <Card key={index}>
          <CardHeader>
            <CardTitle className="text-base">Loading chart…</CardTitle>
          </CardHeader>
          <CardContent>
            <div aria-hidden="true" className="h-[260px] animate-pulse rounded-lg bg-muted" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
