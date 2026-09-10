import { describe, expect, it } from "vitest";
import { billMonthlyEquivalent, getBillDueState, nextBillDueDate } from "./bills";

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

describe("getBillDueState", () => {
  const today = new Date(2026, 8, 10); // 10 Sep 2026 local

  it("labels due today", () => {
    const state = getBillDueState("2026-09-10", "pending", today);
    expect(state.kind).toBe("due_today");
    expect(state.days).toBe(0);
    expect(state.label).toBe("Due today");
  });

  it("labels upcoming due in N days", () => {
    const state = getBillDueState("2026-09-14", "pending", today);
    expect(state.kind).toBe("upcoming");
    expect(state.days).toBe(4);
    expect(state.label).toBe("Due in 4 days");
  });

  it("labels overdue by N days", () => {
    const state = getBillDueState("2026-09-08", "pending", today);
    expect(state.kind).toBe("overdue");
    expect(state.days).toBe(-2);
    expect(state.label).toBe("Overdue by 2 days");
  });

  it("marks paid status without relative days", () => {
    const state = getBillDueState("2026-09-01", "paid", today);
    expect(state.kind).toBe("paid");
    expect(state.label).toBe("Paid");
  });
});
