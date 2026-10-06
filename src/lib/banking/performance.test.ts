import { describe, expect, it } from "vitest";
import {
  calculateKpiAchievement,
  calculateOverallAchievement,
  calculateWeightedContribution,
  CONTRACT_KPI_TEMPLATE,
} from "./performance";

describe("Banking KPI performance calculations", () => {
  it("calculates achievement as actual divided by target", () => {
    expect(calculateKpiAchievement(1_500_000, 2_000_000)).toBe(75);
    expect(calculateKpiAchievement(12, 10)).toBe(120);
  });

  it("returns zero when a numeric target is not configured", () => {
    expect(calculateKpiAchievement(10, null)).toBe(0);
    expect(calculateKpiAchievement(10, 0)).toBe(0);
  });

  it("calculates weighted contribution", () => {
    expect(calculateWeightedContribution(75, 30)).toBe(22.5);
    expect(calculateWeightedContribution(120, 5)).toBe(6);
  });

  it("calculates overall weighted achievement", () => {
    expect(
      calculateOverallAchievement([
        { actual_value: 1_500_000, target_value: 2_000_000, weight_percent: 30 },
        { actual_value: 8, target_value: 10, weight_percent: 5 },
      ]),
    ).toBe(26.5);
  });

  it("preserves the contractual KPI weights at 100%", () => {
    expect(CONTRACT_KPI_TEMPLATE.reduce((sum, kpi) => sum + kpi.weight_percent, 0)).toBe(100);
  });

  it("does not invent a numeric credit-card target", () => {
    const creditCards = CONTRACT_KPI_TEMPLATE.find((kpi) => kpi.code === "CREDIT_CARDS");
    expect(creditCards?.target_value).toBeNull();
  });
});
