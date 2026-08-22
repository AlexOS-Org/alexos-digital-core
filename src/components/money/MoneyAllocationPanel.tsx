import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "@tanstack/react-router";
import { ArrowDownToLine, BellRing, CheckCircle2, HeartHandshake, PiggyBank, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { formatMoney } from "@/lib/money/format";
import { useAccountBalances, useAccounts, useSaveTransaction, useTransactions } from "@/lib/money/api";
import { getDailyGearProfitCashFlow } from "@/lib/dailygear/profit-cash-flow.functions";
import type { DailyGearProfitCashFlowResponse } from "@/lib/dailygear/profit-cash-flow.server";

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
  const [profitResponse, setProfitResponse] = useState<DailyGearProfitCashFlowResponse | null>(null);

  useEffect(() => {
    let active = true;
    getDailyGearProfitCashFlow({ data: { datePreset: "today", includeInsights: true, maxPages: 10 } })
      .then((response) => {
        if (active) setProfitResponse(response);
      })
      .catch(() => {
        if (active) setProfitResponse(null);
      });
    return () => {
      active = false;
    };
  }, []);

  const emergencyAccount = accounts.find((account) => /emergency fund/i.test(account.name));
  const emergencyBalance = Number(
    balances.find((balance) => balance.account_id === emergencyAccount?.id)?.balance ?? 0,
  );

  const metrics = useMemo(() => {
    const posted = transactions.filter((transaction) => transaction.status === "posted");
    const ledgerBusinessProfit = posted.reduce((total, transaction) => {
      if (transaction.financial_scope !== "business") return total;
      if (transaction.type === "income") return total + Number(transaction.amount);
      if (transaction.type === "expense") {
        if (transaction.category === "Tithe") return total;
        return total - Number(transaction.amount);
      }
      return total;
    }, 0);
    const salaryReceived = posted
      .filter(
        (transaction) =>
          transaction.type === "income" &&
          transaction.financial_scope !== "business" &&
          (transaction.income_type === "salary" || transaction.source === "Salary"),
      )
      .reduce((total, transaction) => total + Number(transaction.amount), 0);
    const personalReceipts = posted
      .filter((transaction) => transaction.type === "income" && transaction.financial_scope !== "business")
      .reduce((total, transaction) => total + Number(transaction.amount), 0);
    const canonicalBusinessProfit = profitResponse?.financials.operatingProfit;
    const businessProfit = canonicalBusinessProfit ?? ledgerBusinessProfit;
    return {
      businessProfit: canonicalBusinessProfit ?? ledgerBusinessProfit,
      salaryReceived,
      businessTithe: Math.max(0, businessProfit) * ALLOCATION_RATE,
      salaryTithe: salaryReceived * ALLOCATION_RATE,
      savingsSuggestion: personalReceipts * ALLOCATION_RATE,
    };
  }, [transactions, profitResponse]);

  const availableAccounts = accounts.filter((account) => account.id !== emergencyAccount?.id);
  const personalSavingsAccounts = availableAccounts.filter((account) => account.financial_scope !== "business");
  const selectedSavingsAccount = personalSavingsAccounts.find((account) => account.id === savingsAccountId);
  const selectedTitheAccount = availableAccounts.find((account) => account.id === titheAccountId);
  const balanceFor = (id: string) => Number(balances.find((balance) => balance.account_id === id)?.balance ?? 0);
  const titheTotal = metrics.businessTithe + metrics.salaryTithe;
  const titheKey = `${window.from}:tithe:${titheTotal.toFixed(2)}`;
  const savingsKey = `${window.from}:savings:${metrics.savingsSuggestion.toFixed(2)}`;

  const approveTithe = async () => {
    if (!selectedTitheAccount || titheTotal <= 0) return;
    if (balanceFor(selectedTitheAccount.id) < titheTotal) {
      toast.error("The selected account does not have enough available balance for this tithe suggestion.");
      return;
    }
    await save.mutateAsync({
      type: "expense",
      occurred_at: new Date().toISOString(),
      account_id: selectedTitheAccount.id,
      amount: titheTotal,
      category: "Tithe",
      expense_type: "charitable",
      financial_scope: selectedTitheAccount.financial_scope ?? "personal",
      business_id: selectedTitheAccount.business_id ?? null,
      source: "Approved tithe suggestion",
      description: `Approved 10% tithe: business profit ${formatMoney(metrics.businessTithe)} + salary ${formatMoney(metrics.salaryTithe)}`,
      reference: titheReference,
    });
    setApprovedTitheKeys((keys) => [...keys, titheKey]);
  };

  const approveSavings = async () => {
    if (!emergencyAccount || !selectedSavingsAccount || metrics.savingsSuggestion <= 0) return;
    if (balanceFor(selectedSavingsAccount.id) < metrics.savingsSuggestion) {
      toast.error("The selected account does not have enough available balance for this savings suggestion.");
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
  const titheAlreadyPosted = transactions.some((transaction) => transaction.reference === titheReference);
  const savingsAlreadyPosted = transactions.some((transaction) => transaction.reference === savingsReference);
  const titheApproved = titheAlreadyPosted || approvedTitheKeys.includes(titheKey);
  const savingsApproved = savingsAlreadyPosted || approvedSavingsKeys.includes(savingsKey);

  return (
    <Card className="rounded-[1.5rem] border-border/60 shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <BellRing className="h-4 w-4 text-amber-500" /> Daily allocation review
          </CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            Suggestions are calculated from posted transactions today. Nothing moves until you approve it.
          </p>
        </div>
        <ShieldCheck className="h-5 w-5 text-emerald-600" aria-label="Approval required" />
      </CardHeader>
      <CardContent className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3 rounded-2xl border border-border/60 bg-muted/20 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Tithe due</p>
              <p className="mt-1 text-2xl font-semibold">{formatMoney(titheTotal)}</p>
            </div>
            <HeartHandshake className="h-6 w-6 text-rose-500" />
          </div>
          <p className="text-xs text-muted-foreground">
            10% of today’s net business profit ({formatMoney(metrics.businessTithe)}) plus 10% of confirmed salary received ({formatMoney(metrics.salaryTithe)}). Net business profit includes recognized revenue, COGS, order costs, business expenses, and available read-only Meta spend.
          </p>
          {profitResponse?.financials.dataQuality.warnings.length ? (
            <p className="text-xs text-amber-700 dark:text-amber-300">Profit data warning: {profitResponse.financials.dataQuality.warnings[0]}</p>
          ) : null}
          {titheTotal > 0 && !titheApproved ? (
            <>
              <div className="space-y-1.5">
                <Label>Pay tithe from</Label>
                <Select value={titheAccountId} onValueChange={setTitheAccountId}>
                  <SelectTrigger><SelectValue placeholder="Select personal or business account" /></SelectTrigger>
                  <SelectContent>{availableAccounts.map((account) => <SelectItem key={account.id} value={account.id}>{account.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <Button className="w-full" onClick={approveTithe} disabled={save.isPending || !titheAccountId}>
                <CheckCircle2 className="mr-2 h-4 w-4" /> Approve tithe payment
              </Button>
            </>
          ) : titheApproved ? (
            <p className="flex items-center gap-2 text-sm font-medium text-emerald-600"><CheckCircle2 className="h-4 w-4" /> Approved and posted once.</p>
          ) : <p className="text-sm text-muted-foreground">No tithe suggestion is due today.</p>}
        </div>

        <div className="space-y-3 rounded-2xl border border-border/60 bg-muted/20 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Emergency Fund suggestion</p>
              <p className="mt-1 text-2xl font-semibold">{formatMoney(metrics.savingsSuggestion)}</p>
            </div>
            <PiggyBank className="h-6 w-6 text-emerald-600" />
          </div>
          <p className="text-xs text-muted-foreground">
            Starter rule: 10% of today’s confirmed personal receipts. Current reserve balance: {formatMoney(emergencyBalance)}.
          </p>
          {!emergencyAccount ? (
            <Button asChild variant="outline" className="w-full"><Link to="/money-center/accounts"><ArrowDownToLine className="mr-2 h-4 w-4" /> Create Emergency Fund account</Link></Button>
          ) : metrics.savingsSuggestion > 0 && !savingsApproved ? (
            <>
              <div className="space-y-1.5">
                <Label>Save from</Label>
                <Select value={savingsAccountId} onValueChange={setSavingsAccountId}>
                  <SelectTrigger><SelectValue placeholder="Select personal account" /></SelectTrigger>
                  <SelectContent>{personalSavingsAccounts.map((account) => <SelectItem key={account.id} value={account.id}>{account.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <Button className="w-full" variant="secondary" onClick={approveSavings} disabled={save.isPending || !savingsAccountId}>
                <PiggyBank className="mr-2 h-4 w-4" /> Approve transfer to Emergency Fund
              </Button>
            </>
          ) : savingsApproved ? (
            <p className="flex items-center gap-2 text-sm font-medium text-emerald-600"><CheckCircle2 className="h-4 w-4" /> Transfer approved and posted once.</p>
          ) : <p className="text-sm text-muted-foreground">No personal receipt has been posted today.</p>}
        </div>
      </CardContent>
    </Card>
  );
}
