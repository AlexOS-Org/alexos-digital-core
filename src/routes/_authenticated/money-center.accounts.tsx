import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlexOSEmptyState } from "@/components/alexos/states";
import { AlexOSPageHeader } from "@/components/alexos/page-header";
import { AlexOSStatusBadge } from "@/components/alexos/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
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
import { getAccountLogo, getInstitutionStyle } from "@/lib/money/institution-branding";
import { BINANCE_WITHDRAWAL_MINIMUM_KES, useLiveBinanceBalance } from "@/lib/money/crypto-prices";

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
  const liveBinance = useLiveBinanceBalance();
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
      <AlexOSPageHeader
        title="Accounts"
        description="Manage where your money lives. Balances are calculated from transactions."
        breadcrumbs={[{ label: "Money Center", to: "/money-center" }, { label: "Accounts" }]}
        actions={
          <>
            <div className="flex items-center gap-2">
              <Switch id="archived" checked={showArchived} onCheckedChange={setShowArchived} />
              <Label htmlFor="archived" className="text-sm">
                Show archived
              </Label>
            </div>
            <Button onClick={openNew}>
              <Plus aria-hidden="true" /> New Account
            </Button>
          </>
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-56 w-full rounded-xl" />
          ))}
        </div>
      ) : accounts.length === 0 ? (
        <AlexOSEmptyState
          title={showArchived ? "No accounts yet" : "No accounts found"}
          description={
            showArchived
              ? "Add the bank, wallet or cash account you want AlexOS to track. Balances are then calculated from your transactions."
              : "Every account is archived. Turn on “Show archived” to review them, or add a new account to start tracking."
          }
          action={
            <Button onClick={openNew}>
              <Plus aria-hidden="true" /> New Account
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map((a) => {
            const bal = balances.find((b) => b.account_id === a.id);
            const storedBalance = Number(bal?.balance ?? 0);
            const isBinance = /binance|crypto/i.test(a.name);
            const balance = isBinance ? (liveBinance.balance ?? storedBalance) : storedBalance;
            const Icon = ACCOUNT_ICONS[a.icon] ?? Wallet;
            const isArchived = a.status === "archived";
            const institution = getInstitutionStyle(a.name);
            const logo = getAccountLogo(a.name);
            const warningThreshold = institution.warningThreshold;
            const isMpesa = isMpesaAccountName(a.name);
            const isOverdrawn = isMpesa && balance < 0;
            const isLowBalance = isBinance
              ? balance <= BINANCE_WITHDRAWAL_MINIMUM_KES
              : !isOverdrawn && warningThreshold !== null && balance < warningThreshold;
            const dailyFuliza = isOverdrawn ? fulizaDailyFee(overdraftAmount(balance)) : 0;
            const needsAttention = isLowBalance || isOverdrawn;

            return (
              <Card
                key={a.id}
                data-tone={needsAttention ? (isOverdrawn ? "expense" : "warning") : undefined}
                className={cn(
                  "institution-card relative min-w-0 overflow-hidden shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md",
                  institution.cardClass,
                  `institution-card-${institution.key}`,
                  needsAttention && "institution-card-low",
                )}
              >
                {logo ? (
                  <img
                    src={logo}
                    alt=""
                    aria-hidden="true"
                    className="institution-card-watermark pointer-events-none absolute inset-y-0 right-[-3rem] z-0 h-full w-3/4 object-contain opacity-[0.08]"
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
                <CardContent className="institution-card-content relative z-10 space-y-4 p-5 pt-6 sm:p-6 sm:pt-7">
                  <div
                    className={cn(
                      "absolute inset-x-0 top-0 h-1",
                      needsAttention ? "alexos-tone-rule" : institution.accentClass,
                    )}
                  />
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "institution-logo-tile grid size-14 shrink-0 place-items-center rounded-xl border border-white/35 bg-white/95 shadow-lg ring-4 ring-white/10",
                          needsAttention
                            ? "alexos-tone-bg alexos-tone-text"
                            : institution.iconClass,
                        )}
                      >
                        {logo ? (
                          <img
                            src={logo}
                            alt={`${a.name} logo`}
                            className="size-11 rounded-lg object-contain drop-shadow-md"
                            loading="lazy"
                          />
                        ) : (
                          <span className="text-sm font-bold tracking-wide">
                            {institution.initials}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate font-medium">{a.name}</div>
                        <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                          {a.type.replace("_", " ")} · {a.currency}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {isOverdrawn ? <AlexOSStatusBadge status="fuliza" tone="expense" /> : null}
                      {isLowBalance ? (
                        <AlexOSStatusBadge
                          status="low_balance"
                          tone="warning"
                          label="Low balance"
                        />
                      ) : null}
                      {isArchived ? <AlexOSStatusBadge status="archived" /> : null}
                    </div>
                  </div>
                  <div
                    className={cn(
                      "institution-card-balance rounded-lg px-3 py-2.5",
                      needsAttention ? "alexos-tone-bg" : institution.panelClass,
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-xs text-muted-foreground">Current Balance</div>
                      {needsAttention ? (
                        <CircleAlert
                          className="alexos-tone-text size-3.5"
                          aria-label={isOverdrawn ? "Fuliza overdraft" : "Low balance"}
                        />
                      ) : null}
                    </div>
                    <div
                      className={cn(
                        "alexos-amount text-2xl tracking-tight",
                        needsAttention && "alexos-tone-text",
                      )}
                    >
                      {displayMoney(balance, a.currency)}
                    </div>
                    <div className="alexos-num mt-1 text-xs text-muted-foreground">
                      Opening: {displayMoney(a.opening_balance, a.currency)}
                    </div>
                    {isOverdrawn && (
                      <div className="alexos-tone-text mt-1 space-y-0.5 text-[11px]">
                        <div className="font-medium">Fuliza overdraft active</div>
                        <div>
                          Access fee 1% + daily {displayMoney(dailyFuliza, a.currency)} while below
                          KES 0
                        </div>
                      </div>
                    )}
                    {isLowBalance && (
                      <div className="alexos-tone-text mt-1 text-[11px]">
                        {isBinance
                          ? `Withdrawals unlock above ${displayMoney(BINANCE_WITHDRAWAL_MINIMUM_KES, "KES")}`
                          : `Below your ${displayMoney(warningThreshold!, a.currency)} comfort level`}
                      </div>
                    )}
                    {isBinance && !isLowBalance && (
                      <div data-tone="income" className="alexos-tone-text mt-1 text-[11px]">
                        Withdrawable balance · above{" "}
                        {displayMoney(BINANCE_WITHDRAWAL_MINIMUM_KES, "KES")}
                      </div>
                    )}
                  </div>
                  <div className="institution-card-actions flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEdit(a)}
                      className={cn("institution-card-action flex-1", institution.actionClass)}
                    >
                      <Pencil aria-hidden="true" /> Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => archive.mutate({ id: a.id, archived: !isArchived })}
                      className={cn("institution-card-action flex-1", institution.actionClass)}
                    >
                      {isArchived ? (
                        <>
                          <ArchiveRestore aria-hidden="true" /> Restore
                        </>
                      ) : (
                        <>
                          <Archive aria-hidden="true" /> Archive
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <CryptoHoldingsPanel />

      <AccountFormDialog open={open} onOpenChange={setOpen} account={editing} />
    </div>
  );
}
