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
import { CryptoHoldingsPanel } from "@/components/money/CryptoHoldingsPanel";
import mpesaLogo from "@/assets/branding/accounts/mpesa.png";
import kcbLogo from "@/assets/branding/accounts/kcb.png";
import imBankLogo from "@/assets/branding/accounts/im-bank.jpg";
import sbmLogo from "@/assets/branding/accounts/sbm.png";
import binanceLogo from "@/assets/branding/accounts/binance.png";
import cashLogo from "@/assets/branding/accounts/cash.png";

export const Route = createFileRoute("/_authenticated/money-center/accounts")({
  component: AccountsPage,
});

function institutionStyle(name: string) {
  const value = name.toLowerCase();
  if (/m[- ]?pesa/.test(value)) {
    return {
      iconClass: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
      panelClass: "bg-emerald-50/70 dark:bg-emerald-950/20",
      cardClass:
        "border-emerald-200/70 bg-gradient-to-br from-emerald-50/60 via-background to-background dark:border-emerald-900/40 dark:from-emerald-950/20",
      accentClass: "bg-emerald-500",
      warningThreshold: 300,
    };
  }
  if (/kcb/.test(value)) {
    return {
      iconClass: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
      panelClass: "bg-blue-50/70 dark:bg-blue-950/20",
      cardClass:
        "border-blue-200/70 bg-gradient-to-br from-blue-50/60 via-background to-background dark:border-blue-900/40 dark:from-blue-950/20",
      accentClass: "bg-blue-600",
      warningThreshold: 500,
    };
  }
  if (/i&m|im bank/.test(value)) {
    return {
      iconClass: "bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300",
      panelClass: "bg-orange-50/70 dark:bg-orange-950/20",
      cardClass:
        "border-orange-200/70 bg-gradient-to-br from-orange-50/60 via-background to-background dark:border-orange-900/40 dark:from-orange-950/20",
      accentClass: "bg-orange-500",
      warningThreshold: 500,
    };
  }
  if (/sbm/.test(value)) {
    return {
      iconClass: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300",
      panelClass: "bg-red-50/70 dark:bg-red-950/20",
      cardClass:
        "border-red-200/70 bg-gradient-to-br from-red-50/60 via-background to-background dark:border-red-900/40 dark:from-red-950/20",
      accentClass: "bg-red-600",
      warningThreshold: 500,
    };
  }
  if (/salary/.test(value)) {
    return {
      iconClass: "bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300",
      panelClass: "bg-violet-50/70 dark:bg-violet-950/20",
      cardClass:
        "border-violet-200/70 bg-gradient-to-br from-violet-50/60 via-background to-background dark:border-violet-900/40 dark:from-violet-950/20",
      accentClass: "bg-violet-600",
      warningThreshold: 500,
    };
  }
  if (/binance|crypto/.test(value)) {
    return {
      iconClass: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
      panelClass: "bg-amber-50/70 dark:bg-amber-950/20",
      cardClass:
        "border-amber-200/70 bg-gradient-to-br from-amber-50/60 via-background to-background dark:border-amber-900/40 dark:from-amber-950/20",
      accentClass: "bg-amber-500",
      warningThreshold: 1000,
    };
  }
  return {
    iconClass: "bg-primary/10 text-primary",
    panelClass: "bg-muted/40",
    cardClass: "border-border/70 bg-gradient-to-br from-muted/50 via-background to-background",
    accentClass: "bg-primary",
    warningThreshold: null,
  };
}

function accountLogo(name: string) {
  const value = name.toLowerCase();
  if (/m[- ]?pesa/.test(value)) return mpesaLogo;
  if (/kcb/.test(value)) return kcbLogo;
  if (/i&m|im bank/.test(value)) return imBankLogo;
  if (/sbm/.test(value)) return sbmLogo;
  if (/binance|crypto/.test(value)) return binanceLogo;
  if (/cash/.test(value)) return cashLogo;
  if (/salary/.test(value)) return cashLogo;
  return null;
}

function AccountsPage() {
  const [showArchived, setShowArchived] = useState(false);
  const { data: accounts = [], isLoading } = useAccounts(showArchived);
  const { data: balances = [] } = useAccountBalances();
  const archive = useArchiveAccount();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);

  const openNew = () => {
    setEditing(null);
    setOpen(true);
  };
  const openEdit = (a: Account) => {
    setEditing(a);
    setOpen(true);
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Accounts</h1>
          <p className="text-sm text-muted-foreground">
            Manage where your money lives. Balances are calculated from transactions.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Switch id="archived" checked={showArchived} onCheckedChange={setShowArchived} />
            <Label htmlFor="archived" className="text-sm">
              Show archived
            </Label>
          </div>
          <Button onClick={openNew} className="rounded-xl">
            <Plus className="h-4 w-4 mr-1" /> New Account
          </Button>
        </div>
      </header>

      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading && <div className="text-sm text-muted-foreground">Loading...</div>}
        {accounts.map((a) => {
          const bal = balances.find((b) => b.account_id === a.id);
          const balance = Number(bal?.balance ?? 0);
          const Icon = ACCOUNT_ICONS[a.icon] ?? Wallet;
          const isArchived = a.status === "archived";
          const institution = institutionStyle(a.name);
          const warningThreshold = institution.warningThreshold;
          const isLowBalance = warningThreshold !== null && balance < warningThreshold;

          return (
            <Card
              key={a.id}
              className={cn(
                "relative overflow-hidden rounded-2xl shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md",
                institution.cardClass,
                isLowBalance &&
                  "border-red-300/90 bg-gradient-to-br from-red-50/80 via-background to-background dark:border-red-900/60 dark:from-red-950/30",
              )}
            >
              <CardContent className="space-y-4 p-5 pt-6 sm:p-6 sm:pt-7">
                <div
                  className={cn(
                    "absolute inset-x-0 top-0 h-1",
                    isLowBalance ? "bg-red-600" : institution.accentClass,
                  )}
                />
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "grid h-14 w-14 place-items-center rounded-2xl border border-white/80 bg-white/80 shadow-sm ring-4 ring-background/80 dark:border-white/10 dark:bg-background/60",
                        isLowBalance
                          ? "bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400"
                          : institution.iconClass,
                      )}
                    >
                      {accountLogo(a.name) ? (
                        <img
                          src={accountLogo(a.name)!}
                          alt={`${a.name} logo`}
                          className="h-10 w-10 rounded-lg object-contain drop-shadow-sm"
                          loading="lazy"
                        />
                      ) : (
                        <Icon className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium">{a.name}</div>
                      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                        {a.type.replace("_", " ")} · {a.currency}
                      </div>
                    </div>
                  </div>
                  {isArchived && <Badge variant="secondary">Archived</Badge>}
                </div>
                <div
                  className={cn(
                    "rounded-xl px-3 py-2.5",
                    isLowBalance ? "bg-red-50/70 dark:bg-red-950/20" : institution.panelClass,
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xs text-muted-foreground">Current Balance</div>
                    {isLowBalance && (
                      <CircleAlert
                        className="h-3.5 w-3.5 text-red-500/80"
                        aria-label="Low balance"
                      />
                    )}
                  </div>
                  <div
                    className={cn(
                      "text-2xl font-semibold tracking-tight",
                      isLowBalance && "text-red-600/90 dark:text-red-400/90",
                    )}
                  >
                    {formatMoney(balance, a.currency)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Opening: {formatMoney(a.opening_balance, a.currency)}
                  </div>
                  {isLowBalance && (
                    <div className="mt-1 text-[11px] text-red-600/75 dark:text-red-400/75">
                      Below your {formatMoney(warningThreshold!, a.currency)} comfort level
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEdit(a)}
                    className="flex-1 rounded-lg"
                  >
                    <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => archive.mutate({ id: a.id, archived: !isArchived })}
                    className="flex-1 rounded-lg"
                  >
                    {isArchived ? (
                      <>
                        <ArchiveRestore className="h-3.5 w-3.5 mr-1" /> Restore
                      </>
                    ) : (
                      <>
                        <Archive className="h-3.5 w-3.5 mr-1" /> Archive
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <CryptoHoldingsPanel />

      <AccountFormDialog open={open} onOpenChange={setOpen} account={editing} />
    </div>
  );
}
