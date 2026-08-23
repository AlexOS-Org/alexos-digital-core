import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { QuickActions } from "@/components/money/QuickActions";
import { MoneyAllocationPanel } from "@/components/money/MoneyAllocationPanel";
import { useAccountBalances, useAccounts, useExpected, useTransactions } from "@/lib/money/api";
import { useBills } from "@/lib/money/bills";
import { ACCOUNT_ICONS } from "@/lib/money/constants";
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
  Sparkles,
  CircleAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useBalanceVisibility } from "@/components/money/BalanceVisibility";
import { getDashboardSceneAsset } from "@/components/theme/dashboard-scene-assets";

export const Route = createFileRoute("/_authenticated/money-center/")({
  component: MoneyDashboard,
});

function MoneyDashboard() {
  const { maskBalance } = useBalanceVisibility();
  const displayMoney = (value: number | string | null | undefined, currency = "KES") =>
    maskBalance(formatMoney(value, currency));
  const { data: accounts = [], isLoading: accLoading } = useAccounts();
  const { data: balances = [] } = useAccountBalances();
  const { data: txs = [] } = useTransactions({ limit: 8 });
  const { data: pendingExpected = [] } = useExpected("pending");
  const { data: bills = [] } = useBills();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const { data: monthTx = [] } = useTransactions({ from: monthStart });

  const total = balances.reduce((s, b) => s + Number(b.balance), 0);
  const incomeMonth = monthTx
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + Number(t.amount), 0);
  const expenseMonth = monthTx
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + Number(t.amount), 0);
  const cashFlow = incomeMonth - expenseMonth;
  const expectedTotal = pendingExpected.reduce(
    (s, e) => s + (Number(e.amount) * e.probability) / 100,
    0,
  );
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const unpaidBills = bills.filter((b) => b.status === "pending");
  const unpaidTotal = unpaidBills.reduce((s, b) => s + Number(b.amount), 0);
  const upcomingBills = unpaidBills.filter((b) => {
    const d = new Date(b.due_date + "T00:00:00");
    const diff = Math.round((d.getTime() - new Date(now.toDateString()).getTime()) / 86_400_000);
    return diff >= 0 && diff <= 7;
  });
  const billsThisMonth = unpaidBills.filter((b) => b.due_date?.startsWith(monthKey));
  const savingsRate =
    incomeMonth > 0 ? Math.max(0, Math.min(100, (cashFlow / incomeMonth) * 100)) : 0;

  const getAccountState = (a: (typeof accounts)[number]) => {
    const balance = Number(balances.find((b) => b.account_id === a.id)?.balance ?? 0);
    const isMpesa = /m[- ]?pesa/i.test(a.name);
    const isBank =
      /bank|kcb|equity|coop|co-operative|absa|ncba|stanbic|family|dtb|i&m|im bank|sidian|prime/i.test(
        `${a.name} ${a.type}`,
      );
    const threshold = isMpesa ? 300 : isBank ? 500 : null;
    return { balance, low: threshold !== null && balance < threshold, threshold };
  };

  const kpis = [
    {
      label: "Available",
      value: total,
      icon: Wallet,
      tone: "emerald",
      hint: "Across active accounts",
    },
    { label: "Income", value: incomeMonth, icon: TrendingUp, tone: "green", hint: "This month" },
    {
      label: "Expenses",
      value: expenseMonth,
      icon: TrendingDown,
      tone: "amber",
      hint: "This month",
    },
    {
      label: "Cash Flow",
      value: cashFlow,
      icon: PiggyBank,
      tone: cashFlow >= 0 ? "teal" : "rose",
      hint: cashFlow >= 0 ? "Moving forward" : "Needs attention",
    },
    {
      label: "Expected",
      value: expectedTotal,
      icon: Clock,
      tone: "violet",
      hint: "Weighted incoming",
    },
    {
      label: "Bills",
      value: unpaidTotal,
      icon: Receipt,
      tone: "orange",
      hint: `${upcomingBills.length} due within 7 days`,
    },
  ];

  return (
    <div
      className="money-center-shell space-y-7"
      style={{ backgroundImage: `url(${getDashboardSceneAsset("mountains")})` }}
    >
      <Card className="money-hero relative overflow-hidden rounded-[2rem] border-0 bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white shadow-[0_24px_70px_-35px_rgba(15,23,42,0.65)]">
        <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-emerald-300/15 blur-3xl" />
        <div className="pointer-events-none absolute bottom-[-5rem] left-[30%] h-52 w-52 rounded-full bg-cyan-300/10 blur-3xl" />
        <CardContent className="relative p-6 sm:p-8 lg:p-10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-100/75">
                <Sparkles className="h-3.5 w-3.5" /> Money Center
              </div>
              <p className="mt-4 text-sm text-white/65">Your financial picture right now</p>
              <div className="mt-1 text-4xl font-semibold tracking-tight sm:text-5xl">
                {displayMoney(total)}
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/10 px-4 py-3 backdrop-blur-md">
              <div className="text-[11px] uppercase tracking-wider text-white/55">This month</div>
              <div
                className={cn(
                  "mt-1 text-lg font-semibold",
                  cashFlow >= 0 ? "text-emerald-200" : "text-rose-200",
                )}
              >
                {cashFlow >= 0 ? "+" : ""}
                {displayMoney(cashFlow)}
              </div>
              <div className="mt-1 text-xs text-white/50">
                {cashFlow >= 0 ? "You are ahead of expenses" : "Expenses are ahead of income"}
              </div>
            </div>
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur-sm">
              <div className="text-xs text-white/55">Income</div>
              <div className="mt-1 text-lg font-semibold">{displayMoney(incomeMonth)}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur-sm">
              <div className="text-xs text-white/55">Expenses</div>
              <div className="mt-1 text-lg font-semibold">{displayMoney(expenseMonth)}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur-sm">
              <div className="text-xs text-white/55">Savings rate</div>
              <div className="mt-1 text-lg font-semibold">{savingsRate.toFixed(0)}%</div>
            </div>
          </div>
          <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-emerald-300/80 transition-all"
              style={{ width: `${savingsRate}%` }}
            />
          </div>
        </CardContent>
      </Card>

      <QuickActions />

      <MoneyAllocationPanel />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <Card
              key={k.label}
              data-tone={k.tone}
              className="money-kpi-card group relative overflow-hidden rounded-[1.5rem] shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="money-kpi-strip absolute inset-x-0 top-0 h-1" />
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      {k.label}
                    </p>
                    <p className="mt-3 text-2xl font-semibold tracking-tight">
                      {displayMoney(k.value)}
                    </p>
                  </div>
                  <div className="money-kpi-icon grid h-11 w-11 place-items-center rounded-2xl">
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
                <p className="mt-5 text-xs text-muted-foreground">{k.hint}</p>
              </CardContent>
            </Card>
          );
        })}
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
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {accLoading &&
            Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-36 rounded-2xl" />
            ))}
          {accounts.map((a) => {
            const bal = balances.find((b) => b.account_id === a.id);
            const Icon = ACCOUNT_ICONS[a.icon] ?? Wallet;
            const state = getAccountState(a);
            return (
              <Card
                key={a.id}
                data-status={state.low ? "low" : "healthy"}
                className="money-account-card overflow-hidden rounded-[1.5rem] shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <CardContent className="p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={cn(
                          "money-account-icon grid h-11 w-11 shrink-0 place-items-center rounded-2xl",
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold">{a.name}</div>
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                          {a.currency}
                        </div>
                      </div>
                    </div>
                    {state.low && <CircleAlert className="h-4 w-4 shrink-0 text-red-500/70" />}
                  </div>
                  <div
                    className={cn(
                      "mt-5 rounded-2xl px-4 py-3",
                      "money-account-balance rounded-2xl px-4 py-3",
                    )}
                  >
                    <div
                      className={cn(
                        "money-account-balance-value text-2xl font-semibold tracking-tight",
                      )}
                    >
                      {displayMoney(state.balance, a.currency)}
                    </div>
                    {state.low ? (
                      <div className="money-account-status mt-1 text-[11px]">
                        Below {displayMoney(state.threshold!, a.currency)} comfort level
                      </div>
                    ) : (
                      <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
                        <span className="money-inflow flex items-center gap-1">
                          <ArrowDownRight className="h-3 w-3" />
                          {displayMoney(bal?.money_in ?? 0, a.currency)}
                        </span>
                        <span className="money-outflow flex items-center gap-1">
                          <ArrowUpRight className="h-3 w-3" />
                          {displayMoney(bal?.money_out ?? 0, a.currency)}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
        <Card className="money-data-card rounded-[1.5rem] border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Recent money movement</CardTitle>
          </CardHeader>
          <CardContent>
            {txs.length === 0 ? (
              <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                No transactions yet. Use the actions above to record your first entry.
              </div>
            ) : (
              <ul className="divide-y divide-border/70">
                {txs.map((t) => {
                  const a = accounts.find((x) => x.id === t.account_id);
                  const sign = t.type === "income" ? "+" : t.type === "expense" ? "-" : "";
                  const tone =
                    t.type === "income"
                      ? "text-emerald-600 dark:text-emerald-400"
                      : t.type === "expense"
                        ? "text-rose-600/80 dark:text-rose-400/80"
                        : "text-violet-600 dark:text-violet-400";
                  return (
                    <li key={t.id} className="flex items-center justify-between gap-3 py-3.5">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">
                          {t.description || t.category || t.source || t.type}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatDate(t.occurred_at)} · {formatTime(t.occurred_at)} ·{" "}
                          {a?.name ?? "—"}
                        </div>
                      </div>
                      <div className={cn("whitespace-nowrap text-sm font-semibold", tone)}>
                        {sign}
                        {displayMoney(t.amount)}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card className="money-data-card rounded-[1.5rem] border-border/60 bg-gradient-to-br from-violet-50/80 to-background shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">What needs attention</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-2xl bg-amber-500/8 p-4">
              <div className="text-xs font-semibold text-amber-700 dark:text-amber-400">Bills</div>
              <div className="mt-1 text-xl font-semibold">
                {displayMoney(upcomingBills.reduce((s, b) => s + Number(b.amount), 0))}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {upcomingBills.length} due in the next 7 days
              </div>
            </div>
            <div className="rounded-2xl bg-violet-500/8 p-4">
              <div className="text-xs font-semibold text-violet-700 dark:text-violet-400">
                Expected money
              </div>
              <div className="mt-1 text-xl font-semibold">{displayMoney(expectedTotal)}</div>
              <div className="mt-1 text-xs text-muted-foreground">Weighted incoming value</div>
            </div>
            <div className="rounded-2xl bg-emerald-500/8 p-4">
              <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                This month
              </div>
              <div className="mt-1 text-xl font-semibold">
                {displayMoney(billsThisMonth.reduce((s, b) => s + Number(b.amount), 0))}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">Bills due this month</div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
