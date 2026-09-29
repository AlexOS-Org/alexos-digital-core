import { describe, expect, it } from "vitest";
import {
  aggregateExpectedMoney,
  buildReceivedExpectedTransaction,
  classifyExpectedMoney,
  expectedCurrencyState,
  expectedMoneyScopeMatches,
  isQualifyingReceivable,
} from "./expected-money";

const base = {
  id: "expected-1",
  expected_date: "2026-09-29",
  amount: 12_500,
  probability: 80,
  status: "pending" as const,
  financial_scope: "personal" as const,
  business_id: null,
  received_transaction_id: null,
};

const settledTransaction = {
  id: "tx-1",
  status: "posted" as const,
  deleted_at: null,
  type: "income",
  amount: 12_500,
  financial_scope: "personal" as const,
  business_id: null,
};

describe("classifyExpectedMoney", () => {
  it("distinguishes future, due today, and overdue date-only values in UTC", () => {
    expect(
      classifyExpectedMoney({ ...base, expected_date: "2026-09-30" }, "2026-09-29T23:59:59.999Z"),
    ).toBe("expected");
    expect(classifyExpectedMoney(base, "2026-09-29T23:59:59.999Z")).toBe("due");
    expect(
      classifyExpectedMoney({ ...base, expected_date: "2026-09-28" }, "2026-09-29T00:00:00.000Z"),
    ).toBe("overdue");
  });

  it("recognizes settled expected money only when the linked actual is valid", () => {
    expect(
      classifyExpectedMoney(
        { ...base, status: "received", received_transaction_id: "tx-1" },
        "2026-09-29",
        settledTransaction,
      ),
    ).toBe("received");
    expect(
      classifyExpectedMoney(
        { ...base, status: "received", received_transaction_id: "tx-1" },
        "2026-09-29",
      ),
    ).toBe("needs_reconciliation");
    expect(
      classifyExpectedMoney(
        { ...base, status: "received", received_transaction_id: "tx-1" },
        "2026-09-29",
        { ...settledTransaction, status: "void" },
      ),
    ).toBe("needs_reconciliation");
    expect(
      classifyExpectedMoney(
        { ...base, status: "received", received_transaction_id: "tx-1" },
        "2026-09-29",
        { ...settledTransaction, amount: 1 },
      ),
    ).toBe("needs_reconciliation");
  });

  it("does not treat cancelled or linked-pending records as collectible", () => {
    expect(classifyExpectedMoney({ ...base, status: "cancelled" }, "2026-09-29")).toBe("cancelled");
    expect(classifyExpectedMoney({ ...base, received_transaction_id: "tx-1" }, "2026-09-29")).toBe(
      "needs_reconciliation",
    );
  });

  it("identifies only active pending states as qualifying receivables", () => {
    expect(
      isQualifyingReceivable({ ...base, expected_date: "2026-09-30" }, null, "2026-09-29"),
    ).toBe(true);
    expect(
      isQualifyingReceivable(
        { ...base, status: "received", received_transaction_id: "tx-1" },
        settledTransaction,
        "2026-09-29",
      ),
    ).toBe(false);
    expect(isQualifyingReceivable({ ...base, status: "cancelled" }, null, "2026-09-29")).toBe(
      false,
    );
  });
});

describe("expectedMoneyScopeMatches", () => {
  it("keeps personal and business records isolated", () => {
    expect(
      expectedMoneyScopeMatches(
        { financial_scope: "personal", business_id: null },
        { financial_scope: "personal", business_id: null },
      ),
    ).toBe(true);
    expect(
      expectedMoneyScopeMatches(
        { financial_scope: "personal", business_id: null },
        { financial_scope: "business", business_id: "biz-1" },
      ),
    ).toBe(false);
    expect(
      expectedMoneyScopeMatches(
        { financial_scope: "business", business_id: "biz-1" },
        { financial_scope: "business", business_id: "biz-1" },
      ),
    ).toBe(true);
    expect(
      expectedMoneyScopeMatches(
        { financial_scope: "business", business_id: "biz-1" },
        { financial_scope: "business", business_id: "biz-2" },
      ),
    ).toBe(false);
  });
});

describe("expectedCurrencyState", () => {
  it("does not fabricate conversion", () => {
    expect(expectedCurrencyState({ amount: 100, currency: "KES" }, "KES")).toBe("supported");
    expect(expectedCurrencyState({ amount: 100, currency: "USD" }, "KES")).toBe("unsupported");
    expect(expectedCurrencyState({ amount: 100, currency: null }, "KES")).toBe("unsupported");
  });
});

describe("aggregateExpectedMoney", () => {
  it("aggregates only when every record has a known matching account currency", () => {
    expect(
      aggregateExpectedMoney(
        [
          { ...base, account_id: "account-1", amount: 100.1 },
          { ...base, id: "expected-2", account_id: "account-1", amount: 0.2 },
        ],
        [{ id: "account-1", currency: "KES", status: "active" }],
        () => true,
      ),
    ).toBe(100.3);
    expect(
      aggregateExpectedMoney(
        [base],
        [{ id: "account-1", currency: "KES", status: "active" }],
        () => true,
      ),
    ).toBeNull();
    expect(aggregateExpectedMoney([], [], () => true)).toBe(0);
  });
});

describe("buildReceivedExpectedTransaction", () => {
  it("creates one authoritative standard income transaction with deterministic reference", () => {
    const first = buildReceivedExpectedTransaction(
      { ...base, source: "Salary", description: "September salary" },
      "user-1",
      "account-1",
      "2026-09-29T08:00:00.000Z",
    );
    const retry = buildReceivedExpectedTransaction(
      { ...base, source: "Salary", description: "September salary" },
      "user-1",
      "account-1",
      "2026-09-29T08:01:00.000Z",
    );
    expect(first).toMatchObject({
      user_id: "user-1",
      account_id: "account-1",
      amount: 12_500,
      type: "income",
      reference: "EXPECTED:expected-1",
      flow_type: "standard",
      financial_scope: "personal",
      business_id: null,
    });
    expect(retry.reference).toBe(first.reference);
    expect(first.type).not.toBe("transfer");
  });

  it("keeps multiple Expected Money records independently addressable", () => {
    const first = buildReceivedExpectedTransaction(
      { ...base, id: "expected-1", source: "Salary" },
      "user-1",
      "account-1",
      "2026-09-29T08:00:00.000Z",
    );
    const second = buildReceivedExpectedTransaction(
      { ...base, id: "expected-2", source: "Commission" },
      "user-1",
      "account-1",
      "2026-09-29T08:00:00.000Z",
    );
    expect(first.reference).not.toBe(second.reference);
  });
});
