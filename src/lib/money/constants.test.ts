import { describe, expect, it } from "vitest";
import {
  expenseTypeForCategory,
  isGiftIncome,
  isSalaryIncome,
  isSavingsEligibleIncome,
  isTitheEligibleIncome,
  normalizeExpenseCategory,
} from "./constants";

describe("Money Center category and income rules", () => {
  it("collapses legacy Water variants into one Water category", () => {
    expect(normalizeExpenseCategory("Water")).toBe("Water");
    expect(normalizeExpenseCategory("Water — Home")).toBe("Water");
    expect(normalizeExpenseCategory("Water — Office")).toBe("Water");
    expect(expenseTypeForCategory("Water")).toBe("utilities");
  });

  it("recognizes salary only from an explicit salary source or type", () => {
    expect(isSalaryIncome({ source: "Salary", income_type: null })).toBe(true);
    expect(isSalaryIncome({ source: "Gift", income_type: "gift" })).toBe(false);
    expect(isSalaryIncome({ source: "Customer Payment", income_type: null })).toBe(false);
  });

  it("marks gifts as non-salary income", () => {
    expect(isGiftIncome({ source: "Gift", income_type: null })).toBe(true);
    expect(isGiftIncome({ source: "Salary", income_type: "salary" })).toBe(false);
  });

  it("includes every non-gift income source in tithe eligibility", () => {
    expect(isTitheEligibleIncome({ source: "Salary", income_type: "salary" })).toBe(true);
    expect(isTitheEligibleIncome({ source: "Customer Payment", income_type: "commission" })).toBe(
      true,
    );
    expect(isTitheEligibleIncome({ source: "Interest", income_type: "interest" })).toBe(true);
    expect(isTitheEligibleIncome({ source: "Gift", income_type: "gift" })).toBe(false);
  });

  it("uses the same gift exclusion for Emergency Fund savings", () => {
    const eligibleCategories = [
      { source: "Salary", income_type: "salary" },
      { source: "Customer Payment", income_type: "sales_revenue" },
      { source: "Commission", income_type: "commission" },
      { source: "Interest", income_type: "investment" },
      { source: "Refund", income_type: "refund" },
      { source: "Personal Deal", income_type: "personal_deal" },
    ];

    for (const income of eligibleCategories) {
      expect(isSavingsEligibleIncome(income)).toBe(true);
    }
    expect(isSavingsEligibleIncome({ source: "Gift", income_type: "gift" })).toBe(false);
    expect(isSavingsEligibleIncome({ source: "Gift", income_type: null })).toBe(false);
  });
});
