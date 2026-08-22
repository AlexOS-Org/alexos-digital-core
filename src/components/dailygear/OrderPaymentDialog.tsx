import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAccounts } from "@/lib/money/api";
import { useConfirmOrderPayment, type ConfirmOrderPaymentResult } from "@/lib/dailygear/api";
import type { Order } from "@/lib/dailygear/types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order | null;
  onConfirmed?: (result: ConfirmOrderPaymentResult) => void;
}

export function OrderPaymentDialog({ open, onOpenChange, order, onConfirmed }: Props) {
  const { data: accounts = [], isLoading: accountsLoading } = useAccounts();
  const confirmPayment = useConfirmOrderPayment();
  const [accountId, setAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [paidAt, setPaidAt] = useState(new Date().toISOString().slice(0, 16));
  const [notes, setNotes] = useState("");

  const remaining = useMemo(() => {
    if (!order) return 0;
    return Math.max(0, Number(order.total ?? 0));
  }, [order]);

  useEffect(() => {
    if (!open || !order) return;
    setAccountId(
      accounts.find((account) => /i&m|im bank/i.test(account.name))?.id ?? accounts[0]?.id ?? "",
    );
    setAmount(String(remaining));
    setTransactionId("");
    setPaidAt(new Date().toISOString().slice(0, 16));
    setNotes("");
  }, [open, order, accounts, remaining]);

  const submit = async () => {
    if (!order || !accountId || !transactionId.trim()) return;
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) return;
    const result = await confirmPayment.mutateAsync({
      orderId: order.id,
      accountId,
      amount: numericAmount,
      transactionId,
      paidAt: new Date(paidAt).toISOString(),
      notes: notes || null,
    });
    onConfirmed?.(result);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Confirm customer payment</DialogTitle>
        </DialogHeader>
        {order && (
          <div className="rounded-xl border bg-muted/30 p-3 text-sm">
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">Order</span>
              <strong>{order.order_number}</strong>
            </div>
            <div className="mt-1 flex justify-between gap-3">
              <span className="text-muted-foreground">Order total</span>
              <strong>KES {Number(order.total ?? 0).toLocaleString()}</strong>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Only the amount you confirm will be posted to the selected account. Profit is
              calculated separately; it is not posted as another income transaction.
            </p>
          </div>
        )}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Amount received</Label>
              <Input
                type="number"
                min="0.01"
                step="0.01"
                inputMode="decimal"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Paid date</Label>
              <Input
                type="datetime-local"
                value={paidAt}
                onChange={(event) => setPaidAt(event.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Received into</Label>
            <Select value={accountId} onValueChange={setAccountId} disabled={accountsLoading}>
              <SelectTrigger>
                <SelectValue placeholder="Select account" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name} · {account.currency}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Transaction ID / reference</Label>
            <Input
              value={transactionId}
              onChange={(event) => setTransactionId(event.target.value)}
              placeholder="e.g. MPESA123ABC or bank reference"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea
              rows={2}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Optional collection note"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={submit}
            disabled={confirmPayment.isPending || !accountId || !transactionId.trim()}
          >
            {confirmPayment.isPending ? "Confirming…" : "Confirm payment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
