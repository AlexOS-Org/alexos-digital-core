import { describe, expect, it } from "vitest";
import { billMonthlyEquivalent, nextBillDueDate } from "./bills";

describe("billMonthlyEquivalent", () => {
  it("normalizes recurring frequencies to a monthly planning amount", () => {
    expect(billMonthlyEquivalent(120, "weekly")).toBeCloseTo(520);
    expect(billMonthlyEquivalent(300, "monthly")).toBe(300);
    expect(billMonthlyEquivalent(900, "quarterly")).toBe(300);
    expect(billMonthlyEquivalent(1200, "yearly")).toBe(100);
  });

  it("does not treat one-time bills as recurring monthly obligations", () => {
    expect(billMonthlyEquivalent(1200, "one_time")).toBe(0);
  });

  it("does not produce negative planning obligations", () => {
    expect(billMonthlyEquivalent(-10, "monthly")).toBe(0);
  });

  it("advances every recurring frequency instead of marking quarterly and yearly bills one-time", () => {
    expect(nextBillDueDate("2026-01-15", "quarterly")).toBe("2026-04-15");
    expect(nextBillDueDate("2026-01-15", "yearly")).toBe("2027-01-15");
    expect(nextBillDueDate("2026-01-15", "one_time")).toBe("2026-01-15");
  });
});
