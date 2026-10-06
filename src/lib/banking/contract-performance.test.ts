import { describe, expect, it } from "vitest";
import {
  CONTRACT_KPIS,
  scoreBand,
  scoreAchievement,
  weightedContribution,
  weightedScore,
  weeklyTarget,
} from "./contract-performance";

describe("KCB contract performance framework", () => {
  it("preserves the contract's eight-area 100% weighting", () => {
    expect(CONTRACT_KPIS).toHaveLength(8);
    expect(CONTRACT_KPIS.reduce((sum, kpi) => sum + kpi.weight_percent, 0)).toBe(100);
  });

  it("uses the practical Mobi target while retaining the contract rule", () => {
    const mobi = CONTRACT_KPIS.find((kpi) => kpi.code === "MOBI");
    expect(mobi?.target_value).toBe(10);
    expect(mobi?.qualification_rule).toContain("two successful financial transactions");
  });

  it("converts monthly targets into weekly pacing targets", () => {
    const loans = CONTRACT_KPIS.find((kpi) => kpi.code === "LOANS");
    expect(weeklyTarget(loans!)).toBeCloseTo(2_000_000 / 4.33, 6);
  });

  it("caps each area's weighted contribution at its contract weight", () => {
    expect(scoreAchievement(2, 1)).toBe(200);
    expect(weightedContribution(2, 1, 30)).toBe(30);
    expect(weightedScore([{ actual: 2, target: 1, weight: 30 }])).toBe(30);
  });

  it("maps the weighted score to promotion-readiness bands", () => {
    expect(scoreBand(40).label).toBe("Critical improvement focus");
    expect(scoreBand(80).label).toBe("Improving — below 90%");
    expect(scoreBand(95).label).toBe("Full-performance range");
    expect(scoreBand(105).label).toBe("Target exceeded");
  });
});
