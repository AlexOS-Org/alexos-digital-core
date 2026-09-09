import { useMemo, useState } from "react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowDownRight, ArrowUpRight, ChartNoAxesCombined } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTransactions } from "@/lib/money/api";
import { formatMoney } from "@/lib/money/format";
import { cn } from "@/lib/utils";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

type RangeMonths = 6 | 12;

export default function MoneyFlowChart() {
  const { data: transactions = [], isLoading } = useTransactions();
  const [rangeMonths, setRangeMonths] = useState<RangeMonths>(6);

  const { chartData, income, expenses, net, isEmpty } = useMemo(() => {
    const now = new Date();
    const months = Array.from({ length: rangeMonths }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (rangeMonths - 1 - index), 1);
      return {
        year: date.getFullYear(),
        month: date.getMonth(),
        label: MONTHS[date.getMonth()],
        income: 0,
        expenses: 0,
        net: 0,
      };
    });

    for (const transaction of transactions) {
      if (transaction.status !== "posted") continue;
      const date = new Date(transaction.occurred_at);
      const bucket = months.find(
        (item) => item.year === date.getFullYear() && item.month === date.getMonth(),
      );
      if (!bucket) continue;
      if (transaction.type === "income") bucket.income += Number(transaction.amount || 0);
      if (transaction.type === "expense") bucket.expenses += Number(transaction.amount || 0);
    }

    for (const bucket of months) {
      bucket.net = bucket.income - bucket.expenses;
    }

    const incomeTotal = months.reduce((sum, item) => sum + item.income, 0);
    const expensesTotal = months.reduce((sum, item) => sum + item.expenses, 0);

    return {
      chartData: months,
      income: incomeTotal,
      expenses: expensesTotal,
      net: incomeTotal - expensesTotal,
      isEmpty: incomeTotal === 0 && expensesTotal === 0,
    };
  }, [transactions, rangeMonths]);

  return (
    <Card className="dashboard-surface alexos-data-metric min-w-0 rounded-[1.75rem]">
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 pb-2">
        <div className="min-w-0">
          <p className="dashboard-eyebrow text-primary">Money movement</p>
          <CardTitle className="mt-1 text-lg tracking-tight">Cash flow</CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            Posted income and expenses only. Transfers are excluded.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <div
            className="flex rounded-full border border-border/60 bg-muted/40 p-0.5"
            role="group"
            aria-label="Chart range"
          >
            {([6, 12] as const).map((months) => (
              <button
                key={months}
                type="button"
                onClick={() => setRangeMonths(months)}
                className={cn(
                  "rounded-full px-2.5 py-1 text-[10px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  rangeMonths === months
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
                aria-pressed={rangeMonths === months}
              >
                {months} mo
              </button>
            ))}
          </div>
          <div className="grid h-11 w-11 place-items-center rounded-full bg-primary/10 text-primary ring-1 ring-primary/15">
            <ChartNoAxesCombined className="h-5 w-5" aria-hidden="true" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div
            className="h-56 animate-pulse rounded-2xl bg-muted/50 3xl:h-72 4k:h-80"
            aria-label="Loading cash flow chart"
          />
        ) : isEmpty ? (
          <div
            className="flex h-56 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border/60 bg-muted/20 px-6 text-center 3xl:h-72 4k:h-80"
            role="status"
          >
            <p className="text-sm font-semibold tracking-tight">No posted activity in this range</p>
            <p className="max-w-sm text-xs leading-5 text-muted-foreground">
              When income or expenses are recorded, this chart shows monthly cash movement and net
              operating result.
            </p>
          </div>
        ) : (
          <div
            className="dashboard-chart-grid h-56 min-w-0 w-full rounded-2xl px-1 pt-2 sm:h-60 sm:px-2 lg:h-64 3xl:h-72 4k:h-80"
            aria-label={`${rangeMonths}-month income, expense, and net chart`}
          >
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <ComposedChart
                data={chartData}
                barGap={4}
                margin={{ top: 8, right: 8, left: -12, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="var(--color-border)"
                />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                  interval={rangeMonths === 12 ? 0 : "preserveStartEnd"}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
                  tickFormatter={(value) => `${Math.round(Number(value) / 1000)}k`}
                />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    formatMoney(Number(value)),
                    name === "net" ? "Net" : name === "income" ? "Income" : "Expenses",
                  ]}
                  cursor={{ fill: "var(--color-muted)" }}
                  contentStyle={{
                    borderRadius: 14,
                    border: "1px solid var(--color-border)",
                    background: "var(--color-card)",
                  }}
                />
                <Bar
                  dataKey="income"
                  name="income"
                  fill="var(--color-chart-2)"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={rangeMonths === 12 ? 18 : 28}
                />
                <Bar
                  dataKey="expenses"
                  name="expenses"
                  fill="var(--color-chart-4)"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={rangeMonths === 12 ? 18 : 28}
                />
                <Line
                  type="monotone"
                  dataKey="net"
                  name="net"
                  stroke="var(--color-chart-1)"
                  strokeWidth={2.25}
                  dot={{ r: 3, fill: "var(--color-chart-1)", strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
        <div className="mt-3 grid grid-cols-3 gap-2 sm:gap-3">
          <div className="flex items-center gap-2 rounded-2xl dashboard-tone-green dashboard-tone-panel p-3">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full dashboard-tone-green dashboard-tone-icon">
              <ArrowUpRight className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Income</p>
              <p className="truncate text-sm font-bold">{formatMoney(income)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-2xl dashboard-tone-amber dashboard-tone-panel p-3">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full dashboard-tone-amber dashboard-tone-icon">
              <ArrowDownRight className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Expenses</p>
              <p className="truncate text-sm font-bold">{formatMoney(expenses)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-2xl dashboard-tone-blue dashboard-tone-panel p-3">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full dashboard-tone-blue dashboard-tone-icon">
              <ChartNoAxesCombined className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Net</p>
              <p className="truncate text-sm font-bold">{formatMoney(net)}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
