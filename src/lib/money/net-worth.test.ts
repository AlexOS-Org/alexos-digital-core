import { describe, expect, it } from "vitest";
import { calculateNetWorth } from "./net-worth";
import type { Asset, CryptoHolding } from "./net-worth-types";

const account = (
  overrides: Partial<Parameters<typeof calculateNetWorth>[0]["accounts"][number]> = {},
) => ({
  id: "account-1",
  balance: 0,
  currency: "KES",
  status: "active",
  financial_scope: "personal" as const,
  business_id: null,
  ...overrides,
});
const asset = (overrides: Partial<Asset> = {}) =>
  ({
    id: "asset-1",
    user_id: "user-1",
    business_id: null,
    name: "Laptop",
    asset_type: "equipment",
    value: 0,
    valuation_date: "2026-09-29",
    notes: null,
    status: "active",
    created_at: "2026-09-29",
    updated_at: "2026-09-29",
    ...overrides,
  }) as Asset;
const crypto = (overrides: Partial<CryptoHolding> = {}) =>
  ({
    id: "crypto-1",
    user_id: "user-1",
    exchange: "Binance",
    symbol: "BTC",
    quantity: 0,
    price_kes: 0,
    valued_at: "2026-09-29",
    notes: null,
    created_at: "2026-09-29",
    updated_at: "2026-09-29",
    ...overrides,
  }) as CryptoHolding;

const base = (overrides: Partial<Parameters<typeof calculateNetWorth>[0]> = {}) => ({
  accounts: [account()],
  balances: [{ account_id: "account-1", balance: 0 }],
  assets: [],
  cryptoHoldings: [],
  debts: [],
  expected: [],
  ...overrides,
});

describe("calculateNetWorth", () => {
  it("handles zero data", () => expect(calculateNetWorth(base()).total.netWorth).toBe(0));
  it("handles no assets and no debt", () =>
    expect(
      calculateNetWorth(base({ balances: [{ account_id: "account-1", balance: 100 }] })).total
        .netWorth,
    ).toBe(100));
  it("handles cash only", () =>
    expect(
      calculateNetWorth(base({ balances: [{ account_id: "account-1", balance: 1250.5 }] })).total
        .cash,
    ).toBe(1250.5));
  it("subtracts outstanding debt principal only", () =>
    expect(
      calculateNetWorth(base({ debts: [{ principal: 500, amount_paid: 125, status: "active" }] }))
        .total.liabilities,
    ).toBe(375));
  it("adds owned assets and subtracts debt", () =>
    expect(
      calculateNetWorth(
        base({
          assets: [asset({ value: 1000 })],
          debts: [{ principal: 500, amount_paid: 100, status: "active" }],
        }),
      ).total.netWorth,
    ).toBe(600));
  it("calculates personal-only finances", () =>
    expect(
      calculateNetWorth(base({ balances: [{ account_id: "account-1", balance: 700 }] })).personal
        .netWorth,
    ).toBe(700));
  it("calculates business-only finances", () =>
    expect(
      calculateNetWorth(
        base({
          accounts: [account({ financial_scope: "business", business_id: "business-1" })],
          balances: [{ account_id: "account-1", balance: 700 }],
          assets: [asset({ business_id: "business-1", value: 300 })],
          debts: [
            {
              principal: 100,
              amount_paid: 25,
              status: "active",
              financial_scope: "business",
              business_id: "business-1",
            },
          ],
        }),
      ).business.netWorth,
    ).toBe(925));
  it("consolidates personal and business without name matching", () =>
    expect(
      calculateNetWorth(
        base({
          accounts: [
            account(),
            account({
              id: "business-account",
              financial_scope: "business",
              business_id: "business-1",
            }),
          ],
          balances: [
            { account_id: "account-1", balance: 500 },
            { account_id: "business-account", balance: 800 },
          ],
        }),
      ).total.netWorth,
    ).toBe(1300));
  it("values crypto from the stored manual KES price", () =>
    expect(
      calculateNetWorth(base({ cryptoHoldings: [crypto({ quantity: 0.25, price_kes: 100000 })] }))
        .personal.assets,
    ).toBe(25000));
  it("supports multiple assets", () =>
    expect(
      calculateNetWorth(
        base({ assets: [asset({ value: 10 }), asset({ id: "asset-2", value: 20 })] }),
      ).personal.assets,
    ).toBe(30));
  it("excludes paid, archived, and deleted records", () =>
    expect(
      calculateNetWorth(
        base({
          assets: [asset({ value: 100, status: "archived" })],
          debts: [
            { principal: 500, amount_paid: 0, status: "paid" },
            { principal: 400, amount_paid: 0, status: "archived" },
            { principal: 300, amount_paid: 0, status: "active", deleted_at: "2026-09-29" },
          ],
        }),
      ).total.netWorth,
    ).toBe(0));
  it("does not double count a business-to-personal transfer because cash is balance-derived", () =>
    expect(
      calculateNetWorth(
        base({
          accounts: [
            account({ balance: 1000 }),
            account({
              id: "business-account",
              financial_scope: "business",
              business_id: "business-1",
              balance: 0,
            }),
          ],
          balances: [
            { account_id: "account-1", balance: 1000 },
            { account_id: "business-account", balance: 0 },
          ],
        }),
      ).total.netWorth,
    ).toBe(1000));
  it("keeps expected money out of actual net worth and shows it separately", () => {
    const result = calculateNetWorth(
      base({ expected: [{ amount: 1000, probability: 50, status: "pending" }] }),
    );
    expect(result.total.netWorth).toBe(0);
    expect(result.expectedMoney).toBe(1000);
    expect(result.expectedWeightedMoney).toBe(500);
    expect(result.expectedPosition).toBe(500);
  });
  it("rejects mixed currencies instead of producing a misleading total", () =>
    expect(
      calculateNetWorth(base({ accounts: [account(), account({ id: "usd", currency: "USD" })] }))
        .displayable,
    ).toBe(false));
  it("rejects unsupported non-KES aggregation when asset currency is unavailable", () =>
    expect(
      calculateNetWorth(
        base({ accounts: [account({ currency: "USD" })], assets: [asset({ value: 100 })] }),
      ).currencyState,
    ).toBe("unsupported"));
  it("rejects negative or invalid asset values", () =>
    expect(() => calculateNetWorth(base({ assets: [asset({ value: -1 })] }))).toThrow());
  it("preserves decimal money precision", () =>
    expect(
      calculateNetWorth(
        base({
          balances: [{ account_id: "account-1", balance: 0.1 }],
          assets: [asset({ value: 0.2 })],
          debts: [{ principal: 0.3, amount_paid: 0, status: "active" }],
        }),
      ).total.netWorth,
    ).toBe(0));
});
