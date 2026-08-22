import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAccountBalances, useAccounts, useArchiveAccount, type Account } from "@/lib/money/api";
import { ACCOUNT_ICONS } from "@/lib/money/constants";
import { formatMoney } from "@/lib/money/format";
import { getAccountThemeId } from "@/lib/money/account-theme";
import { AccountFormDialog } from "@/components/money/AccountFormDialog";
import { Archive, ArchiveRestore, Pencil, Plus, Wallet, CircleAlert } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { CryptoHoldingsPanel } from "@/components/money/CryptoHoldingsPanel";
import { getAccountLogo } from "@/lib/money/account-branding";

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

function accountTheme(name: string) {
  const id = getAccountThemeId(name);
  const threshold =
    id === "mpesa" || id === "airtel" || id === "cash"
      ? LOW_BALANCE_THRESHOLDS.mobileMoney
      : id === "salary"
        ? LOW_BALANCE_THRESHOLDS.salary
        : id === "binance"
          ? LOW_BALANCE_THRESHOLDS.crypto
          : id === "default"
            ? null
            : LOW_BALANCE_THRESHOLDS.bank;
  return { id, threshold };
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
          const institution = accountTheme(a.name);
          const warningThreshold = institution.threshold;
          const isLowBalance = warningThreshold !== null && balance < warningThreshold;

          return (
            <Card
              key={a.id}
              data-account-theme={institution.id}
              data-account-warning={isLowBalance ? "true" : "false"}
              className={cn(
                "relative overflow-hidden rounded-2xl shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md",
                "money-account-card",
                isLowBalance && "money-account-card--warning",
              )}
            >
              <CardContent className="money-account-card__content space-y-4 p-5 pt-6 sm:p-6 sm:pt-7">
                <div className="money-account-card__glow" aria-hidden="true" />
                {getAccountLogo(a.name) && (
                  <img
                    src={getAccountLogo(a.name)!}
                    alt=""
                    aria-hidden="true"
                    className="money-account-card__watermark"
                  />
                )}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "money-account-card__logo grid h-16 w-16 place-items-center rounded-2xl border shadow-md sm:h-[4.5rem] sm:w-[4.5rem]",
                        isLowBalance && "money-account-card__logo--warning",
                      )}
                    >
                      {getAccountLogo(a.name) ? (
                        <img
                          src={getAccountLogo(a.name)!}
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
                <div className={cn("rounded-xl px-3 py-2.5", "money-account-card__balance")}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xs text-muted-foreground">Current Balance</div>
                    {isLowBalance && (
                      <CircleAlert
                        className="money-account-card__warning-icon h-3.5 w-3.5"
                        aria-label="Low balance"
                      />
                    )}
                  </div>
                  <div
                    className={cn(
                      "money-account-card__amount text-2xl font-semibold tracking-tight",
                      isLowBalance && "money-account-card__amount--warning",
                    )}
                  >
                    {formatMoney(balance, a.currency)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Opening: {formatMoney(a.opening_balance, a.currency)}
                  </div>
                  {isLowBalance && (
                    <div className="money-account-card__warning mt-1 text-[11px]">
                      Below your {formatMoney(warningThreshold!, a.currency)} comfort level
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEdit(a)}
                    className="money-account-card__action flex-1 rounded-lg"
                  >
                    <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => archive.mutate({ id: a.id, archived: !isArchived })}
                    className="money-account-card__action flex-1 rounded-lg"
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
