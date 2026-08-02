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
    hour < 12
      ? "🌅 Good Morning"
      : hour < 17
        ? "☀️ Good Afternoon"
        : "🌙 Good Evening";

  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const monthTransactions = transactions.filter((transaction) => {
    const date = new Date(transaction.occurred_at);

    return (
      date.getMonth() === currentMonth &&
      date.getFullYear() === currentYear &&
      transaction.status === "posted"
    );
  });

  const income = monthTransactions
    .filter((transaction) => transaction.type === "income")
    .reduce((total, transaction) => total + Number(transaction.amount), 0);

  const expenses = monthTransactions
    .filter((transaction) => transaction.type === "expense")
    .reduce((total, transaction) => total + Number(transaction.amount), 0);

  const expectedIncome = expected.reduce(
    (total, item) => total + Number(item.amount),
    0,
  );

  const cashFlow = income - expenses;

  const transportExpenses = monthTransactions
    .filter(
      (transaction) =>
        transaction.type === "expense" &&
        (transaction.category ?? "").toLowerCase().includes("transport"),
    )
    .reduce((total, transaction) => total + Number(transaction.amount), 0);

  const dueTomorrow = expected.filter((item) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const expectedDate = new Date(item.expected_date);

    return (
      expectedDate.getDate() === tomorrow.getDate() &&
      expectedDate.getMonth() === tomorrow.getMonth() &&
      expectedDate.getFullYear() === tomorrow.getFullYear()
    );
  }).length;

  const insights: string[] = [];

  if (cashFlow >= 0) {
    insights.push("✅ Your business generated a positive cash flow this month.");
  } else {
    insights.push(
      `⚠️ Expenses exceeded income by ${formatMoney(Math.abs(cashFlow))} this month.`,
    );
  }

  if (transportExpenses > 0) {
    insights.push(
      `🚗 Transport spending this month totals ${formatMoney(transportExpenses)}.`,
    );
  }

  if (expectedIncome > 0) {
    insights.push(
      `💰 ${formatMoney(expectedIncome)} is expected. Follow up on outstanding payments to strengthen cash flow.`,
    );
  }

  if (dueTomorrow > 0) {
    insights.push(
      `📅 ${dueTomorrow} expected payment${
        dueTomorrow > 1 ? "s are" : " is"
      } scheduled for tomorrow.`,
    );
  }

  if (insights.length === 0) {
    insights.push(
      "Everything looks healthy today. Continue recording your business activity to keep your insights accurate.",
    );
  }

  return (
    <Card className="rounded-2xl shadow-sm">
      <CardHeader className="flex flex-row items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <Brain className="h-5 w-5 text-primary" />
        </div>

        <div>
          <CardTitle>AlexOS Intelligence</CardTitle>

          <p className="text-sm text-muted-foreground">
            Business intelligence for smarter decisions.
          </p>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="rounded-xl border bg-muted/30 p-5">
          <p className="text-lg font-semibold">
            {greeting}, Alex 👋
          </p>

          <p className="mt-2 text-sm text-muted-foreground">
            Here's what requires your attention today.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border p-4">
            <TrendingUp className="h-5 w-5 text-green-600" />

            <h3 className="mt-4 text-sm font-medium">
              Income
            </h3>

            <p className="mt-2 text-xl font-bold text-green-600">
              {formatMoney(income)}
            </p>
          </div>

          <div className="rounded-xl border p-4">
            <TrendingDown className="h-5 w-5 text-red-600" />

            <h3 className="mt-4 text-sm font-medium">
              Expenses
            </h3>

            <p className="mt-2 text-xl font-bold text-red-600">
              {formatMoney(expenses)}
            </p>
          </div>

          <div className="rounded-xl border p-4">
            <CircleDollarSign className="h-5 w-5 text-orange-600" />

            <h3 className="mt-4 text-sm font-medium">
              Expected Income
            </h3>

            <p className="mt-2 text-xl font-bold">
              {formatMoney(expectedIncome)}
            </p>
          </div>

          <div className="rounded-xl border p-4">
            <Target className="h-5 w-5 text-purple-600" />

            <h3 className="mt-4 text-sm font-medium">
              Net Cash Flow
            </h3>

            <p
              className={`mt-2 text-xl font-bold ${
                cashFlow >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {formatMoney(cashFlow)}
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
          <p className="mb-4 font-semibold">
            AlexOS Intelligence
          </p>

          <div className="space-y-3">
            {insights.map((insight, index) => (
              <div
                key={index}
                className="rounded-lg border bg-background p-3 text-sm"
              >
                {insight}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}