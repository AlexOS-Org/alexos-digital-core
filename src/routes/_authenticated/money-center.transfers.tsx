import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlexOSMetricCard } from "@/components/alexos/metric-card";
import { AlexOSEmptyState } from "@/components/alexos/states";
import { AlexOSPageHeader } from "@/components/alexos/page-header";
import { useAccounts, useTransactions } from "@/lib/money/api";
import { formatDate, formatMoney, formatTime } from "@/lib/money/format";
import { Hash, Plus, Repeat } from "lucide-react";
import { TransactionFormDialog } from "@/components/money/TransactionFormDialog";

export const Route = createFileRoute("/_authenticated/money-center/transfers")({
  component: TransfersPage,
});

function TransfersPage() {
  const [open, setOpen] = useState(false);
  const { data: txs = [] } = useTransactions({ type: "transfer" });
  const { data: accounts = [] } = useAccounts(true);
  const accName: Record<string, string> = Object.fromEntries(accounts.map((a) => [a.id, a.name]));

  const total = txs.reduce((s, t) => s + Number(t.amount), 0);

  return (
    <div className="space-y-6">
      <AlexOSPageHeader
        title="Transfers"
        description="Move money between your accounts. Transfers move your position without counting as income or expense."
        breadcrumbs={[{ label: "Money Center", to: "/money-center" }, { label: "Transfers" }]}
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus aria-hidden="true" /> New transfer
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <AlexOSMetricCard
          label="Total moved"
          hint="Sum of every transfer on record"
          value={formatMoney(total)}
          tone="info"
          icon={Repeat}
          emphasis
        />
        <AlexOSMetricCard
          label="Transfers"
          hint="Individual movement records"
          value={txs.length}
          tone="neutral"
          icon={Hash}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent transfers</CardTitle>
          <CardDescription>The 30 most recent movements between accounts.</CardDescription>
        </CardHeader>
        <CardContent>
          {txs.length === 0 ? (
            <AlexOSEmptyState
              compact
              title="No transfers recorded yet"
              description="Record a movement between your own accounts to keep every balance reconciled. Transfers never affect income or expense totals."
              action={
                <Button onClick={() => setOpen(true)}>
                  <Plus aria-hidden="true" /> New transfer
                </Button>
              }
            />
          ) : (
            <ul className="divide-y divide-border">
              {txs.slice(0, 30).map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      data-tone="info"
                      className="alexos-tone-bg alexos-tone-text grid size-9 shrink-0 place-items-center rounded-lg"
                    >
                      <Repeat aria-hidden="true" className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">
                        {accName[t.account_id] ?? "Unknown account"} →{" "}
                        {t.transfer_account_id
                          ? (accName[t.transfer_account_id] ?? "Unknown account")
                          : "—"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(t.occurred_at)} · {formatTime(t.occurred_at)}
                        {t.description ? ` · ${t.description}` : ""}
                      </div>
                    </div>
                  </div>
                  <div className="alexos-amount text-sm text-tone-info">
                    {formatMoney(t.amount)}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <TransactionFormDialog open={open} onOpenChange={setOpen} mode="transfer" />
    </div>
  );
}
