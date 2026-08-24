import { useEffect, useState } from "react";
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
import { useAccounts, useBusinesses, useSaveTransaction, type Transaction } from "@/lib/money/api";
import { toast } from "sonner";
import {
  EXPENSE_CATEGORIES,
  INCOME_SOURCES,
  expenseTypeForCategory,
  normalizeExpenseCategory,
} from "@/lib/money/constants";

type Mode = "income" | "expense" | "transfer";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  mode: Mode;
  editing?: Transaction | null;
}

export function TransactionFormDialog({ open, onOpenChange, mode, editing }: Props) {
  const { data: accounts = [] } = useAccounts();
  const { data: businesses = [] } = useBusinesses();
  const save = useSaveTransaction();

  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 16));
  const [amount, setAmount] = useState("");
  const [accountId, setAccountId] = useState("");
  const [toAccountId, setToAccountId] = useState("");
  const [category, setCategory] = useState<string>(EXPENSE_CATEGORIES[0]);
  const [source, setSource] = useState<string>(INCOME_SOURCES[0]);
  const [description, setDescription] = useState("");
  const [reference, setReference] = useState("");
  const [scope, setScope] = useState<"personal" | "business">("personal");
  const [businessId, setBusinessId] = useState("");

  const eligibleAccounts =
    mode !== "expense"
      ? accounts
      : accounts.filter((account) => (account.financial_scope ?? "personal") === scope);

  useEffect(() => {
    if (!open || mode !== "expense") return;
    if (!eligibleAccounts.some((account) => account.id === accountId)) {
      setAccountId(eligibleAccounts[0]?.id ?? "");
    }
  }, [open, mode, scope, accountId, eligibleAccounts]);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setDate(new Date(editing.occurred_at).toISOString().slice(0, 16));
      setAmount(String(editing.amount));
      setAccountId(editing.account_id);
      setToAccountId(editing.transfer_account_id ?? "");
      setCategory(normalizeExpenseCategory(editing.category));
      setSource(editing.source ?? INCOME_SOURCES[0]);
      setDescription(editing.description ?? "");
      setReference(editing.reference ?? "");
      setScope(
        editing.expense_scope === "business" || editing.business_id ? "business" : "personal",
      );
      setBusinessId(editing.business_id ?? "");
    } else {
      setDate(new Date().toISOString().slice(0, 16));
      setAmount("");
      setAccountId(accounts[0]?.id ?? "");
      setToAccountId(accounts[1]?.id ?? "");
      setCategory(EXPENSE_CATEGORIES[0]);
      setSource(INCOME_SOURCES[0]);
      setDescription("");
      setReference("");
      setScope("personal");
      setBusinessId(businesses[0]?.id ?? "");
    }
  }, [open, editing, accounts, businesses]);

  const selectedAccount = accounts.find((account) => account.id === accountId);

  const title =
    mode === "income" ? "Receive Money" : mode === "expense" ? "Spend Money" : "Transfer Money";

  const submit = async () => {
    const amt = Number(amount);
    if (!amt || amt <= 0 || !accountId) return;
    if (mode === "transfer" && (!toAccountId || toAccountId === accountId)) return;
    if (mode === "expense" && scope === "business" && !businessId) {
      toast.error("Select the business this expense belongs to.");
      return;
    }
    if (mode === "expense" && !selectedAccount) {
      toast.error("Select the account that paid this expense.");
      return;
    }
    if (
      mode === "expense" &&
      scope === "business" &&
      selectedAccount?.business_id &&
      selectedAccount.business_id !== businessId
    ) {
      toast.error("Choose an account owned by the selected business.");
      return;
    }
    await save.mutateAsync({
      id: editing?.id,
      type: mode,
      occurred_at: new Date(date).toISOString(),
      account_id: accountId,
      transfer_account_id: mode === "transfer" ? toAccountId : null,
      amount: amt,
      category: mode === "expense" ? normalizeExpenseCategory(category) : null,
      source: mode === "income" ? source : null,
      description: description || null,
      reference: reference || null,
      business_id: mode === "expense" && scope === "business" ? businessId : null,
      financial_scope: mode === "expense" ? (selectedAccount?.financial_scope ?? "personal") : null,
      expense_type: mode === "expense" ? expenseTypeForCategory(category) : null,
      expense_scope: mode === "expense" ? scope : null,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? `Edit ${title}` : title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Date & Time</Label>
              <Input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Amount</Label>
              <Input
                type="number"
                step="0.01"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>{mode === "transfer" ? "From Account" : "Paid from account"}</Label>
            <Select value={accountId} onValueChange={setAccountId}>
              <SelectTrigger>
                <SelectValue placeholder="Select account" />
              </SelectTrigger>
              <SelectContent>
                {eligibleAccounts.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name} · {a.financial_scope === "business" ? "Business" : "Personal"}
                    {a.business_name ? ` · ${a.business_name}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {mode === "expense" && (
              <p className="text-xs text-muted-foreground">
                This is the one account that will be reduced. Transfers between accounts belong in
                Transfer Money, not as an expense.
              </p>
            )}
          </div>

          {mode === "transfer" && (
            <div className="space-y-1.5">
              <Label>To Account</Label>
              <Select value={toAccountId} onValueChange={setToAccountId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select destination" />
                </SelectTrigger>
                <SelectContent>
                  {accounts
                    .filter((a) => a.id !== accountId)
                    .map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {mode === "income" && (
            <div className="space-y-1.5">
              <Label>Source</Label>
              <Select value={source} onValueChange={setSource}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INCOME_SOURCES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {mode === "expense" && (
            <>
              <div className="space-y-1.5">
                <Label>Expense scope</Label>
                <Select
                  value={scope}
                  onValueChange={(value) => setScope(value as "personal" | "business")}
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
              {scope === "business" && (
                <div className="space-y-1.5">
                  <Label>Business</Label>
                  <Select value={businessId} onValueChange={setBusinessId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select business" />
                    </SelectTrigger>
                    <SelectContent>
                      {businesses.map((business) => (
                        <SelectItem key={business.id} value={business.id}>
                          {business.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-1.5">
                <Label>Expense purpose</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPENSE_CATEGORIES.map((purpose) => (
                      <SelectItem key={purpose} value={purpose}>
                        {purpose}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional note"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Reference</Label>
            <Input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="e.g. MPESA-XYZ123"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={save.isPending}>
            {save.isPending ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
