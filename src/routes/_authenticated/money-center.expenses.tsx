import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlexOSMetricCard } from "@/components/alexos/metric-card";
import { AlexOSEmptyState } from "@/components/alexos/states";
import { AlexOSPageHeader } from "@/components/alexos/page-header";
import { AlexOSStatusBadge } from "@/components/alexos/status-badge";
import { useAccounts, useTransactions } from "@/lib/money/api";
import { formatDate, formatMoney, formatTime } from "@/lib/money/format";
import { ArrowUpCircle, Building2, Hash, Plus, Tag, User } from "lucide-react";
import { normalizeExpenseCategory } from "@/lib/money/constants";
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
    .filter((t) => t.expense_scope === "business")
    .reduce((s, t) => s + Number(t.amount), 0);
  const personalTotal = txs
    .filter((t) => t.expense_scope !== "business" && !t.business_id)
    .reduce((s, t) => s + Number(t.amount), 0);

  const byCat = txs.reduce<Record<string, number>>((acc, t) => {
    const k = normalizeExpenseCategory(t.category);
    acc[k] = (acc[k] ?? 0) + Number(t.amount);
    return acc;
  }, {});
  const categories = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
  const categoryMax = categories[0]?.[1] ?? 0;

  return (
    <div className="space-y-6">
      <AlexOSPageHeader
        title="Expenses"
        description="All money going out, separated by scope so business and personal spend never blur together."
        breadcrumbs={[{ label: "Money Center", to: "/money-center" }, { label: "Expenses" }]}
        actions={
          <Button variant="destructive" onClick={() => setOpen(true)}>
            <Plus aria-hidden="true" /> Quick add expense
          </Button>
        }
      />

      <div className="grid gap-3 grid-cols-2 lg:grid-cols-5">
        <AlexOSMetricCard
          label="This month"
          hint="Expenses since the 1st"
          value={formatMoney(monthTotal)}
          tone="expense"
          icon={ArrowUpCircle}
          emphasis
        />
        <AlexOSMetricCard
          label="All time"
          hint="Every expense on record"
          value={formatMoney(total)}
          tone="neutral"
          icon={Tag}
        />
        <AlexOSMetricCard
          label="Entries"
          hint="Individual expense records"
          value={txs.length}
          tone="neutral"
          icon={Hash}
        />
        <AlexOSMetricCard
          label="Business"
          hint="Scoped to a business"
          value={formatMoney(businessTotal)}
          tone="info"
          icon={Building2}
        />
        <AlexOSMetricCard
          label="Personal"
          hint="Not tied to a business"
          value={formatMoney(personalTotal)}
          tone="debt"
          icon={User}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent expenses</CardTitle>
            <CardDescription>The 20 most recent entries.</CardDescription>
          </CardHeader>
          <CardContent>
            {txs.length === 0 ? (
              <AlexOSEmptyState
                compact
                title="No expenses recorded yet"
                description="Log your first outgoing payment. Categorise it and mark the scope so business reporting stays accurate."
                action={
                  <Button variant="destructive" onClick={() => setOpen(true)}>
                    <Plus aria-hidden="true" /> Add expense
                  </Button>
                }
              />
            ) : (
              <ul className="divide-y divide-border">
                {txs.slice(0, 20).map((t) => (
                  <li key={t.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">
                        {t.description || normalizeExpenseCategory(t.category)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(t.occurred_at)} · {formatTime(t.occurred_at)} ·{" "}
                        {accName[t.account_id] ?? "Unknown account"} ·{" "}
                        {normalizeExpenseCategory(t.category)}
                      </div>
                      <div className="mt-1">
                        <AlexOSStatusBadge
                          status={
                            t.expense_scope === "business" || t.business_id
                              ? "business"
                              : "personal"
                          }
                          label={
                            t.expense_scope === "business" || t.business_id
                              ? "Business"
                              : "Personal"
                          }
                          tone={t.expense_scope === "business" || t.business_id ? "info" : "debt"}
                        />
                        {t.expense_type ? (
                          <AlexOSStatusBadge
                            status={t.expense_type}
                            tone="neutral"
                            className="ml-1"
                          />
                        ) : null}
                      </div>
                    </div>
                    <div
                      data-tone="expense"
                      className="alexos-tone-text flex items-center gap-1.5 text-sm font-semibold"
                    >
                      <ArrowUpCircle aria-hidden="true" className="size-4" />
                      <span className="alexos-amount">-{formatMoney(t.amount)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>By category</CardTitle>
            <CardDescription>Where the money is going.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {categories.length === 0 ? (
              <AlexOSEmptyState
                compact
                title="No categories yet"
                description="Categorise your expenses and the breakdown appears here automatically."
              />
            ) : (
              categories.map(([k, v]) => (
                <div key={k} className="space-y-1">
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="truncate text-muted-foreground">{k}</span>
                    <span className="alexos-amount text-tone-expense">{formatMoney(v)}</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-alexos-coral"
                      style={{
                        width: `${categoryMax > 0 ? Math.max(4, (v / categoryMax) * 100) : 0}%`,
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <TransactionFormDialog open={open} onOpenChange={setOpen} mode="expense" />
    </div>
  );
}
