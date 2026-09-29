import { lazy, Suspense, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlexOSPageHeader } from "@/components/alexos/page-header";
import {
  useAccountBalances,
  useAccounts,
  useAssets,
  useCryptoHoldings,
  useBudgets,
  useExpected,
  useTransactions,
} from "@/lib/money/api";
import { useMoneyCenterScope } from "@/lib/money/scope";
import { useDebts } from "@/lib/debts/api";
import { formatMoney, monthKey } from "@/lib/money/format";
import { normalizeExpenseCategory } from "@/lib/money/constants";
import { summarizeCurrencySafety } from "@/lib/money/currency-safety";
import { calculateNetWorth } from "@/lib/money/net-worth";
import { calculateBudget, type BudgetExpense } from "@/lib/money/budget-calculations";

const MoneyCenterCharts = lazy(() =>
  import("@/components/money/MoneyCenterCharts").then((module) => ({
    default: module.MoneyCenterCharts,
  })),
);

export const Route = createFileRoute("/_authenticated/money-center/analytics")({
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const { businessId } = useMoneyCenterScope();
  const { data: txs = [] } = useTransactions({ businessId });
  const { data: accounts = [] } = useAccounts(false, businessId);
  const { data: balances = [] } = useAccountBalances(businessId);
  const { data: budgets = [] } = useBudgets(monthKey(), businessId);
  const { data: expected = [] } = useExpected(undefined, businessId);
  const { data: assets = [] } = useAssets();
  const { data: cryptoHoldings = [] } = useCryptoHoldings();
  const { data: debts = [] } = useDebts(false, businessId);
  const scopedAssets = businessId
    ? assets.filter((asset) => asset.business_id === businessId)
    : assets;
  const scopedCryptoHoldings = businessId ? [] : cryptoHoldings;
  const currencySafety = useMemo(() => summarizeCurrencySafety(accounts), [accounts]);
  const netWorth = useMemo(
    () =>
      calculateNetWorth({
        accounts,
        balances,
        assets: scopedAssets,
        cryptoHoldings: scopedCryptoHoldings,
        debts,
        expected,
      }),
    [accounts, balances, scopedAssets, scopedCryptoHoldings, debts, expected],
  );

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
    const selectedMonth = monthKey();
    const monthEnd = new Date(`${selectedMonth}T00:00:00.000Z`);
    monthEnd.setUTCMonth(monthEnd.getUTCMonth() + 1);
    const period = {
      from: `${selectedMonth}T00:00:00.000Z`,
      toExclusive: monthEnd.toISOString(),
    };
    const expenses = txs.map((transaction) => ({
      ...transaction,
      category: normalizeExpenseCategory(transaction.category),
    })) satisfies BudgetExpense[];
    const accountCurrencies = accounts.map((account) => ({
      id: account.id,
      currency: account.currency,
      status: account.status,
      financial_scope: account.financial_scope,
      business_id: account.business_id,
    }));
    return budgets.map((budget) => {
      const calculation = calculateBudget({ budget, expenses, period, accountCurrencies });
      return {
        name: `${budget.category} · ${budget.financial_scope === "business" ? `Business${budget.business_name ? ` · ${budget.business_name}` : ""}` : "Personal"}`,
        budget: Number(budget.amount),
        actual: calculation.actual,
      };
    });
  }, [txs, budgets, accounts]);

  const accountBalanceData = balances.map((b) => ({
    name: accounts.find((a) => a.id === b.account_id)?.name ?? "?",
    balance: Number(b.balance),
  }));

  // No valuation-history table exists yet. Do not present a cashflow-derived line as true net worth.
  const netWorthTrend: { date: string; value: number }[] = [];

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
            currentNetWorth={netWorth.total.netWorth}
            personalNetWorth={netWorth.personal.netWorth}
            businessNetWorth={netWorth.business.netWorth}
            netWorthAvailable={netWorth.displayable}
            netWorthUnavailableReason={netWorth.unavailableReason}
            expectedVsReceived={expectedVsReceived}
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
