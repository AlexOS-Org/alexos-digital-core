export interface BudgetSnapshot {
  category: string;
  month: string;
  amount: number;
  deleted_at: string | null;
}

/**
 * Returns the latest budget instruction at or before the selected month for
 * each category. A budget row is a monthly limit template from its start
 * month onward; the transaction query remains month-specific, so usage resets
 * naturally when the selected month changes.
 *
 * Keeping deleted rows in the input is intentional. If the latest instruction
 * for a category is archived, an older row must not resurrect itself in a
 * future month.
 */
export function carryForwardBudgets<T extends BudgetSnapshot>(rows: T[], selectedMonth: string) {
  const latestByCategory = new Map<string, T>();

  for (const row of rows) {
    if (!row.category || row.month > selectedMonth || latestByCategory.has(row.category)) continue;
    latestByCategory.set(row.category, row);
  }

  return Array.from(latestByCategory.values())
    .filter((row) => row.deleted_at == null)
    .sort((a, b) => a.category.localeCompare(b.category));
}

/** Expense category labels that roll into the parent "Kids" monthly budget. */
export const KIDS_BUDGET_SPEND_CATEGORIES = [
  "Kids",
  "Kids — School Fees",
  "Kids — Expenses",
  "Kids — Shopping",
] as const;

/**
 * Categories whose posted expenses count toward a given budget card.
 * Parent "Kids" includes all kids subcategories so school fees / expenses /
 * shopping hit the Kids monthly limit. Any other budget (including a
 * subcategory budget, if one exists) still matches exact category only.
 */
export function expenseCategoriesForBudget(budgetCategory: string): string[] {
  const cat = (budgetCategory ?? "").trim();
  if (cat === "Kids") return [...KIDS_BUDGET_SPEND_CATEGORIES];
  return cat ? [cat] : [];
}

/** Sum spent amounts for the categories that apply to this budget card. */
export function spentForBudgetCategory(
  spentByCat: Record<string, number>,
  budgetCategory: string,
): number {
  return expenseCategoriesForBudget(budgetCategory).reduce(
    (sum, key) => sum + (spentByCat[key] ?? 0),
    0,
  );
}
