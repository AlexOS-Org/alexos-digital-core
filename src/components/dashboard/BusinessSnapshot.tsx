import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Coins, Percent, TrendingUp, Users, Wallet } from "lucide-react";
import { useDashboardData } from "@/lib/dashboard/api";
import { formatMoney } from "@/lib/money/format";

export default function BusinessSnapshot() {
  const { metrics, isLoading, isError } = useDashboardData();
  const { business, money } = metrics;

  if (isError) {
    return (
      <Card className="rounded-[1.6rem] border-border/60">
        <CardContent className="p-5 text-sm text-muted-foreground">
          Business metrics are unavailable right now. Refresh to retry.
        </CardContent>
      </Card>
    );
  }

  const items = [
    {
      title: "Revenue",
      value: formatMoney(money.incomeThisMonth),
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
      value: formatMoney(money.expensesThisMonth),
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
    },
    {
      title: "Win rate",
      value: `${business.winRate.toFixed(0)}%`,
      description: `${business.wonLeads} won · ${business.lostLeads} lost`,
      icon: Percent,
      url: "/people/leads",
      accent: "from-emerald-500 to-lime-400",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-[168px] rounded-[1.6rem]" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Link key={item.title} to={item.url} className="group">
            <Card className="relative h-full overflow-hidden rounded-[1.6rem] border-border/60 bg-card/80 transition-all duration-300 hover:-translate-y-1 hover:border-primary/20 hover:shadow-xl">
              <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${item.accent}`} />
              <CardContent className="relative p-5">
                <div className="flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/[0.07] text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </div>
                <div className="mt-7">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    {item.title}
                  </p>
                  <p className="mt-2 text-2xl font-bold tracking-tight">{item.value}</p>
                  <p className="mt-1.5 text-xs leading-5 text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
