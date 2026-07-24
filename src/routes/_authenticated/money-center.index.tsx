import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { QuickActions } from "@/components/money/QuickActions";
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
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/money-center/")({
  component: MoneyDashboard,
});

function MoneyDashboard() {
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
  const kpis = [
    { label: "Total Available", value: total, icon: Wallet, tone: "text-primary" },
    {
      label: "Income (Month)",
      value: incomeMonth,
      icon: TrendingUp,
      tone: "text-[color:var(--success)]",
    },
    {
      label: "Expenses (Month)",
      value: expenseMonth,
      icon: TrendingDown,
      tone: "text-destructive",
    },
    {
      label: "Cash Flow",
      value: cashFlow,
      icon: PiggyBank,
      tone: cashFlow >= 0 ? "text-[color:var(--success)]" : "text-destructive",
    },
    { label: "Expected (weighted)", value: expectedTotal, icon: Clock, tone: "text-amber-600" },
    { label: "Net Worth", value: total, icon: Wallet, tone: "text-primary" },
    {
      label: "Upcoming Bills (7d)",
      value: upcomingBills.reduce((s, b) => s + Number(b.amount), 0),
      icon: Clock,
      tone: "text-primary",
      hint: `${upcomingBills.length} bills`,
    },
    {
      label: "Unpaid Bills",
      value: unpaidTotal,
      icon: Receipt,
      tone: "text-destructive",
      hint: `${unpaidBills.length} pending`,
    },
    {
      label: "Bills Due This Month",
      value: billsThisMonth.reduce((s, b) => s + Number(b.amount), 0),
      icon: Receipt,
      tone: "text-amber-600",
      hint: `${billsThisMonth.length} bills`,
    },
  ];

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl border-0 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
        <CardContent className="p-6 sm:p-8 space-y-4">
          <div className="text-[11px] uppercase tracking-widest text-primary-foreground/70">
            Money Center
          </div>
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <div className="text-sm text-primary-foreground/70">Total Available</div>
              <div className="text-3xl sm:text-4xl font-semibold tracking-tight mt-1">
                {formatMoney(total)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-primary-foreground/70">This month</div>
              <div
                className={cn(
                  "text-sm font-semibold",
                  cashFlow >= 0 ? "text-[color:var(--success)]" : "text-red-200",
                )}
              >
                {cashFlow >= 0 ? "+" : ""}
                {formatMoney(cashFlow)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <QuickActions />

      <section className="grid gap-3 grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {kpis.map((k) => (
          <Card key={k.label} className="rounded-2xl">
            <CardHeader className="pb-1 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                {k.label}
              </CardTitle>
              <k.icon className={cn("h-4 w-4", k.tone)} />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-semibold tracking-tight truncate">
                {formatMoney(k.value)}
              </div>
              {"hint" in k && k.hint && (
                <div className="text-xs text-muted-foreground mt-0.5">{k.hint}</div>
              )}
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Accounts</h2>
          <span className="text-xs text-muted-foreground">{accounts.length} active</span>
        </div>
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {accLoading &&
            Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-2xl" />
            ))}
          {accounts.map((a) => {
            const bal = balances.find((b) => b.account_id === a.id);
            const Icon = ACCOUNT_ICONS[a.icon] ?? Wallet;
            return (
              <Card key={a.id} className="rounded-2xl transition-shadow hover:shadow-md">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary grid place-items-center">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-medium text-sm">{a.name}</div>
                        <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                          {a.currency}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-xl font-semibold tracking-tight">
                    {formatMoney(bal?.balance ?? 0, a.currency)}
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="flex items-center gap-1 text-[color:var(--success)]">
                      <ArrowDownRight className="h-3 w-3" />
                      {formatMoney(bal?.money_in ?? 0, a.currency)}
                    </span>
                    <span className="flex items-center gap-1 text-destructive">
                      <ArrowUpRight className="h-3 w-3" />
                      {formatMoney(bal?.money_out ?? 0, a.currency)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {txs.length === 0 ? (
            <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
              No transactions yet. Use the actions above to record your first entry.
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {txs.map((t) => {
                const a = accounts.find((x) => x.id === t.account_id);
                const sign = t.type === "income" ? "+" : t.type === "expense" ? "-" : "";
                const toneCls =
                  t.type === "income"
                    ? "text-[color:var(--success)]"
                    : t.type === "expense"
                      ? "text-destructive"
                      : "text-primary";
                return (
                  <li key={t.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">
                        {t.description || t.category || t.source || t.type}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(t.occurred_at)} · {formatTime(t.occurred_at)} · {a?.name ?? "—"}
                      </div>
                    </div>
                    <div className={cn("text-sm font-semibold whitespace-nowrap", toneCls)}>
                      {sign}
                      {formatMoney(t.amount)}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
