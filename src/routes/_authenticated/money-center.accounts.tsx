import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQueryClient } from "@tanstack/react-query";
import { useAccountBalances, useAccounts, useArchiveAccount, type Account } from "@/lib/money/api";
import { ACCOUNT_ICONS } from "@/lib/money/constants";
import { formatMoney } from "@/lib/money/format";
import { ensureMpesaFulizaCharges } from "@/lib/money/fuliza-ensure";
import { isMpesaAccountName, fulizaDailyFee, overdraftAmount } from "@/lib/money/fuliza";
import { AccountFormDialog } from "@/components/money/AccountFormDialog";
import { Archive, ArchiveRestore, Pencil, Plus, Wallet, CircleAlert } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { CryptoHoldingsPanel } from "@/components/money/CryptoHoldingsPanel";
import { useBalanceVisibility } from "@/components/money/BalanceVisibility";
import {
  getAccountLogo,
  getInstitutionStyle,
} from "@/lib/money/institution-branding";

export const Route = createFileRoute("/_authenticated/money-center/accounts")({
  component: AccountsPage,
});

function AccountsPage() {
  const { maskBalance } = useBalanceVisibility();
  const displayMoney = (value: number | string | null | undefined, currency = "KES") =>
    maskBalance(formatMoney(value, currency));
  const qc = useQueryClient();
  const [showArchived, setShowArchived] = useState(false);
  const { data: accounts = [], isLoading } = useAccounts(showArchived);
  const { data: balances = [] } = useAccountBalances();
  const archive = useArchiveAccount();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);

  // M-Pesa card only: post Fuliza access + daily fees while balance < 0
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const { posted } = await ensureMpesaFulizaCharges();
        if (!cancelled && posted > 0) {
          void qc.invalidateQueries({ queryKey: ["account_balances"] });
          void qc.invalidateQueries({ queryKey: ["transactions"] });
        }
      } catch {
        /* non-blocking */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [qc, accounts.length, balances]);

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
          const institution = getInstitutionStyle(a.name);
          const logo = getAccountLogo(a.name);
          const warningThreshold = institution.warningThreshold;
          const isMpesa = isMpesaAccountName(a.name);
          const isOverdrawn = isMpesa && balance < 0;
          const isLowBalance =
            !isOverdrawn && warningThreshold !== null && balance < warningThreshold;
          const dailyFuliza = isOverdrawn ? fulizaDailyFee(overdraftAmount(balance)) : 0;

          return (
            <Card
              key={a.id}
              className={cn(
                "institution-card relative min-w-0 overflow-hidden rounded-2xl shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md",
                institution.cardClass,
                `institution-card-${institution.key}`,
                (isLowBalance || isOverdrawn) && "institution-card-low",
                (isLowBalance || isOverdrawn) &&
                  "border-red-400/90 bg-gradient-to-br from-red-200/95 via-red-100/80 to-red-50/70 dark:border-red-800/70 dark:from-red-950/70 dark:via-red-950/45 dark:to-background",
              )}
            >
              {logo ? (
                <img
                  src={logo}
                  alt=""
                  aria-hidden="true"
                  className="institution-card-watermark pointer-events-none absolute inset-y-0 right-[-3rem] z-0 h-full w-3/4 object-contain opacity-[0.16]"
                  loading="lazy"
                />
              ) : (
                <div
                  className="institution-card-watermark pointer-events-none absolute inset-y-0 right-[-2rem] z-0 grid w-3/4 place-items-center opacity-[0.12]"
                  aria-hidden="true"
                >
                  <Icon className="h-40 w-40" strokeWidth={1} />
                </div>
              )}
              <CardContent className="institution-card-content relative z-10 space-y-4 p-5 pt-6 text-slate-100 sm:p-6 sm:pt-7">
                <div
                  className={cn(
                    "absolute inset-x-0 top-0 h-1",
                    isLowBalance || isOverdrawn ? "bg-red-600" : institution.accentClass,
                  )}
                />
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "institution-logo-tile grid h-16 w-16 place-items-center rounded-2xl border border-white/35 bg-white/95 shadow-lg ring-4 ring-white/10",
                        isLowBalance || isOverdrawn
                          ? "bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400"
                          : institution.iconClass,
                      )}
                    >
                      {logo ? (
                        <img
                          src={logo}
                          alt={`${a.name} logo`}
                          className="h-12 w-12 rounded-xl object-contain drop-shadow-md"
                          loading="lazy"
                        />
                      ) : (
                        <span className="text-sm font-bold tracking-wide">{institution.initials}</span>
                      )}
                    </div>
                    <div>
                      <div className="font-medium">{a.name}</div>
                      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                        {a.type.replace("_", " ")} · {a.currency}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {isOverdrawn && (
                      <Badge className="bg-red-600 text-white hover:bg-red-600">Fuliza</Badge>
                    )}
                    {isArchived && <Badge variant="secondary">Archived</Badge>}
                  </div>
                </div>
                <div
                  className={cn(
                    "institution-card-balance rounded-xl px-3 py-2.5",
                    isLowBalance || isOverdrawn
                      ? "bg-red-50/70 dark:bg-red-950/20"
                      : institution.panelClass,
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xs text-muted-foreground">Current Balance</div>
                    {(isLowBalance || isOverdrawn) && (
                      <CircleAlert
                        className="h-3.5 w-3.5 text-red-500/80"
                        aria-label={isOverdrawn ? "Fuliza overdraft" : "Low balance"}
                      />
                    )}
                  </div>
                  <div
                    className={cn(
                      "text-2xl font-semibold tracking-tight",
                      (isLowBalance || isOverdrawn) && "text-red-600/90 dark:text-red-400/90",
                    )}
                  >
                    {displayMoney(balance, a.currency)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Opening: {displayMoney(a.opening_balance, a.currency)}
                  </div>
                  {isOverdrawn && (
                    <div className="mt-1 space-y-0.5 text-[11px] text-red-600/80 dark:text-red-400/80">
                      <div className="font-medium">Fuliza overdraft active</div>
                      <div>
                        Access fee 1% + daily{" "}
                        {displayMoney(dailyFuliza, a.currency)} while below KES 0
                      </div>
                    </div>
                  )}
                  {isLowBalance && (
                    <div className="mt-1 text-[11px] text-red-600/75 dark:text-red-400/75">
                      Below your {displayMoney(warningThreshold!, a.currency)} comfort level
                    </div>
                  )}
                </div>
                <div className="institution-card-actions flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEdit(a)}
                    className={cn(
                      "institution-card-action flex-1 rounded-lg",
                      institution.actionClass,
                    )}
                  >
                    <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => archive.mutate({ id: a.id, archived: !isArchived })}
                    className={cn(
                      "institution-card-action flex-1 rounded-lg",
                      institution.actionClass,
                    )}
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
