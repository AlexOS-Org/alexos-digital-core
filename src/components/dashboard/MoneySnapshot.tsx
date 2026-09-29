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
import { useBusinessContext } from "@/lib/businesses/context";
import { formatMoney } from "@/lib/money/format";
import { guardAggregateMoneyValue, summarizeCurrencySafety } from "@/lib/money/currency-safety";

export default function MoneySnapshot({
  businessId: explicitBusinessId,
}: { businessId?: string | null } = {}) {
  const businessContext = useBusinessContext();
  const businessId = explicitBusinessId ?? businessContext.business?.id ?? null;
  const { data: balances = [] } = useAccountBalances();
  const { data: accounts = [] } = useAccounts(false, businessId);
  const { data: transactions = [] } = useTransactions({ businessId });
  const { data: debts = [] } = useDebts(false, businessId);

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
  const currencySafety = summarizeCurrencySafety(scopedAccounts);
  const moneyValue = (value: number) => {
    const guarded = guardAggregateMoneyValue(value, currencySafety);
    return guarded === null
      ? "Data not available"
      : formatMoney(guarded, currencySafety.currency ?? undefined);
  };

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
  const isBusinessScoped = Boolean(businessId);

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

  const cards = isBusinessScoped
    ? [
        {
          title: "Cash Available",
          value: moneyValue(cashAvailable),
          icon: Wallet,
          subtitle: "Business accounts",
          tone: "green",
        },
        {
          title: "Business Debt",
          value: moneyValue(businessDebt),
          icon: Briefcase,
          subtitle: "Outstanding",
          tone: "purple",
        },
        {
          title: "Liquid Net Position",
          value: moneyValue(cashAvailable - businessDebt),
          icon: Landmark,
          subtitle: "Cash less business debt",
          tone: cashAvailable - businessDebt >= 0 ? "purple" : "danger",
        },
        {
          title: "Operating Income",
          value: moneyValue(operatingIncome),
          icon: TrendingUp,
          subtitle: "This month",
          tone: "green",
        },
        {
          title: "Expenses",
          value: moneyValue(expenses),
          icon: TrendingDown,
          subtitle: "This month",
          tone: "amber",
        },
      ]
    : [
        {
          title: "Cash Available",
          value: moneyValue(cashAvailable),
          icon: Wallet,
          subtitle: "All accounts",
          tone: "green",
        },
        {
          title: "Personal Cash",
          value: moneyValue(personalCash),
          icon: UserRound,
          subtitle: `Debt ${moneyValue(personalDebt)}`,
          tone: "blue",
        },
        {
          title: "Business Cash",
          value: moneyValue(businessCash),
          icon: Briefcase,
          subtitle: `Debt ${moneyValue(businessDebt)}`,
          tone: "purple",
        },
        {
          title: "Liquid Net Position",
          value: moneyValue(netWorth),
          icon: Landmark,
          subtitle: "Cash less tracked outstanding debt",
          tone: netWorth >= 0 ? "purple" : "danger",
        },
        {
          title: "Operating Income",
          value: moneyValue(operatingIncome),
          icon: TrendingUp,
          subtitle: "This month · loans excluded",
          tone: "green",
        },
        {
          title: "Expenses",
          value: moneyValue(expenses),
          icon: TrendingDown,
          subtitle: "This month",
          tone: "amber",
        },
        {
          title: "Loan Proceeds",
          value: moneyValue(loanProceeds),
          icon: ArrowDownCircle,
          subtitle: "Cash received · not income",
          tone: "amber",
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
              data-tone={card.tone}
              className="dashboard-kpi-card alexos-card-interactive group relative h-full overflow-hidden"
            >
              <CardContent className="relative p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="dashboard-kpi-label truncate">{card.title}</p>
                    <p className="mt-3 text-2xl font-bold tabular-nums tracking-tight">
                      {card.value}
                    </p>
                  </div>
                  <div className="dashboard-kpi-icon grid size-11 shrink-0 place-items-center rounded-full">
                    <Icon aria-hidden="true" className="size-5" />
                  </div>
                </div>
                <div className="mt-6 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{card.subtitle}</span>
                  <ArrowUpRight
                    aria-hidden="true"
                    className="size-3.5 opacity-50 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                  />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      {lowBalanceCount > 0 && (
        <div
          data-tone="danger"
          className="alexos-tone-bg alexos-tone-text inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium"
        >
          <CircleAlert aria-hidden="true" className="size-3.5" />
          {lowBalanceCount} account{lowBalanceCount === 1 ? "" : "s"} below your comfort level
        </div>
      )}
    </div>
  );
}
