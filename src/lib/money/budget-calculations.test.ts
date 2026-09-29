import { describe, expect, it } from "vitest";
import {
  calculateBudget,
  calculateConsolidatedBudgets,
  carryForwardBudgets,
  expenseCategoriesForBudget,
  spentForBudgetCategory,
  type BudgetExpense,
  type BudgetSnapshot,
} from "./budget-calculations";

const personalBudget = (overrides: Partial<BudgetSnapshot> = {}): BudgetSnapshot => ({
  category: "Food",
  month: "2026-09-01",
  amount: 10_000,
  deleted_at: null,
  financial_scope: "personal",
  business_id: null,
  ...overrides,
});

const expense = (overrides: Partial<BudgetExpense> = {}): BudgetExpense => ({
  id: "expense-1",
  occurred_at: "2026-09-15T10:00:00.000Z",
  type: "expense",
  status: "posted",
  deleted_at: null,
  amount: 2_500,
  category: "Food",
  expense_scope: "personal",
  financial_scope: "personal",
  business_id: null,
  account_id: "cash-1",
  currency: "KES",
  ...overrides,
});

const period = { from: "2026-09-01T00:00:00.000Z", toExclusive: "2026-10-01T00:00:00.000Z" };
const personalAccounts = [
  { id: "cash-1", currency: "KES", status: "active", financial_scope: "personal" as const },
];

describe("carryForwardBudgets", () => {
  it("carries the latest limit into a future month", () => {
    expect(
      carryForwardBudgets([personalBudget({ month: "2026-01-01", amount: 13_000 })], "2026-02-01"),
    ).toEqual([personalBudget({ month: "2026-01-01", amount: 13_000 })]);
  });

  it("keeps personal and business budgets independent", () => {
    const rows = [
      personalBudget({ amount: 10_000 }),
      personalBudget({ amount: 25_000, financial_scope: "business", business_id: "biz-1" }),
    ];
    expect(carryForwardBudgets(rows, "2026-09-01")).toHaveLength(2);
  });

  it("uses a later scope-specific override", () => {
    const rows = [
      personalBudget({ month: "2026-03-01", amount: 14_000 }),
      personalBudget({ month: "2026-01-01", amount: 13_000 }),
    ];
    expect(carryForwardBudgets(rows, "2026-02-01")[0]?.amount).toBe(13_000);
    expect(carryForwardBudgets(rows, "2026-03-01")[0]?.amount).toBe(14_000);
  });

  it("does not resurrect an older limit after the latest instruction is archived", () => {
    expect(
      carryForwardBudgets(
        [
          personalBudget({ month: "2026-02-01", deleted_at: "2026-02-15T00:00:00.000Z" }),
          personalBudget({ month: "2026-01-01" }),
        ],
        "2026-03-01",
      ),
    ).toEqual([]);
  });
});

describe("category matching", () => {
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

  it("keeps exact matching for subcategory budgets", () => {
    expect(spentForBudgetCategory(spent, "Kids — School Fees")).toBe(5_000);
    expect(spentForBudgetCategory(spent, "Rent")).toBe(0);
    expect(expenseCategoriesForBudget("Kids")).toEqual([
      "Kids",
      "Kids — School Fees",
      "Kids — Expenses",
      "Kids — Shopping",
    ]);
  });
});

describe("calculateBudget", () => {
  it("counts personal expense activity for a personal budget", () => {
    const result = calculateBudget({
      budget: personalBudget(),
      expenses: [expense()],
      period,
      accountCurrencies: personalAccounts,
    });
    expect(result.actual).toBe(2_500);
    expect(result.state).toBe("supported");
  });

  it("counts business expense activity for the matching business budget", () => {
    const budget = personalBudget({ financial_scope: "business", business_id: "biz-1" });
    const result = calculateBudget({
      budget,
      expenses: [
        expense({ expense_scope: "business", financial_scope: "business", business_id: "biz-1" }),
      ],
      period,
      accountCurrencies: [
        {
          id: "business-1",
          currency: "KES",
          status: "active",
          financial_scope: "business",
          business_id: "biz-1",
        },
      ],
    });
    expect(result.actual).toBe(2_500);
  });

  it("keeps personal budgets free of business expenses", () => {
    const result = calculateBudget({
      budget: personalBudget(),
      expenses: [
        expense({ expense_scope: "business", financial_scope: "business", business_id: "biz-1" }),
      ],
      period,
      accountCurrencies: personalAccounts,
    });
    expect(result.actual).toBe(0);
    expect(result.state).toBe("no_activity");
  });

  it("keeps business budgets free of personal expenses and other businesses", () => {
    const budget = personalBudget({ financial_scope: "business", business_id: "biz-1" });
    const result = calculateBudget({
      budget,
      expenses: [
        expense(),
        expense({ id: "expense-2", expense_scope: "business", business_id: "biz-2" }),
      ],
      period,
      accountCurrencies: [
        {
          id: "business-1",
          currency: "KES",
          status: "active",
          financial_scope: "business",
          business_id: "biz-1",
        },
      ],
    });
    expect(result.actual).toBe(0);
  });

  it("excludes transfers, pending, voided, deleted, invalid, and negative rows", () => {
    const result = calculateBudget({
      budget: personalBudget(),
      expenses: [
        expense(),
        expense({ id: "transfer", type: "transfer" }),
        expense({ id: "pending", status: "pending" }),
        expense({ id: "void", status: "void" }),
        expense({ id: "deleted", deleted_at: "2026-09-20T00:00:00Z" }),
        expense({ id: "negative", amount: -10 }),
        expense({ id: "invalid", amount: Number.NaN }),
      ],
      period,
      accountCurrencies: personalAccounts,
    });
    expect(result.actual).toBe(2_500);
    expect(result.matchingExpenseCount).toBe(1);
  });

  it("uses an inclusive start and exclusive end date boundary", () => {
    const result = calculateBudget({
      budget: personalBudget(),
      expenses: [
        expense({ id: "start", occurred_at: "2026-09-01T00:00:00.000Z" }),
        expense({ id: "end", occurred_at: "2026-10-01T00:00:00.000Z" }),
      ],
      period,
      accountCurrencies: personalAccounts,
    });
    expect(result.actual).toBe(2_500);
    expect(result.matchingExpenseCount).toBe(1);
  });

  it("calculates remaining, utilization, and over-budget state safely", () => {
    const result = calculateBudget({
      budget: personalBudget({ amount: 2_000 }),
      expenses: [expense()],
      period,
      accountCurrencies: personalAccounts,
    });
    expect(result.remaining).toBe(-500);
    expect(result.utilizationPct).toBe(125);
    expect(result.overBudget).toBe(true);
  });

  it("handles exact budget, zero budget, zero activity, and invalid values", () => {
    const exact = calculateBudget({
      budget: personalBudget({ amount: 2_500 }),
      expenses: [expense()],
      period,
      accountCurrencies: personalAccounts,
    });
    expect(exact.remaining).toBe(0);
    expect(exact.utilizationPct).toBe(100);
    expect(exact.overBudget).toBe(false);

    const zeroBudget = calculateBudget({
      budget: personalBudget({ amount: 0 }),
      expenses: [],
      period,
      accountCurrencies: personalAccounts,
    });
    expect(zeroBudget.utilizationPct).toBeNull();
    expect(zeroBudget.remaining).toBe(0);

    const noActivity = calculateBudget({
      budget: personalBudget(),
      expenses: [],
      period,
      accountCurrencies: personalAccounts,
    });
    expect(noActivity.state).toBe("no_activity");
    expect(noActivity.actual).toBe(0);

    expect(
      calculateBudget({ budget: personalBudget({ amount: -1 }), expenses: [], period }).state,
    ).toBe("invalid");
  });

  it("does not fabricate FX for mixed or unsupported currencies", () => {
    const mixed = calculateBudget({
      budget: personalBudget(),
      expenses: [expense({ currency: "KES" }), expense({ id: "usd", currency: "USD" })],
      period,
      accountCurrencies: personalAccounts,
    });
    expect(mixed.state).toBe("unsupported_currency");
    expect(mixed.actual).toBeNull();
    expect(mixed.utilizationPct).toBeNull();
  });
});

describe("calculateConsolidatedBudgets", () => {
  it("does not double-count one expense matched by parent and child budgets", () => {
    const budgets = [
      personalBudget({ category: "Kids", amount: 10_000 }),
      personalBudget({ category: "Kids — School Fees", amount: 6_000 }),
    ];
    const result = calculateConsolidatedBudgets(
      budgets,
      [expense({ category: "Kids — School Fees" })],
      period,
      personalAccounts,
    );
    expect(result.actual).toBe(2_500);
    expect(result.matchingExpenseCount).toBe(1);
  });

  it("keeps separate personal and business activity in one derived consolidated view", () => {
    const budgets = [
      personalBudget({ amount: 10_000 }),
      personalBudget({ financial_scope: "business", business_id: "biz-1", amount: 20_000 }),
    ];
    const result = calculateConsolidatedBudgets(
      budgets,
      [
        expense(),
        expense({
          id: "business-expense",
          expense_scope: "business",
          financial_scope: "business",
          business_id: "biz-1",
          account_id: "business-1",
        }),
      ],
      period,
      [
        ...personalAccounts,
        {
          id: "business-1",
          currency: "KES",
          status: "active",
          financial_scope: "business",
          business_id: "biz-1",
        },
      ],
    );
    expect(result.actual).toBe(5_000);
    expect(result.matchingExpenseCount).toBe(2);
  });

  it("returns an honest empty state when no budgets exist", () => {
    const result = calculateConsolidatedBudgets([], [], period);
    expect(result.state).toBe("no_activity");
    expect(result.actual).toBe(0);
    expect(result.unavailableReason).toContain("No active budgets");
  });
});
