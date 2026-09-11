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
  const [fromAccountId, setFromAccountId] = useState<string>("");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (open && goal) {
      setAccountId(goal.account_id ?? "");
      setFromAccountId("");
      setAmount("");
      setNote("");
    }
  }, [open, goal]);

  const sourceAccounts = accounts.filter((a) => a.id !== accountId);

  const submit = async () => {
    if (!goal) return;
    const n = Number(amount);
    if (!n || n <= 0) return;
    if (!accountId) return;
    await contribute.mutateAsync({
      goal_id: goal.id,
      goal_name: goal.name,
      amount: n,
      account_id: accountId,
      from_account_id: fromAccountId || null,
      note: note.trim() || null,
    });
    setAmount("");
    setNote("");
    setAccountId("");
    setFromAccountId("");
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
            <p className="text-xs text-muted-foreground">
              This records the contribution and posts a Money Center movement so the linked account
              balance stays accurate. Prefer a transfer from another account when you are moving
              existing cash; use deposit only for money that is not already on the ledger.
            </p>
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
              <Label>From account (optional transfer)</Label>
              <Select
                value={fromAccountId || "__none__"}
                onValueChange={(v) => setFromAccountId(v === "__none__" ? "" : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="None — external deposit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None — external deposit</SelectItem>
                  {sourceAccounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Into savings account</Label>
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
                  Defaults to this goal's linked savings account.
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
          <Button onClick={submit} disabled={contribute.isPending || !amount || !accountId}>
            {contribute.isPending ? "Saving..." : "Add Contribution"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
