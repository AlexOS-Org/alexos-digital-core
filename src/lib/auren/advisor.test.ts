import { describe, expect, it } from "vitest";
import {
  buildAurenAdvisory,
  validateAurenAdvisorRequest,
  type AurenAdvisoryInput,
} from "./advisor.server";

const snapshot = {
  accounts: [],
  balances: [],
  transactions: [],
  expected: [],
  bills: [],
  debts: [],
  goals: [],
  goalProgress: [],
  contacts: [],
  leads: [],
} as never;
function fixture(): AurenAdvisoryInput {
  const now = new Date("2026-08-21T12:00:00.000Z");
  const transactions = Array.from({ length: 28 }, (_, index) => {
    const date = new Date(now);
    date.setUTCDate(date.getUTCDate() - (index < 14 ? index : index + 16));
    return [
      {
        amount: 1000,
        type: "income",
        status: "posted",
        occurred_at: date.toISOString(),
        business_id: "business-1",
        business_name: "DailyGear",
        financial_scope: "business",
        deleted_at: null,
        account_id: "account-1",
      },
      {
        amount: 500,
        type: "expense",
        status: "posted",
        occurred_at: date.toISOString(),
        business_id: "business-1",
        business_name: "DailyGear",
        financial_scope: "business",
        deleted_at: null,
        account_id: "account-1",
      },
    ];
  }).flat();
  return {
    request: { period: "last_30d", scope: "businesses", horizonDays: 30 },
    now,
    businesses: [{ id: "business-1", name: "DailyGear", slug: "dailygear", status: "active" }],
    accounts: [{ id: "account-1", currency: "KES" }],
    transactions,
    expected: [],
    dailyGear: { products: [], orders: [] },
    dashboardSnapshot: snapshot,
  };
}
describe("Auren advisory contract", () => {
  it("rejects unsupported scope and horizon values", () => {
    expect(() => validateAurenAdvisorRequest({ scope: "unknown" })).toThrow("scope must be");
    expect(() => validateAurenAdvisorRequest({ horizonDays: 45 })).toThrow("horizonDays must be");
  });
  it("builds a transparent run-rate outlook from recorded periods", () => {
    const advisory = buildAurenAdvisory(fixture());
    expect(advisory.currency).toBe("KES");
    expect(advisory.verified.income).toBe(14000);
    expect(advisory.forecasts.income.base).toBe(30000);
    expect(advisory.forecasts.income.method).toBe("current_run_rate_range");
    expect(advisory.forecasts.income.confidence).toBe("medium");
    expect(advisory.businesses[0]?.name).toBe("DailyGear");
  });
});
