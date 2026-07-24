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
import { EXPENSE_CATEGORIES } from "@/lib/money/constants";
import { useSaveBudget, type Budget } from "@/lib/money/api";
import { monthKey, monthLabel } from "@/lib/money/format";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  month: string;
  editing?: Budget | null;
}

export function BudgetFormDialog({
  open,
  onOpenChange,
  month,
  editing,
}: Props) {
  const save = useSaveBudget();

const [category, setCategory] = useState<string>(EXPENSE_CATEGORIES[0]);
  const [amount, setAmount] = useState("");

  useEffect(() => {
    if (!open) return;

    if (editing) {
      setCategory(editing.category);
      setAmount(String(editing.amount));
    } else {
      setCategory(EXPENSE_CATEGORIES[0]);
      setAmount("");
    }
  }, [open, editing]);

  const submit = async () => {
    const value = Number(amount);

    if (!value || value <= 0) return;

    await save.mutateAsync({
      id: editing?.id,
      category,
      month: month || monthKey(),
      amount: value,
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editing ? "Edit Budget" : "Create Budget"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <div className="space-y-2">
            <Label>Month</Label>
            <Input
              value={monthLabel(month)}
              disabled
            />
          </div>

          <div className="space-y-2">
            <Label>Expense Category</Label>
            <Select
              value={category}
              onValueChange={setCategory}
              disabled={!!editing}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                {EXPENSE_CATEGORIES.map((item) => (
                  <SelectItem
                    key={item}
                    value={item}
                  >
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Monthly Limit</Label>
            <Input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>

          <Button
            onClick={submit}
            disabled={save.isPending}
          >
            {save.isPending
              ? "Saving..."
              : editing
                ? "Update Budget"
                : "Create Budget"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}