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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRecordDebtPayment, type Debt, debtRemaining } from "@/lib/debts/api";
import { useAccounts } from "@/lib/money/api";
import { formatMoney } from "@/lib/money/format";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  debt: Debt | null;
}

export function DebtPaymentDialog({ open, onOpenChange, debt }: Props) {
  const pay = useRecordDebtPayment();
  const { data: accounts = [] } = useAccounts();

  const [amount, setAmount] = useState("");
  const [interestAmount, setInterestAmount] = useState("0");
  const [accountId, setAccountId] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (!open) return;

    setAmount("");
    setInterestAmount("0");
    setDescription("");
    setPaymentDate(new Date().toISOString().slice(0, 10));

    if (accounts.length > 0) setAccountId(accounts[0].id);
  }, [open, accounts]);

  const submit = async () => {
    if (!debt) return;

    const n = Number(amount);
    const interest = Number(interestAmount) || 0;
    if (!n || n <= 0) return;

    await pay.mutateAsync({
      debt,
      amount: n,
      interestAmount: interest,
      accountId,
      paymentDate,
      description,
    });

    onOpenChange(false);
  };

  const total = Number(amount) || 0;
  const interest = Number(interestAmount) || 0;
  const principal = Math.max(0, total - interest);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Record Debt Payment</DialogTitle>
        </DialogHeader>

        {debt && (
          <div className="space-y-4">
            <div className="rounded-xl border p-3">
              <div className="font-medium">{debt.name}</div>
              <div className="text-sm text-muted-foreground">
                Remaining principal: {formatMoney(debtRemaining(debt))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Payment Account</Label>
              <Select value={accountId} onValueChange={setAccountId}>
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

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Total Payment</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Interest Included</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={interestAmount}
                  onChange={(e) => setInterestAmount(e.target.value)}
                />
              </div>
            </div>

            <div className="rounded-xl bg-muted/50 p-3 text-sm">
              <div className="flex justify-between">
                <span>Principal</span>
                <strong>{formatMoney(principal)}</strong>
              </div>
              <div className="mt-1 flex justify-between">
                <span>Interest expense</span>
                <strong>{formatMoney(Math.min(interest, total))}</strong>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Principal reduces the debt. Interest is recorded as an expense. The full payment
                reduces cash.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label>Payment Date</Label>
              <Input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Description (Optional)</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Payment notes"
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={pay.isPending || !amount || !accountId}>
            {pay.isPending ? "Saving..." : "Record Payment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
