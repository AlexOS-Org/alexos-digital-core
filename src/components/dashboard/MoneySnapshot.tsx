import { Card, CardContent } from "@/components/ui/card";
import { ArrowDownCircle, Landmark, TrendingDown, TrendingUp, Wallet } from "lucide-react";

import { useDebts, debtRemaining } from "@/lib/debts/api";
import { useAccountBalances, useTransactions } from "@/lib/money/api";
import { formatMoney } from "@/lib/money/format";

export default function MoneySnapshot() {
  const { data: balances = [] } = useAccountBalances();
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

  const cards = [
    {
      title: "Cash Available",
      value: formatMoney(cashAvailable),
      icon: Wallet,
      gradient: "from-primary to-primary/80",
      bg: "bg-primary/5",
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
      subtitle: "Across All Accounts",
    },
    {
      title: "Net Worth",
      value: formatMoney(netWorth),
      icon: Landmark,
      gradient: netWorth >= 0 ? "from-primary to-primary/80" : "from-destructive to-destructive/80",
      bg: netWorth >= 0 ? "bg-primary/5" : "bg-destructive/5",
      iconBg: netWorth >= 0 ? "bg-primary/10" : "bg-destructive/10",
      iconColor: netWorth >= 0 ? "text-primary" : "text-destructive",
      subtitle: "Cash - Debt",
    },
    {
      title: "Income",
      value: formatMoney(income),
      icon: TrendingUp,
      gradient: "from-primary to-primary/80",
      bg: "bg-primary/5",
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
      subtitle: "This Month",
    },
    {
      title: "Expenses",
      value: formatMoney(expenses),
      icon: TrendingDown,
      gradient: "from-orange-500 to-red-500",
      bg: "bg-orange-50",
      iconBg: "bg-orange-100",
      iconColor: "text-orange-700",
      subtitle: "This Month",
    },
    {
      title: "Outstanding Debt",
      value: formatMoney(totalDebt),
      icon: ArrowDownCircle,
      gradient: "from-amber-500 to-orange-600",
      bg: "bg-amber-50",
      iconBg: "bg-amber-100",
      iconColor: "text-amber-700",
      subtitle: `${debts.filter((d) => d.status !== "paid").length} Active Debt(s)`,
    },
  ];

  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-5">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <Card
            key={card.title}
            className={`overflow-hidden border-0 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${card.bg}`}
          >
            <div className={`h-2 w-full bg-gradient-to-r ${card.gradient}`} />

            <CardContent className="p-6">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{card.title}</p>

                  <h2 className="mt-2 text-2xl font-bold tracking-tight">{card.value}</h2>
                </div>

                <div
                  className={`flex h-14 w-14 items-center justify-center rounded-2xl ${card.iconBg}`}
                >
                  <Icon className={`h-7 w-7 ${card.iconColor}`} />
                </div>
              </div>

              <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
                <div
                  className={`h-full bg-gradient-to-r ${card.gradient}`}
                  style={{ width: "70%" }}
                />
              </div>

              <p className="mt-4 text-xs font-medium text-muted-foreground">{card.subtitle}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
