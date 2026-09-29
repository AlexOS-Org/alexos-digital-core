import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { AlexOSMetricCard } from "@/components/alexos/metric-card";
import { AlexOSEmptyState } from "@/components/alexos/states";
import { AlexOSPageHeader } from "@/components/alexos/page-header";
import { AlexOSStatusBadge } from "@/components/alexos/status-badge";
import { useArchiveBudget, useBudgets, useTransactions, type Budget } from "@/lib/money/api";
import { useMoneyCenterScope } from "@/lib/money/scope";
import { formatMoney, monthKey, monthLabel } from "@/lib/money/format";
import { BudgetFormDialog } from "@/components/money/BudgetFormDialog";
import { ChevronLeft, ChevronRight, Pencil, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { normalizeExpenseCategory } from "@/lib/money/constants";
import { spentForBudgetCategory } from "@/lib/money/budget-calculations";

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
  const { businessId } = useMoneyCenterScope();
  const { data: budgets = [] } = useBudgets(month, businessId);
  const archive = useArchiveBudget();

  const monthStart = month;
  const monthEnd = shiftMonth(month, 1);
  const { data: txs = [] } = useTransactions({
    businessId,
    type: "expense",
    from: monthStart,
    toExclusive: monthEnd,
  });

  const spentByCat = useMemo(() => {
    const map: Record<string, number> = {};
    for (const t of txs) {
      const k = normalizeExpenseCategory(t.category);
      map[k] = (map[k] ?? 0) + Number(t.amount);
    }
    return map;
  }, [txs]);

  const totals = useMemo(() => {
    const budget = budgets.reduce((s, b) => s + Number(b.amount), 0);
    const spent = budgets.reduce((s, b) => s + spentForBudgetCategory(spentByCat, b.category), 0);
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
      <AlexOSPageHeader
        title="Budgets"
        description="Recurring monthly limits per category. The limit rolls forward automatically; monthly spending resets to zero when you change months."
        breadcrumbs={[{ label: "Money Center", to: "/money-center" }, { label: "Budgets" }]}
        actions={
          <Button onClick={openNew}>
            <Plus aria-hidden="true" /> New budget
          </Button>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            aria-label="Previous month"
            onClick={() => setMonth(shiftMonth(month, -1))}
          >
            <ChevronLeft aria-hidden="true" />
          </Button>
          <p className="min-w-[9rem] text-center text-sm font-semibold" aria-live="polite">
            {monthLabel(month)}
          </p>
          <Button
            variant="outline"
            size="icon"
            aria-label="Next month"
            onClick={() => setMonth(shiftMonth(month, 1))}
          >
            <ChevronRight aria-hidden="true" />
          </Button>
        </div>
        <div>
          <label htmlFor="budget-month" className="sr-only">
            Jump to month
          </label>
          <Input
            id="budget-month"
            type="month"
            value={month.slice(0, 7)}
            onChange={(e) => setMonth(`${e.target.value}-01`)}
            className="w-40"
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <AlexOSMetricCard
          label="Budgeted"
          hint="Total of all limits this month"
          value={formatMoney(totals.budget)}
          tone="neutral"
          emphasis
        />
        <AlexOSMetricCard
          label="Spent"
          hint="Against budgeted categories"
          value={formatMoney(totals.spent)}
          tone="expense"
        />
        <AlexOSMetricCard
          label="Remaining"
          hint={totals.remaining >= 0 ? "Still available" : "Over the combined limit"}
          value={formatMoney(totals.remaining)}
          tone={totals.remaining >= 0 ? "income" : "expense"}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {budgets.length === 0 ? (
          <div className="col-span-full">
            <AlexOSEmptyState
              title={`No budgets for ${monthLabel(month)}`}
              description="Create a budget to set a monthly limit for a category. The limit carries forward into future months, and spend against it is calculated from your recorded expenses."
              action={
                <Button onClick={openNew}>
                  <Plus aria-hidden="true" /> New budget
                </Button>
              }
            />
          </div>
        ) : null}
        {budgets.map((b) => {
          const spent = spentForBudgetCategory(spentByCat, b.category);
          const remaining = Number(b.amount) - spent;
          const pct = b.amount > 0 ? Math.min(100, (spent / Number(b.amount)) * 100) : 0;
          const over = spent > Number(b.amount);
          const state = over ? "over" : pct > 80 ? "overdue" : "active";
          return (
            <Card
              key={b.id}
              data-tone={state === "over" ? "danger" : state === "overdue" ? "warning" : "success"}
            >
              <CardContent className="space-y-3 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium">{b.category}</div>
                    <div className="alexos-num text-xs text-muted-foreground">
                      {formatMoney(spent)} of {formatMoney(b.amount)} this month
                    </div>
                    <div className="text-[11px] text-muted-foreground/80">
                      {b.month === month
                        ? "Started this month"
                        : `Recurring from ${monthLabel(b.month)}`}
                      {b.category === "Kids"
                        ? " · Includes School Fees, Expenses & Shopping"
                        : null}
                    </div>
                  </div>
                  <AlexOSStatusBadge
                    tone={state === "over" ? "danger" : state === "overdue" ? "warning" : "income"}
                    label={state === "over" ? "Over budget" : `${Math.round(pct)}% used`}
                    showDot
                  />
                </div>
                <Progress
                  value={pct}
                  aria-label={`${b.category} budget usage`}
                  className={cn("h-2", over && "[&>div]:bg-destructive")}
                />
                <div className="flex items-center justify-between gap-2">
                  <div
                    data-tone={remaining >= 0 ? "income" : "expense"}
                    className="alexos-tone-text text-sm font-medium"
                  >
                    {remaining >= 0 ? "Remaining" : "Over"}: {formatMoney(Math.abs(remaining))}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Edit ${b.category} budget`}
                      onClick={() => openEdit(b)}
                    >
                      <Pencil aria-hidden="true" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Remove ${b.category} budget`}
                      onClick={() => archive.mutate(b.id)}
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 aria-hidden="true" />
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
