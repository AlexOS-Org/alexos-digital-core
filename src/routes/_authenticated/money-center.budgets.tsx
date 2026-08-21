import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useArchiveBudget, useBudgets, useTransactions, type Budget } from "@/lib/money/api";
import { formatMoney, monthKey, monthLabel } from "@/lib/money/format";
import { BudgetFormDialog } from "@/components/money/BudgetFormDialog";
import { ChevronLeft, ChevronRight, Pencil, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/money-center/budgets")({
  component: BudgetsPage,
});

function shiftMonth(iso: string, delta: number) {
  const d = new Date(iso);
  d.setMonth(d.getMonth() + delta);
  return monthKey(d);
}

function BudgetsPage() {
  const [month, setMonth] = useState<string>(monthKey());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Budget | null>(null);
  const { data: budgets = [] } = useBudgets(month);
  const archive = useArchiveBudget();

  const monthStart = month;
  const monthEnd = shiftMonth(month, 1);
  const { data: txs = [] } = useTransactions({
    type: "expense",
    from: monthStart,
    toExclusive: monthEnd,
  });

  const spentByCat = useMemo(() => {
    const map: Record<string, number> = {};
    for (const t of txs) {
      const k = t.category ?? "Other";
      map[k] = (map[k] ?? 0) + Number(t.amount);
    }
    return map;
  }, [txs]);

  const totals = useMemo(() => {
    const budget = budgets.reduce((s, b) => s + Number(b.amount), 0);
    const spent = budgets.reduce((s, b) => s + (spentByCat[b.category] ?? 0), 0);
    return { budget, spent, remaining: budget - spent };
  }, [budgets, spentByCat]);

  const openNew = () => {
    setEditing(null);
    setDialogOpen(true);
  };
  const openEdit = (b: Budget) => {
    setEditing(b);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Budgets</h1>
          <p className="text-sm text-muted-foreground">
            Recurring monthly limits per category. The limit rolls forward automatically; monthly
            spending resets to zero when you change months.
          </p>
        </div>
        <Button onClick={openNew} className="rounded-xl">
          <Plus className="h-4 w-4 mr-1" /> New Budget
        </Button>
      </header>

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setMonth(shiftMonth(month, -1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-sm font-semibold min-w-[10rem] text-center">{monthLabel(month)}</div>
          <Button variant="outline" size="icon" onClick={() => setMonth(shiftMonth(month, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Input
          type="month"
          value={month.slice(0, 7)}
          onChange={(e) => setMonth(`${e.target.value}-01`)}
          className="w-40"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="rounded-2xl">
          <CardHeader className="pb-1">
            <CardTitle className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Budgeted
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-semibold">{formatMoney(totals.budget)}</div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardHeader className="pb-1">
            <CardTitle className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Spent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-semibold text-destructive">
              {formatMoney(totals.spent)}
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardHeader className="pb-1">
            <CardTitle className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Remaining
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={cn(
                "text-xl font-semibold",
                totals.remaining >= 0 ? "text-[color:var(--success)]" : "text-destructive",
              )}
            >
              {formatMoney(totals.remaining)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
        {budgets.length === 0 && (
          <div className="col-span-full text-sm text-muted-foreground border border-dashed rounded-2xl p-8 text-center">
            No recurring budgets are available for {monthLabel(month)}. Create one to set a limit
            that will continue into future months.
          </div>
        )}
        {budgets.map((b) => {
          const spent = spentByCat[b.category] ?? 0;
          const remaining = Number(b.amount) - spent;
          const pct = b.amount > 0 ? Math.min(100, (spent / Number(b.amount)) * 100) : 0;
          const over = spent > Number(b.amount);
          return (
            <Card key={b.id} className="rounded-2xl">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{b.category}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatMoney(spent)} of {formatMoney(b.amount)} this month
                    </div>
                    <div className="text-[11px] text-muted-foreground/80">
                      {b.month === month
                        ? "Started this month"
                        : `Recurring from ${monthLabel(b.month)}`}
                    </div>
                  </div>
                  <Badge variant={over ? "destructive" : pct > 80 ? "secondary" : "default"}>
                    {Math.round(pct)}%
                  </Badge>
                </div>
                <Progress value={pct} className={cn("h-2", over && "[&>div]:bg-destructive")} />
                <div className="flex items-center justify-between">
                  <div
                    className={cn(
                      "text-sm font-medium",
                      remaining >= 0 ? "text-[color:var(--success)]" : "text-destructive",
                    )}
                  >
                    {remaining >= 0 ? "Remaining" : "Over"}: {formatMoney(Math.abs(remaining))}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openEdit(b)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => archive.mutate(b.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <BudgetFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        month={month}
        editing={editing}
      />
    </div>
  );
}
