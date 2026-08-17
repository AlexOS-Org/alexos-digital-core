import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSaveDebt, type Debt, type FinancialScope } from "@/lib/debts/api";
import { useAccounts } from "@/lib/money/api";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  debt?: Debt | null;
}

const CATEGORIES = ["Loan", "Credit Card", "Mortgage", "Family", "Business", "Other"];

export function DebtFormDialog({ open, onOpenChange, debt }: Props) {
  const save = useSaveDebt();
  const { data: accounts = [] } = useAccounts();
  const [name, setName] = useState("");
  const [category, setCategory] = useState<string>("Loan");
  const [principal, setPrincipal] = useState("0");
  const [rate, setRate] = useState("0");
  const [minPay, setMinPay] = useState("0");
  const [paid, setPaid] = useState("0");
  const [due, setDue] = useState("");
  const [priority, setPriority] = useState<Debt["priority"]>("medium");
  const [status, setStatus] = useState<Debt["status"]>("active");
  const [notes, setNotes] = useState("");
  const [scope, setScope] = useState<FinancialScope>("personal");
  const [businessName, setBusinessName] = useState("");
  const [disbursementAccountId, setDisbursementAccountId] = useState("");

  useEffect(() => {
    if (open) {
      setName(debt?.name ?? "");
      setCategory(debt?.category ?? "Loan");
      setPrincipal(String(debt?.principal ?? 0));
      setRate(String(debt?.interest_rate ?? 0));
      setMinPay(String(debt?.minimum_payment ?? 0));
      setPaid(String(debt?.amount_paid ?? 0));
      setDue(debt?.due_date ?? "");
      setPriority(debt?.priority ?? "medium");
      setStatus(debt?.status ?? "active");
      setNotes(debt?.notes ?? "");
      setScope(debt?.financial_scope ?? "personal");
      setBusinessName(debt?.business_name ?? "");
      setDisbursementAccountId(debt?.disbursement_account_id ?? "");
    }
  }, [open, debt]);

  const submit = async () => {
    if (!name.trim()) return;
    if (scope === "business" && !businessName.trim()) return;

    await save.mutateAsync({
      id: debt?.id,
      name: name.trim(),
      category,
      principal: Number(principal) || 0,
      interest_rate: Number(rate) || 0,
      minimum_payment: Number(minPay) || 0,
      amount_paid: Number(paid) || 0,
      interest_paid: debt?.interest_paid ?? 0,
      due_date: due || null,
      priority,
      status,
      notes: notes.trim() || null,
      financial_scope: scope,
      business_name: scope === "business" ? businessName.trim() : null,
      disbursement_account_id: disbursementAccountId || null,
      disbursementAccountId: disbursementAccountId || null,
    });
    onOpenChange(false);
  };

  const isNewLoan = !debt;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{debt ? "Edit Debt" : "New Debt / Loan"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label>Lender / Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. KCB Personal Loan"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Money belongs to</Label>
              <Select
                value={scope}
                onValueChange={(v) => setScope(v as FinancialScope)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="personal">Personal</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {scope === "business" && (
              <div className="col-span-2 space-y-1.5">
                <Label>Business</Label>
                <Input
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. CarBar Motion"
                />
              </div>
            )}

            {isNewLoan && (
              <div className="col-span-2 space-y-1.5">
                <Label>Where did the loan money go?</Label>
                <Select
                  value={disbursementAccountId}
                  onValueChange={setDisbursementAccountId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select cash / bank / M-Pesa account" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  This records the loan as cash received and debt created — not as income.
                </p>
              </div>
            )}

            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select
                value={priority}
                onValueChange={(v) => setPriority(v as Debt["priority"])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Principal</Label>
              <Input
                type="number"
                step="0.01"
                value={principal}
                onChange={(e) => setPrincipal(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Interest Rate (%)</Label>
              <Input
                type="number"
                step="0.01"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Minimum Payment</Label>
              <Input
                type="number"
                step="0.01"
                value={minPay}
                onChange={(e) => setMinPay(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Amount Paid</Label>
              <Input
                type="number"
                step="0.01"
                value={paid}
                onChange={(e) => setPaid(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Due Date</Label>
              <Input type="date" value={due} onChange={(e) => setDue(e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as Debt["status"])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="defaulted">Defaulted</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2 space-y-1.5">
              <Label>Notes</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={submit}
            disabled={save.isPending || (scope === "business" && !businessName.trim())}
          >
            {save.isPending ? "Saving..." : debt ? "Save Debt" : "Record Loan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
