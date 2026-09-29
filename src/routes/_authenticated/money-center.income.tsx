import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlexOSMetricCard } from "@/components/alexos/metric-card";
import { AlexOSEmptyState } from "@/components/alexos/states";
import { AlexOSPageHeader } from "@/components/alexos/page-header";
import { useAccounts, useTransactions } from "@/lib/money/api";
import { useMoneyCenterScope } from "@/lib/money/scope";
import { formatDate, formatMoney, formatTime } from "@/lib/money/format";
import { ArrowDownCircle, Hash, Plus, Wallet } from "lucide-react";
import { TransactionFormDialog } from "@/components/money/TransactionFormDialog";

export const Route = createFileRoute("/_authenticated/money-center/income")({
  component: IncomePage,
});

function IncomePage() {
  const [open, setOpen] = useState(false);
  const { businessId } = useMoneyCenterScope();
  const { data: txs = [] } = useTransactions({ businessId, type: "income" });
  const { data: accounts = [] } = useAccounts(true, businessId);
  const accName: Record<string, string> = Object.fromEntries(accounts.map((a) => [a.id, a.name]));

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthTotal = txs
    .filter((t) => new Date(t.occurred_at) >= monthStart)
    .reduce((s, t) => s + Number(t.amount), 0);
  const total = txs.reduce((s, t) => s + Number(t.amount), 0);

  const bySource = txs.reduce<Record<string, number>>((acc, t) => {
    const k = t.source ?? "Other";
    acc[k] = (acc[k] ?? 0) + Number(t.amount);
    return acc;
  }, {});
  const sources = Object.entries(bySource).sort((a, b) => b[1] - a[1]);
  const sourceMax = sources[0]?.[1] ?? 0;

  return (
    <div className="space-y-6">
      <AlexOSPageHeader
        title="Income"
        description="All money coming in, grouped by the source you recorded it against."
        breadcrumbs={[{ label: "Money Center", to: "/money-center" }, { label: "Income" }]}
        actions={
          <Button variant="success" onClick={() => setOpen(true)}>
            <Plus aria-hidden="true" /> Quick add income
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <AlexOSMetricCard
          label="This month"
          hint="Income recorded since the 1st"
          value={formatMoney(monthTotal)}
          tone="income"
          icon={ArrowDownCircle}
          emphasis
        />
        <AlexOSMetricCard
          label="All time"
          hint="Every income entry on record"
          value={formatMoney(total)}
          tone="neutral"
          icon={Wallet}
        />
        <AlexOSMetricCard
          label="Entries"
          hint="Individual income records"
          value={txs.length}
          tone="neutral"
          icon={Hash}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent income</CardTitle>
            <CardDescription>The 20 most recent entries.</CardDescription>
          </CardHeader>
          <CardContent>
            {txs.length === 0 ? (
              <AlexOSEmptyState
                compact
                title="No income recorded yet"
                description="Log your first payment, salary or sale. Income entries raise your account balances and flow into every Money Center total."
                action={
                  <Button variant="success" onClick={() => setOpen(true)}>
                    <Plus aria-hidden="true" /> Add income
                  </Button>
                }
              />
            ) : (
              <ul className="divide-y divide-border">
                {txs.slice(0, 20).map((t) => (
                  <li key={t.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">
                        {t.description || t.source}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(t.occurred_at)} · {formatTime(t.occurred_at)} ·{" "}
                        {accName[t.account_id] ?? "Unknown account"} · {t.source ?? "Other"}
                      </div>
                    </div>
                    <div
                      data-tone="income"
                      className="alexos-tone-text flex items-center gap-1.5 text-sm font-semibold"
                    >
                      <ArrowDownCircle aria-hidden="true" className="size-4" />
                      <span className="alexos-amount">+{formatMoney(t.amount)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>By source</CardTitle>
            <CardDescription>Where income is coming from.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {sources.length === 0 ? (
              <AlexOSEmptyState
                compact
                title="No sources yet"
                description="Record income with a source — salary, client, marketplace — and the split appears here."
              />
            ) : (
              sources.map(([k, v]) => (
                <div key={k} className="space-y-1">
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="truncate text-muted-foreground">{k}</span>
                    <span className="alexos-amount text-tone-income">{formatMoney(v)}</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-alexos-green"
                      style={{
                        width: `${sourceMax > 0 ? Math.max(4, (v / sourceMax) * 100) : 0}%`,
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <TransactionFormDialog open={open} onOpenChange={setOpen} mode="income" />
    </div>
  );
}
