import { describe, expect, it } from "vitest";
import { carryForwardBudgets } from "./budget-calculations";

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
