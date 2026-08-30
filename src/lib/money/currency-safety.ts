export interface CurrencyAccountLike {
  currency: string | null | undefined;
  status: string;
}

export interface CurrencySafetySummary {
  currency: string | null;
  isMixed: boolean;
}

export function summarizeCurrencySafety(accounts: CurrencyAccountLike[]): CurrencySafetySummary {
  const currencies = new Set(
    accounts
      .filter((account) => account.status === "active")
      .map((account) => account.currency?.trim().toUpperCase())
      .filter((currency): currency is string => Boolean(currency)),
  );

  if (currencies.size > 1) return { currency: null, isMixed: true };
  return { currency: currencies.values().next().value ?? null, isMixed: false };
}

export function guardAggregateMoneyValue(
  value: number,
  summary: CurrencySafetySummary,
): number | null {
  return summary.isMixed || !summary.currency ? null : value;
}
