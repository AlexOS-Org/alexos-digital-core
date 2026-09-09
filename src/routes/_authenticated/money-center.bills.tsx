import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Calendar, CheckCircle2, Clock3, DollarSign, Edit, Plus, Trash2 } from "lucide-react";

import {
  Bill,
  BillFrequency,
  BillInput,
  billMonthlyEquivalent,
  useBills,
  useDeleteBill,
  useMarkBillPaid,
  useSaveBill,
} from "@/lib/money/bills";

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

function BillsPage() {
  const { data: bills = [], isLoading } = useBills();

  const deleteBill = useDeleteBill();
  const markPaid = useMarkBillPaid();

  const [editing, setEditing] = useState<Bill | null>(null);
  const [open, setOpen] = useState(false);

  const activeBills = useMemo(() => bills.filter((b) => b.status === "pending"), [bills]);

  /** Recurring obligations only — frequency-normalized; one-time bills are excluded. */
  const totalMonthly = useMemo(
    () =>
      activeBills.reduce(
        (sum, bill) => sum + billMonthlyEquivalent(Number(bill.amount ?? 0), bill.frequency),
        0,
      ),
    [activeBills],
  );

  const overdue = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);

    return activeBills.filter((bill) => bill.due_date && bill.due_date < today);
  }, [activeBills]);

  const upcoming = useMemo(() => {
    const today = new Date();

    const next7 = new Date();
    next7.setDate(today.getDate() + 7);

    return activeBills.filter((bill) => {
      if (!bill.due_date) return false;

      const due = new Date(bill.due_date);

      return due >= today && due <= next7;
    });
  }, [activeBills]);
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Bills</h1>
          <p className="text-muted-foreground">Manage recurring expenses and upcoming payments.</p>
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
                return (
                  <div
                    key={bill.id}
                    className="flex items-center justify-between rounded-xl border p-4"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold">{bill.name}</h3>
                        <Badge variant="outline" className="text-xs font-normal">
                          {frequencyLabel[bill.frequency] ?? bill.frequency}
                        </Badge>
                        {bill.status !== "pending" && (
                          <Badge variant="secondary" className="text-xs font-normal">
                            {bill.status}
                          </Badge>
                        )}
                      </div>

                      <p className="text-sm text-muted-foreground">
                        Due {bill.due_date ?? "—"}
                        {bill.frequency !== "one_time" && bill.frequency !== "monthly"
                          ? ` · ~${currency(monthly)}/mo planning`
                          : null}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-bold">{currency(amount)}</span>

                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => {
                          setEditing(bill);
                          setOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>

                      <Button size="icon" variant="outline" onClick={() => markPaid.mutate(bill)}>
                        <CheckCircle2 className="h-4 w-4" />
                      </Button>

                      <Button
                        size="icon"
                        variant="destructive"
                        onClick={() => deleteBill.mutate(bill.id)}
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
      <BillDialog open={open} onOpenChange={setOpen} bill={editing} />
    </div>
  );
}

interface BillDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bill: Bill | null;
}

function BillDialog({ open, onOpenChange, bill }: BillDialogProps) {
  const saveBill = useSaveBill();

  const [form, setForm] = useState<BillInput>({
    name: bill?.name ?? "",
    amount: Number(bill?.amount ?? 0),
    due_date: bill?.due_date ?? "",
    frequency: bill?.frequency ?? "monthly",
    category: bill?.category ?? "",
    account_id: bill?.account_id ?? null,
    notes: bill?.notes ?? "",
    auto_create_transaction: bill?.auto_create_transaction ?? false,
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
      auto_create_transaction: bill?.auto_create_transaction ?? false,
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
            <Label>Category</Label>
            <Input
              value={form.category ?? ""}
              onChange={(e) => update("category", e.target.value)}
              placeholder="Optional (e.g. utilities)"
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
