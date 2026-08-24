import { describe, expect, it } from "vitest";
import {
  expenseTypeForCategory,
  isGiftIncome,
  isSalaryIncome,
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
});
