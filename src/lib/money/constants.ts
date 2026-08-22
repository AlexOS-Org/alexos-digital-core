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
  "Rent — Shared",
  "Transport",
  "Transport — Shared",
  "Fuel",
  "Food",
  "Food — Shared",
  "Electricity",
  "Electricity — Shared",
  "Water",
  "Water — Shared",
  "Water — Home",
  "Water — Office",
  "WiFi",
  "WiFi — Shared",
  "Internet",
  "Internet — Shared",
  "Airtime",
  "Airtime — Shared",
  "Facebook Ads",
  "Google Ads",
  "Ads — Business",
  "Rider / Delivery — Business",
  "Packaging — Business",
  "Supplier — Business",
  "Business",
  "Office",
  "Office — Shared",
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

export const EXPECTED_SOURCES = [
  "Salary",
  "Vehicle Commission",
  "Bank Commission",
  "Customer Deposit",
  "COD Payment",
  "Loan Disbursement",
  "Other",
] as const;
