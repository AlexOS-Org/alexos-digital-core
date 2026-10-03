import { describe, expect, it } from "vitest";
import { buildReceivedExpectedTransaction } from "./expected-money";

describe("buildReceivedExpectedTransaction", () => {
  it("carries expected scope and business context into the income transaction", () => {
    const tx = buildReceivedExpectedTransaction(
      {
        amount: 12500,
        source: "DailyGear",
        description: "Order payout",
        financial_scope: "business",
        business_id: "business-1",
        business_name: "DailyGear",
      },
      "user-1",
      "account-1",
      "2026-08-31T00:00:00.000Z",
    );

    expect(tx).toMatchObject({
      user_id: "user-1",
      account_id: "account-1",
      amount: 12500,
      type: "income",
      financial_scope: "business",
      business_id: "business-1",
      business_name: "DailyGear",
      income_type: "other",
      flow_type: "standard",
    });
  });

  it("defaults legacy expected items to personal scope without a business", () => {
    const tx = buildReceivedExpectedTransaction(
      { amount: 5000, source: "Salary", description: null },
      "user-1",
      "account-1",
      "2026-08-31T00:00:00.000Z",
    );

    expect(tx).toMatchObject({
      financial_scope: "personal",
      business_id: null,
      business_name: null,
      income_type: "other",
      flow_type: "standard",
    });
  });

  it("explicitly sets income_type and flow_type on posted entries", () => {
    const tx = buildReceivedExpectedTransaction(
      {
        amount: 100000,
        source: "Invoice 001",
        financial_scope: "business",
        business_id: "biz-1",
      },
      "user-1",
      "acc-1",
      "2026-10-03T12:00:00.000Z",
    );

    expect(tx.income_type).toBe("other");
    expect(tx.flow_type).toBe("standard");
  });
});
