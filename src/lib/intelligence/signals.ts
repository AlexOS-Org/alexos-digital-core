import {
  AlertTriangle,
  ArrowDownRight,
  CalendarClock,
  Clock,
  Coins,
  Flag,
  PiggyBank,
  Receipt,
  Target,
  TrendingDown,
  TrendingUp,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";
import { HEALTHY_SAVINGS_RATE, SPEND_SPIKE_PCT } from "@/lib/dashboard/constants";
import type { DashboardMetrics } from "@/lib/dashboard/types";
import { CATEGORY_LABELS, MAX_PRIORITIES, PRIORITY_ORDER } from "./constants";
import { formatAmount, formatPct, plural } from "./calculations";
import type { IntelligenceSignal, Priority, SignalCategory, SignalPriority } from "./types";

type Draft = Omit<IntelligenceSignal, "categoryLabel" | "timestamp">;

function build(drafts: Draft[], now: Date): IntelligenceSignal[] {
  return drafts
    .map((d) => ({ ...d, categoryLabel: CATEGORY_LABELS[d.category as SignalCategory], timestamp: now.toISOString() }))
    .sort((a, b) => PRIORITY_ORDER[a.priority as SignalPriority] - PRIORITY_ORDER[b.priority as SignalPriority]);
}

/** Derives operational signals from computed dashboard metrics. */
export function generateSignals(metrics: DashboardMetrics, now = new Date()): IntelligenceSignal[] {
  const { money, business, goals } = metrics;
  const drafts: Draft[] = [];

  if (money.lowBalanceAccounts.length > 0) {
    const worst = money.lowBalanceAccounts[0];
    drafts.push({
      id: "money-low-balance",
      category: "money",
      title: "Cash balance below comfort level",
      description: `${plural(money.lowBalanceAccounts.length, "account")} below threshold — ${worst.name} holds ${formatAmount(worst.balance)}.`,
      recommendation: "Top up or move funds before committing to new spending.",
      priority: "critical",
      icon: Wallet,
      action: { label: "Open accounts", to: "/money-center/accounts" },
    });
  }

  if (money.overdueBills.length > 0) {
    drafts.push({
      id: "money-overdue-bills",
      category: "money",
      title: "Overdue bills need clearing",
      description: `${plural(money.overdueBills.length, "bill")} past the due date, totalling ${formatAmount(money.overdueBills.reduce((s, b) => s + Number(b.amount), 0))}.`,
      recommendation: "Settle the oldest bills first to avoid penalties.",
      priority: "critical",
      icon: AlertTriangle,
      action: { label: "Review bills", to: "/money-center/bills" },
    });
  }

  if (money.billsDueSoon.length > 0) {
    drafts.push({
      id: "money-bills-due",
      category: "money",
      title: "Bills due this week",
      description: `${plural(money.billsDueSoon.length, "bill")} worth ${formatAmount(money.billsDueSoon.reduce((s, b) => s + Number(b.amount), 0))} fall due within 7 days.`,
      recommendation: "Reserve the cash now so the week stays predictable.",
      priority: "high",
      icon: Receipt,
      action: { label: "Plan bills", to: "/money-center/bills" },
    });
  }

  if (money.expenseChangePct !== null && money.expenseChangePct >= SPEND_SPIKE_PCT) {
    drafts.push({
      id: "money-spend-spike",
      category: "money",
      title: "Spending is climbing",
      description: `Expenses are ${formatPct(money.expenseChangePct)} higher than the same point last month (${formatAmount(money.expensesThisMonth)}).`,
      recommendation: "Check the largest categories and trim what is optional.",
      priority: "high",
      icon: TrendingDown,
      action: { label: "See analytics", to: "/money-center/analytics" },
    });
  }

  if (money.expectedPendingCount > 0) {
    drafts.push({
      id: "money-expected",
      category: "money",
      title: "Expected income still pending",
      description: `${plural(money.expectedPendingCount, "incoming payment")} with a weighted value of ${formatAmount(money.expectedWeighted)}.`,
      recommendation: "Confirm dates with payers so forecasts stay reliable.",
      priority: "medium",
      icon: Clock,
      action: { label: "Track expected", to: "/money-center/expected" },
    });
  }

  if (money.incomeThisMonth > 0) {
    const healthy = money.savingsRate >= HEALTHY_SAVINGS_RATE;
    drafts.push({
      id: "money-savings-rate",
      category: "money",
      title: healthy ? "Savings rate is holding" : "Savings rate is thin",
      description: `You are keeping ${money.savingsRate.toFixed(0)}% of income this month (${formatAmount(money.netFlowThisMonth)} net).`,
      recommendation: healthy
        ? "Move the surplus into a goal before it is absorbed by spending."
        : `Aim for at least ${HEALTHY_SAVINGS_RATE}% by cutting one recurring cost.`,
      priority: healthy ? "low" : "medium",
      icon: PiggyBank,
      action: { label: "Open goals", to: "/goals" },
    });
  }

  if (money.outstandingDebt > 0) {
    drafts.push({
      id: "money-debt",
      category: "money",
      title: "Outstanding debt in play",
      description: `${formatAmount(money.outstandingDebt)} still to clear across active debts.`,
      recommendation: "Direct any surplus to the highest-interest balance first.",
      priority: "medium",
      icon: ArrowDownRight,
      action: { label: "Manage debt", to: "/debt-management" },
    });
  }

  if (business.staleLeads.length > 0) {
    drafts.push({
      id: "crm-stale-leads",
      category: "crm",
      title: "Leads without follow-up",
      description: `${plural(business.staleLeads.length, "open lead")} untouched for over a week.`,
      recommendation: "Log a call or email today before the interest cools.",
      priority: "high",
      icon: Users,
      action: { label: "Open pipeline", to: "/people/leads" },
    });
  }

  if (business.closingSoon.length > 0) {
    drafts.push({
      id: "crm-closing-soon",
      category: "business",
      title: "Deals closing soon",
      description: `${plural(business.closingSoon.length, "deal")} worth ${formatAmount(business.closingSoon.reduce((s, l) => s + Number(l.value), 0))} are due to close within two weeks.`,
      recommendation: "Confirm terms and remove blockers on each deal.",
      priority: "high",
      icon: CalendarClock,
      action: { label: "Review deals", to: "/people/leads" },
    });
  }

  if (business.newLeadsThisWeek > 0) {
    drafts.push({
      id: "crm-new-leads",
      category: "crm",
      title: "New leads this week",
      description: `${plural(business.newLeadsThisWeek, "lead")} entered the pipeline in the last 7 days.`,
      recommendation: "Qualify them quickly — early response wins deals.",
      priority: "medium",
      icon: UserPlus,
      action: { label: "See leads", to: "/people/leads" },
    });
  }

  if (business.pipelineValue > 0) {
    drafts.push({
      id: "business-pipeline",
      category: "business",
      title: "Pipeline value in motion",
      description: `${formatAmount(business.pipelineValue)} open, ${formatAmount(business.weightedPipelineValue)} weighted by probability.`,
      recommendation: "Advance the two largest deals one stage this week.",
      priority: "medium",
      icon: TrendingUp,
      action: { label: "Open pipeline", to: "/people/leads" },
    });
  }

  if (money.revenueToday > 0) {
    drafts.push({
      id: "business-revenue-today",
      category: "business",
      title: "Revenue recorded today",
      description: `${formatAmount(money.revenueToday)} in today, ${formatAmount(money.incomeThisMonth)} this month.`,
      recommendation: "Repeat what worked — log the source against the deal.",
      priority: "low",
      icon: Coins,
      action: { label: "View income", to: "/money-center/income" },
    });
  }

  if (goals.behindSchedule.length > 0) {
    const g = goals.behindSchedule[0];
    drafts.push({
      id: "goals-behind",
      category: "goals",
      title: "Goal is behind schedule",
      description: `${g.name} is ${g.pct.toFixed(0)}% funded with the target date approaching.`,
      recommendation: "Add a contribution or move the target date.",
      priority: "medium",
      icon: Target,
      action: { label: "Open goals", to: "/goals" },
    });
  } else if (goals.activeGoals > 0) {
    drafts.push({
      id: "goals-progress",
      category: "goals",
      title: "Goal funding on track",
      description: `${goals.completionPct.toFixed(0)}% of ${formatAmount(goals.totalTarget)} funded across ${plural(goals.activeGoals, "active goal")}.`,
      recommendation: "Keep contributions consistent this month.",
      priority: "low",
      icon: Flag,
      action: { label: "Open goals", to: "/goals" },
    });
  }

  return build(drafts, now);
}

/** Ranked operational priorities for the day. */
export function generatePriorities(metrics: DashboardMetrics): Priority[] {
  const { money, business, goals } = metrics;
  const candidates: (Priority & { weight: number })[] = [
    {
      id: "overdue-bills",
      title: "Clear overdue bills",
      detail: money.overdueBills.length ? formatAmount(money.overdueBills.reduce((s, b) => s + Number(b.amount), 0)) : "Nothing overdue",
      count: money.overdueBills.length,
      tone: "amber",
      to: "/money-center/bills",
      weight: 100,
    },
    {
      id: "stale-leads",
      title: "Follow up active leads",
      detail: business.staleLeads.length ? "No contact in over a week" : "Pipeline is current",
      count: business.staleLeads.length,
      tone: "violet",
      to: "/people/leads",
      weight: 90,
    },
    {
      id: "closing-soon",
      title: "Close deals due soon",
      detail: business.closingSoon.length ? formatAmount(business.closingSoon.reduce((s, l) => s + Number(l.value), 0)) : "No deals closing",
      count: business.closingSoon.length,
      tone: "emerald",
      to: "/people/leads",
      weight: 80,
    },
    {
      id: "bills-due",
      title: "Fund bills due this week",
      detail: money.billsDueSoon.length ? formatAmount(money.billsDueSoon.reduce((s, b) => s + Number(b.amount), 0)) : "Nothing due",
      count: money.billsDueSoon.length,
      tone: "amber",
      to: "/money-center/bills",
      weight: 70,
    },
    {
      id: "expected",
      title: "Confirm expected income",
      detail: money.expectedPendingCount ? formatAmount(money.expectedWeighted) : "Nothing pending",
      count: money.expectedPendingCount,
      tone: "blue",
      to: "/money-center/expected",
      weight: 60,
    },
    {
      id: "goals",
      title: "Fund goals behind target",
      detail: goals.behindSchedule.length ? goals.behindSchedule.map((g) => g.name).join(", ") : "Goals on track",
      count: goals.behindSchedule.length,
      tone: "violet",
      to: "/goals",
      weight: 50,
    },
  ];

  const active = candidates.filter((c) => c.count > 0).sort((a, b) => b.weight - a.weight);
  const list = active.length > 0 ? active : candidates.slice(0, MAX_PRIORITIES);
  return list.slice(0, MAX_PRIORITIES).map(({ weight: _weight, ...priority }) => priority);
}
