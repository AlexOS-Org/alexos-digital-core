import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowDownRight, ArrowUpRight, ChartNoAxesCombined } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTransactions } from "@/lib/money/api";
import { formatMoney } from "@/lib/money/format";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function MoneyFlowChart() {
  const { data: transactions = [], isLoading } = useTransactions();
  const { chartData, income, expenses } = useMemo(() => {
    const now = new Date();
    const months = Array.from({ length: 6 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
      return {
        year: date.getFullYear(),
        month: date.getMonth(),
        label: MONTHS[date.getMonth()],
        income: 0,
        expenses: 0,
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
    return {
      chartData: months,
      income: months.reduce((sum, item) => sum + item.income, 0),
      expenses: months.reduce((sum, item) => sum + item.expenses, 0),
    };
  }, [transactions]);

  return (
    <Card className="rounded-[1.75rem] border-border/60 bg-card/80 shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 pb-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            Money movement
          </p>
          <CardTitle className="mt-1 text-lg tracking-tight">Six-month cash flow</CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            Posted income and expenses only. Transfers are excluded.
          </p>
        </div>
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary/10 text-primary ring-1 ring-primary/15">
          <ChartNoAxesCombined className="h-5 w-5" aria-hidden="true" />
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div
            className="h-56 animate-pulse rounded-2xl bg-muted/50"
            aria-label="Loading cash flow chart"
          />
        ) : (
          <div className="h-56 w-full" aria-label="Six-month income and expense chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                barGap={6}
                margin={{ top: 8, right: 4, left: -18, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="hsl(var(--border) / 0.7)"
                />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  tickFormatter={(value) => `${Math.round(Number(value) / 1000)}k`}
                />
                <Tooltip
                  formatter={(value: number) => formatMoney(Number(value))}
                  cursor={{ fill: "hsl(var(--muted) / 0.35)" }}
                  contentStyle={{
                    borderRadius: 14,
                    border: "1px solid hsl(var(--border))",
                    background: "hsl(var(--card))",
                  }}
                />
                <Bar
                  dataKey="income"
                  name="Income"
                  fill="hsl(var(--chart-2))"
                  radius={[6, 6, 0, 0]}
                />
                <Bar
                  dataKey="expenses"
                  name="Expenses"
                  fill="hsl(var(--chart-4))"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 rounded-2xl bg-emerald-500/8 p-3">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-300">
              <ArrowUpRight className="h-4 w-4" />
            </span>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Income</p>
              <p className="text-sm font-bold">{formatMoney(income)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-2xl bg-amber-500/8 p-3">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-300">
              <ArrowDownRight className="h-4 w-4" />
            </span>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Expenses</p>
              <p className="text-sm font-bold">{formatMoney(expenses)}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
