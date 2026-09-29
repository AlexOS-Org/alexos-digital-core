import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { AlexOSFormField } from "@/components/alexos/form";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EXPENSE_CATEGORIES } from "@/lib/money/constants";
import { useBusinesses, useSaveBudget, type Budget } from "@/lib/money/api";
import type { BudgetScope } from "@/lib/money/budget-calculations";
import { monthKey, monthLabel } from "@/lib/money/format";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  month: string;
  editing?: Budget | null;
}

export function BudgetFormDialog({ open, onOpenChange, month, editing }: Props) {
  const save = useSaveBudget();
  const { data: businesses = [] } = useBusinesses();

  const [category, setCategory] = useState<string>(EXPENSE_CATEGORIES[0]);
  const [amount, setAmount] = useState("");
  const [scope, setScope] = useState<BudgetScope>("personal");
  const [businessId, setBusinessId] = useState("");
  const [amountError, setAmountError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setAmountError(null);

    if (editing) {
      setCategory(editing.category);
      setAmount(String(editing.amount));
      setScope(editing.financial_scope);
      setBusinessId(editing.business_id ?? "");
    } else {
      setCategory(EXPENSE_CATEGORIES[0]);
      setAmount("");
      setScope("personal");
      setBusinessId("");
    }
  }, [open, editing]);

  const submit = async () => {
    const value = Number(amount);

    if (!value || value <= 0) {
      setAmountError("Enter a monthly limit greater than zero.");
      return;
    }
    if (scope === "business" && !businessId) return;
    setAmountError(null);

    await save.mutateAsync({
      id: editing?.id,
      category,
      month: month || monthKey(),
      amount: value,
      financial_scope: scope,
      business_id: scope === "business" ? businessId : null,
      business_name:
        scope === "business"
          ? (businesses.find((business) => business.id === businessId)?.name ?? null)
          : null,
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Budget" : "Create Budget"}</DialogTitle>
        </DialogHeader>

        <form
          className="space-y-5"
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
        >
          <AlexOSFormField
            label="Starts in"
            hint="This monthly limit repeats automatically in future months. Spending and remaining balance are recalculated for each month."
          >
            {({ id, describedBy }) => (
              <Input id={id} aria-describedby={describedBy} value={monthLabel(month)} disabled />
            )}
          </AlexOSFormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <AlexOSFormField
              label="Budget scope"
              required
              hint={
                editing
                  ? "Scope cannot be changed once a budget exists."
                  : "Choose which financial activity this limit measures."
              }
            >
              {({ id, describedBy }) => (
                <Select
                  value={scope}
                  onValueChange={(value) => setScope(value as BudgetScope)}
                  disabled={!!editing}
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

            {scope === "business" ? (
              <AlexOSFormField
                label="Business"
                required
                error={!businessId ? "Choose a business." : undefined}
              >
                {({ id, describedBy, invalid }) => (
                  <Select value={businessId} onValueChange={setBusinessId} disabled={!!editing}>
                    <SelectTrigger id={id} aria-describedby={describedBy} aria-invalid={invalid}>
                      <SelectValue placeholder="Choose business" />
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
            ) : null}

            <AlexOSFormField
              label="Expense category"
              required
              hint={editing ? "The category cannot be changed once a budget exists." : undefined}
            >
              {({ id, describedBy }) => (
                <Select value={category} onValueChange={setCategory} disabled={!!editing}>
                  <SelectTrigger id={id} aria-describedby={describedBy}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPENSE_CATEGORIES.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </AlexOSFormField>

            <AlexOSFormField
              label="Recurring monthly limit"
              required
              error={amountError}
              hint="Enter an amount greater than zero."
            >
              {({ id, describedBy, invalid }) => (
                <Input
                  id={id}
                  aria-describedby={describedBy}
                  aria-invalid={invalid}
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  className="alexos-num"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              )}
            </AlexOSFormField>
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={save.isPending}>
              {save.isPending ? "Saving…" : editing ? "Update budget" : "Create budget"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
