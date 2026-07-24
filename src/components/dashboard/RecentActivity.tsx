import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDownLeft, ArrowUpRight, Wallet } from "lucide-react";
import { useTransactions } from "@/lib/money/api";
import { formatMoney } from "@/lib/money/format";

export default function RecentActivity() {
  const { data: transactions = [] } = useTransactions();

  const recent = [...transactions]
    .sort(
      (a, b) =>
        new Date(b.occurred_at).getTime() -
        new Date(a.occurred_at).getTime()
    )
    .slice(0, 5);

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {recent.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            No recent transactions.
          </div>
        ) : (
          recent.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-xl border p-4"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-primary/10 p-2">
                  {item.type === "income" ? (
                    <ArrowDownLeft className="h-5 w-5 text-green-600" />
                  ) : item.type === "expense" ? (
                    <ArrowUpRight className="h-5 w-5 text-red-600" />
                  ) : (
                    <Wallet className="h-5 w-5 text-blue-600" />
                  )}
                </div>

                <div>
                  <p className="font-medium">
                    {item.description || item.category || "Transaction"}
                  </p>

                  <p className="text-xs text-muted-foreground">
                    {new Date(item.occurred_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <p className="font-bold">
                  {formatMoney(Number(item.amount))}
                </p>

                <p className="text-xs capitalize text-muted-foreground">
                  {item.type}
                </p>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}