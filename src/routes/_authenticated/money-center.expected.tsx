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
  type Expected,
} from "@/lib/money/api";
import { ExpectedFormDialog } from "@/components/money/ExpectedFormDialog";
import { formatDate, formatMoney } from "@/lib/money/format";
import { Check, Pencil, Plus, Scale, X } from "lucide-react";

export const Route = createFileRoute("/_authenticated/money-center/expected")({
  component: ExpectedPage,
});

function ExpectedPage() {
  const { data: pending = [], isLoading: pendingLoading } = useExpected("pending");
  const { data: received = [], isLoading: receivedLoading } = useExpected("received");
  const { data: cancelled = [], isLoading: cancelledLoading } = useExpected("cancelled");
  const { data: accounts = [] } = useAccounts();
  const markReceived = useMarkExpectedReceived();
  const cancel = useCancelExpected();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Expected | null>(null);
  const [receiveOpen, setReceiveOpen] = useState(false);
  const [receiveTarget, setReceiveTarget] = useState<Expected | null>(null);
  const [receiveAccount, setReceiveAccount] = useState<string>("");

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

  const pendingTotal = pending.reduce((s, e) => s + Number(e.amount), 0);
  const weightedTotal = pending.reduce((s, e) => s + (Number(e.amount) * e.probability) / 100, 0);
  const receivedTotal = received.reduce((s, e) => s + Number(e.amount), 0);
  const all = [...pending, ...received, ...cancelled];

  const renderRow = (e: Expected) => (
    <TableRow key={e.id}>
      <TableCell className="alexos-cell-id whitespace-nowrap">
        {formatDate(e.expected_date)}
      </TableCell>
      <TableCell className="font-medium">{e.source}</TableCell>
      <TableCell className="max-w-[240px] truncate text-muted-foreground">
        {e.description ?? "—"}
      </TableCell>
      <TableNumericCell>{formatMoney(e.amount)}</TableNumericCell>
      <TableNumericCell className="text-muted-foreground">{e.probability}%</TableNumericCell>
      <TableCell>
        <AlexOSStatusBadge status={e.status} showDot />
      </TableCell>
      <TableActionsCell>
        {e.status === "pending" ? (
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

  return (
    <div className="space-y-6">
      <AlexOSPageHeader
        title="Expected money"
        description="Track upcoming income. Marking an item as received posts it to the ledger automatically."
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
          value={formatMoney(pendingTotal)}
          tone="warning"
          icon={Scale}
          emphasis
        />
        <AlexOSMetricCard
          label="Weighted"
          hint="Adjusted by each item's probability"
          value={formatMoney(weightedTotal)}
          tone="info"
        />
        <AlexOSMetricCard
          label="Received"
          hint="Confirmed and posted to the ledger"
          value={formatMoney(receivedTotal)}
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
            isLoading={pendingLoading || receivedLoading || cancelledLoading}
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
