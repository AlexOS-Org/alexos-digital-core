import { useEffect, useMemo, useState } from "react";
import { PackageCheck, WalletCards } from "lucide-react";
import { toast } from "sonner";
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
import { useAccounts } from "@/lib/money/api";
import { useOrderExpenses, useRecordOrderFulfilment } from "@/lib/dailygear/api";
import type { Order } from "@/lib/dailygear/types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order | null;
}

interface FormState {
  purchaseCost: string;
  deliveryCost: string;
  advertisingCost: string;
  otherCost: string;
  otherDescription: string;
  accountId: string;
  supplierPaid: boolean;
  supplierPaymentAmount: string;
  supplierPaymentAccountId: string;
  advanceOrder: boolean;
}

const EMPTY: FormState = {
  purchaseCost: "",
  deliveryCost: "",
  advertisingCost: "",
  otherCost: "",
  otherDescription: "",
  accountId: "",
  supplierPaid: false,
  supplierPaymentAmount: "",
  supplierPaymentAccountId: "",
  advanceOrder: true,
};

function amount(value: string) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

export function OrderFulfilmentDialog({ open, onOpenChange, order }: Props) {
  const accounts = useAccounts();
  const expenses = useOrderExpenses(order?.id);
  const save = useRecordOrderFulfilment();
  const [form, setForm] = useState<FormState>(EMPTY);

  const existing = useMemo(() => {
    const map = new Map((expenses.data ?? []).map((expense) => [expense.cost_type, expense]));
    return {
      purchase: map.get("purchase_cost"),
      delivery: map.get("delivery"),
      advertising: map.get("advertising"),
      other: map.get("other"),
    };
  }, [expenses.data]);

  const nextStatus: Order["status"] | null =
    order?.status === "new" ? "processing" : order?.status === "processing" ? "packed" : null;

  useEffect(() => {
    if (!open || !order) return;
    setForm({
      purchaseCost: existing.purchase?.amount ? String(existing.purchase.amount) : "",
      deliveryCost: existing.delivery?.amount ? String(existing.delivery.amount) : "",
      advertisingCost: existing.advertising?.amount ? String(existing.advertising.amount) : "",
      otherCost: existing.other?.amount ? String(existing.other.amount) : "",
      otherDescription: existing.other?.description ?? "",
      accountId:
        existing.purchase?.account_id ??
        existing.delivery?.account_id ??
        existing.advertising?.account_id ??
        existing.other?.account_id ??
        accounts.data?.[0]?.id ??
        "",
      supplierPaid: Boolean(existing.purchase?.cash_paid),
      supplierPaymentAmount:
        existing.purchase?.cash_paid && existing.purchase.amount
          ? String(existing.purchase.amount)
          : "",
      supplierPaymentAccountId: existing.purchase?.cash_paid
        ? (existing.purchase.account_id ?? "")
        : "",
      advanceOrder: Boolean(nextStatus),
    });
  }, [accounts.data, existing, nextStatus, open, order]);

  const posted = Boolean(
    existing.purchase?.money_transaction_id ||
    existing.delivery?.money_transaction_id ||
    existing.advertising?.money_transaction_id ||
    existing.other?.money_transaction_id,
  );

  function set(key: keyof FormState, value: string | boolean) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit() {
    if (!order) return;
    const purchaseCost = amount(form.purchaseCost);
    const deliveryCost = amount(form.deliveryCost);
    const advertisingCost = amount(form.advertisingCost);
    const otherCost = amount(form.otherCost);
    const supplierPaymentAmount = amount(form.supplierPaymentAmount);
    if (purchaseCost + deliveryCost + advertisingCost + otherCost > 0 && !form.accountId) {
      toast.error("Select the Money Center account used to pay the fulfilment costs.");
      return;
    }
    if (form.supplierPaid && supplierPaymentAmount <= 0) {
      toast.error("Enter the supplier payment amount when supplier paid is Yes.");
      return;
    }
    if (form.supplierPaid && !form.supplierPaymentAccountId) {
      toast.error("Select the account used to pay the supplier when supplier paid is Yes.");
      return;
    }
    if (otherCost > 0 && !form.otherDescription.trim()) {
      toast.error("Describe the other fulfilment cost before saving it.");
      return;
    }

    await save.mutateAsync({
      orderId: order.id,
      purchaseCost,
      deliveryCost,
      advertisingCost,
      otherCost,
      accountId: form.accountId || null,
      supplierPaid: form.supplierPaid,
      supplierPaymentAmount: form.supplierPaid ? supplierPaymentAmount : null,
      supplierPaymentAccountId: form.supplierPaid ? form.supplierPaymentAccountId || null : null,
      otherDescription: form.otherDescription.trim() || null,
      nextStatus: form.advanceOrder ? nextStatus : null,
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Fulfil {order?.order_number ?? "order"}</DialogTitle>
        </DialogHeader>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-900">
          Enter the actual costs used to fulfil this order. Each non-zero cost becomes one posted
          Money Center expense from the selected account. Repeating the same save will not duplicate
          transactions; posted values cannot be silently rewritten.
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="order-purchase-cost">Purchase cost (KES)</Label>
            <Input
              id="order-purchase-cost"
              type="number"
              min="0"
              step="0.01"
              value={form.purchaseCost}
              disabled={Boolean(existing.purchase?.money_transaction_id)}
              onChange={(event) => set("purchaseCost", event.target.value)}
              placeholder="0"
            />
            {existing.purchase?.money_transaction_id ? (
              <p className="text-[11px] text-muted-foreground">Already posted to Money Center.</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="order-delivery-cost">Delivery cost (KES)</Label>
            <Input
              id="order-delivery-cost"
              type="number"
              min="0"
              step="0.01"
              value={form.deliveryCost}
              disabled={Boolean(existing.delivery?.money_transaction_id)}
              onChange={(event) => set("deliveryCost", event.target.value)}
              placeholder="0"
            />
            {existing.delivery?.money_transaction_id ? (
              <p className="text-[11px] text-muted-foreground">Already posted to Money Center.</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="order-advertising-cost">Advertising cost (KES)</Label>
            <Input
              id="order-advertising-cost"
              type="number"
              min="0"
              step="0.01"
              value={form.advertisingCost}
              disabled={Boolean(existing.advertising?.money_transaction_id)}
              onChange={(event) => set("advertisingCost", event.target.value)}
              placeholder="0"
            />
            {existing.advertising?.money_transaction_id ? (
              <p className="text-[11px] text-muted-foreground">Already posted to Money Center.</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="order-other-cost">Packaging or other cost (KES)</Label>
            <Input
              id="order-other-cost"
              type="number"
              min="0"
              step="0.01"
              value={form.otherCost}
              disabled={Boolean(existing.other?.money_transaction_id)}
              onChange={(event) => set("otherCost", event.target.value)}
              placeholder="0"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="order-other-description">Other cost description</Label>
            <Input
              id="order-other-description"
              value={form.otherDescription}
              disabled={Boolean(existing.other?.money_transaction_id)}
              onChange={(event) => set("otherDescription", event.target.value)}
              placeholder="Packaging, platform fee…"
            />
          </div>
        </div>

        <div className="space-y-4 rounded-2xl border bg-muted/25 p-4">
          <div className="flex items-center gap-2">
            <WalletCards className="h-4 w-4 text-primary" />
            <Label htmlFor="order-cost-account">Paid from Money Center account</Label>
          </div>
          <Select value={form.accountId} onValueChange={(value) => set("accountId", value)}>
            <SelectTrigger id="order-cost-account">
              <SelectValue
                placeholder={accounts.isLoading ? "Loading accounts…" : "Select account"}
              />
            </SelectTrigger>
            <SelectContent>
              {(accounts.data ?? []).map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  {account.name} · {account.currency}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-[11px] leading-5 text-muted-foreground">
            All non-zero fulfilment costs are recorded for this order. Only costs with a selected
            paid-from account create a Money Center cash transaction.
          </p>

          <label className="flex items-start gap-3 rounded-xl border bg-background p-3 text-sm">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 accent-primary"
              checked={form.supplierPaid}
              disabled={Boolean(existing.purchase?.money_transaction_id)}
              onChange={(event) => set("supplierPaid", event.target.checked)}
            />
            <span>
              <span className="font-semibold">Supplier paid?</span>
              <span className="mt-1 block text-xs text-muted-foreground">
                Select Yes only when money actually left an account. Select No to save the supplier
                cost for profit analysis without posting supplier cash.
              </span>
            </span>
          </label>

          {form.supplierPaid ? (
            <div className="grid gap-4 sm:grid-cols-2 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3">
              <div className="space-y-2">
                <Label htmlFor="supplier-payment-amount">Actual supplier payment (KES)</Label>
                <Input
                  id="supplier-payment-amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.supplierPaymentAmount}
                  disabled={Boolean(existing.purchase?.money_transaction_id)}
                  onChange={(event) => set("supplierPaymentAmount", event.target.value)}
                  placeholder="Enter amount paid"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supplier-payment-account">Supplier paid from</Label>
                <Select
                  value={form.supplierPaymentAccountId}
                  disabled={Boolean(existing.purchase?.money_transaction_id)}
                  onValueChange={(value) => set("supplierPaymentAccountId", value)}
                >
                  <SelectTrigger id="supplier-payment-account">
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                  <SelectContent>
                    {(accounts.data ?? []).map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name} · {account.currency}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : null}
        </div>

        {nextStatus ? (
          <label className="flex items-start gap-3 rounded-xl border p-3 text-sm">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 accent-primary"
              checked={form.advanceOrder}
              onChange={(event) => set("advanceOrder", event.target.checked)}
            />
            <span>
              <span className="font-semibold">
                {nextStatus === "processing" ? "Move order to processing" : "Mark order as packed"}
              </span>
              <span className="mt-1 block text-xs text-muted-foreground">
                This changes only the fulfilment status and creates an order event.
              </span>
            </span>
          </label>
        ) : null}

        {posted ? (
          <p className="text-xs text-muted-foreground">
            <PackageCheck className="mr-1 inline h-3.5 w-3.5" />
            At least one cost is already linked to Money Center. Existing posted costs are locked to
            preserve the financial audit trail.
          </p>
        ) : null}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={save.isPending || accounts.isLoading}
            onClick={() => void submit()}
          >
            <PackageCheck className="mr-2 h-4 w-4" />
            {save.isPending ? "Saving…" : "Record costs and fulfil"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
