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
import { ArrowUpCircle, MoreHorizontal, Plus, Pencil, Trash2 } from "lucide-react";
import { TransactionFormDialog } from "@/components/money/TransactionFormDialog";

export const Route = createFileRoute("/_authenticated/money-center/expenses")({
  component: ExpensesPage,
});

function ExpensesPage() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [voiding, setVoiding] = useState<Transaction | null>(null);

  const { data: txs = [] } = useTransactions({ type: "expense" });
  const { data: accounts = [] } = useAccounts(true);
  const voidTx = useVoidTransaction();

  const accName: Record<string, string> = Object.fromEntries(
    accounts.map((a) => [a.id, a.name]),
  );

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const monthTotal = txs
    .filter((t) => new Date(t.occurred_at) >= monthStart)
    .reduce((s, t) => s + Number(t.amount), 0);

  const total = txs.reduce((s, t) => s + Number(t.amount), 0);

  const byCat = txs.reduce<Record<string, number>>((acc, t) => {
    const k = t.category ?? "Other";
    acc[k] = (acc[k] ?? 0) + Number(t.amount);
    return acc;
  }, {});

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
          <h1 className="text-2xl font-semibold tracking-tight">Expenses</h1>
          <p className="text-sm text-muted-foreground">All money going out.</p>
        </div>

        <Button
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
          variant="destructive"
          className="rounded-xl"
        >
          <Plus className="h-4 w-4 mr-1" /> Quick Add Expense
        </Button>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="rounded-2xl">
          <CardHeader className="pb-1">
            <CardTitle className="text-[10px] uppercase tracking-widest text-muted-foreground">
              This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-semibold text-destructive">
              {formatMoney(monthTotal)}
            </div>
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
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-2 text-destructive font-semibold">
                        <ArrowUpCircle className="h-4 w-4" />-{formatMoney(t.amount)}
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

      <TransactionFormDialog
        open={open}
        onOpenChange={(value) => {
          setOpen(value);

          if (!value) {
            setEditing(null);
          }
        }}
        mode="expense"
      />

      <TransactionFormDialog
        open={dialogOpen}
        onOpenChange={(value) => {
          setDialogOpen(value);

          if (!value) {
            setEditing(null);
          }
        }}
        mode="expense"
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
            <AlertDialogTitle>Void this expense?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the expense from active financial totals and account balances. The
              transaction will be retained as voided history.
              {voiding && (
                <span className="block mt-2 font-medium text-foreground">
                  {voiding.description || voiding.category} · {formatMoney(voiding.amount)}
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
              {voidTx.isPending ? "Voiding..." : "Void Expense"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}