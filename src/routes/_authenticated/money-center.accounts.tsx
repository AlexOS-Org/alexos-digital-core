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

const LOW_BALANCE_THRESHOLDS = {
  mobileMoney: 500,
  bank: 1000,
  salary: 5000,
  crypto: 1000,
  cash: 500,
} as const;

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
        "border-emerald-300/80 bg-gradient-to-br from-emerald-200/90 via-emerald-100/70 to-emerald-50/60 dark:border-emerald-800/60 dark:from-emerald-950/60 dark:via-emerald-950/35 dark:to-background",
      actionClass:
        "border-emerald-300/70 bg-white/70 hover:bg-emerald-50 dark:border-emerald-800/70 dark:bg-background/50",
      accentClass: "bg-emerald-500",
      warningThreshold: LOW_BALANCE_THRESHOLDS.mobileMoney,
    };
  }
  if (/kcb/.test(value)) {
    return {
      iconClass: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
      panelClass: "bg-blue-50/70 dark:bg-blue-950/20",
      cardClass:
        "border-blue-300/80 bg-gradient-to-br from-blue-200/90 via-blue-100/70 to-blue-50/60 dark:border-blue-800/60 dark:from-blue-950/60 dark:via-blue-950/35 dark:to-background",
      actionClass:
        "border-blue-300/70 bg-white/70 hover:bg-blue-50 dark:border-blue-800/70 dark:bg-background/50",
      accentClass: "bg-blue-600",
      warningThreshold: LOW_BALANCE_THRESHOLDS.bank,
    };
  }
  if (/i&m|im bank/.test(value)) {
    return {
      iconClass: "bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300",
      panelClass: "bg-orange-50/70 dark:bg-orange-950/20",
      cardClass:
        "border-orange-300/80 bg-gradient-to-br from-orange-200/90 via-orange-100/70 to-orange-50/60 dark:border-orange-800/60 dark:from-orange-950/60 dark:via-orange-950/35 dark:to-background",
      actionClass:
        "border-orange-300/70 bg-white/70 hover:bg-orange-50 dark:border-orange-800/70 dark:bg-background/50",
      accentClass: "bg-orange-500",
      warningThreshold: LOW_BALANCE_THRESHOLDS.bank,
    };
  }
  if (/sbm/.test(value)) {
    return {
      iconClass: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300",
      panelClass: "bg-red-50/70 dark:bg-red-950/20",
      cardClass:
        "border-red-300/80 bg-gradient-to-br from-red-200/90 via-red-100/70 to-red-50/60 dark:border-red-800/60 dark:from-red-950/60 dark:via-red-950/35 dark:to-background",
      actionClass:
        "border-red-300/70 bg-white/70 hover:bg-red-50 dark:border-red-800/70 dark:bg-background/50",
      accentClass: "bg-red-600",
      warningThreshold: LOW_BALANCE_THRESHOLDS.bank,
    };
  }
  if (/equity/.test(value)) {
    return {
      iconClass: "bg-lime-100 text-lime-800 dark:bg-lime-950/40 dark:text-lime-300",
      panelClass: "bg-lime-50/70 dark:bg-lime-950/20",
      cardClass:
        "border-lime-300/80 bg-gradient-to-br from-lime-200/90 via-lime-100/70 to-lime-50/60 dark:border-lime-800/60 dark:from-lime-950/60 dark:via-lime-950/35 dark:to-background",
      actionClass:
        "border-lime-300/70 bg-white/70 hover:bg-lime-50 dark:border-lime-800/70 dark:bg-background/50",
      accentClass: "bg-lime-600",
      warningThreshold: LOW_BALANCE_THRESHOLDS.bank,
    };
  }
  if (/co[- ]?operative|co-op|coop/.test(value)) {
    return {
      iconClass: "bg-teal-100 text-teal-800 dark:bg-teal-950/40 dark:text-teal-300",
      panelClass: "bg-teal-50/70 dark:bg-teal-950/20",
      cardClass:
        "border-teal-300/80 bg-gradient-to-br from-teal-200/90 via-teal-100/70 to-teal-50/60 dark:border-teal-800/60 dark:from-teal-950/60 dark:via-teal-950/35 dark:to-background",
      actionClass:
        "border-teal-300/70 bg-white/70 hover:bg-teal-50 dark:border-teal-800/70 dark:bg-background/50",
      accentClass: "bg-teal-600",
      warningThreshold: LOW_BALANCE_THRESHOLDS.bank,
    };
  }
  if (/ncba/.test(value)) {
    return {
      iconClass: "bg-sky-100 text-sky-800 dark:bg-sky-950/40 dark:text-sky-300",
      panelClass: "bg-sky-50/70 dark:bg-sky-950/20",
      cardClass:
        "border-sky-300/80 bg-gradient-to-br from-sky-200/90 via-sky-100/70 to-sky-50/60 dark:border-sky-800/60 dark:from-sky-950/60 dark:via-sky-950/35 dark:to-background",
      actionClass:
        "border-sky-300/70 bg-white/70 hover:bg-sky-50 dark:border-sky-800/70 dark:bg-background/50",
      accentClass: "bg-sky-600",
      warningThreshold: LOW_BALANCE_THRESHOLDS.bank,
    };
  }
  if (/absa/.test(value)) {
    return {
      iconClass: "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300",
      panelClass: "bg-rose-50/70 dark:bg-rose-950/20",
      cardClass:
        "border-rose-300/80 bg-gradient-to-br from-rose-200/90 via-rose-100/70 to-rose-50/60 dark:border-rose-800/60 dark:from-rose-950/60 dark:via-rose-950/35 dark:to-background",
      actionClass:
        "border-rose-300/70 bg-white/70 hover:bg-rose-50 dark:border-rose-800/70 dark:bg-background/50",
      accentClass: "bg-rose-600",
      warningThreshold: LOW_BALANCE_THRESHOLDS.bank,
    };
  }
  if (/stanbic/.test(value)) {
    return {
      iconClass: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300",
      panelClass: "bg-indigo-50/70 dark:bg-indigo-950/20",
      cardClass:
        "border-indigo-300/80 bg-gradient-to-br from-indigo-200/90 via-indigo-100/70 to-indigo-50/60 dark:border-indigo-800/60 dark:from-indigo-950/60 dark:via-indigo-950/35 dark:to-background",
      actionClass:
        "border-indigo-300/70 bg-white/70 hover:bg-indigo-50 dark:border-indigo-800/70 dark:bg-background/50",
      accentClass: "bg-indigo-600",
      warningThreshold: LOW_BALANCE_THRESHOLDS.bank,
    };
  }
  if (/family bank/.test(value)) {
    return {
      iconClass: "bg-cyan-100 text-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-300",
      panelClass: "bg-cyan-50/70 dark:bg-cyan-950/20",
      cardClass:
        "border-cyan-300/80 bg-gradient-to-br from-cyan-200/90 via-cyan-100/70 to-cyan-50/60 dark:border-cyan-800/60 dark:from-cyan-950/60 dark:via-cyan-950/35 dark:to-background",
      actionClass:
        "border-cyan-300/70 bg-white/70 hover:bg-cyan-50 dark:border-cyan-800/70 dark:bg-background/50",
      accentClass: "bg-cyan-600",
      warningThreshold: LOW_BALANCE_THRESHOLDS.bank,
    };
  }
  if (/airtel/.test(value)) {
    return {
      iconClass: "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300",
      panelClass: "bg-red-50/70 dark:bg-red-950/20",
      cardClass:
        "border-red-300/80 bg-gradient-to-br from-red-200/90 via-red-100/70 to-red-50/60 dark:border-red-800/60 dark:from-red-950/60 dark:via-red-950/35 dark:to-background",
      actionClass:
        "border-red-300/70 bg-white/70 hover:bg-red-50 dark:border-red-800/70 dark:bg-background/50",
      accentClass: "bg-red-600",
      warningThreshold: LOW_BALANCE_THRESHOLDS.mobileMoney,
    };
  }
  if (/salary/.test(value)) {
    return {
      iconClass: "bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300",
      panelClass: "bg-violet-50/70 dark:bg-violet-950/20",
      cardClass:
        "border-violet-300/80 bg-gradient-to-br from-violet-200/90 via-violet-100/70 to-violet-50/60 dark:border-violet-800/60 dark:from-violet-950/60 dark:via-violet-950/35 dark:to-background",
      actionClass:
        "border-violet-300/70 bg-white/70 hover:bg-violet-50 dark:border-violet-800/70 dark:bg-background/50",
      accentClass: "bg-violet-600",
      warningThreshold: LOW_BALANCE_THRESHOLDS.salary,
    };
  }
  if (/binance|crypto/.test(value)) {
    return {
      iconClass: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
      panelClass: "bg-amber-50/70 dark:bg-amber-950/20",
      cardClass:
        "border-amber-300/80 bg-gradient-to-br from-amber-200/90 via-amber-100/70 to-amber-50/60 dark:border-amber-800/60 dark:from-amber-950/60 dark:via-amber-950/35 dark:to-background",
      actionClass:
        "border-amber-300/70 bg-white/70 hover:bg-amber-50 dark:border-amber-800/70 dark:bg-background/50",
      accentClass: "bg-amber-500",
      warningThreshold: LOW_BALANCE_THRESHOLDS.crypto,
    };
  }
  return {
    iconClass: "bg-primary/10 text-primary",
    panelClass: "bg-muted/40",
    cardClass:
      "border-slate-300/80 bg-gradient-to-br from-slate-200/80 via-slate-100/60 to-background dark:border-slate-700/70 dark:from-slate-900/60 dark:via-slate-900/30 dark:to-background",
    actionClass:
      "border-slate-300/70 bg-white/70 hover:bg-slate-50 dark:border-slate-700/70 dark:bg-background/50",
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
                  "border-red-400/90 bg-gradient-to-br from-red-200/95 via-red-100/80 to-red-50/70 dark:border-red-800/70 dark:from-red-950/70 dark:via-red-950/45 dark:to-background",
              )}
            >
              <CardContent className="space-y-4 p-5 pt-6 text-slate-900 sm:p-6 sm:pt-7 dark:text-slate-100">
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
                        "grid h-16 w-16 place-items-center rounded-2xl border-2 border-white/90 bg-white/90 shadow-md ring-4 ring-white/40 dark:border-white/15 dark:bg-background/70 dark:ring-background/40",
                        isLowBalance
                          ? "bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400"
                          : institution.iconClass,
                      )}
                    >
                      {accountLogo(a.name) ? (
                        <img
                          src={accountLogo(a.name)!}
                          alt={`${a.name} logo`}
                          className="h-12 w-12 rounded-xl object-contain drop-shadow-md"
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
                    className={cn("flex-1 rounded-lg", institution.actionClass)}
                  >
                    <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => archive.mutate({ id: a.id, archived: !isArchived })}
                    className={cn("flex-1 rounded-lg", institution.actionClass)}
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
