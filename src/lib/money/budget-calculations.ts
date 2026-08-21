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
