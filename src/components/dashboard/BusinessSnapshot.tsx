import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Coins, Percent, TrendingUp, Users, Wallet } from "lucide-react";
import { useDashboardData } from "@/lib/dashboard/api";
import { formatMoney } from "@/lib/money/format";
import { guardAggregateMoneyValue } from "@/lib/money/currency-safety";

export default function BusinessSnapshot() {
  const { metrics, isLoading, isError } = useDashboardData();
  const { business, money } = metrics;
  const moneyValue = (value: number) => {
    const guarded = guardAggregateMoneyValue(value, money.currencySafety);
    return guarded === null
      ? "Data not available"
      : formatMoney(guarded, money.currencySafety.currency ?? undefined);
  };

  if (isError) {
    return (
      <Card className="rounded-[1.6rem] border-border/60">
        <CardContent className="p-5 text-sm text-muted-foreground">
          Business metrics are unavailable right now. Refresh to retry.
        </CardContent>
      </Card>
    );
  }

  const closed = business.wonLeads + business.lostLeads;
  const winShare = closed > 0 ? Math.min(100, (business.wonLeads / closed) * 100) : 0;
  const weightedShare =
    business.pipelineValue > 0
      ? Math.min(100, (business.weightedPipelineValue / business.pipelineValue) * 100)
      : 0;

  const items = [
    {
      title: "Revenue",
      value: moneyValue(money.incomeThisMonth),
      description:
        money.incomeChangePct === null
          ? "This month"
          : `${money.incomeChangePct >= 0 ? "+" : ""}${money.incomeChangePct.toFixed(0)}% vs last month`,
      icon: Coins,
      url: "/money-center/income",
      accent: "from-emerald-500 to-teal-400",
    },
    {
      title: "Expenses",
      value: moneyValue(money.expensesThisMonth),
      description:
        money.expenseChangePct === null
          ? "This month"
          : `${money.expenseChangePct >= 0 ? "+" : ""}${money.expenseChangePct.toFixed(0)}% vs last month`,
      icon: Wallet,
      url: "/money-center/expenses",
      accent: "from-orange-400 to-amber-300",
    },
    {
      title: "Customers",
      value: String(business.activeCustomers),
      description: `${business.contactsTotal} contacts on record`,
      icon: Users,
      url: "/people",
      accent: "from-blue-500 to-cyan-400",
    },
    {
      title: "Leads",
      value: String(business.openLeads),
      description: `${business.newLeadsThisWeek} new this week`,
      icon: TrendingUp,
      url: "/people/leads",
      accent: "from-violet-500 to-fuchsia-400",
    },
    {
      title: "Pipeline",
      value: formatMoney(business.pipelineValue),
      description: `${formatMoney(business.weightedPipelineValue)} weighted`,
      icon: ArrowUpRight,
      url: "/people/leads",
      accent: "from-indigo-500 to-blue-400",
      density: weightedShare,
      densityLabel: "Weighted share of open pipeline",
    },
    {
      title: "Win rate",
      value: `${business.winRate.toFixed(0)}%`,
      description: `${business.wonLeads} won · ${business.lostLeads} lost`,
      icon: Percent,
      url: "/people/leads",
      accent: "from-emerald-500 to-lime-400",
      density: winShare,
      densityLabel: "Wins among closed leads",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-[148px] rounded-[1.6rem]" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3 3xl:gap-5">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Link key={item.title} to={item.url} className="group">
            <Card className="alexos-data-metric relative h-full overflow-hidden rounded-[1.6rem] border-border/60 transition-all duration-300 hover:-translate-y-1 hover:border-primary/20 hover:shadow-xl focus-within:ring-2 focus-within:ring-ring">
              <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${item.accent}`} />
              <CardContent className="relative z-[1] p-5 3xl:p-6">
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/[0.07] text-primary ring-1 ring-inset ring-primary/10">
                    <Icon className="h-5 w-5" />
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </div>
                <div className="mt-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    {item.title}
                  </p>
                  <p className="mt-2 text-2xl font-bold tracking-tight 3xl:text-3xl">{item.value}</p>
                  <p className="mt-1.5 text-xs leading-5 text-muted-foreground">{item.description}</p>
                  {"density" in item && typeof item.density === "number" ? (
                    <div className="mt-3" aria-label={item.densityLabel}>
                      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary/80 transition-[width] duration-500"
                          style={{ width: `${item.density}%` }}
                        />
                      </div>
                      <p className="mt-1 text-[10px] text-muted-foreground">{item.densityLabel}</p>
                    </div>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
