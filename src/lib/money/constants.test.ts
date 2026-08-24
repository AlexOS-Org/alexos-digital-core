import { describe, expect, it } from "vitest";
import { EXPENSE_CATEGORIES, EXPENSE_TYPE_BY_CATEGORY, expenseTypeForCategory } from "./constants";

const DATABASE_EXPENSE_TYPES = new Set([
  "cost_of_goods",
  "packaging",
  "delivery",
  "logistics",
  "advertising",
  "platform_fee",
  "supplier",
  "payroll",
  "rent",
  "utilities",
  "tax",
  "debt_payment",
  "interest",
  "personal_living",
  "education",
  "health",
  "transport",
  "airtime",
  "other",
]);

describe("expense category to database type mapping", () => {
  it("maps every visible expense category to an accepted database value", () => {
    for (const category of EXPENSE_CATEGORIES) {
      expect(DATABASE_EXPENSE_TYPES.has(expenseTypeForCategory(category))).toBe(true);
    }
  });

  it("maps the observed Food failure to personal_living", () => {
    expect(expenseTypeForCategory("Food")).toBe("personal_living");
  });

  it("maps the approved tithe path to an accepted value", () => {
    expect(expenseTypeForCategory("Tithe")).toBe("other");
  });

  it("keeps the mapping explicit for every UI category", () => {
    expect(Object.keys(EXPENSE_TYPE_BY_CATEGORY).sort()).toEqual([...EXPENSE_CATEGORIES].sort());
  });
});
