import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  useAccounts,
  useTransactions,
  useVoidTransaction,
  type Transaction,
} from "@/lib/money/api";
import { formatDate, formatMoney, formatTime } from "@/lib/money/format";
import { MoreHorizontal, Pencil, Plus, Repeat, Trash2 } from "lucide-react";
import { TransactionFormDialog } from "@/components/money/TransactionFormDialog";

export const Route = createFileRoute("/_authenticated/money-center/transfers")({
  component: TransfersPage,
});

function TransfersPage() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [voiding, setVoiding] = useState<Transaction | null>(null);

  const { data: txs = [] } = useTransactions({ type: "transfer" });
  const { data: accounts = [] } = useAccounts(true);
  const voidTx = useVoidTransaction();

  const accName: Record<string, string> = Object.fromEntries(accounts.map((a) => [a.id, a.name]));

  const total = txs.reduce((s, t) => s + Number(t.amount), 0);

  const openEdit = (transaction: Transaction) => {
    setEditing(transaction);
    setDialogOpen(true);
  };

  const openVoidConfirmation = (transaction: Transaction) => {
    setVoiding(transaction);
  };

  const confirmVoid = async () => {
    if (!voiding) return;

    await voidTx.mutateAsync(voiding.id);
    setVoiding(null);
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Transfers</h1>
          <p className="text-sm text-muted-foreground">
            Move money between your accounts. Not counted as income or expense.
          </p>
        </div>

        <Button
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
          className="rounded-xl"
        >
          <Plus className="h-4 w-4 mr-1" /> New Transfer
        </Button>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        <Card className="rounded-2xl">
          <CardHeader className="pb-1">
            <CardTitle className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Total Moved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-semibold">{formatMoney(total)}</div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader className="pb-1">
            <CardTitle className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Transfers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-semibold">{txs.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">Recent Transfers</CardTitle>
        </CardHeader>

        <CardContent>
          {txs.length === 0 ? (
            <div className="text-sm text-muted-foreground border border-dashed rounded-xl p-8 text-center">
              No transfers recorded yet.
            </div>
          ) : (
            <ul className="divide-y">
              {txs.slice(0, 30).map((t) => (
                <li key={t.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary grid place-items-center shrink-0">
                      <Repeat className="h-4 w-4" />
                    </div>

                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">
                        {accName[t.account_id]} →{" "}
                        {t.transfer_account_id ? accName[t.transfer_account_id] : "—"}
                      </div>

                      <div className="text-xs text-muted-foreground">
                        {formatDate(t.occurred_at)} · {formatTime(t.occurred_at)}
                        {t.description ? ` · ${t.description}` : ""}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="text-sm font-semibold text-primary whitespace-nowrap">
                      {formatMoney(t.amount)}
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>

                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => openEdit(t)}
                          disabled={t.status !== "posted"}
                        >
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onClick={() => openVoidConfirmation(t)}
                          disabled={t.status !== "posted"}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Void
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <TransactionFormDialog
        open={open}
        onOpenChange={(value) => {
          setOpen(value);

          if (!value) {
            setEditing(null);
          }
        }}
        mode="transfer"
      />

      <TransactionFormDialog
        open={dialogOpen}
        onOpenChange={(value) => {
          setDialogOpen(value);

          if (!value) {
            setEditing(null);
          }
        }}
        mode="transfer"
        editing={editing}
      />

      <AlertDialog
        open={!!voiding}
        onOpenChange={(open) => {
          if (!open && !voidTx.isPending) {
            setVoiding(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Void this transfer?</AlertDialogTitle>

            <AlertDialogDescription>
              This will remove the transfer from active account balances. The transaction will be
              retained as voided history.
              {voiding && (
                <span className="block mt-2 font-medium text-foreground">
                  {accName[voiding.account_id]} →{" "}
                  {voiding.transfer_account_id
                    ? accName[voiding.transfer_account_id]
                    : "Unknown account"}{" "}
                  · {formatMoney(voiding.amount)}
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={voidTx.isPending}>Cancel</AlertDialogCancel>

            <AlertDialogAction
              onClick={confirmVoid}
              disabled={voidTx.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {voidTx.isPending ? "Voiding..." : "Void Transfer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
