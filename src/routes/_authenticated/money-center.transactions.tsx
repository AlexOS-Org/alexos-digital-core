import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlexOSDataTable, AlexOSTableToolbar } from "@/components/alexos/data-table";
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
import { useMoneyCenterScope } from "@/lib/money/scope";
import { formatDate, formatMoney, formatTime } from "@/lib/money/format";
import { Download, MoreHorizontal, Printer, Search, Trash2 } from "lucide-react";
import { TransactionFormDialog } from "@/components/money/TransactionFormDialog";
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

  const { businessId } = useMoneyCenterScope();
  const { data: accounts = [] } = useAccounts(true, businessId);
  const { data: txs = [], isLoading } = useTransactions({
    businessId,
    type: type === "all" ? undefined : (type as Transaction["type"]),
    accountId: account === "all" ? undefined : account,
    search: search || undefined,
  });
  const voidTx = useVoidTransaction();

  const accountName = useMemo(
    () => Object.fromEntries(accounts.map((a) => [a.id, a.name])),
    [accounts],
  );

  const hasFilters = type !== "all" || account !== "all" || search.trim().length > 0;

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

  return (
    <div className="space-y-6">
      <AlexOSPageHeader
        title="Transactions"
        description="Permanent, sortable record of every entry. Posted transactions can be edited or voided; voided entries stay in the ledger for audit."
        breadcrumbs={[{ label: "Money Center", to: "/money-center" }, { label: "Transactions" }]}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={exportCsv}>
              <Download aria-hidden="true" /> CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer aria-hidden="true" /> Print
            </Button>
          </>
        }
      />

      <Card>
        <CardContent className="space-y-4">
          <AlexOSTableToolbar>
            <div className="relative w-full sm:max-w-xs">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                aria-label="Search transactions"
                placeholder="Search description, reference, category…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger aria-label="Filter by type" className="w-full sm:w-40">
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
              <SelectTrigger aria-label="Filter by account" className="w-full sm:w-48">
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
          </AlexOSTableToolbar>

          <AlexOSDataTable
            label="Transactions"
            minWidth={960}
            isLoading={isLoading}
            loading={<AlexOSLoadingState label="Loading transactions" rows={6} height="h-9" />}
            empty={
              hasFilters ? (
                <AlexOSEmptyState
                  compact
                  variant="no-results"
                  title="No transactions match these filters"
                  description="Widen the type or account filter, or clear the search term to see the full ledger."
                />
              ) : (
                <AlexOSEmptyState
                  compact
                  title="No transactions recorded yet"
                  description="Record your first income, expense or transfer and balances across Money Center will start calculating from it."
                />
              )
            }
            footer={
              <>
                <span>
                  {txs.length} transaction{txs.length === 1 ? "" : "s"}
                </span>
                <span>Amounts shown in the account currency</span>
              </>
            }
          >
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
                  <TableNumericHead>Amount</TableNumericHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="alexos-cell-actions">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {txs.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="alexos-cell-id whitespace-nowrap">
                      <div>{formatDate(t.occurred_at)}</div>
                      <div className="text-muted-foreground">{formatTime(t.occurred_at)}</div>
                    </TableCell>
                    <TableCell data-tone={t.type}>
                      <AlexOSStatusBadge status={t.type} showDot />
                    </TableCell>
                    <TableCell>
                      {accountName[t.account_id] ?? "—"}
                      {t.transfer_account_id ? (
                        <span className="text-muted-foreground">
                          {" "}
                          → {accountName[t.transfer_account_id]}
                        </span>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      {t.type === "expense"
                        ? normalizeExpenseCategory(t.category)
                        : (t.category ?? t.source ?? "—")}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {t.expense_scope ?? t.financial_scope ?? "—"}
                    </TableCell>
                    <TableCell className="max-w-[220px] truncate">{t.description ?? "—"}</TableCell>
                    <TableCell className="alexos-cell-id text-muted-foreground">
                      {t.reference ?? "—"}
                    </TableCell>
                    <TableNumericCell data-tone={t.type} className="alexos-tone-text">
                      {t.type === "income" ? "+" : t.type === "expense" ? "-" : ""}
                      {formatMoney(t.amount)}
                    </TableNumericCell>
                    <TableCell>
                      <AlexOSStatusBadge status={t.status} />
                    </TableCell>
                    <TableActionsCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Actions for transaction on ${formatDate(t.occurred_at)}`}
                          >
                            <MoreHorizontal aria-hidden="true" />
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
                            <Trash2 aria-hidden="true" /> Void
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableActionsCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </AlexOSDataTable>
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
