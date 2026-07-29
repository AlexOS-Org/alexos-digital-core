import { Card, CardContent } from "@/components/ui/card";
import { TrendingDown, TrendingUp, Wallet, Landmark, ArrowDownCircle, ArrowUpRight } from "lucide-react";
import { useAccountBalances, useTransactions } from "@/lib/money/api";
import { useDebts, debtRemaining } from "@/lib/debts/api";
import { formatMoney } from "@/lib/money/format";

export default function MoneySnapshot() {
  const { data: balances = [] } = useAccountBalances();
  const { data: transactions = [] } = useTransactions();
  const { data: debts = [] } = useDebts();

  const cashAvailable = balances.reduce((total, account) => total + Number(account.balance), 0);
  const totalDebt = debts.filter((d) => d.status !== "paid").reduce((sum, debt) => sum + debtRemaining(debt), 0);
  const netWorth = cashAvailable - totalDebt;
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthTransactions = transactions.filter((t) => {
    const date = new Date(t.occurred_at);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear && t.status === "posted";
  });
  const income = monthTransactions.filter((t) => t.type === "income").reduce((sum, t) => sum + Number(t.amount), 0);
  const expenses = monthTransactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + Number(t.amount), 0);

  const cards = [
    { title: "Cash Available", value: formatMoney(cashAvailable), icon: Wallet, accent: "from-blue-400 to-cyan-300", subtitle: "Across all accounts" },
    { title: "Net Worth", value: formatMoney(netWorth), icon: Landmark, accent: netWorth >= 0 ? "from-violet-400 to-fuchsia-300" : "from-red-400 to-rose-300", subtitle: "Cash less outstanding debt" },
    { title: "Income", value: formatMoney(income), icon: TrendingUp, accent: "from-emerald-400 to-teal-300", subtitle: "This month" },
    { title: "Expenses", value: formatMoney(expenses), icon: TrendingDown, accent: "from-amber-400 to-orange-300", subtitle: "This month" },
    { title: "Outstanding Debt", value: formatMoney(totalDebt), icon: ArrowDownCircle, accent: "from-orange-400 to-red-300", subtitle: `${debts.filter((d) => d.status !== "paid").length} active debt(s)` },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card key={card.title} className={`group relative overflow-hidden rounded-[1.6rem] border ${index === 0 ? "border-blue-400/20 bg-[#0a1730] text-white shadow-[0_20px_55px_-30px_rgba(37,99,235,.7)]" : "border-border/60 bg-card/80 shadow-sm"} transition-all duration-300 hover:-translate-y-1 hover:shadow-xl`}>
            <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${card.accent}`} />
            {index === 0 && <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-blue-500/15 blur-2xl" />}
            <CardContent className="relative p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className={`text-xs font-semibold uppercase tracking-[0.14em] ${index === 0 ? "text-blue-200/80" : "text-muted-foreground"}`}>{card.title}</p>
                  <p className="mt-3 text-2xl font-bold tracking-tight sm:text-[1.65rem]">{card.value}</p>
                </div>
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${index === 0 ? "bg-white/10 text-blue-200" : "bg-primary/[0.07] text-primary"}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <div className={`mt-6 flex items-center justify-between text-xs ${index === 0 ? "text-slate-400" : "text-muted-foreground"}`}>
                <span>{card.subtitle}</span>
                <ArrowUpRight className="h-3.5 w-3.5 opacity-60 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
