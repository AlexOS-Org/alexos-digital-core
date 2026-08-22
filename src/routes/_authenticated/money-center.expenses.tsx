import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAccounts, useTransactions } from "@/lib/money/api";
import { formatDate, formatMoney, formatTime } from "@/lib/money/format";
import { ArrowUpCircle, Plus } from "lucide-react";
import { TransactionFormDialog } from "@/components/money/TransactionFormDialog";

export const Route = createFileRoute("/_authenticated/money-center/expenses")({
  component: ExpensesPage,
});

function ExpensesPage() {
  const [open, setOpen] = useState(false);
  const { data: txs = [] } = useTransactions({ type: "expense" });
  const { data: accounts = [] } = useAccounts(true);
  const accName: Record<string, string> = Object.fromEntries(accounts.map((a) => [a.id, a.name]));

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthTotal = txs
    .filter((t) => new Date(t.occurred_at) >= monthStart)
    .reduce((s, t) => s + Number(t.amount), 0);
  const total = txs.reduce((s, t) => s + Number(t.amount), 0);
  const businessTotal = txs
    .filter((t) => Boolean(t.business_id))
    .reduce((s, t) => s + Number(t.amount), 0);
  const personalTotal = txs.filter((t) => !t.business_id).reduce((s, t) => s + Number(t.amount), 0);

  const byCat = txs.reduce<Record<string, number>>((acc, t) => {
    const k = t.category ?? "Other";
    acc[k] = (acc[k] ?? 0) + Number(t.amount);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Expenses</h1>
          <p className="text-sm text-muted-foreground">All money going out.</p>
        </div>
        <Button onClick={() => setOpen(true)} variant="destructive" className="rounded-xl">
          <Plus className="h-4 w-4 mr-1" /> Quick Add Expense
        </Button>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Card className="rounded-2xl">
          <CardHeader className="pb-1">
            <CardTitle className="text-[10px] uppercase tracking-widest text-muted-foreground">
              This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-semibold text-destructive">{formatMoney(monthTotal)}</div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardHeader className="pb-1">
            <CardTitle className="text-[10px] uppercase tracking-widest text-muted-foreground">
              All Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-semibold">{formatMoney(total)}</div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardHeader className="pb-1">
            <CardTitle className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Entries
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-semibold">{txs.length}</div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-primary/20 bg-primary/[0.04]">
          <CardHeader className="pb-1">
            <CardTitle className="text-[10px] uppercase tracking-widest text-primary">
              Business
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-semibold">{formatMoney(businessTotal)}</div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-violet-500/20 bg-violet-500/[0.04]">
          <CardHeader className="pb-1">
            <CardTitle className="text-[10px] uppercase tracking-widest text-violet-600 dark:text-violet-300">
              Personal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-semibold">{formatMoney(personalTotal)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="rounded-2xl lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Recent Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            {txs.length === 0 ? (
              <div className="text-sm text-muted-foreground border border-dashed rounded-xl p-8 text-center">
                No expenses recorded yet.
              </div>
            ) : (
              <ul className="divide-y">
                {txs.slice(0, 20).map((t) => (
                  <li key={t.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">
                        {t.description || t.category}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(t.occurred_at)} · {formatTime(t.occurred_at)} ·{" "}
                        {accName[t.account_id]} · {t.category}
                      </div>
                      <div className="mt-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                        {t.business_id ? "Business expense" : "Personal expense"}
                        {t.expense_type ? ` · ${t.expense_type.replace(/_/g, " ")}` : ""}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-destructive font-semibold">
                      <ArrowUpCircle className="h-4 w-4" />-{formatMoney(t.amount)}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base">By Category</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(byCat).length === 0 && (
              <div className="text-sm text-muted-foreground">—</div>
            )}
            {Object.entries(byCat)
              .sort((a, b) => b[1] - a[1])
              .map(([k, v]) => (
                <div key={k} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{k}</span>
                  <span className="font-medium">{formatMoney(v)}</span>
                </div>
              ))}
          </CardContent>
        </Card>
      </div>

      <TransactionFormDialog open={open} onOpenChange={setOpen} mode="expense" />
    </div>
  );
}
