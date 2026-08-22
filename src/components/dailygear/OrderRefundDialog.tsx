import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAccounts } from "@/lib/money/api";
import { useRefundOrVoidOrderPayment } from "@/lib/dailygear/api";
import type { Order } from "@/lib/dailygear/types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order | null;
}

export function OrderRefundDialog({ open, onOpenChange, order }: Props) {
  const { data: accounts = [], isLoading: accountsLoading } = useAccounts(true);
  const mutation = useRefundOrVoidOrderPayment();
  const [mode, setMode] = useState<"void" | "refund">("void");
  const [amount, setAmount] = useState("");
  const [accountId, setAccountId] = useState("");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!open || !order) return;
    setMode("void");
    setAmount(String(Number(order.total ?? 0)));
    setAccountId(accounts[0]?.id ?? "");
    setReference("");
    setNotes("");
  }, [open, order, accounts]);

  async function submit() {
    if (!order) return;
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) return;
    if (mode === "refund" && (!accountId || !reference.trim())) return;
    await mutation.mutateAsync({
      orderId: order.id,
      mode,
      refundAmount: numericAmount,
      refundAccountId: mode === "refund" ? accountId : null,
      refundTransactionId: mode === "refund" ? reference : null,
      notes: notes || null,
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Reverse paid order</DialogTitle>
        </DialogHeader>
        {order ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-950">
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <p>
                  This keeps the order and payment evidence for audit. A void removes the linked
                  receipt from active balances. A refund also records the money returned from the
                  selected account.
                </p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Order <strong className="text-foreground">{order.order_number}</strong> · original
              total KES {Number(order.total ?? 0).toLocaleString()}
            </p>
            <div className="space-y-1.5">
              <Label>Action</Label>
              <Select value={mode} onValueChange={(value) => setMode(value as "void" | "refund")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="void">Void payment — no money returned</SelectItem>
                  <SelectItem value="refund">Refund customer — money returned</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Amount to reverse</Label>
              <Input
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
              />
            </div>
            {mode === "refund" ? (
              <>
                <div className="space-y-1.5">
                  <Label>Refund paid from</Label>
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
                  <Label>Refund transaction reference</Label>
                  <Input
                    value={reference}
                    onChange={(event) => setReference(event.target.value)}
                    placeholder="M-Pesa code or bank reference"
                  />
                </div>
              </>
            ) : null}
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea
                rows={2}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Reason for test reversal or refund"
              />
            </div>
          </div>
        ) : null}
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => void submit()}
            disabled={mutation.isPending || !order}
          >
            {mutation.isPending
              ? "Processing…"
              : mode === "refund"
                ? "Record refund"
                : "Void payment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
