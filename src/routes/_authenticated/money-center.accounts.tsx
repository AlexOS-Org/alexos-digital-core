import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAccountBalances, useAccounts, useArchiveAccount, type Account } from "@/lib/money/api";
import { ACCOUNT_ICONS } from "@/lib/money/constants";
import { formatMoney } from "@/lib/money/format";
import { AccountFormDialog } from "@/components/money/AccountFormDialog";
import { Archive, ArchiveRestore, Pencil, Plus, Wallet, CircleAlert } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/money-center/accounts")({
  component: AccountsPage,
});

function AccountsPage() {
  const [showArchived, setShowArchived] = useState(false);
  const { data: accounts = [], isLoading } = useAccounts(showArchived);
  const { data: balances = [] } = useAccountBalances();
  const archive = useArchiveAccount();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);

  const openNew = () => { setEditing(null); setOpen(true); };
  const openEdit = (a: Account) => { setEditing(a); setOpen(true); };

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Accounts</h1>
          <p className="text-sm text-muted-foreground">Manage where your money lives. Balances are calculated from transactions.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Switch id="archived" checked={showArchived} onCheckedChange={setShowArchived} />
            <Label htmlFor="archived" className="text-sm">Show archived</Label>
          </div>
          <Button onClick={openNew} className="rounded-xl"><Plus className="h-4 w-4 mr-1" /> New Account</Button>
        </div>
      </header>

      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading && <div className="text-sm text-muted-foreground">Loading...</div>}
        {accounts.map((a) => {
          const bal = balances.find((b) => b.account_id === a.id);
          const balance = Number(bal?.balance ?? 0);
          const Icon = ACCOUNT_ICONS[a.icon] ?? Wallet;
          const isArchived = a.status === "archived";
          const isMpesa = /m[- ]?pesa/i.test(a.name);
          const isBank = /bank|kcb|equity|coop|co-operative|absa|ncba|stanbic|family|dtb|i&m|im bank|sidian|prime/i.test(`${a.name} ${a.type}`);
          const warningThreshold = isMpesa ? 300 : isBank ? 500 : null;
          const isLowBalance = warningThreshold !== null && balance < warningThreshold;

          return (
            <Card key={a.id} className={cn("rounded-2xl transition-colors", isLowBalance && "border-red-200/80 dark:border-red-900/50")}>
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn("h-11 w-11 rounded-xl grid place-items-center", isLowBalance ? "bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400" : "bg-primary/10 text-primary")}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-medium">{a.name}</div>
                      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{a.type.replace("_", " ")} · {a.currency}</div>
                    </div>
                  </div>
                  {isArchived && <Badge variant="secondary">Archived</Badge>}
                </div>
                <div className={cn("rounded-xl px-3 py-2.5", isLowBalance ? "bg-red-50/70 dark:bg-red-950/20" : "bg-muted/40")}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xs text-muted-foreground">Current Balance</div>
                    {isLowBalance && <CircleAlert className="h-3.5 w-3.5 text-red-500/80" aria-label="Low balance" />}
                  </div>
                  <div className={cn("text-2xl font-semibold tracking-tight", isLowBalance && "text-red-600/90 dark:text-red-400/90")}>
                    {formatMoney(balance, a.currency)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">Opening: {formatMoney(a.opening_balance, a.currency)}</div>
                  {isLowBalance && <div className="mt-1 text-[11px] text-red-600/75 dark:text-red-400/75">Below your {formatMoney(warningThreshold!, a.currency)} comfort level</div>}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => openEdit(a)} className="flex-1 rounded-lg"><Pencil className="h-3.5 w-3.5 mr-1" /> Edit</Button>
                  <Button variant="outline" size="sm" onClick={() => archive.mutate({ id: a.id, archived: !isArchived })} className="flex-1 rounded-lg">
                    {isArchived ? <><ArchiveRestore className="h-3.5 w-3.5 mr-1" /> Restore</> : <><Archive className="h-3.5 w-3.5 mr-1" /> Archive</>}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <AccountFormDialog open={open} onOpenChange={setOpen} account={editing} />
    </div>
  );
}