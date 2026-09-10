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
import { useContribute, type Goal } from "@/lib/goals/api";
import { useAccounts } from "@/lib/money/api";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  goal: Goal | null;
}

export function GoalContributeDialog({ open, onOpenChange, goal }: Props) {
  const contribute = useContribute();
  const { data: accounts = [] } = useAccounts();
  const [amount, setAmount] = useState("");
  const [accountId, setAccountId] = useState<string>("");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (open && goal) {
      setAccountId(goal.account_id ?? "");
      setAmount("");
      setNote("");
    }
  }, [open, goal]);

  const submit = async () => {
    if (!goal) return;
    const n = Number(amount);
    if (!n || n <= 0) return;
    await contribute.mutateAsync({
      goal_id: goal.id,
      amount: n,
      account_id: accountId || null,
      note: note.trim() || null,
    });
    setAmount("");
    setNote("");
    setAccountId("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Add Contribution</DialogTitle>
        </DialogHeader>
        {goal && (
          <div className="space-y-4">
            <div className="rounded-lg border p-3 text-sm">
              <div className="font-medium">{goal.name}</div>
              <div className="text-muted-foreground text-xs">{goal.category ?? "—"}</div>
            </div>
            <div className="space-y-1.5">
              <Label>Amount</Label>
              <Input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label>Into account</Label>
              <Select value={accountId} onValueChange={setAccountId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {goal.account_id && (
                <p className="text-xs text-muted-foreground">
                  Defaults to this goal&apos;s linked savings account.
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Note</Label>
              <Input value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={contribute.isPending || !amount}>
            {contribute.isPending ? "Saving..." : "Add Contribution"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
