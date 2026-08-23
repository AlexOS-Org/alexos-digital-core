import {
  Banknote,
  Smartphone,
  Landmark,
  CreditCard,
  Wallet,
  Coins,
  type LucideIcon,
} from "lucide-react";

export const ACCOUNT_ICONS: Record<string, LucideIcon> = {
  banknote: Banknote,
  smartphone: Smartphone,
  landmark: Landmark,
  "credit-card": CreditCard,
  wallet: Wallet,
  coins: Coins,
};

export const ACCOUNT_ICON_OPTIONS = Object.keys(ACCOUNT_ICONS);

export const ACCOUNT_TYPES = [
  { value: "cash", label: "Cash" },
  { value: "bank", label: "Bank" },
  { value: "mobile_money", label: "Mobile Money" },
  { value: "credit_card", label: "Credit Card" },
  { value: "wallet", label: "Wallet" },
  { value: "other", label: "Other" },
] as const;

export const CURRENCIES = ["KES", "USD", "EUR", "GBP", "UGX", "TZS", "ZAR"] as const;

export const INCOME_SOURCES = [
  "Salary",
  "Bank Commission",
  "Vehicle Commission",
  "E-commerce",
  "Customer Payment",
  "Refund",
  "Investment",
  "Interest",
  "Loan Received",
  "Gift",
  "Other",
] as const;

export const EXPENSE_CATEGORIES = [
  "Rent",
  "Transport",
  "Fuel",
  "Food",
  "Electricity",
  "Water",
  "Water — Home",
  "Water — Office",
  "WiFi",
  "Internet",
  "Airtime",
  "Facebook Ads",
  "Google Ads",
  "Ads",
  "Rider / Delivery",
  "Packaging",
  "Supplier",
  "Business",
  "Office",
  "Shopping",
  "Medical",
  "Kids",
  "Kids — School Fees",
  "Kids — Expenses",
  "Kids — Shopping",
  "Tithe",
  "Entertainment",
  "Other",
] as const;

/**
 * Older records used category suffixes such as " — Shared" and " — Business".
 * Scope is now the single source of truth, so keep historical records readable
 * while preventing new duplicate category values.
 */
export function normalizeExpenseCategory(category: string | null | undefined) {
  return (category ?? "Other").replace(/\s+—\s+(Shared|Business)$/, "");
}

export const EXPECTED_SOURCES = [
  "Salary",
  "Vehicle Commission",
  "Bank Commission",
  "Customer Deposit",
  "COD Payment",
  "Loan Disbursement",
  "Other",
] as const;
