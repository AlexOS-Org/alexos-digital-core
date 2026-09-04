import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDownLeft, ArrowUpRight, Wallet, Activity } from "lucide-react";
import { useTransactions } from "@/lib/money/api";
import { formatMoney } from "@/lib/money/format";

export default function RecentActivity() {
  const { data: transactions = [] } = useTransactions();
  const recent = [...transactions]
    .sort((a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime())
    .slice(0, 5);

  return (
    <Card className="h-full rounded-[1.8rem] border-border/60 bg-card/80 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl dashboard-tone-blue dashboard-tone-icon">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-base">Recent Activity</CardTitle>
            <p className="mt-0.5 text-xs text-muted-foreground">Your latest money moves</p>
          </div>
        </div>
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Live
        </span>
      </CardHeader>
      <CardContent className="space-y-2">
        {recent.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
            No recent transactions yet.
          </div>
        ) : (
          recent.map((item) => (
            <div
              key={item.id}
              className="group flex items-center justify-between gap-4 rounded-2xl border border-border/50 bg-muted/20 p-3.5 transition-colors hover:bg-muted/50"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${item.type === "income" ? "dashboard-tone-green dashboard-tone-icon" : item.type === "expense" ? "dashboard-tone-danger dashboard-tone-icon" : "dashboard-tone-blue dashboard-tone-icon"}`}
                >
                  {item.type === "income" ? (
                    <ArrowDownLeft className="h-4 w-4" />
                  ) : item.type === "expense" ? (
                    <ArrowUpRight className="h-4 w-4" />
                  ) : (
                    <Wallet className="h-4 w-4" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {item.description || item.category || "Transaction"}
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {new Date(item.occurred_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-bold">{formatMoney(Number(item.amount))}</p>
                <p className="text-[10px] capitalize text-muted-foreground">{item.type}</p>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
