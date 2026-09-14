import { describe, expect, it } from "vitest";
import {
  carryForwardBudgets,
  expenseCategoriesForBudget,
  spentForBudgetCategory,
} from "./budget-calculations";

describe("carryForwardBudgets", () => {
  it("carries the latest limit into a future month", () => {
    const result = carryForwardBudgets(
      [{ category: "Rent", month: "2026-01-01", amount: 13_000, deleted_at: null }],
      "2026-02-01",
    );

    expect(result).toEqual([
      { category: "Rent", month: "2026-01-01", amount: 13_000, deleted_at: null },
    ]);
  });

  it("uses a later category-specific override from its start month", () => {
    const rows = [
      { category: "Rent", month: "2026-03-01", amount: 14_000, deleted_at: null },
      { category: "Rent", month: "2026-01-01", amount: 13_000, deleted_at: null },
    ];

    expect(carryForwardBudgets(rows, "2026-02-01")[0]?.amount).toBe(13_000);
    expect(carryForwardBudgets(rows, "2026-03-01")[0]?.amount).toBe(14_000);
  });

  it("does not resurrect an older limit after the latest instruction is archived", () => {
    const rows = [
      {
        category: "Rent",
        month: "2026-02-01",
        amount: 13_000,
        deleted_at: "2026-02-15T00:00:00.000Z",
      },
      { category: "Rent", month: "2026-01-01", amount: 13_000, deleted_at: null },
    ];

    expect(carryForwardBudgets(rows, "2026-03-01")).toEqual([]);
  });
});

describe("spentForBudgetCategory (Kids rollup)", () => {
  const spent = {
    Kids: 1_000,
    "Kids — School Fees": 5_000,
    "Kids — Expenses": 2_000,
    "Kids — Shopping": 500,
    Food: 3_000,
  };

  it("rolls all kids subcategory spend into the parent Kids budget", () => {
    expect(spentForBudgetCategory(spent, "Kids")).toBe(8_500);
  });

  it("keeps exact match for subcategory budgets", () => {
    expect(spentForBudgetCategory(spent, "Kids — School Fees")).toBe(5_000);
    expect(spentForBudgetCategory(spent, "Kids — Expenses")).toBe(2_000);
  });

  it("does not affect non-kids budgets", () => {
    expect(spentForBudgetCategory(spent, "Food")).toBe(3_000);
    expect(spentForBudgetCategory(spent, "Rent")).toBe(0);
  });

  it("lists parent Kids categories", () => {
    expect(expenseCategoriesForBudget("Kids")).toEqual([
      "Kids",
      "Kids — School Fees",
      "Kids — Expenses",
      "Kids — Shopping",
    ]);
  });
});
