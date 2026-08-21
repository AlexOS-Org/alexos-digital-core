import {
  ArrowDownCircle,
  ArrowLeftRight,
  ArrowUpCircle,
  BarChart3,
  Clock3,
  PiggyBank,
  Receipt,
  Repeat2,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export interface MoneyCenterSection {
  to: string;
  label: string;
  icon: LucideIcon;
  description: string;
  exact?: boolean;
}

/**
 * Single source of truth for Money Center contextual navigation.
 * The global AlexOS shell owns the workspace disclosure; this registry owns
 * the destinations so the former horizontal navigation cannot drift.
 */
export const MONEY_CENTER_SECTIONS: MoneyCenterSection[] = [
  {
    to: "/money-center",
    label: "Overview",
    icon: Wallet,
    description: "Balances, cash flow and current financial signals.",
    exact: true,
  },
  {
    to: "/money-center/accounts",
    label: "Accounts",
    icon: Wallet,
    description: "Cash, bank, mobile money and wallet accounts.",
  },
  {
    to: "/money-center/transactions",
    label: "Transactions",
    icon: ArrowLeftRight,
    description: "Income, expenses, transfers and adjustments.",
  },
  {
    to: "/money-center/income",
    label: "Income",
    icon: ArrowDownCircle,
    description: "Record and review incoming money.",
  },
  {
    to: "/money-center/expenses",
    label: "Expenses",
    icon: ArrowUpCircle,
    description: "Track spending, including Airtime.",
  },
  {
    to: "/money-center/transfers",
    label: "Transfers",
    icon: Repeat2,
    description: "Move money between your accounts.",
  },
  {
    to: "/money-center/budgets",
    label: "Budgets",
    icon: PiggyBank,
    description: "Plan spending by category and month.",
  },
  {
    to: "/money-center/expected",
    label: "Expected",
    icon: Clock3,
    description: "Track expected money and probabilities.",
  },
  {
    to: "/money-center/bills",
    label: "Bills",
    icon: Receipt,
    description: "Manage recurring and one-time bills.",
  },
  {
    to: "/money-center/analytics",
    label: "Analytics",
    icon: BarChart3,
    description: "Review financial trends and summaries.",
  },
];
