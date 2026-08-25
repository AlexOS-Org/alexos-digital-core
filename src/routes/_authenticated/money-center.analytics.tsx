import { lazy, Suspense, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useAccountBalances,
  useAccounts,
  useBudgets,
  useExpected,
  useTransactions,
} from "@/lib/money/api";
import { formatMoney, monthKey } from "@/lib/money/format";
import { normalizeExpenseCategory } from "@/lib/money/constants";

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

  const expectedVsReceived = useMemo(() => {
    const pending = expected
      .filter((e) => e.status === "pending")
      .reduce((sum, e) => sum + Number(e.amount), 0);
    const received = expected
      .filter((e) => e.status === "received")
      .reduce((sum, e) => sum + Number(e.amount), 0);
    const cancelled = expected
      .filter((e) => e.status === "cancelled")
      .reduce((sum, e) => sum + Number(e.amount), 0);
    return [
      { name: "Pending", value: pending },
      { name: "Received", value: received },
      { name: "Cancelled", value: cancelled },
    ];
  }, [expected]);

  const money = (value: number) => formatMoney(value);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
        <p className="text-sm text-muted-foreground">Visual insights across your money.</p>
      </header>
      <Suspense fallback={<ChartsLoadingState />}>
        <MoneyCenterCharts
          monthly={monthly}
          byCategory={byCategory}
          bySource={bySource}
          budgetActual={budgetActual}
          accountBalanceData={accountBalanceData}
          netWorthTrend={netWorthTrend}
          expectedVsReceived={expectedVsReceived}
          expectedCount={expected.length}
          money={money}
        />
      </Suspense>
    </div>
  );
}

function ChartsLoadingState() {
  return (
    <div className="grid gap-4 lg:grid-cols-2" aria-label="Loading analytics charts">
      {Array.from({ length: 8 }, (_, index) => (
        <Card key={index} className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base">Loading chart…</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[260px] animate-pulse rounded-xl bg-muted" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
