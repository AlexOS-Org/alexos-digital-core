import type { Account, AccountBalance, Expected, Transaction } from "@/lib/money/api";
import type { Bill } from "@/lib/money/bills";
import type { Debt } from "@/lib/debts/api";
import type { Goal, GoalProgress } from "@/lib/goals/api";
import type { Contact, Lead } from "@/lib/crm/types";

export interface DashboardSnapshot {
  accounts: Account[];
  balances: AccountBalance[];
  transactions: Transaction[];
  expected: Expected[];
  bills: Bill[];
  debts: Debt[];
  goals: Goal[];
  goalProgress: GoalProgress[];
  contacts: Contact[];
  leads: Lead[];
}

export interface MoneyMetrics {
  cashAvailable: number;
  lowBalanceAccounts: { name: string; balance: number; threshold: number }[];
  incomeThisMonth: number;
  expensesThisMonth: number;
  incomeLastMonth: number;
  expensesLastMonth: number;
  netFlowThisMonth: number;
  expenseChangePct: number | null;
  incomeChangePct: number | null;
  savingsRate: number;
  revenueToday: number;
  outstandingDebt: number;
  unpaidBillsTotal: number;
  billsDueSoon: Bill[];
  overdueBills: Bill[];
  expectedWeighted: number;
  expectedPendingCount: number;
}

export interface BusinessMetrics {
  contactsTotal: number;
  activeCustomers: number;
  leadsTotal: number;
  openLeads: number;
  newLeadsThisWeek: number;
  wonLeads: number;
  lostLeads: number;
  winRate: number;
  pipelineValue: number;
  weightedPipelineValue: number;
  staleLeads: Lead[];
  closingSoon: Lead[];
}

export interface GoalMetrics {
  activeGoals: number;
  totalTarget: number;
  totalSaved: number;
  completionPct: number;
  behindSchedule: { id: string; name: string; pct: number; targetDate: string | null }[];
}

export interface DashboardMetrics {
  money: MoneyMetrics;
  business: BusinessMetrics;
  goals: GoalMetrics;
}
