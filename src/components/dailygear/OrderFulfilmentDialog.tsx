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
  otherCost: string;
  otherDescription: string;
  accountId: string;
  advanceOrder: boolean;
}

const EMPTY: FormState = {
  purchaseCost: "",
  deliveryCost: "",
  otherCost: "",
  otherDescription: "",
  accountId: "",
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
      otherCost: existing.other?.amount ? String(existing.other.amount) : "",
      otherDescription: existing.other?.description ?? "",
      accountId:
        existing.purchase?.account_id ??
        existing.delivery?.account_id ??
        existing.other?.account_id ??
        accounts.data?.[0]?.id ??
        "",
      advanceOrder: Boolean(nextStatus),
    });
  }, [accounts.data, existing, nextStatus, open, order]);

  const posted = Boolean(
    existing.purchase?.money_transaction_id ||
    existing.delivery?.money_transaction_id ||
    existing.other?.money_transaction_id,
  );

  function set(key: keyof FormState, value: string | boolean) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit() {
    if (!order) return;
    const purchaseCost = amount(form.purchaseCost);
    const deliveryCost = amount(form.deliveryCost);
    const otherCost = amount(form.otherCost);
    if (purchaseCost + deliveryCost + otherCost > 0 && !form.accountId) {
      toast.error("Select the Money Center account used to pay the fulfilment costs.");
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
      otherCost,
      accountId: form.accountId || null,
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
            <Label htmlFor="order-other-cost">Other fulfilment cost (KES)</Label>
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

        <div className="space-y-2 rounded-2xl border bg-muted/25 p-4">
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
            All non-zero costs in this save are posted as business expenses from this account. The
            order’s unpaid COD status remains unchanged; receiving payment is a separate action.
          </p>
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
