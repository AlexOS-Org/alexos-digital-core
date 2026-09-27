import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AlexOSEmptyState } from "@/components/alexos/states";
import { AlexOSFormField } from "@/components/alexos/form";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useAccounts,
  useBusinesses,
  useSaveBusiness,
  useSaveTransaction,
  type Transaction,
} from "@/lib/money/api";
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
  const saveBusiness = useSaveBusiness();

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
  const [newBusinessName, setNewBusinessName] = useState("");
  const [errors, setErrors] = useState<{
    amount?: string;
    account?: string;
    destination?: string;
    business?: string;
  }>({});

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
    if (scope !== "business" || businessId || !businesses[0]) return;
    setBusinessId(businesses[0].id);
  }, [scope, businessId, businesses]);

  useEffect(() => {
    if (!open) return;
    setErrors({});
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
      setNewBusinessName("");
    }
  }, [open, editing, accounts, businesses]);

  const createBusiness = async () => {
    const name = newBusinessName.trim();
    if (!name) {
      toast.error("Enter a business name.");
      return;
    }
    try {
      const created = await saveBusiness.mutateAsync({ name });
      setBusinessId(created.id);
      setNewBusinessName("");
    } catch {
      // The mutation's onError handler presents the provider error to the user.
    }
  };

  const selectedAccount = accounts.find((account) => account.id === accountId);

  const title =
    mode === "income" ? "Receive Money" : mode === "expense" ? "Spend Money" : "Transfer Money";

  const submit = async () => {
    const amt = Number(amount);
    const next: typeof errors = {};

    if (!Number.isFinite(amt) || amt <= 0) {
      next.amount = "Enter an amount greater than zero.";
    }
    if (!accountId) {
      next.account = "Select the account this entry affects.";
    }
    if (mode === "transfer" && (!toAccountId || toAccountId === accountId)) {
      next.destination = "Select a destination account different from the source.";
    }
    if (mode === "expense" && scope === "business" && !businessId) {
      next.business = "Select the business this expense belongs to.";
    }
    if (mode === "expense" && accountId && !selectedAccount) {
      next.account = "Select the account that paid this expense.";
    }
    if (mode === "expense" && selectedAccount && selectedAccount.financial_scope !== scope) {
      next.account = `Choose a ${scope} account for this expense.`;
    }
    if (
      mode === "expense" &&
      scope === "business" &&
      businessId &&
      selectedAccount &&
      selectedAccount.business_id !== businessId
    ) {
      next.account = "Choose an account owned by the selected business.";
    }

    if (Object.keys(next).length > 0) {
      setErrors(next);
      return;
    }
    setErrors({});

    const financialScope = selectedAccount?.financial_scope ?? scope;
    const expenseScope = mode === "expense" ? scope : "personal";

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
      financial_scope: financialScope,
      expense_type: mode === "expense" ? expenseTypeForCategory(category) : null,
      expense_scope: expenseScope,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] w-[calc(100vw-1rem)] max-w-[calc(100vw-1rem)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? `Edit ${title}` : title}</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <AlexOSFormField label="Date & time" required>
              {({ id, describedBy }) => (
                <Input
                  id={id}
                  aria-describedby={describedBy}
                  type="datetime-local"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              )}
            </AlexOSFormField>
            <AlexOSFormField
              label="Amount"
              required
              error={errors.amount}
              hint={errors.account ? undefined : "Enter the value in the account currency."}
            >
              {({ id, describedBy, invalid }) => (
                <Input
                  id={id}
                  aria-describedby={describedBy}
                  aria-invalid={invalid}
                  type="number"
                  step="0.01"
                  min="0.01"
                  inputMode="decimal"
                  className="alexos-num"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                />
              )}
            </AlexOSFormField>
          </div>

          <AlexOSFormField
            label={mode === "transfer" ? "From account" : "Account"}
            required
            error={errors.account}
            hint={
              mode === "expense"
                ? "The one account that will be reduced. Movements between your own accounts belong in Transfer Money, not here."
                : mode === "transfer"
                  ? "The account the money leaves."
                  : "The account the money lands in."
            }
          >
            {({ id, describedBy, invalid }) => (
              <Select value={accountId} onValueChange={setAccountId}>
                <SelectTrigger id={id} aria-describedby={describedBy} aria-invalid={invalid}>
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
            )}
          </AlexOSFormField>

          {mode === "transfer" ? (
            <AlexOSFormField
              label="To account"
              required
              error={errors.destination}
              hint="Must be different from the account it leaves."
            >
              {({ id, describedBy, invalid }) => (
                <Select value={toAccountId} onValueChange={setToAccountId}>
                  <SelectTrigger id={id} aria-describedby={describedBy} aria-invalid={invalid}>
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
              )}
            </AlexOSFormField>
          ) : null}

          {mode === "income" ? (
            <AlexOSFormField label="Source" required hint="Where the money came from.">
              {({ id, describedBy }) => (
                <Select value={source} onValueChange={setSource}>
                  <SelectTrigger id={id} aria-describedby={describedBy}>
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
              )}
            </AlexOSFormField>
          ) : null}

          {mode === "expense" ? (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <AlexOSFormField label="Expense scope" required>
                  {({ id, describedBy }) => (
                    <Select
                      value={scope}
                      onValueChange={(value) => setScope(value as "personal" | "business")}
                    >
                      <SelectTrigger id={id} aria-describedby={describedBy}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="personal">Personal</SelectItem>
                        <SelectItem value="business">Business</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </AlexOSFormField>

                <AlexOSFormField label="Expense purpose" required>
                  {({ id, describedBy }) => (
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger id={id} aria-describedby={describedBy}>
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
                  )}
                </AlexOSFormField>
              </div>

              {scope === "business" ? (
                businesses.length === 0 ? (
                  <div className="alexos-field">
                    <span className="alexos-label">Business</span>
                    <AlexOSEmptyState
                      compact
                      variant="not-configured"
                      title="No active businesses yet"
                      description="Add a business to assign this expense. Business-scoped spend is reported separately from personal spend."
                      action={
                        <div className="flex w-full flex-col gap-2 sm:flex-row">
                          <Input
                            aria-label="New business name"
                            value={newBusinessName}
                            onChange={(event) => setNewBusinessName(event.target.value)}
                            placeholder="e.g. DailyGear"
                          />
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={createBusiness}
                            disabled={saveBusiness.isPending}
                          >
                            {saveBusiness.isPending ? "Adding…" : "Add business"}
                          </Button>
                        </div>
                      }
                    />
                  </div>
                ) : (
                  <AlexOSFormField label="Business" required error={errors.business}>
                    {({ id, describedBy, invalid }) => (
                      <Select value={businessId} onValueChange={setBusinessId}>
                        <SelectTrigger
                          id={id}
                          aria-describedby={describedBy}
                          aria-invalid={invalid}
                        >
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
                    )}
                  </AlexOSFormField>
                )
              ) : null}
            </>
          ) : null}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <AlexOSFormField label="Description">
              {({ id, describedBy }) => (
                <Textarea
                  id={id}
                  aria-describedby={describedBy}
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional note"
                />
              )}
            </AlexOSFormField>
            <AlexOSFormField label="Reference" hint="e.g. an M-Pesa or bank reference.">
              {({ id, describedBy }) => (
                <Input
                  id={id}
                  aria-describedby={describedBy}
                  className="alexos-num"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="MPESA-XYZ123"
                />
              )}
            </AlexOSFormField>
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={save.isPending}>
              {save.isPending ? "Saving…" : editing ? "Save changes" : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
