import {
  ArrowDownRight,
  ArrowUpRight,
  BriefcaseBusiness,
  Landmark,
  TrendingUp,
  WalletCards,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { useDashboardData } from "@/lib/dashboard/api";
import { formatMoney } from "@/lib/money/format";
import { guardAggregateMoneyValue } from "@/lib/money/currency-safety";
import { cn } from "@/lib/utils";

type KpiTone = "blue" | "green" | "purple" | "amber";

type Kpi = {
  label: string;
  value: string;
  detail: string;
  to: string;
  tone: KpiTone;
  icon: typeof Landmark;
  change?: number | null;
};

function ChangePill({ change }: { change: number | null | undefined }) {
  if (change === null || change === undefined) {
    return <span className="text-[10px] text-muted-foreground">No prior baseline</span>;
  }
  const positive = change >= 0;
  const Icon = positive ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-[10px] font-semibold",
        positive ? "text-success" : "text-destructive",
      )}
    >
      <Icon className="h-3 w-3" />
      {Math.abs(change).toFixed(1)}% vs last month
    </span>
  );
}

export function DashboardKpiStrip() {
  const { metrics, isLoading } = useDashboardData();
  const { money, business } = metrics;
  const netWorth = money.cashAvailable - money.outstandingDebt;
  const moneyValue = (value: number) => {
    const guarded = guardAggregateMoneyValue(value, money.currencySafety);
    return guarded === null
      ? "Data not available"
      : formatMoney(guarded, money.currencySafety.currency ?? undefined);
  };
  const kpis: Kpi[] = [
    {
      label: "Total net worth",
      value: moneyValue(netWorth),
      detail: "Cash available less outstanding debt",
      to: "/money-center",
      tone: "blue",
      icon: Landmark,
    },
    {
      label: "Cash available",
      value: moneyValue(money.cashAvailable),
      detail: "Across your connected accounts",
      to: "/money-center/accounts",
      tone: "green",
      icon: WalletCards,
    },
    {
      label: "Operating income",
      value: moneyValue(money.incomeThisMonth),
      detail: "Posted income this month",
      to: "/money-center/income",
      tone: "purple",
      icon: TrendingUp,
      change: money.incomeChangePct,
    },
    {
      label: "Open leads",
      value: String(business.openLeads),
      detail: `${business.newLeadsThisWeek} new this week`,
      to: "/people/leads",
      tone: "amber",
      icon: BriefcaseBusiness,
    },
  ];

  return (
    <section aria-labelledby="dashboard-kpi-title" className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="dashboard-eyebrow">Command snapshot</p>
          <h2 id="dashboard-kpi-title" className="mt-1 text-xl font-semibold tracking-tight">
            The four signals to check first.
          </h2>
        </div>
        <Link
          to="/money-center"
          className="hidden text-xs font-semibold text-primary transition-colors hover:text-primary/80 sm:inline-flex"
        >
          Open Money Center <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
        </Link>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Link key={kpi.label} to={kpi.to} className="group min-w-0">
              <Card
                data-tone={kpi.tone}
                className="dashboard-kpi-card h-full overflow-hidden rounded-[1.35rem] transition duration-300 group-hover:-translate-y-1 group-hover:shadow-xl"
              >
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="dashboard-kpi-label truncate">{kpi.label}</p>
                      {isLoading ? (
                        <div className="mt-3 h-8 w-28 animate-pulse rounded-lg bg-muted" />
                      ) : (
                        <p className="mt-3 truncate text-2xl font-bold tracking-tight">
                          {kpi.value}
                        </p>
                      )}
                    </div>
                    <span className="dashboard-kpi-icon flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ring-1 ring-inset">
                      <Icon className="h-5 w-5" />
                    </span>
                  </div>
                  <div className="mt-5 flex min-h-8 flex-col justify-end gap-1">
                    <p className="truncate text-[11px] text-muted-foreground">{kpi.detail}</p>
                    <ChangePill change={kpi.change} />
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
