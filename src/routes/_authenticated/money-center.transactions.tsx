import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useAccounts,
  useTransactions,
  useVoidTransaction,
  type Transaction,
} from "@/lib/money/api";
import { formatDate, formatMoney, formatTime } from "@/lib/money/format";
import { Download, MoreHorizontal, Printer, Search, Trash2 } from "lucide-react";
import { TransactionFormDialog } from "@/components/money/TransactionFormDialog";
import { cn } from "@/lib/utils";
import { normalizeExpenseCategory } from "@/lib/money/constants";

export const Route = createFileRoute("/_authenticated/money-center/transactions")({
  component: TransactionsPage,
});

function TransactionsPage() {
  const [type, setType] = useState<string>("all");
  const [account, setAccount] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [openEditMode, setOpenEditMode] = useState<"income" | "expense" | "transfer">("income");
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: accounts = [] } = useAccounts(true);
  const { data: txs = [], isLoading } = useTransactions({
    type: type === "all" ? undefined : (type as Transaction["type"]),
    accountId: account === "all" ? undefined : account,
    search: search || undefined,
  });
  const voidTx = useVoidTransaction();

  const accountName = useMemo(
    () => Object.fromEntries(accounts.map((a) => [a.id, a.name])),
    [accounts],
  );

  const exportCsv = () => {
    const rows = [
      [
        "ID",
        "Date",
        "Time",
        "Type",
        "Account",
        "To Account",
        "Category/Source",
        "Scope",
        "Description",
        "Reference",
        "Amount",
        "Status",
      ],
      ...txs.map((t) => [
        t.id,
        formatDate(t.occurred_at),
        formatTime(t.occurred_at),
        t.type,
        accountName[t.account_id] ?? "",
        t.transfer_account_id ? (accountName[t.transfer_account_id] ?? "") : "",
        t.type === "expense"
          ? normalizeExpenseCategory(t.category)
          : (t.category ?? t.source ?? ""),
        t.expense_scope ?? t.financial_scope ?? "",
        t.description ?? "",
        t.reference ?? "",
        String(t.amount),
        t.status,
      ]),
    ];
    const csv = rows
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const openEdit = (t: Transaction) => {
    if (t.type === "adjustment") return;
    setEditing(t);
    setOpenEditMode(t.type as "income" | "expense" | "transfer");
    setDialogOpen(true);
  };

  const typeTone = (t: Transaction["type"]) =>
    t === "income"
      ? "text-[color:var(--success)]"
      : t === "expense"
        ? "text-destructive"
        : "text-primary";

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Transactions</h1>
          <p className="text-sm text-muted-foreground">
            Permanent, sortable record of every entry.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportCsv} className="rounded-lg">
            <Download className="h-4 w-4 mr-1" /> CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.print()} className="rounded-lg">
            <Printer className="h-4 w-4 mr-1" /> Print
          </Button>
        </div>
      </header>

      <Card className="rounded-2xl">
        <CardContent className="p-4 space-y-3">
          <div className="grid gap-2 sm:grid-cols-4">
            <div className="relative sm:col-span-2">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search description, reference, category..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
                <SelectItem value="transfer">Transfer</SelectItem>
                <SelectItem value="adjustment">Adjustment</SelectItem>
              </SelectContent>
            </Select>
            <Select value={account} onValueChange={setAccount}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All accounts</SelectItem>
                {accounts.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead>Category / Source</TableHead>
                  <TableHead>Scope</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell
                      colSpan={10}
                      className="text-center text-sm text-muted-foreground py-8"
                    >
                      Loading...
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading && txs.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={10}
                      className="text-center text-sm text-muted-foreground py-8"
                    >
                      No transactions match your filters.
                    </TableCell>
                  </TableRow>
                )}
                {txs.map((t) => (
                  <TableRow key={t.id} className="hover:bg-accent/40">
                    <TableCell className="text-xs whitespace-nowrap">
                      <div>{formatDate(t.occurred_at)}</div>
                      <div className="text-muted-foreground">{formatTime(t.occurred_at)}</div>
                    </TableCell>
                    <TableCell>
                      <span className={cn("text-xs font-medium capitalize", typeTone(t.type))}>
                        {t.type}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">
                      {accountName[t.account_id] ?? "—"}
                      {t.transfer_account_id && (
                        <span className="text-muted-foreground">
                          {" "}
                          → {accountName[t.transfer_account_id]}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {t.type === "expense"
                        ? normalizeExpenseCategory(t.category)
                        : (t.category ?? t.source ?? "—")}
                    </TableCell>
                    <TableCell className="text-xs capitalize">
                      {t.expense_scope ?? t.financial_scope ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm max-w-[220px] truncate">
                      {t.description ?? "—"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {t.reference ?? "—"}
                    </TableCell>
                    <TableCell
                      className={cn("text-right font-semibold whitespace-nowrap", typeTone(t.type))}
                    >
                      {t.type === "income" ? "+" : t.type === "expense" ? "-" : ""}
                      {formatMoney(t.amount)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={t.status === "posted" ? "default" : "secondary"}
                        className="capitalize"
                      >
                        {t.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => openEdit(t)}
                            disabled={t.type === "adjustment" || t.status !== "posted"}
                          >
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => voidTx.mutate(t.id)}
                            disabled={t.status !== "posted"}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" /> Void
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="text-xs text-muted-foreground text-right">
            {txs.length} transaction{txs.length === 1 ? "" : "s"}
          </div>
        </CardContent>
      </Card>

      <TransactionFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={openEditMode}
        editing={editing}
      />
    </div>
  );
}
