import { Brain, CircleDollarSign, TrendingDown, TrendingUp, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useExpected, useTransactions } from "@/lib/money/api";
import { formatMoney } from "@/lib/money/format";

export function AIBriefing() {
  const { data: expected = [] } = useExpected("pending");
  const { data: transactions = [] } = useTransactions();

  const now = new Date();
  const hour = now.getHours();

  const greeting =
    hour < 12 ? "🌅 Good Morning" : hour < 17 ? "☀️ Good Afternoon" : "🌙 Good Evening";

  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const monthTransactions = transactions.filter((t) => {
    const d = new Date(t.occurred_at);

    return (
      d.getMonth() === currentMonth && d.getFullYear() === currentYear && t.status === "posted"
    );
  });

  const income = monthTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const expenses = monthTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const expectedCash = expected.reduce((sum, item) => sum + Number(item.amount), 0);

  const cashFlow = income - expenses;

  const transport = monthTransactions
    .filter((t) => t.type === "expense" && (t.category ?? "").toLowerCase().includes("transport"))
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const dueTomorrow = expected.filter((item) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const d = new Date(item.expected_date);

    return (
      d.getDate() === tomorrow.getDate() &&
      d.getMonth() === tomorrow.getMonth() &&
      d.getFullYear() === tomorrow.getFullYear()
    );
  }).length;

  const insights: string[] = [];

  if (cashFlow >= 0) {
    insights.push("✅ Your cash flow is positive this month.");
  } else {
    insights.push(
      `⚠️ You have spent ${formatMoney(Math.abs(cashFlow))} more than you've earned this month.`,
    );
  }

  if (transport > 0) {
    insights.push(`🚗 Transport expenses this month: ${formatMoney(transport)}.`);
  }

  if (expectedCash > 0) {
    insights.push(
      `💰 Follow up on ${formatMoney(expectedCash)} in expected income to improve cash flow.`,
    );
  }

  if (dueTomorrow > 0) {
    insights.push(
      `📅 You have ${dueTomorrow} expected payment${dueTomorrow > 1 ? "s" : ""} due tomorrow.`,
    );
  }

  if (insights.length === 0) {
    insights.push("Everything looks good today. Keep recording transactions.");
  }

  return (
    <Card className="rounded-2xl shadow-sm">
      <CardHeader className="flex flex-row items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Brain className="h-5 w-5 text-primary" />
        </div>

        <div>
          <CardTitle>AlexOS AI Briefing</CardTitle>

          <p className="text-sm text-muted-foreground">Your business intelligence overview.</p>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="rounded-xl border bg-muted/30 p-5">
          <p className="font-semibold text-lg">{greeting}, Alex 👋</p>

          <p className="text-sm text-muted-foreground mt-2">
            Here's what deserves your attention today.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border p-4">
            <TrendingUp className="h-5 w-5 text-green-600" />

            <h3 className="mt-4 text-sm font-medium">Income</h3>

            <p className="text-xl font-bold text-green-600 mt-2">{formatMoney(income)}</p>
          </div>

          <div className="rounded-xl border p-4">
            <TrendingDown className="h-5 w-5 text-red-600" />

            <h3 className="mt-4 text-sm font-medium">Expenses</h3>

            <p className="text-xl font-bold text-red-600 mt-2">{formatMoney(expenses)}</p>
          </div>

          <div className="rounded-xl border p-4">
            <CircleDollarSign className="h-5 w-5 text-orange-600" />

            <h3 className="mt-4 text-sm font-medium">Expected Income</h3>

            <p className="text-xl font-bold mt-2">{formatMoney(expectedCash)}</p>
          </div>

          <div className="rounded-xl border p-4">
            <Target className="h-5 w-5 text-purple-600" />

            <h3 className="mt-4 text-sm font-medium">Cash Flow</h3>

            <p className="text-xl font-bold mt-2">{formatMoney(cashFlow)}</p>
          </div>
        </div>

        <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
          <p className="font-semibold mb-4">🤖 AlexOS Insights</p>

          <div className="space-y-3">
            {insights.map((insight, index) => (
              <div key={index} className="rounded-lg bg-background p-3 border text-sm">
                {insight}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
