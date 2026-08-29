import { isGiftIncome } from "./constants";

export const TITHE_RATE = 0.1;

export type TitheReceipt = {
  type: "income" | "expense" | "transfer" | "adjustment";
  status: "posted" | "pending" | "void";
  amount: number | string | null | undefined;
  source?: string | null;
  income_type?: string | null;
  currency?: string | null;
};

export type TitheCalculation = {
  rate: number;
  currencies: string[];
  eligibleReceiptTotals: Record<string, number>;
  titheTotals: Record<string, number>;
  total: number | null;
  currency: string | null;
  unavailableReason: "mixed_currency" | "unknown_currency" | null;
};

function normalizeCurrency(currency: string | null | undefined) {
  const normalized = currency?.trim().toUpperCase();
  return normalized || null;
}

function numericAmount(amount: number | string | null | undefined) {
  const value = typeof amount === "string" ? Number(amount.trim()) : Number(amount);
  return Number.isFinite(value) && value > 0 ? value : 0;
}

/**
 * Calculates tithe from posted income receipts only.
 * Gifts are excluded; loans, transfers, expenses, pending rows, and void rows
 * are not income receipts and therefore do not enter the base.
 * A combined total is withheld when currency is unknown or mixed.
 */
export function calculateTithe(
  receipts: readonly TitheReceipt[],
  rate = TITHE_RATE,
): TitheCalculation {
  const safeRate = Number.isFinite(rate) && rate >= 0 ? rate : TITHE_RATE;
  const eligibleReceiptTotals: Record<string, number> = {};

  for (const receipt of receipts) {
    if (receipt.type !== "income" || receipt.status !== "posted" || isGiftIncome(receipt)) {
      continue;
    }

    const amount = numericAmount(receipt.amount);
    if (amount <= 0) continue;

    const currency = normalizeCurrency(receipt.currency) ?? "UNKNOWN";
    eligibleReceiptTotals[currency] = (eligibleReceiptTotals[currency] ?? 0) + amount;
  }

  const currencies = Object.keys(eligibleReceiptTotals).sort();
  const titheTotals = Object.fromEntries(
    currencies.map((currency) => [currency, eligibleReceiptTotals[currency] * safeRate]),
  );
  const unavailableReason = currencies.includes("UNKNOWN")
    ? "unknown_currency"
    : currencies.length > 1
      ? "mixed_currency"
      : null;
  const currency = currencies.length === 1 && unavailableReason === null ? currencies[0] : null;
  const total = currency ? titheTotals[currency] : null;

  return {
    rate: safeRate,
    currencies,
    eligibleReceiptTotals,
    titheTotals,
    total,
    currency,
    unavailableReason,
  };
}
