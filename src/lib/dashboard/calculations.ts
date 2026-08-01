import {
  BANK_PATTERN,
  BILLS_DUE_SOON_DAYS,
  DAY_MS,
  LEAD_CLOSING_SOON_DAYS,
  LEAD_STALE_DAYS,
  LOW_BALANCE_THRESHOLDS,
  MOBILE_MONEY_PATTERN,
  OPEN_LEAD_STAGES,
} from "./constants";
import type {
  BusinessMetrics,
  DashboardMetrics,
  DashboardSnapshot,
  GoalMetrics,
  MoneyMetrics,
} from "./types";
import type { Account, AccountBalance, Transaction } from "@/lib/money/api";
import type { Lead } from "@/lib/crm/types";

const num = (value: unknown) => {
  const n = typeof value === "string" ? parseFloat(value) : Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
};

export function accountThreshold(account: Account): number | null {
  if (MOBILE_MONEY_PATTERN.test(account.name)) return LOW_BALANCE_THRESHOLDS.mobileMoney;
  if (BANK_PATTERN.test(`${account.name} ${account.type}`)) return LOW_BALANCE_THRESHOLDS.bank;
  return null;
}

export function pctChange(current: number, previous: number): number | null {
  if (previous <= 0) return current > 0 ? 100 : null;
  return ((current - previous) / previous) * 100;
}

function sumByType(transactions: Transaction[], type: Transaction["type"]) {
  return transactions
    .filter((t) => t.type === type && t.status === "posted")
    .reduce((sum, t) => sum + num(t.amount), 0);
}

function inMonth(date: Date, year: number, month: number) {
  return date.getFullYear() === year && date.getMonth() === month;
}

export function computeMoneyMetrics(snapshot: DashboardSnapshot, now = new Date()): MoneyMetrics {
  const { accounts, balances, transactions, expected, bills, debts } = snapshot;

  const cashAvailable = balances.reduce((sum, b: AccountBalance) => sum + num(b.balance), 0);

  const lowBalanceAccounts = accounts
    .map((account) => {
      const threshold = accountThreshold(account);
      const balance = num(balances.find((b) => b.account_id === account.id)?.balance);
      return { name: account.name, balance, threshold: threshold ?? 0, flagged: threshold !== null && balance < threshold };
    })
    .filter((a) => a.flagged)
    .map(({ name, balance, threshold }) => ({ name, balance, threshold }));

  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const thisMonthTx = transactions.filter((t) => inMonth(new Date(t.occurred_at), now.getFullYear(), now.getMonth()));
  const lastMonthTx = transactions.filter((t) => inMonth(new Date(t.occurred_at), prev.getFullYear(), prev.getMonth()));
  const todayKey = now.toISOString().slice(0, 10);

  const incomeThisMonth = sumByType(thisMonthTx, "income");
  const expensesThisMonth = sumByType(thisMonthTx, "expense");
  const incomeLastMonth = sumByType(lastMonthTx, "income");
  const expensesLastMonth = sumByType(lastMonthTx, "expense");
  const netFlowThisMonth = incomeThisMonth - expensesThisMonth;

  const revenueToday = sumByType(
    transactions.filter((t) => t.occurred_at.slice(0, 10) === todayKey),
    "income",
  );

  const unpaidBills = bills.filter((b) => b.status === "pending" && !b.deleted_at);
  const overdueBills = unpaidBills.filter((b) => b.due_date && b.due_date < todayKey);
  const billsDueSoon = unpaidBills.filter((b) => {
    if (!b.due_date) return false;
    const diff = Math.round((new Date(`${b.due_date}T00:00:00`).getTime() - new Date(todayKey + "T00:00:00").getTime()) / DAY_MS);
    return diff >= 0 && diff <= BILLS_DUE_SOON_DAYS;
  });

  const pendingExpected = expected.filter((e) => e.status === "pending");

  return {
    cashAvailable,
    lowBalanceAccounts,
    incomeThisMonth,
    expensesThisMonth,
    incomeLastMonth,
    expensesLastMonth,
    netFlowThisMonth,
    expenseChangePct: pctChange(expensesThisMonth, expensesLastMonth),
    incomeChangePct: pctChange(incomeThisMonth, incomeLastMonth),
    savingsRate: incomeThisMonth > 0 ? Math.max(0, Math.min(100, (netFlowThisMonth / incomeThisMonth) * 100)) : 0,
    revenueToday,
    outstandingDebt: debts
      .filter((d) => d.status !== "paid" && d.status !== "archived")
      .reduce((sum, d) => sum + Math.max(0, num(d.principal) - num(d.amount_paid)), 0),
    unpaidBillsTotal: unpaidBills.reduce((sum, b) => sum + num(b.amount), 0),
    billsDueSoon,
    overdueBills,
    expectedWeighted: pendingExpected.reduce((sum, e) => sum + (num(e.amount) * num(e.probability)) / 100, 0),
    expectedPendingCount: pendingExpected.length,
  };
}

export function computeBusinessMetrics(snapshot: DashboardSnapshot, now = new Date()): BusinessMetrics {
  const { contacts, leads } = snapshot;
  const open = leads.filter((l) => (OPEN_LEAD_STAGES as readonly string[]).includes(l.stage));
  const won = leads.filter((l) => l.stage === "won");
  const lost = leads.filter((l) => l.stage === "lost");
  const closed = won.length + lost.length;

  const isStale = (lead: Lead) => {
    const touched = new Date(lead.updated_at ?? lead.created_at).getTime();
    return (now.getTime() - touched) / DAY_MS > LEAD_STALE_DAYS;
  };

  const closingSoon = open.filter((l) => {
    if (!l.expected_close_date) return false;
    const diff = (new Date(`${l.expected_close_date}T00:00:00`).getTime() - now.getTime()) / DAY_MS;
    return diff >= -1 && diff <= LEAD_CLOSING_SOON_DAYS;
  });

  return {
    contactsTotal: contacts.length,
    activeCustomers: contacts.filter((c) => c.status === "active").length,
    leadsTotal: leads.length,
    openLeads: open.length,
    newLeadsThisWeek: leads.filter((l) => (now.getTime() - new Date(l.created_at).getTime()) / DAY_MS <= 7).length,
    wonLeads: won.length,
    lostLeads: lost.length,
    winRate: closed > 0 ? (won.length / closed) * 100 : 0,
    pipelineValue: open.reduce((sum, l) => sum + num(l.value), 0),
    weightedPipelineValue: open.reduce((sum, l) => sum + (num(l.value) * num(l.probability)) / 100, 0),
    staleLeads: open.filter(isStale),
    closingSoon,
  };
}

export function computeGoalMetrics(snapshot: DashboardSnapshot, now = new Date()): GoalMetrics {
  const active = snapshot.goals.filter((g) => g.status === "active");
  const saved = (goalId: string) => num(snapshot.goalProgress.find((p) => p.goal_id === goalId)?.current_amount);
  const totalTarget = active.reduce((sum, g) => sum + num(g.target_amount), 0);
  const totalSaved = active.reduce((sum, g) => sum + saved(g.id), 0);

  const behindSchedule = active
    .filter((g) => g.target_date)
    .map((g) => {
      const target = num(g.target_amount);
      const pct = target > 0 ? (saved(g.id) / target) * 100 : 0;
      const daysLeft = (new Date(`${g.target_date}T00:00:00`).getTime() - now.getTime()) / DAY_MS;
      return { id: g.id, name: g.name, pct, targetDate: g.target_date, daysLeft };
    })
    .filter((g) => g.daysLeft <= 60 && g.pct < 80)
    .map(({ id, name, pct, targetDate }) => ({ id, name, pct, targetDate }));

  return {
    activeGoals: active.length,
    totalTarget,
    totalSaved,
    completionPct: totalTarget > 0 ? Math.min(100, (totalSaved / totalTarget) * 100) : 0,
    behindSchedule,
  };
}

export function computeDashboardMetrics(snapshot: DashboardSnapshot, now = new Date()): DashboardMetrics {
  return {
    money: computeMoneyMetrics(snapshot, now),
    business: computeBusinessMetrics(snapshot, now),
    goals: computeGoalMetrics(snapshot, now),
  };
}
