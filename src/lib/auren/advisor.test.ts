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
  it("keeps personal scope separate from business activity", () => {
    const input = fixture();
    input.request = { period: "last_30d", scope: "personal", horizonDays: 30 };
    input.transactions = [
      {
        amount: 2500,
        type: "income",
        status: "posted",
        occurred_at: input.now?.toISOString() ?? "2026-08-21T12:00:00.000Z",
        business_id: null,
        business_name: null,
        financial_scope: "personal",
        deleted_at: null,
        account_id: "account-1",
      },
      ...input.transactions,
    ];
    const advisory = buildAurenAdvisory(input);
    expect(advisory.verified.income).toBe(2500);
    expect(advisory.businesses).toHaveLength(0);
    expect(advisory.verified.openLeads).toBe(0);
    expect(advisory.verified.pipelineValue).toBeNull();
  });
  it("flags negative cash pressure and withholds thin-data forecasts", () => {
    const input = fixture();
    input.transactions = input.transactions.slice(0, 2).map((row) => ({
      ...row,
      amount: row.type === "income" ? 300 : 600,
      occurred_at: input.now?.toISOString() ?? "2026-08-21T12:00:00.000Z",
    }));
    const advisory = buildAurenAdvisory(input);
    expect(advisory.outlook).toBe("under_pressure");
    expect(advisory.forecasts.income.base).toBeNull();
    expect(advisory.forecasts.income.method).toBe("insufficient_data");
  });
  it("adds reviewed public context without changing operational totals", () => {
    const advisory = buildAurenAdvisory(fixture());
    expect(advisory.externalContext.find((item) => item.business === "DailyGear")).toMatchObject({
      status: "verified_brand_context",
      sourceUrl: "https://dailygear.co.ke/",
    });
    expect(advisory.verified.income).toBe(14000);
    expect(advisory.forecasts.income.base).toBe(30000);
  });
  it("does not expose business public context in personal scope", () => {
    const input = fixture();
    input.request = { period: "last_30d", scope: "personal", horizonDays: 30 };
    expect(buildAurenAdvisory(input).externalContext).toHaveLength(0);
  });
});
