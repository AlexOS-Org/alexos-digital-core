import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowDownCircle,
  ArrowUpRight,
  Briefcase,
  CircleAlert,
  Landmark,
  TrendingDown,
  TrendingUp,
  UserRound,
  Wallet,
} from "lucide-react";
import { useAccountBalances, useAccounts, useTransactions } from "@/lib/money/api";
import { useDebts, debtRemaining } from "@/lib/debts/api";
import { formatMoney } from "@/lib/money/format";

export default function MoneySnapshot() {
  const { data: balances = [] } = useAccountBalances();
  const { data: accounts = [] } = useAccounts();
  const { data: transactions = [] } = useTransactions();
  const { data: debts = [] } = useDebts();

  type AccountWithScope = (typeof accounts)[number] & {
    financial_scope?: "personal" | "business";
    business_name?: string | null;
  };
  type TxWithFlow = (typeof transactions)[number] & {
    financial_scope?: "personal" | "business";
    business_name?: string | null;
    flow_type?: "standard" | "loan_received" | "debt_payment" | "debt_interest";
  };

  const scopedAccounts = accounts as AccountWithScope[];
  const scopedTransactions = transactions as TxWithFlow[];

  const getBalance = (accountId: string) =>
    Number(balances.find((b) => b.account_id === accountId)?.balance ?? 0);
  const cashAvailable = scopedAccounts.reduce(
    (total, account) => total + getBalance(account.id),
    0,
  );
  const personalCash = scopedAccounts
    .filter((a) => (a.financial_scope ?? "personal") === "personal")
    .reduce((total, a) => total + getBalance(a.id), 0);
  const businessCash = scopedAccounts
    .filter((a) => a.financial_scope === "business")
    .reduce((total, a) => total + getBalance(a.id), 0);
  const totalDebt = debts
    .filter((d) => d.status !== "paid")
    .reduce((sum, debt) => sum + debtRemaining(debt), 0);
  const personalDebt = debts
    .filter((d) => d.status !== "paid" && d.financial_scope === "personal")
    .reduce((sum, debt) => sum + debtRemaining(debt), 0);
  const businessDebt = debts
    .filter((d) => d.status !== "paid" && d.financial_scope === "business")
    .reduce((sum, debt) => sum + debtRemaining(debt), 0);
  const netWorth = cashAvailable - totalDebt;

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthTransactions = scopedTransactions.filter((t) => {
    const date = new Date(t.occurred_at);
    return (
      date.getMonth() === currentMonth &&
      date.getFullYear() === currentYear &&
      t.status === "posted"
    );
  });

  const operatingIncome = monthTransactions
    .filter((t) => t.type === "income" && t.flow_type !== "loan_received")
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const expenses = monthTransactions
    .filter((t) => t.type === "expense" && t.flow_type !== "debt_payment")
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const loanProceeds = monthTransactions
    .filter((t) => t.flow_type === "loan_received")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const lowBalanceCount = scopedAccounts.reduce((count, account) => {
    const balance = getBalance(account.id);
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
      subtitle: "All accounts",
      accent: "from-emerald-500 to-teal-400",
      iconClass: "bg-emerald-500/12 text-emerald-400 ring-emerald-400/15",
    },
    {
      title: "Personal Cash",
      value: formatMoney(personalCash),
      icon: UserRound,
      subtitle: `Debt ${formatMoney(personalDebt)}`,
      accent: "from-sky-500 to-cyan-400",
      iconClass: "bg-sky-500/12 text-sky-400 ring-sky-400/15",
    },
    {
      title: "Business Cash",
      value: formatMoney(businessCash),
      icon: Briefcase,
      subtitle: `Debt ${formatMoney(businessDebt)}`,
      accent: "from-violet-500 to-indigo-400",
      iconClass: "bg-violet-500/12 text-violet-400 ring-violet-400/15",
    },
    {
      title: "Net Worth",
      value: formatMoney(netWorth),
      icon: Landmark,
      subtitle: "Cash less outstanding debt",
      accent: netWorth >= 0 ? "from-violet-500 to-indigo-400" : "from-red-400 to-rose-300",
      iconClass: "bg-indigo-500/12 text-indigo-400 ring-indigo-400/15",
    },
    {
      title: "Operating Income",
      value: formatMoney(operatingIncome),
      icon: TrendingUp,
      subtitle: "This month · loans excluded",
      accent: "from-emerald-500 to-teal-400",
      iconClass: "bg-emerald-500/12 text-emerald-400 ring-emerald-400/15",
    },
    {
      title: "Expenses",
      value: formatMoney(expenses),
      icon: TrendingDown,
      subtitle: "This month",
      accent: "from-amber-400 to-orange-300",
      iconClass: "bg-amber-400/12 text-amber-300 ring-amber-300/15",
    },
    {
      title: "Loan Proceeds",
      value: formatMoney(loanProceeds),
      icon: ArrowDownCircle,
      subtitle: "Cash received · not income",
      accent: "from-orange-400 to-red-300",
      iconClass: "bg-orange-400/12 text-orange-300 ring-orange-300/15",
    },
  ];

  return (
    <div className="space-y-3">
      <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
        {cards.map((card) => {
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
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ring-1 ring-inset ${card.iconClass}`}
                  >
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
