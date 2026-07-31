import { Card, CardContent } from "@/components/ui/card";
import {
  TrendingDown,
  TrendingUp,
  Wallet,
  Landmark,
  ArrowDownCircle,
  ArrowUpRight,
  CircleAlert,
} from "lucide-react";
import { useAccountBalances, useAccounts, useTransactions } from "@/lib/money/api";
import { useDebts, debtRemaining } from "@/lib/debts/api";
import { formatMoney } from "@/lib/money/format";

export default function MoneySnapshot() {
  const { data: balances = [] } = useAccountBalances();
  const { data: accounts = [] } = useAccounts();
  const { data: transactions = [] } = useTransactions();
  const { data: debts = [] } = useDebts();

  const cashAvailable = balances.reduce((total, account) => total + Number(account.balance), 0);
  const totalDebt = debts
    .filter((d) => d.status !== "paid")
    .reduce((sum, debt) => sum + debtRemaining(debt), 0);
  const netWorth = cashAvailable - totalDebt;
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthTransactions = transactions.filter((t) => {
    const date = new Date(t.occurred_at);
    return (
      date.getMonth() === currentMonth &&
      date.getFullYear() === currentYear &&
      t.status === "posted"
    );
  });
  const income = monthTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const expenses = monthTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const lowBalanceCount = accounts.reduce((count, account) => {
    const balance = Number(balances.find((b) => b.account_id === account.id)?.balance ?? 0);
    const isMpesa = /m[- ]?pesa/i.test(account.name);
    const isBank =
      /bank|kcb|equity|coop|co-operative|absa|ncba|stanbic|family|dtb|i&m|im bank|sidian|prime/i.test(
        `${account.name} ${account.type}`,
      );
    const threshold = isMpesa ? 300 : isBank ? 500 : null;
    return count + (threshold !== null && balance < threshold ? 1 : 0);
  }, 0);

  const cards = [
    {
      title: "Cash Available",
      value: formatMoney(cashAvailable),
      icon: Wallet,
      accent: "from-emerald-500 to-teal-400",
      subtitle: "Across all accounts",
    },
    {
      title: "Net Worth",
      value: formatMoney(netWorth),
      icon: Landmark,
      accent: netWorth >= 0 ? "from-violet-500 to-indigo-400" : "from-red-400 to-rose-300",
      subtitle: "Cash less outstanding debt",
    },
    {
      title: "Income",
      value: formatMoney(income),
      icon: TrendingUp,
      accent: "from-emerald-500 to-teal-400",
      subtitle: "This month",
    },
    {
      title: "Expenses",
      value: formatMoney(expenses),
      icon: TrendingDown,
      accent: "from-amber-400 to-orange-300",
      subtitle: "This month",
    },
    {
      title: "Outstanding Debt",
      value: formatMoney(totalDebt),
      icon: ArrowDownCircle,
      accent: "from-orange-400 to-red-300",
      subtitle: `${debts.filter((d) => d.status !== "paid").length} active debt(s)`,
    },
  ];

  return (
    <div className="space-y-3">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Card
              key={card.title}
              className="group relative overflow-hidden rounded-[1.6rem] border border-border/60 bg-card/80 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
            >
              <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${card.accent}`} />
              <CardContent className="relative p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      {card.title}
                    </p>
                    <p className="mt-3 text-2xl font-bold tracking-tight">{card.value}</p>
                  </div>
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/[0.07] text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-6 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{card.subtitle}</span>
                  <ArrowUpRight className="h-3.5 w-3.5 opacity-50 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      {lowBalanceCount > 0 && (
        <div className="inline-flex items-center gap-2 rounded-full border border-red-200/70 bg-red-50/70 px-3 py-1.5 text-xs text-red-700/80 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300/80">
          <CircleAlert className="h-3.5 w-3.5" />
          {lowBalanceCount} account{lowBalanceCount === 1 ? "" : "s"} below your comfort level
        </div>
      )}
    </div>
  );
}
