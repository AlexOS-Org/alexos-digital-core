import { describe, expect, it } from "vitest";
import { calculateTithe } from "./tithe-calculations";

const income = (overrides: Record<string, unknown> = {}) => ({
  type: "income" as const,
  status: "posted" as const,
  amount: 10_000,
  source: "Customer Payment",
  income_type: "sales_revenue",
  currency: "KES",
  ...overrides,
});

describe("calculateTithe", () => {
  it("calculates 10% of all posted non-gift receipts, including business receipts", () => {
    const result = calculateTithe([
      income({ amount: 10_000, financial_scope: "business" }),
      income({ amount: 5_000, source: "Salary", income_type: "salary" }),
    ]);

    expect(result.total).toBe(1_500);
    expect(result.currency).toBe("KES");
    expect(result.eligibleReceiptTotals).toEqual({ KES: 15_000 });
    expect(result.titheTotals).toEqual({ KES: 1_500 });
  });

  it("excludes gifts identified by source or income type", () => {
    const result = calculateTithe([
      income({ amount: 10_000, source: "Gift", income_type: null }),
      income({ amount: 20_000, source: "Family", income_type: "gift" }),
      income({ amount: 5_000 }),
    ]);

    expect(result.total).toBe(500);
    expect(result.eligibleReceiptTotals).toEqual({ KES: 5_000 });
  });

  it("excludes non-income, pending, void, zero, negative, null, and invalid amounts", () => {
    const result = calculateTithe([
      income({ amount: 10_000, type: "transfer" }),
      income({ amount: 10_000, status: "pending" }),
      income({ amount: 10_000, status: "void" }),
      income({ amount: 0 }),
      income({ amount: -100 }),
      income({ amount: null }),
      income({ amount: "not-a-number" }),
      income({ amount: 2_000 }),
    ]);

    expect(result.total).toBe(200);
    expect(result.eligibleReceiptTotals).toEqual({ KES: 2_000 });
  });

  it("handles decimals and large receipt values deterministically", () => {
    const result = calculateTithe([
      income({ amount: "1234.56" }),
      income({ amount: 9_876_543.21 }),
    ]);

    expect(result.total).toBeCloseTo(987_777.777, 8);
  });

  it("withholds a combined total for mixed currencies", () => {
    const result = calculateTithe([
      income({ amount: 10_000, currency: "KES" }),
      income({ amount: 100, currency: "USD" }),
    ]);

    expect(result.total).toBeNull();
    expect(result.currency).toBeNull();
    expect(result.unavailableReason).toBe("mixed_currency");
    expect(result.titheTotals).toEqual({ KES: 1_000, USD: 10 });
  });

  it("withholds a combined total when currency is missing", () => {
    const result = calculateTithe([income({ amount: 10_000, currency: null })]);

    expect(result.total).toBeNull();
    expect(result.currency).toBeNull();
    expect(result.unavailableReason).toBe("unknown_currency");
    expect(result.titheTotals).toEqual({ UNKNOWN: 1_000 });
  });

  it("returns a zero total for an empty receipt set", () => {
    const result = calculateTithe([]);

    expect(result.total).toBeNull();
    expect(result.currencies).toEqual([]);
    expect(result.unavailableReason).toBeNull();
  });
});
