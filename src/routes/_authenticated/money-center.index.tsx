import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlexOSEmptyState } from "@/components/alexos/states";
import { QuickActions } from "@/components/money/QuickActions";
import { MoneyAllocationPanel } from "@/components/money/MoneyAllocationPanel";
import { useAccountBalances, useAccounts, useExpected, useTransactions } from "@/lib/money/api";
import { useBills } from "@/lib/money/bills";
import { getAccountLogo, getInstitutionStyle } from "@/lib/money/institution-branding";
import { formatDate, formatMoney, formatTime } from "@/lib/money/format";
import {
  ArrowDownRight,
  ArrowUpRight,
  Wallet,
  TrendingUp,
  TrendingDown,
  Clock,
  PiggyBank,
  Receipt,
  CircleAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AlexOSTone } from "@/lib/ui/status";
import { useBalanceVisibility } from "@/components/money/BalanceVisibility";
import { BINANCE_WITHDRAWAL_MINIMUM_KES, useLiveBinanceBalance } from "@/lib/money/crypto-prices";
import { WeeklyCashSummary } from "@/components/money/WeeklyCashSummary";

export const Route = createFileRoute("/_authenticated/money-center/")({
  component: MoneyDashboard,
});

function MoneyDashboard() {
  const { maskBalance } = useBalanceVisibility();
  const displayMoney = (
    value: number | string | null | undefined,
    currency: string | null = "KES",
  ) => {
    if (value === null || value === undefined || currency === null) return "Multiple currencies";
    return maskBalance(formatMoney(value, currency));
  };
  const { data: accounts = [], isLoading: accLoading } = useAccounts();
  const { data: balances = [] } = useAccountBalances();
  const liveBinance = useLiveBinanceBalance();
  const { data: txs = [] } = useTransactions({ limit: 8 });
  const { data: pendingExpected = [] } = useExpected("pending");
  const { data: bills = [] } = useBills();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const { data: monthTx = [] } = useTransactions({ from: monthStart });

  const accountCurrencies = [
    ...new Set(accounts.map((account) => account.currency).filter(Boolean)),
  ];
  const aggregateCurrency = accountCurrencies.length === 1 ? accountCurrencies[0] : null;
  const total = aggregateCurrency ? balances.reduce((s, b) => s + Number(b.balance), 0) : null;
  const incomeMonth = aggregateCurrency
    ? monthTx.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0)
    : null;
  const expenseMonth = aggregateCurrency
    ? monthTx.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0)
    : null;
  const cashFlow =
    incomeMonth !== null && expenseMonth !== null ? incomeMonth - expenseMonth : null;
  const expectedTotal = aggregateCurrency
    ? pendingExpected.reduce((s, e) => s + (Number(e.amount) * e.probability) / 100, 0)
    : null;
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const unpaidBills = bills.filter((b) => b.status === "pending");
  const unpaidTotal = aggregateCurrency
    ? unpaidBills.reduce((s, b) => s + Number(b.amount), 0)
    : null;
  const upcomingBills = unpaidBills.filter((b) => {
    const d = new Date(b.due_date + "T00:00:00");
    const diff = Math.round((d.getTime() - new Date(now.toDateString()).getTime()) / 86_400_000);
    return diff >= 0 && diff <= 7;
  });
  const billsThisMonth = unpaidBills.filter((b) => b.due_date?.startsWith(monthKey));
  const savingsRate =
    incomeMonth !== null && cashFlow !== null && incomeMonth > 0
      ? Math.max(0, Math.min(100, (cashFlow / incomeMonth) * 100))
      : 0;

  const getAccountState = (a: (typeof accounts)[number]) => {
    const storedBalance = Number(balances.find((b) => b.account_id === a.id)?.balance ?? 0);
    const isBinance = /binance|crypto/i.test(a.name);
    const balance = isBinance ? (liveBinance.balance ?? storedBalance) : storedBalance;
    const isMpesa = /m[- ]?pesa/i.test(a.name);
    const isBank =
      /bank|kcb|equity|coop|co-operative|absa|ncba|stanbic|family|dtb|i&m|im bank|sidian|prime/i.test(
        `${a.name} ${a.type}`,
      );
    const threshold = isBinance
      ? BINANCE_WITHDRAWAL_MINIMUM_KES
      : isMpesa
        ? 300
        : isBank
          ? 500
          : null;
    return { balance, low: threshold !== null && balance <= threshold, threshold, isBinance };
  };

  const kpis = [
    {
      label: "Available",
      value: total,
      icon: Wallet,
      tone: "income" as AlexOSTone,
      hint: "Across active accounts",
    },
    {
      label: "Income",
      value: incomeMonth,
      icon: TrendingUp,
      tone: "income" as AlexOSTone,
      hint: "This month",
    },
    {
      label: "Expenses",
      value: expenseMonth,
      icon: TrendingDown,
      tone: "expense" as AlexOSTone,
      hint: "This month",
    },
    {
      label: "Cash flow",
      value: cashFlow,
      icon: PiggyBank,
      tone: (cashFlow !== null && cashFlow >= 0 ? "income" : "danger") as AlexOSTone,
      hint:
        cashFlow === null
          ? "Multiple currencies"
          : cashFlow >= 0
            ? "Moving forward"
            : "Needs attention",
    },
    {
      label: "Expected",
      value: expectedTotal,
      icon: Clock,
      tone: "debt" as AlexOSTone,
      hint: "Weighted incoming",
    },
    {
      label: "Bills",
      value: unpaidTotal,
      icon: Receipt,
      tone: (upcomingBills.length > 0 ? "warning" : "neutral") as AlexOSTone,
      hint: `${upcomingBills.length} due within 7 days`,
    },
  ];

  const attention = [
    {
      label: "Bills due soon",
      value: aggregateCurrency ? upcomingBills.reduce((s, b) => s + Number(b.amount), 0) : null,
      hint: `${upcomingBills.length} due in the next 7 days`,
      tone: (upcomingBills.length > 0 ? "warning" : "neutral") as AlexOSTone,
    },
    {
      label: "Expected money",
      value: expectedTotal,
      hint: "Weighted incoming value",
      tone: "debt" as AlexOSTone,
    },
    {
      label: "Bills this month",
      value: aggregateCurrency ? billsThisMonth.reduce((s, b) => s + Number(b.amount), 0) : null,
      hint: "Unpaid, due before month end",
      tone: "neutral" as AlexOSTone,
    },
  ];

  return (
    <div className="money-center-shell space-y-7">
      <Card className="money-hero relative overflow-hidden rounded-xl border-0">
        <CardContent className="relative p-5 sm:p-7 lg:p-8">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="min-w-0">
              <p className="dashboard-eyebrow">Money Center</p>
              <p className="mt-3 text-sm text-white/65">Your financial position right now</p>
              <h1 className="alexos-amount mt-1 text-4xl tracking-tight sm:text-5xl">
                {displayMoney(total, aggregateCurrency)}
              </h1>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/15 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-white/60">
                This month
              </p>
              <p
                data-tone={cashFlow !== null && cashFlow >= 0 ? "income" : "expense"}
                className="alexos-amount mt-1 text-lg"
              >
                {cashFlow !== null && cashFlow >= 0 ? "+" : ""}
                {displayMoney(cashFlow, aggregateCurrency)}
              </p>
              <p className="mt-1 text-xs text-white/60">
                {cashFlow === null
                  ? "Choose one currency to view combined totals"
                  : cashFlow >= 0
                    ? "You are ahead of expenses"
                    : "Expenses are ahead of income"}
              </p>
            </div>
          </div>

          <dl className="mt-7 grid gap-3 sm:grid-cols-3">
            {[
              { label: "Income", value: displayMoney(incomeMonth, aggregateCurrency) },
              { label: "Expenses", value: displayMoney(expenseMonth, aggregateCurrency) },
              { label: "Savings rate", value: `${savingsRate.toFixed(0)}%` },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-lg border border-white/10 bg-white/[0.06] p-3.5"
              >
                <dt className="text-xs text-white/60">{item.label}</dt>
                <dd className="alexos-amount mt-1 text-lg">{item.value}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-5">
            <div
              role="progressbar"
              aria-label="Savings rate"
              aria-valuenow={Math.round(savingsRate)}
              aria-valuemin={0}
              aria-valuemax={100}
              className="h-1.5 overflow-hidden rounded-full bg-white/10"
            >
              <div
                className="h-full rounded-full bg-alexos-green transition-all"
                style={{ width: `${savingsRate}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <QuickActions />

      <MoneyAllocationPanel />

      <WeeklyCashSummary />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {kpis.map((k) => (
          <Card key={k.label} data-tone={k.tone} className="money-kpi-card">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="alexos-metric-label">{k.label}</p>
                  <p className="alexos-amount mt-3 text-2xl tracking-tight">
                    {displayMoney(k.value, aggregateCurrency)}
                  </p>
                </div>
                <span className="money-kpi-icon grid size-10 shrink-0 place-items-center rounded-lg">
                  <k.icon aria-hidden="true" className="size-5" />
                </span>
              </div>
              <p className="alexos-metric-meta mt-4">{k.hint}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="space-y-3">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Where your money lives</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              A live view of your active accounts
            </p>
          </div>
          <span className="text-xs text-muted-foreground">{accounts.length} active</span>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {accLoading
            ? Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-36 rounded-xl" />
              ))
            : null}
          {accounts.map((a) => {
            const bal = balances.find((b) => b.account_id === a.id);
            const state = getAccountState(a);
            const institution = getInstitutionStyle(a.name);
            const logo = getAccountLogo(a.name);
            return (
              <Card
                key={a.id}
                data-tone={state.low ? "warning" : "income"}
                data-status={state.low ? "low" : "healthy"}
                className={cn(
                  "money-account-card institution-card relative overflow-hidden",
                  `institution-card-${institution.key}`,
                  state.low && "institution-card-low",
                )}
              >
                {logo ? (
                  <img
                    src={logo}
                    alt=""
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-y-0 right-[-2.5rem] z-0 h-full w-2/3 object-contain opacity-[0.08]"
                    loading="lazy"
                  />
                ) : null}
                <div
                  className={cn(
                    "absolute inset-x-0 top-0 z-10 h-1",
                    state.low ? "alexos-tone-rule" : institution.accentClass,
                  )}
                />
                <CardContent className="relative z-10 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className={cn(
                          "institution-logo-tile grid size-11 shrink-0 place-items-center rounded-xl border border-white/35 bg-white/95 shadow-md ring-2 ring-white/10",
                          !logo && institution.iconClass,
                        )}
                      >
                        {logo ? (
                          <img
                            src={logo}
                            alt={`${a.name} logo`}
                            className="size-9 rounded-lg object-contain drop-shadow-sm"
                            loading="lazy"
                          />
                        ) : (
                          <span className="text-xs font-bold tracking-wide">
                            {institution.initials}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold">{a.name}</div>
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                          {institution.brandLabel} · {a.currency}
                        </div>
                      </div>
                    </div>
                    {state.low ? (
                      <CircleAlert
                        aria-label="Below comfort level"
                        className="alexos-tone-text size-4 shrink-0"
                      />
                    ) : null}
                  </div>
                  <div className="money-account-balance institution-card-balance mt-4 rounded-xl px-4 py-3">
                    <div className="money-account-balance-value alexos-amount text-2xl tracking-tight">
                      {displayMoney(state.balance, a.currency)}
                    </div>
                    {state.low ? (
                      <div className="money-account-status mt-1 text-[11px]">
                        {state.isBinance
                          ? `Withdrawals unlock above ${displayMoney(BINANCE_WITHDRAWAL_MINIMUM_KES, "KES")}`
                          : `Below ${displayMoney(state.threshold!, a.currency)} comfort level`}
                      </div>
                    ) : (
                      <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
                        <span className="money-inflow alexos-num flex items-center gap-1">
                          <ArrowDownRight aria-hidden="true" className="size-3" />
                          {displayMoney(bal?.money_in ?? 0, a.currency)}
                        </span>
                        <span className="money-outflow alexos-num flex items-center gap-1">
                          <ArrowUpRight aria-hidden="true" className="size-3" />
                          {displayMoney(bal?.money_out ?? 0, a.currency)}
                        </span>
                      </div>
                    )}
                    {state.isBinance && !state.low ? (
                      <div data-tone="income" className="alexos-tone-text mt-1 text-[11px]">
                        Withdrawable balance · above{" "}
                        {displayMoney(BINANCE_WITHDRAWAL_MINIMUM_KES, "KES")}
                      </div>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
        <Card className="money-data-card border-border/60">
          <CardHeader>
            <CardTitle className="text-base">Recent money movement</CardTitle>
          </CardHeader>
          <CardContent>
            {txs.length === 0 ? (
              <AlexOSEmptyState
                compact
                title="No transactions yet"
                description="Use the actions above to record your first entry. Every transaction you post updates balances, budgets and analytics across Money Center."
              />
            ) : (
              <ul className="divide-y divide-border/70">
                {txs.map((t) => {
                  const a = accounts.find((x) => x.id === t.account_id);
                  const sign = t.type === "income" ? "+" : t.type === "expense" ? "-" : "";
                  return (
                    <li key={t.id} className="flex items-center justify-between gap-3 py-3.5">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">
                          {t.description || t.category || t.source || t.type}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatDate(t.occurred_at)} · {formatTime(t.occurred_at)} ·{" "}
                          {a?.name ?? "Unknown account"}
                        </div>
                      </div>
                      <div
                        data-tone={t.type}
                        className="alexos-tone-text alexos-amount whitespace-nowrap text-sm"
                      >
                        {sign}
                        {displayMoney(t.amount, a?.currency ?? null)}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card className="money-data-card border-border/60">
          <CardHeader>
            <CardTitle className="text-base">What needs attention</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {attention.map((item) => (
              <div key={item.label} data-tone={item.tone} className="alexos-tone-bg rounded-xl p-4">
                <p className="alexos-tone-text text-xs font-semibold">{item.label}</p>
                <p className="alexos-amount mt-1 text-xl">
                  {displayMoney(item.value, aggregateCurrency)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{item.hint}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
