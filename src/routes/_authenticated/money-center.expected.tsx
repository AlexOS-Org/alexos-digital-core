import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlexOSDataTable } from "@/components/alexos/data-table";
import { AlexOSFormField } from "@/components/alexos/form";
import { AlexOSMetricCard } from "@/components/alexos/metric-card";
import { AlexOSEmptyState, AlexOSLoadingState } from "@/components/alexos/states";
import { AlexOSPageHeader } from "@/components/alexos/page-header";
import { AlexOSStatusBadge } from "@/components/alexos/status-badge";
import {
  Table,
  TableActionsCell,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableNumericCell,
  TableNumericHead,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useAccounts,
  useCancelExpected,
  useExpected,
  useMarkExpectedReceived,
  useTransactions,
  type Expected,
} from "@/lib/money/api";
import { ExpectedFormDialog } from "@/components/money/ExpectedFormDialog";
import { formatDate, formatMoney } from "@/lib/money/format";
import {
  aggregateExpectedMoney,
  classifyExpectedMoney,
  type ExpectedMoneyState,
} from "@/lib/money/expected-money";
import { Check, Pencil, Plus, Scale, X } from "lucide-react";

export const Route = createFileRoute("/_authenticated/money-center/expected")({
  component: ExpectedPage,
});

function ExpectedPage() {
  const { data: allExpected = [], isLoading: expectedLoading } = useExpected();
  const { data: transactions = [], isLoading: transactionsLoading } = useTransactions({
    includeVoided: true,
    limit: 1000,
  });
  const { data: accounts = [] } = useAccounts();
  const markReceived = useMarkExpectedReceived();
  const cancel = useCancelExpected();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Expected | null>(null);
  const [receiveOpen, setReceiveOpen] = useState(false);
  const [receiveTarget, setReceiveTarget] = useState<Expected | null>(null);
  const [receiveAccount, setReceiveAccount] = useState<string>("");

  const transactionsById = new Map(
    transactions.map((transaction) => [transaction.id, transaction]),
  );
  const stateFor = (expected: Expected): ExpectedMoneyState =>
    classifyExpectedMoney(
      expected,
      new Date(),
      expected.received_transaction_id
        ? transactionsById.get(expected.received_transaction_id)
        : null,
    );
  const pending = allExpected.filter((expected) =>
    ["expected", "due", "overdue"].includes(stateFor(expected)),
  );
  const reconciliation = allExpected.filter(
    (expected) => stateFor(expected) === "needs_reconciliation",
  );
  const received = allExpected.filter((expected) => stateFor(expected) === "received");
  const cancelled = allExpected.filter((expected) => stateFor(expected) === "cancelled");

  const openNew = () => {
    setEditing(null);
    setDialogOpen(true);
  };
  const openEdit = (e: Expected) => {
    setEditing(e);
    setDialogOpen(true);
  };
  const startReceive = (e: Expected) => {
    setReceiveTarget(e);
    setReceiveAccount(accounts[0]?.id ?? "");
    setReceiveOpen(true);
  };
  const confirmReceive = async () => {
    if (!receiveTarget || !receiveAccount) return;
    await markReceived.mutateAsync({ expected: receiveTarget, accountId: receiveAccount });
    setReceiveOpen(false);
  };

  const pendingTotal = aggregateExpectedMoney(pending, accounts, () => true);
  const weightedTotal =
    pendingTotal === null
      ? null
      : pending.reduce((s, e) => s + (Number(e.amount) * e.probability) / 100, 0);
  const receivedTotal = aggregateExpectedMoney(received, accounts, () => true);
  const all = allExpected;

  const stateLabel = (state: ExpectedMoneyState) =>
    ({
      expected: "Expected",
      due: "Due today",
      overdue: "Overdue",
      received: "Received",
      cancelled: "Cancelled",
      needs_reconciliation: "Needs reconciliation",
      unsupported: "Unavailable",
    })[state];

  const stateTone = (state: ExpectedMoneyState) =>
    state === "overdue" || state === "needs_reconciliation"
      ? "danger"
      : state === "due"
        ? "warning"
        : state === "received"
          ? "income"
          : state === "cancelled"
            ? "neutral"
            : "info";

  const renderRow = (e: Expected) => {
    const state = stateFor(e);
    return (
      <TableRow key={e.id}>
        <TableCell className="alexos-cell-id whitespace-nowrap">
          {formatDate(e.expected_date)}
        </TableCell>
        <TableCell className="font-medium">{e.source}</TableCell>
        <TableCell className="text-xs text-muted-foreground">
          {e.financial_scope === "business"
            ? `Business${e.business_name ? ` · ${e.business_name}` : ""}`
            : "Personal"}
        </TableCell>
        <TableCell className="max-w-[240px] truncate text-muted-foreground">
          {e.description ?? "—"}
        </TableCell>
        <TableNumericCell>{formatMoney(e.amount)}</TableNumericCell>
        <TableNumericCell className="text-muted-foreground">{e.probability}%</TableNumericCell>
        <TableCell>
          <AlexOSStatusBadge tone={stateTone(state)} label={stateLabel(state)} showDot />
        </TableCell>
        <TableActionsCell>
          {e.status === "pending" && ["expected", "due", "overdue"].includes(state) ? (
            <div className="flex justify-end gap-1">
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Edit expected money from ${e.source}`}
                onClick={() => openEdit(e)}
              >
                <Pencil aria-hidden="true" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Mark ${formatMoney(e.amount)} from ${e.source} as received`}
                className="text-tone-income hover:bg-alexos-green/10"
                onClick={() => startReceive(e)}
              >
                <Check aria-hidden="true" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Cancel expected money from ${e.source}`}
                className="text-destructive hover:bg-destructive/10"
                onClick={() => cancel.mutate(e.id)}
              >
                <X aria-hidden="true" />
              </Button>
            </div>
          ) : null}
        </TableActionsCell>
      </TableRow>
    );
  };

  return (
    <div className="space-y-6">
      <AlexOSPageHeader
        title="Expected money"
        description="Track anticipated money separately from actual cash. Settlement posts exactly one authoritative ledger transaction."
        breadcrumbs={[{ label: "Money Center", to: "/money-center" }, { label: "Expected money" }]}
        actions={
          <Button onClick={openNew}>
            <Plus aria-hidden="true" /> Add expected
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <AlexOSMetricCard
          label="Pending total"
          hint="Full face value still outstanding"
          value={pendingTotal === null ? "Unavailable" : formatMoney(pendingTotal)}
          tone="warning"
          icon={Scale}
          emphasis
        />
        <AlexOSMetricCard
          label="Weighted"
          hint="Adjusted by each item's probability"
          value={weightedTotal === null ? "Unavailable" : formatMoney(weightedTotal)}
          tone="info"
        />
        <AlexOSMetricCard
          label="Received"
          hint="Confirmed and posted to the ledger"
          value={receivedTotal === null ? "Unavailable" : formatMoney(receivedTotal)}
          tone="income"
          icon={Check}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All expected money</CardTitle>
          <CardDescription>Pending first, then received, then cancelled.</CardDescription>
        </CardHeader>
        <CardContent>
          <AlexOSDataTable
            label="Expected money"
            minWidth={820}
            isLoading={expectedLoading || transactionsLoading}
            loading={<AlexOSLoadingState label="Loading expected money" rows={5} height="h-9" />}
            empty={
              <AlexOSEmptyState
                compact
                title="Nothing expected yet"
                description="Record an invoice, a client payment or any money you are counting on. Weight it by probability to see a realistic figure alongside the full amount."
                action={
                  <Button onClick={openNew}>
                    <Plus aria-hidden="true" /> Add expected
                  </Button>
                }
              />
            }
            footer={
              <span>
                {all.length} item{all.length === 1 ? "" : "s"} tracked
              </span>
            }
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Scope</TableHead>
                  <TableHead>Description</TableHead>
                  <TableNumericHead>Amount</TableNumericHead>
                  <TableNumericHead>Probability</TableNumericHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="alexos-cell-actions">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pending.map(renderRow)}
                {reconciliation.map(renderRow)}
                {received.map(renderRow)}
                {cancelled.map(renderRow)}
              </TableBody>
            </Table>
          </AlexOSDataTable>
        </CardContent>
      </Card>

      <ExpectedFormDialog open={dialogOpen} onOpenChange={setDialogOpen} editing={editing} />

      <Dialog open={receiveOpen} onOpenChange={setReceiveOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Mark as received</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {receiveTarget ? (
              <div className="rounded-lg bg-muted/50 p-3 text-sm">
                <div className="font-medium">{receiveTarget.source}</div>
                <div className="alexos-amount text-muted-foreground">
                  {formatMoney(receiveTarget.amount)}
                </div>
              </div>
            ) : null}
            <AlexOSFormField
              label="Destination account"
              required
              hint="The income is posted to this account."
            >
              {({ id, describedBy }) => (
                <Select value={receiveAccount} onValueChange={setReceiveAccount}>
                  <SelectTrigger id={id} aria-describedby={describedBy}>
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </AlexOSFormField>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReceiveOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmReceive} disabled={markReceived.isPending || !receiveAccount}>
              {markReceived.isPending ? "Saving…" : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
