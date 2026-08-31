import { describe, expect, it } from "vitest";
import { buildReceivedExpectedTransaction } from "./expected-money";

describe("buildReceivedExpectedTransaction", () => {
  it("carries expected scope and business context into the income transaction", () => {
    expect(
      buildReceivedExpectedTransaction(
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
      ),
    ).toMatchObject({
      user_id: "user-1",
      account_id: "account-1",
      amount: 12500,
      type: "income",
      financial_scope: "business",
      business_id: "business-1",
      business_name: "DailyGear",
    });
  });

  it("defaults legacy expected items to personal scope without a business", () => {
    expect(
      buildReceivedExpectedTransaction(
        { amount: 5000, source: "Salary", description: null },
        "user-1",
        "account-1",
        "2026-08-31T00:00:00.000Z",
      ),
    ).toMatchObject({
      financial_scope: "personal",
      business_id: null,
      business_name: null,
    });
  });
});
