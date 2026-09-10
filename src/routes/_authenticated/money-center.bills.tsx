import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Calendar, CheckCircle2, Clock3, DollarSign, Edit, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  Bill,
  BillFrequency,
  BillInput,
  billMonthlyEquivalent,
  getBillDueState,
  useBills,
  useDeleteBill,
  useMarkBillPaid,
  useSaveBill,
} from "@/lib/money/bills";
import { useAccounts } from "@/lib/money/api";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ALEXOS_LOCALE } from "@/lib/locale";

export const Route = createFileRoute("/_authenticated/money-center/bills")({
  component: BillsPage,
});

const frequencies: BillFrequency[] = ["one_time", "weekly", "monthly", "quarterly", "yearly"];

const frequencyLabel: Record<BillFrequency, string> = {
  one_time: "One-time",
  weekly: "Weekly",
  monthly: "Monthly",
  quarterly: "Quarterly",
  yearly: "Yearly",
};

function currency(value: number) {
  return new Intl.NumberFormat(ALEXOS_LOCALE, {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(value);
}

function dueBadgeClass(kind: string) {
  if (kind === "overdue") return "border-destructive/40 text-destructive";
  if (kind === "due_today") return "border-amber-500/40 text-amber-700 dark:text-amber-400";
  if (kind === "paid") return "border-emerald-500/30 text-emerald-700 dark:text-emerald-400";
  return "border-border/60 text-muted-foreground";
}

function BillsPage() {
  const { data: bills = [], isLoading } = useBills();
  const { data: accounts = [] } = useAccounts();
  const accountName = useMemo(() => {
    const map = new Map<string, string>();
    for (const a of accounts) map.set(a.id, a.name);
    return map;
  }, [accounts]);

  const deleteBill = useDeleteBill();
  const markPaid = useMarkBillPaid();

  const [editing, setEditing] = useState<Bill | null>(null);
  const [open, setOpen] = useState(false);
  const [paying, setPaying] = useState<Bill | null>(null);
  const [payAccountId, setPayAccountId] = useState<string>("");

  const activeBills = useMemo(() => bills.filter((b) => b.status === "pending"), [bills]);

  const totalMonthly = useMemo(
    () =>
      activeBills.reduce(
        (sum, bill) => sum + billMonthlyEquivalent(Number(bill.amount ?? 0), bill.frequency),
        0,
      ),
    [activeBills],
  );

  const overdue = useMemo(() => {
    return activeBills.filter((bill) => getBillDueState(bill.due_date, bill.status).kind === "overdue");
  }, [activeBills]);

  const upcoming = useMemo(() => {
    return activeBills.filter((bill) => {
      const state = getBillDueState(bill.due_date, bill.status);
      return state.kind === "upcoming" && (state.days ?? 99) <= 7;
    });
  }, [activeBills]);

  function openPay(bill: Bill) {
    setPaying(bill);
    setPayAccountId(bill.account_id ?? accounts[0]?.id ?? "");
  }

  async function confirmPay() {
    if (!paying) return;
    if (!payAccountId) {
      toast.error("Choose the account this bill was paid from.");
      return;
    }
    try {
      const account = accounts.find((a) => a.id === payAccountId);
      await markPaid.mutateAsync({
        bill: paying,
        accountId: payAccountId,
        expenseScope: account?.financial_scope === "business" ? "business" : "personal",
        businessId: account?.business_id ?? null,
      });
      const next =
        paying.frequency !== "one_time" && paying.due_date
          ? getBillDueState(
              // approximate next label after advance
              paying.due_date,
              "pending",
            )
          : null;
      toast.success(
        paying.frequency === "one_time"
          ? `Paid from ${accountName.get(payAccountId) ?? "account"}`
          : `Paid from ${accountName.get(payAccountId) ?? "account"}. Next cycle scheduled.`,
      );
      void next;
      setPaying(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not mark bill paid");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Bills</h1>
          <p className="text-muted-foreground">
            Recurring and one-time obligations. Paying posts an expense from the account you choose.
          </p>
        </div>

        <Button
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Bill
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Est. monthly</CardTitle>
            <CardDescription className="text-xs font-normal">
              Frequency-normalized planning total. One-time bills are not included.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <DollarSign className="h-8 w-8 text-green-600" />
            <span className="text-2xl font-bold">{currency(totalMonthly)}</span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <Calendar className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold">{activeBills.length}</span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming</CardTitle>
            <CardDescription className="text-xs font-normal">Due within 7 days</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <Clock3 className="h-8 w-8 text-amber-500" />
            <span className="text-2xl font-bold">{upcoming.length}</span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Overdue</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <CheckCircle2 className="h-8 w-8 text-red-500" />
            <span className="text-2xl font-bold">{overdue.length}</span>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Bills</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Loading...</p>
          ) : bills.length === 0 ? (
            <p className="text-muted-foreground">No bills found.</p>
          ) : (
            <div className="space-y-3">
              {bills.map((bill) => {
                const amount = Number(bill.amount ?? 0);
                const monthly = billMonthlyEquivalent(amount, bill.frequency);
                const due = getBillDueState(bill.due_date, bill.status);
                const fromName = bill.account_id ? accountName.get(bill.account_id) : null;
                return (
                  <div
                    key={bill.id}
                    className="flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold">{bill.name}</h3>
                        <Badge variant="outline" className="text-xs font-normal">
                          {frequencyLabel[bill.frequency] ?? bill.frequency}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={`text-xs font-normal ${dueBadgeClass(due.kind)}`}
                        >
                          {due.label}
                        </Badge>
                        {bill.status !== "pending" && (
                          <Badge variant="secondary" className="text-xs font-normal">
                            {bill.status}
                          </Badge>
                        )}
                      </div>

                      <p className="text-sm text-muted-foreground">
                        {bill.due_date ? `Due ${bill.due_date}` : "No due date"}
                        {bill.frequency !== "one_time" && bill.frequency !== "monthly"
                          ? ` · ~${currency(monthly)}/mo planning`
                          : null}
                      </p>
                      {(fromName || bill.last_paid_at) && (
                        <p className="text-xs text-muted-foreground">
                          {fromName ? `Pay from / last: ${fromName}` : null}
                          {fromName && bill.last_paid_at ? " · " : null}
                          {bill.last_paid_at
                            ? `Last paid ${new Date(bill.last_paid_at).toLocaleString(ALEXOS_LOCALE)}`
                            : null}
                        </p>
                      )}
                    </div>

                    <div className="flex shrink-0 items-center gap-3">
                      <span className="font-bold">{currency(amount)}</span>

                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => {
                          setEditing(bill);
                          setOpen(true);
                        }}
                        aria-label="Edit bill"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>

                      {bill.status !== "paid" && (
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => openPay(bill)}
                          aria-label="Mark bill paid"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </Button>
                      )}

                      <Button
                        size="icon"
                        variant="destructive"
                        onClick={() => deleteBill.mutate(bill.id)}
                        aria-label="Delete bill"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <BillDialog open={open} onOpenChange={setOpen} bill={editing} accounts={accounts} />

      <Dialog open={Boolean(paying)} onOpenChange={(v) => !v && setPaying(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark bill paid</DialogTitle>
          </DialogHeader>
          {paying && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{paying.name}</span>
                {" · "}
                {currency(Number(paying.amount ?? 0))}
                {" · "}
                {frequencyLabel[paying.frequency]}
              </p>
              <p className="text-xs text-muted-foreground">
                This posts a <strong>posted expense</strong> on the selected account and updates the
                bill. Recurring bills stay active with the next due date advanced.
              </p>
              <div>
                <Label>Paid from account</Label>
                <Select value={payAccountId} onValueChange={setPayAccountId}>
                  <SelectTrigger>
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
              </div>
              <Button className="w-full" onClick={confirmPay} disabled={markPaid.isPending}>
                {markPaid.isPending ? "Posting…" : "Confirm payment"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface BillDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bill: Bill | null;
  accounts: { id: string; name: string }[];
}

function BillDialog({ open, onOpenChange, bill, accounts }: BillDialogProps) {
  const saveBill = useSaveBill();

  const [form, setForm] = useState<BillInput>({
    name: bill?.name ?? "",
    amount: Number(bill?.amount ?? 0),
    due_date: bill?.due_date ?? "",
    frequency: bill?.frequency ?? "monthly",
    category: bill?.category ?? "",
    account_id: bill?.account_id ?? null,
    notes: bill?.notes ?? "",
    auto_create_transaction: bill?.auto_create_transaction ?? true,
    status: bill?.status ?? "pending",
  });

  useEffect(() => {
    setForm({
      name: bill?.name ?? "",
      amount: Number(bill?.amount ?? 0),
      due_date: bill?.due_date ?? "",
      frequency: bill?.frequency ?? "monthly",
      category: bill?.category ?? "",
      account_id: bill?.account_id ?? null,
      notes: bill?.notes ?? "",
      auto_create_transaction: bill?.auto_create_transaction ?? true,
      status: bill?.status ?? "pending",
    });
  }, [bill, open]);

  function update<K extends keyof BillInput>(key: K, value: BillInput[K]) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  async function submit() {
    await saveBill.mutateAsync({
      ...form,
      id: bill?.id,
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{bill ? "Edit Bill" : "Add Bill"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Name</Label>
            <Input value={form.name} onChange={(e) => update("name", e.target.value)} />
          </div>

          <div>
            <Label>Amount</Label>
            <Input
              type="number"
              value={form.amount}
              onChange={(e) => update("amount", Number(e.target.value))}
            />
          </div>

          <div>
            <Label>Due Date</Label>
            <Input
              type="date"
              value={form.due_date}
              onChange={(e) => update("due_date", e.target.value)}
            />
          </div>

          <div>
            <Label>Frequency</Label>
            <Select
              value={form.frequency}
              onValueChange={(v) => update("frequency", v as BillFrequency)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {frequencies.map((f) => (
                  <SelectItem key={f} value={f}>
                    {frequencyLabel[f]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.frequency !== "one_time" &&
            form.frequency !== "monthly" &&
            Number(form.amount) > 0 ? (
              <p className="mt-1 text-xs text-muted-foreground">
                Planning equivalent:{" "}
                {currency(billMonthlyEquivalent(Number(form.amount), form.frequency))}/mo
              </p>
            ) : null}
          </div>

          <div>
            <Label>Preferred pay-from account</Label>
            <Select
              value={form.account_id ?? "none"}
              onValueChange={(v) => update("account_id", v === "none" ? null : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Optional default" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None (choose at pay time)</SelectItem>
                {accounts.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="mt-1 text-xs text-muted-foreground">
              Used as the default when you mark this bill paid. You can still change it at payment.
            </p>
          </div>

          <div>
            <Label>Category</Label>
            <Input
              value={form.category ?? ""}
              onChange={(e) => update("category", e.target.value)}
              placeholder="Optional (e.g. Rent, utilities)"
            />
          </div>

          <div>
            <Label>Notes</Label>
            <Input
              value={form.notes ?? ""}
              onChange={(e) => update("notes", e.target.value)}
              placeholder="Optional"
            />
          </div>

          <Button className="w-full" onClick={submit}>
            {bill ? "Save Changes" : "Create Bill"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
