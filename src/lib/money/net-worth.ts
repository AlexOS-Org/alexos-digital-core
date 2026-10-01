import type { Asset, CryptoHolding } from "./net-worth-types";

export type NetWorthScope = "personal" | "business";
export type NetWorthCurrencyState = "empty" | "supported" | "mixed" | "unsupported";

export interface NetWorthAccount {
  id: string;
  balance?: number;
  currency: string | null | undefined;
  status: string;
  deleted_at?: string | null;
  financial_scope?: NetWorthScope | null;
  business_id?: string | null;
}

export interface NetWorthDebt {
  principal: number;
  amount_paid: number;
  status: string;
  deleted_at?: string | null;
  financial_scope?: NetWorthScope | null;
  business_id?: string | null;
}

export interface NetWorthExpected {
  amount: number;
  probability: number;
  status: string;
  deleted_at?: string | null;
  financial_scope?: NetWorthScope | null;
  business_id?: string | null;
}

export interface NetWorthBalance {
  account_id: string;
  balance: number;
}

export interface NetWorthInput {
  accounts: NetWorthAccount[];
  balances?: NetWorthBalance[];
  assets?: Asset[];
  cryptoHoldings?: CryptoHolding[];
  debts?: NetWorthDebt[];
  expected?: NetWorthExpected[];
}

export interface NetWorthBreakdown {
  cash: number;
  assets: number;
  liabilities: number;
  netWorth: number;
}

export interface NetWorthResult {
  currency: string | null;
  currencyState: NetWorthCurrencyState;
  displayable: boolean;
  unavailableReason: string | null;
  personal: NetWorthBreakdown;
  business: NetWorthBreakdown;
  total: NetWorthBreakdown;
  expectedMoney: number;
  expectedWeightedMoney: number;
  expectedPosition: number;
}

const num = (value: unknown, label: string): number => {
  const parsed = typeof value === "string" ? Number(value) : Number(value ?? 0);
  if (!Number.isFinite(parsed)) throw new Error(`${label} must be a finite number`);
  return parsed;
};

const money = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

function scopeOf(value: {
  financial_scope?: NetWorthScope | null;
  business_id?: string | null;
}): NetWorthScope {
  return value.business_id || value.financial_scope === "business" ? "business" : "personal";
}

function emptyBreakdown(): NetWorthBreakdown {
  return { cash: 0, assets: 0, liabilities: 0, netWorth: 0 };
}

function addBreakdown(
  target: NetWorthBreakdown,
  field: keyof Omit<NetWorthBreakdown, "netWorth">,
  value: number,
) {
  target[field] = money(target[field] + value);
  target.netWorth = money(target.cash + target.assets - target.liabilities);
}

export function calculateNetWorth(input: NetWorthInput): NetWorthResult {
  const accounts = input.accounts.filter(
    (account) => account.status === "active" && !account.deleted_at,
  );
  const currencies = new Set(
    accounts
      .map((account) => account.currency?.trim().toUpperCase())
      .filter((currency): currency is string => Boolean(currency)),
  );
  const currency = currencies.size === 1 ? [...currencies][0] : null;
  const currencyState: NetWorthCurrencyState =
    currencies.size === 0
      ? "empty"
      : currencies.size > 1
        ? "mixed"
        : currency === "KES"
          ? "supported"
          : "unsupported";
  const displayable = currencyState === "supported";
  const unavailableReason = displayable
    ? null
    : currencyState === "mixed"
      ? "Active accounts use multiple currencies; no authoritative FX conversion is available."
      : currencyState === "unsupported"
        ? "The existing asset and expected-money records have no currency field; only KES aggregation is supported safely."
        : "Add an active KES account before viewing a consolidated net-worth total.";

  const result = {
    currency,
    currencyState,
    displayable,
    unavailableReason,
    personal: emptyBreakdown(),
    business: emptyBreakdown(),
    total: emptyBreakdown(),
    expectedMoney: 0,
    expectedWeightedMoney: 0,
    expectedPosition: 0,
  } satisfies NetWorthResult;

  const balancesByAccount = new Map(
    (input.balances ?? []).map((balance) => [
      balance.account_id,
      num(balance.balance, "Account balance"),
    ]),
  );
  for (const account of accounts) {
    const breakdown = scopeOf(account) === "business" ? result.business : result.personal;
    addBreakdown(
      breakdown,
      "cash",
      balancesByAccount.get(account.id) ?? num(account.balance, "Account balance"),
    );
  }

  for (const asset of input.assets ?? []) {
    if (asset.status !== "active") continue;
    const value = num(asset.value, `Asset ${asset.name} value`);
    if (value < 0) throw new Error(`Asset ${asset.name} value cannot be negative`);
    const breakdown = asset.business_id ? result.business : result.personal;
    addBreakdown(breakdown, "assets", value);
  }

  for (const holding of input.cryptoHoldings ?? []) {
    const quantity = num(holding.quantity, `Crypto ${holding.symbol} quantity`);
    const price = num(holding.price_kes, `Crypto ${holding.symbol} price`);
    if (quantity < 0 || price < 0)
      throw new Error(`Crypto ${holding.symbol} values cannot be negative`);
    addBreakdown(result.personal, "assets", money(quantity * price));
  }

  for (const debt of input.debts ?? []) {
    if (debt.deleted_at || debt.status === "paid" || debt.status === "archived") continue;
    const principal = num(debt.principal, "Debt principal");
    const amountPaid = num(debt.amount_paid, "Debt amount paid");
    const remaining = Math.max(0, principal - amountPaid);
    const breakdown = scopeOf(debt) === "business" ? result.business : result.personal;
    addBreakdown(breakdown, "liabilities", remaining);
  }

  for (const expected of input.expected ?? []) {
    if (expected.deleted_at || expected.status !== "pending") continue;
    const amount = num(expected.amount, "Expected-money amount");
    const probability = num(expected.probability, "Expected-money probability");
    if (amount < 0 || probability < 0 || probability > 100) {
      throw new Error("Expected-money amount and probability must be valid non-negative values");
    }
    result.expectedMoney = money(result.expectedMoney + amount);
    result.expectedWeightedMoney = money(
      result.expectedWeightedMoney + (amount * probability) / 100,
    );
  }

  result.total = {
    cash: money(result.personal.cash + result.business.cash),
    assets: money(result.personal.assets + result.business.assets),
    liabilities: money(result.personal.liabilities + result.business.liabilities),
    netWorth: money(result.personal.netWorth + result.business.netWorth),
  };
  result.expectedPosition = money(result.total.netWorth + result.expectedWeightedMoney);
  return result;
}
