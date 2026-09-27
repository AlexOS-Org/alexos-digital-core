import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlexOSEmptyState } from "@/components/alexos/states";
import { AlexOSFormField } from "@/components/alexos/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Link } from "@tanstack/react-router";
import {
  ArrowDownToLine,
  BellRing,
  CheckCircle2,
  HeartHandshake,
  PiggyBank,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { formatMoney } from "@/lib/money/format";
import { isSavingsEligibleIncome } from "@/lib/money/constants";
import { calculateTithe } from "@/lib/money/tithe-calculations";
import {
  useAccountBalances,
  useAccounts,
  useSaveTransaction,
  useTransactions,
} from "@/lib/money/api";

const ALLOCATION_RATE = 0.1;

function dayWindow() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return { from: start.toISOString(), toExclusive: end.toISOString() };
}

export function MoneyAllocationPanel() {
  const window = dayWindow();
  const { data: transactions = [] } = useTransactions(window);
  const { data: accounts = [] } = useAccounts();
  const { data: balances = [] } = useAccountBalances();
  const save = useSaveTransaction();
  const [titheAccountId, setTitheAccountId] = useState("");
  const [savingsAccountId, setSavingsAccountId] = useState("");
  const [approvedTitheKeys, setApprovedTitheKeys] = useState<string[]>([]);
  const [approvedSavingsKeys, setApprovedSavingsKeys] = useState<string[]>([]);
  const emergencyAccount = accounts.find(
    (account) =>
      /emergency fund/i.test(account.name) &&
      (account.financial_scope ?? "personal") !== "business",
  );
  const emergencyBalance = Number(
    balances.find((balance) => balance.account_id === emergencyAccount?.id)?.balance ?? 0,
  );

  const metrics = useMemo(() => {
    const posted = transactions.filter((transaction) => transaction.status === "posted");
    const titheCalculation = calculateTithe(
      posted.map((transaction) => ({
        ...transaction,
        currency: accounts.find((account) => account.id === transaction.account_id)?.currency,
      })),
    );
    const eligiblePersonalReceipts = posted
      .filter(
        (transaction) =>
          transaction.type === "income" &&
          transaction.financial_scope !== "business" &&
          isSavingsEligibleIncome(transaction),
      )
      .reduce((total, transaction) => total + Number(transaction.amount), 0);
    return {
      titheCalculation,
      savingsSuggestion: eligiblePersonalReceipts * ALLOCATION_RATE,
    };
  }, [transactions, accounts]);

  const availableAccounts = accounts.filter((account) => account.id !== emergencyAccount?.id);
  const personalSavingsAccounts = availableAccounts.filter(
    (account) => account.financial_scope !== "business",
  );
  const selectedSavingsAccount = personalSavingsAccounts.find(
    (account) => account.id === savingsAccountId,
  );
  const selectedTitheAccount = availableAccounts.find((account) => account.id === titheAccountId);
  const balanceFor = (id: string) =>
    Number(balances.find((balance) => balance.account_id === id)?.balance ?? 0);
  const titheTotal = metrics.titheCalculation.total ?? 0;
  const titheUnavailable =
    metrics.titheCalculation.unavailableReason !== null &&
    metrics.titheCalculation.currencies.length > 0;
  const titheKey = `${window.from}:tithe:${titheTotal.toFixed(2)}`;
  const savingsKey = `${window.from}:savings:${metrics.savingsSuggestion.toFixed(2)}`;

  const approveTithe = async () => {
    if (!selectedTitheAccount || titheTotal <= 0) return;
    if (balanceFor(selectedTitheAccount.id) < titheTotal) {
      toast.error(
        "The selected account does not have enough available balance for this tithe suggestion.",
      );
      return;
    }
    await save.mutateAsync({
      type: "expense",
      occurred_at: new Date().toISOString(),
      account_id: selectedTitheAccount.id,
      amount: titheTotal,
      category: "Tithe",
      expense_type: "other",
      financial_scope: selectedTitheAccount.financial_scope ?? "personal",
      business_id: selectedTitheAccount.business_id ?? null,
      source: "Approved tithe suggestion",
      description: `Approved 10% tithe on posted non-gift receipts: ${formatMoney(titheTotal, metrics.titheCalculation.currency ?? undefined)}`,
      reference: titheReference,
    });
    setApprovedTitheKeys((keys) => [...keys, titheKey]);
  };

  const approveSavings = async () => {
    if (!emergencyAccount || !selectedSavingsAccount || metrics.savingsSuggestion <= 0) return;
    if (balanceFor(selectedSavingsAccount.id) < metrics.savingsSuggestion) {
      toast.error(
        "The selected account does not have enough available balance for this savings suggestion.",
      );
      return;
    }
    await save.mutateAsync({
      type: "transfer",
      occurred_at: new Date().toISOString(),
      account_id: selectedSavingsAccount.id,
      transfer_account_id: emergencyAccount.id,
      amount: metrics.savingsSuggestion,
      financial_scope: "personal",
      source: "Approved emergency-fund suggestion",
      description: "Approved 10% personal receipt transfer to Emergency Fund",
      reference: savingsReference,
    });
    setApprovedSavingsKeys((keys) => [...keys, savingsKey]);
  };

  const titheReference = `TITHE:${new Date().toISOString().slice(0, 10)}`;
  const savingsReference = `EMERGENCY:${new Date().toISOString().slice(0, 10)}`;
  const titheAlreadyPosted = transactions.some(
    (transaction) => transaction.reference === titheReference,
  );
  const savingsAlreadyPosted = transactions.some(
    (transaction) => transaction.reference === savingsReference,
  );
  const titheApproved = titheAlreadyPosted || approvedTitheKeys.includes(titheKey);
  const savingsApproved = savingsAlreadyPosted || approvedSavingsKeys.includes(savingsKey);

  return (
    <Card className="border-border/60">
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <span data-tone="warning" className="alexos-tone-text">
              <BellRing aria-hidden="true" className="size-4" />
            </span>
            Daily allocation review
          </CardTitle>
          <CardDescription>
            Suggestions are calculated from posted transactions today. Nothing moves until you
            approve it.
          </CardDescription>
        </div>
        <span data-tone="income" className="alexos-tone-text shrink-0">
          <ShieldCheck aria-label="Approval required" className="size-5" />
        </span>
      </CardHeader>
      <CardContent className="grid gap-4 lg:grid-cols-2">
        <section data-tone="debt" className="alexos-tone-bg space-y-3 rounded-xl border p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="alexos-metric-label">Tithe due</p>
              <p className="alexos-amount mt-1 text-2xl">
                {titheUnavailable
                  ? "Unavailable"
                  : formatMoney(titheTotal, metrics.titheCalculation.currency ?? undefined)}
              </p>
            </div>
            <span className="alexos-tone-text shrink-0">
              <HeartHandshake aria-hidden="true" className="size-6" />
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            10% of today’s posted non-gift income receipts. Gifts, loans, and transfers are
            excluded; nothing moves until you approve it.
          </p>
          {titheUnavailable ? (
            <p
              data-tone="warning"
              className="alexos-tone-bg alexos-tone-border alexos-tone-text rounded-lg border px-3 py-2 text-xs"
            >
              Tithe is unavailable because eligible receipts have{" "}
              {metrics.titheCalculation.unavailableReason === "mixed_currency"
                ? "multiple currencies"
                : "an unknown currency"}
              .
            </p>
          ) : null}
          {titheTotal > 0 && !titheUnavailable && !titheApproved ? (
            <>
              <AlexOSFormField label="Pay tithe from" required>
                {({ id, describedBy }) => (
                  <Select value={titheAccountId} onValueChange={setTitheAccountId}>
                    <SelectTrigger id={id} aria-describedby={describedBy}>
                      <SelectValue placeholder="Select personal or business account" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableAccounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </AlexOSFormField>
              <Button
                className="w-full"
                onClick={approveTithe}
                disabled={save.isPending || !titheAccountId}
              >
                <CheckCircle2 aria-hidden="true" /> Approve tithe payment
              </Button>
            </>
          ) : titheApproved ? (
            <p
              data-tone="income"
              className="alexos-tone-bg alexos-tone-text flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium"
            >
              <CheckCircle2 aria-hidden="true" className="size-4" /> Approved and posted once.
            </p>
          ) : (
            <AlexOSEmptyState
              compact
              title="No tithe suggestion due today"
              description="Nothing eligible was posted today. The 10% suggestion appears as soon as qualifying income lands."
            />
          )}
        </section>

        <section data-tone="income" className="alexos-tone-bg space-y-3 rounded-xl border p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="alexos-metric-label">Emergency Fund suggestion</p>
              <p className="alexos-amount mt-1 text-2xl">
                {formatMoney(metrics.savingsSuggestion)}
              </p>
            </div>
            <span className="alexos-tone-text shrink-0">
              <PiggyBank aria-hidden="true" className="size-6" />
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Starter rule: 10% of today’s confirmed personal receipts. Current reserve balance:{" "}
            <span className="alexos-num">{formatMoney(emergencyBalance)}</span>
          </p>
          {!emergencyAccount ? (
            <AlexOSEmptyState
              compact
              variant="not-configured"
              title="No Emergency Fund account"
              description="Create an account named “Emergency Fund” and AlexOS can suggest transfers into it from your daily receipts."
              action={
                <Button asChild variant="outline" size="sm">
                  <Link to="/money-center/accounts">
                    <ArrowDownToLine aria-hidden="true" /> Create Emergency Fund account
                  </Link>
                </Button>
              }
            />
          ) : metrics.savingsSuggestion > 0 && !savingsApproved ? (
            <>
              <AlexOSFormField label="Save from" required>
                {({ id, describedBy }) => (
                  <Select value={savingsAccountId} onValueChange={setSavingsAccountId}>
                    <SelectTrigger id={id} aria-describedby={describedBy}>
                      <SelectValue placeholder="Select personal account" />
                    </SelectTrigger>
                    <SelectContent>
                      {personalSavingsAccounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </AlexOSFormField>
              <Button
                className="w-full"
                variant="secondary"
                onClick={approveSavings}
                disabled={save.isPending || !savingsAccountId}
              >
                <PiggyBank aria-hidden="true" /> Approve transfer to Emergency Fund
              </Button>
            </>
          ) : savingsApproved ? (
            <p
              data-tone="income"
              className="alexos-tone-bg alexos-tone-text flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium"
            >
              <CheckCircle2 aria-hidden="true" className="size-4" /> Transfer approved and posted
              once.
            </p>
          ) : (
            <AlexOSEmptyState
              compact
              title="No personal receipt posted today"
              description="Once you post a confirmed personal receipt, AlexOS suggests 10% into your Emergency Fund."
            />
          )}
        </section>
      </CardContent>
    </Card>
  );
}
