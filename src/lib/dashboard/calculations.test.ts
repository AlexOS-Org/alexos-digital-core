import { describe, expect, it } from "vitest";
import { computeMoneyMetrics } from "./calculations";
import type { DashboardSnapshot } from "./types";

const emptySnapshot = (accounts: DashboardSnapshot["accounts"]): DashboardSnapshot => ({
  accounts,
  balances: [],
  transactions: [],
  expected: [],
  bills: [],
  debts: [],
  goals: [],
  goalProgress: [],
  contacts: [],
  leads: [],
});

describe("computeMoneyMetrics currency safety", () => {
  it("reports mixed active currencies so dashboard consumers can withhold aggregates", () => {
    const metrics = computeMoneyMetrics(
      emptySnapshot([
        { id: "kes", currency: "KES", status: "active" } as DashboardSnapshot["accounts"][number],
        { id: "usd", currency: "USD", status: "active" } as DashboardSnapshot["accounts"][number],
      ]),
    );

    expect(metrics.currencySafety).toEqual({ currency: null, isMixed: true });
  });
});
