import { useMemo } from "react";
import { useAccountBalances, useAccounts, useExpected, useTransactions } from "@/lib/money/api";
import { useBills } from "@/lib/money/bills";
import { useDebts } from "@/lib/debts/api";
import { useGoalProgress, useGoals } from "@/lib/goals/api";
import { useContacts, useLeads } from "@/lib/crm/api";
import { computeDashboardMetrics } from "./calculations";
import type { DashboardMetrics, DashboardSnapshot } from "./types";

export interface DashboardQueryResult {
  snapshot: DashboardSnapshot;
  metrics: DashboardMetrics;
  isLoading: boolean;
  isError: boolean;
  isEmpty: boolean;
}

/**
 * Single entry point for dashboard data. Components consume this hook and render;
 * all aggregation lives in `calculations.ts`.
 */
export function useDashboardData(): DashboardQueryResult {
  const accounts = useAccounts();
  const balances = useAccountBalances();
  const transactions = useTransactions();
  const expected = useExpected();
  const bills = useBills();
  const debts = useDebts();
  const goals = useGoals();
  const goalProgress = useGoalProgress();
  const contacts = useContacts();
  const leads = useLeads();

  const queries = [accounts, balances, transactions, expected, bills, debts, goals, goalProgress, contacts, leads];
  const isLoading = queries.some((q) => q.isLoading);
  const isError = queries.some((q) => q.isError);

  const snapshot = useMemo<DashboardSnapshot>(
    () => ({
      accounts: accounts.data ?? [],
      balances: balances.data ?? [],
      transactions: transactions.data ?? [],
      expected: expected.data ?? [],
      bills: bills.data ?? [],
      debts: debts.data ?? [],
      goals: goals.data ?? [],
      goalProgress: goalProgress.data ?? [],
      contacts: contacts.data ?? [],
      leads: leads.data ?? [],
    }),
    [
      accounts.data,
      balances.data,
      transactions.data,
      expected.data,
      bills.data,
      debts.data,
      goals.data,
      goalProgress.data,
      contacts.data,
      leads.data,
    ],
  );

  const metrics = useMemo(() => computeDashboardMetrics(snapshot), [snapshot]);

  const isEmpty =
    !isLoading &&
    snapshot.transactions.length === 0 &&
    snapshot.bills.length === 0 &&
    snapshot.leads.length === 0 &&
    snapshot.contacts.length === 0 &&
    snapshot.goals.length === 0;

  return { snapshot, metrics, isLoading, isError, isEmpty };
}
