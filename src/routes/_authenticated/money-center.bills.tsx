import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock3,
  DollarSign,
  Edit,
  Plus,
  Trash2,
} from "lucide-react";
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
import { useMoneyCenterScope } from "@/lib/money/scope";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { AlexOSMetricCard } from "@/components/alexos/metric-card";
import { AlexOSEmptyState, AlexOSLoadingState } from "@/components/alexos/states";
import { AlexOSFormField } from "@/components/alexos/form";
import { AlexOSPageHeader } from "@/components/alexos/page-header";
import { AlexOSStatusBadge } from "@/components/alexos/status-badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

function BillsPage() {
  const { businessId } = useMoneyCenterScope();
  const { data: bills = [], isLoading } = useBills(businessId);
  const { data: accounts = [] } = useAccounts(false, businessId);
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
    return activeBills.filter(
      (bill) => getBillDueState(bill.due_date, bill.status).kind === "overdue",
    );
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
      toast.success(
        paying.frequency === "one_time"
          ? `Paid from ${accountName.get(payAccountId) ?? "account"}`
          : `Paid from ${accountName.get(payAccountId) ?? "account"}. Next cycle scheduled.`,
      );
      setPaying(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not mark bill paid");
    }
  }

  return (
    <div className="space-y-6">
      <AlexOSPageHeader
        title="Bills"
        description="Recurring and one-time obligations. Paying posts an expense from the account you choose."
        breadcrumbs={[{ label: "Money Center", to: "/money-center" }, { label: "Bills" }]}
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            <Plus aria-hidden="true" /> Add Bill
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <AlexOSMetricCard
          label="Est. monthly"
          hint="Frequency-normalised planning total. One-time bills are excluded."
          value={currency(totalMonthly)}
          icon={DollarSign}
          tone="expense"
          emphasis
        />
        <AlexOSMetricCard
          label="Active"
          hint="Bills still awaiting payment"
          value={activeBills.length}
          icon={Calendar}
          tone="info"
        />
        <AlexOSMetricCard
          label="Upcoming"
          hint="Due within 7 days"
          value={upcoming.length}
          icon={Clock3}
          tone="warning"
        />
        <AlexOSMetricCard
          label="Overdue"
          hint="Past the due date and unpaid"
          value={overdue.length}
          icon={AlertTriangle}
          tone={overdue.length > 0 ? "danger" : "neutral"}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your bills</CardTitle>
          <CardDescription>
            {bills.length} bill{bills.length === 1 ? "" : "s"} · {currency(totalMonthly)} estimated
            monthly
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <AlexOSLoadingState label="Loading bills" rows={4} />
          ) : bills.length === 0 ? (
            <AlexOSEmptyState
              title="No bills yet"
              description="Add rent, utilities, subscriptions or any recurring obligation. AlexOS will normalise each one to a monthly planning figure and warn you before anything is due."
              action={
                <Button
                  onClick={() => {
                    setEditing(null);
                    setOpen(true);
                  }}
                >
                  <Plus aria-hidden="true" /> Add Bill
                </Button>
              }
            />
          ) : (
            <ul className="space-y-2">
              {bills.map((bill) => {
                const amount = Number(bill.amount ?? 0);
                const monthly = billMonthlyEquivalent(amount, bill.frequency);
                const due = getBillDueState(bill.due_date, bill.status);
                const fromName = bill.account_id ? accountName.get(bill.account_id) : null;
                return (
                  <li
                    key={bill.id}
                    className="flex flex-col gap-3 rounded-xl border border-border p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold">{bill.name}</h3>
                        <AlexOSStatusBadge
                          status={bill.frequency}
                          label={frequencyLabel[bill.frequency] ?? bill.frequency}
                          tone="neutral"
                        />
                        <AlexOSStatusBadge status={due.kind} label={due.label} showDot />
                        {bill.status !== "pending" ? (
                          <AlexOSStatusBadge status={bill.status} />
                        ) : null}
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

                    <div className="flex shrink-0 items-center gap-2">
                      <span className="alexos-amount mr-1 text-base">{currency(amount)}</span>

                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => {
                          setEditing(bill);
                          setOpen(true);
                        }}
                        aria-label={`Edit ${bill.name}`}
                      >
                        <Edit aria-hidden="true" />
                      </Button>

                      {bill.status !== "paid" ? (
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => openPay(bill)}
                          aria-label={`Mark ${bill.name} paid`}
                        >
                          <CheckCircle2 aria-hidden="true" />
                        </Button>
                      ) : null}

                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => deleteBill.mutate(bill.id)}
                        aria-label={`Delete ${bill.name}`}
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 aria-hidden="true" />
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
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
                <span className="alexos-amount">{currency(Number(paying.amount ?? 0))}</span>
                {" · "}
                {frequencyLabel[paying.frequency]}
              </p>
              <p className="text-xs text-muted-foreground">
                This posts a <strong>posted expense</strong> on the selected account and updates the
                bill. Recurring bills stay active with the next due date advanced.
              </p>
              <AlexOSFormField
                label="Paid from account"
                required
                hint="The expense is posted against this account."
              >
                {({ id, describedBy }) => (
                  <Select value={payAccountId} onValueChange={setPayAccountId}>
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
              <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
                <Button variant="outline" onClick={() => setPaying(null)}>
                  Cancel
                </Button>
                <Button onClick={confirmPay} disabled={markPaid.isPending}>
                  {markPaid.isPending ? "Posting…" : "Confirm payment"}
                </Button>
              </div>
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{bill ? "Edit bill" : "Add bill"}</DialogTitle>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
        >
          <AlexOSFormField label="Name" required>
            {({ id, describedBy }) => (
              <Input
                id={id}
                aria-describedby={describedBy}
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                placeholder="e.g. Rent, Internet, Electricity"
              />
            )}
          </AlexOSFormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <AlexOSFormField label="Amount" required>
              {({ id, describedBy }) => (
                <Input
                  id={id}
                  aria-describedby={describedBy}
                  type="number"
                  inputMode="decimal"
                  value={form.amount}
                  onChange={(e) => update("amount", Number(e.target.value))}
                />
              )}
            </AlexOSFormField>

            <AlexOSFormField label="Due date" hint="Used to flag overdue obligations.">
              {({ id, describedBy }) => (
                <Input
                  id={id}
                  aria-describedby={describedBy}
                  type="date"
                  value={form.due_date}
                  onChange={(e) => update("due_date", e.target.value)}
                />
              )}
            </AlexOSFormField>
          </div>

          <AlexOSFormField
            label="Frequency"
            required
            hint={
              form.frequency !== "one_time" &&
              form.frequency !== "monthly" &&
              Number(form.amount) > 0
                ? `Planning equivalent: ${currency(
                    billMonthlyEquivalent(Number(form.amount), form.frequency),
                  )}/mo`
                : "How often this bill recurs."
            }
          >
            {({ id, describedBy }) => (
              <Select
                value={form.frequency}
                onValueChange={(v) => update("frequency", v as BillFrequency)}
              >
                <SelectTrigger id={id} aria-describedby={describedBy}>
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
            )}
          </AlexOSFormField>

          <AlexOSFormField
            label="Preferred pay-from account"
            hint="Used as the default when you mark this bill paid. You can still change it at payment."
          >
            {({ id, describedBy }) => (
              <Select
                value={form.account_id ?? "none"}
                onValueChange={(v) => update("account_id", v === "none" ? null : v)}
              >
                <SelectTrigger id={id} aria-describedby={describedBy}>
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
            )}
          </AlexOSFormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <AlexOSFormField label="Category">
              {({ id, describedBy }) => (
                <Input
                  id={id}
                  aria-describedby={describedBy}
                  value={form.category ?? ""}
                  onChange={(e) => update("category", e.target.value)}
                  placeholder="e.g. Rent, utilities"
                />
              )}
            </AlexOSFormField>

            <AlexOSFormField label="Notes">
              {({ id, describedBy }) => (
                <Input
                  id={id}
                  aria-describedby={describedBy}
                  value={form.notes ?? ""}
                  onChange={(e) => update("notes", e.target.value)}
                />
              )}
            </AlexOSFormField>
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saveBill.isPending}>
              {saveBill.isPending ? "Saving…" : bill ? "Save changes" : "Create bill"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
