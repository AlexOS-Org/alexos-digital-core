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

export const EXPENSE_SCOPES = ["personal", "business"] as const;
export type ExpenseScope = (typeof EXPENSE_SCOPES)[number];

export const EXPENSE_CATEGORIES = [
  "Rent",
  "Transport",
  "Fuel",
  "Food",
  "Electricity",
  "Water",
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
 * Scope is the single source of truth, so category labels never encode a second
 * allocation and cannot create duplicate ledger entries.
 */
export function normalizeExpenseCategory(category: string | null | undefined) {
  const normalized = (category ?? "Other").replace(/\s+—\s+(Shared|Business)$/, "");
  if (normalized === "Water — Home" || normalized === "Water — Office") return "Water";
  return normalized;
}

export function isSalaryIncome(input: { income_type?: string | null; source?: string | null }) {
  return (
    input.income_type?.trim().toLowerCase() === "salary" ||
    input.source?.trim().toLowerCase() === "salary"
  );
}

export function isGiftIncome(input: { income_type?: string | null; source?: string | null }) {
  return (
    input.income_type?.trim().toLowerCase() === "gift" ||
    input.source?.trim().toLowerCase() === "gift"
  );
}

const EXPENSE_TYPE_BY_CATEGORY: Record<string, string> = {
  Rent: "rent",
  Transport: "transport",
  Fuel: "transport",
  Food: "personal_living",
  Electricity: "utilities",
  Water: "utilities",
  WiFi: "utilities",
  Internet: "utilities",
  Airtime: "airtime",
  "Facebook Ads": "advertising",
  "Google Ads": "advertising",
  Ads: "advertising",
  "Rider / Delivery": "delivery",
  Packaging: "packaging",
  Supplier: "supplier",
  Business: "other",
  Office: "other",
  Shopping: "personal_living",
  Medical: "health",
  Kids: "personal_living",
  "Kids — School Fees": "education",
  "Kids — Expenses": "personal_living",
  "Kids — Shopping": "personal_living",
  Tithe: "personal_living",
  Entertainment: "personal_living",
  Other: "other",
};

export function expenseTypeForCategory(category: string | null | undefined) {
  return EXPENSE_TYPE_BY_CATEGORY[normalizeExpenseCategory(category)] ?? "other";
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
