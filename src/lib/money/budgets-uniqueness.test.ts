import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { BUDGET_UPSERT_CONFLICT } from "./api";
import { resolveScopedWrite } from "./write-scope";

/**
 * Budget identity, and the cross-business corruption regression.
 *
 * The bug this guards against: `budgets` was created with
 * `UNIQUE(user_id, category, month)` — no business dimension — while
 * `useSaveBudget` began writing `business_id`. Upserting on the three-column
 * key meant a second business saving the same category + month silently
 * UPDATED the first business's row, overwriting both its amount and its
 * business_id:
 *
 *   Business A: (user, Food, 2026-09, business_id = A, amount = 50000)
 *   Business B: (user, Food, 2026-09, business_id = B, amount = 30000)
 *     -> the single stored row becomes business_id = B, amount = 30000
 *
 * Two things therefore have to hold, and both are asserted here:
 *
 * 1. The database enforces a business-aware unique key (migration below), and
 * 2. the client's upsert conflict target names exactly those columns.
 *
 * A mismatch between the two reintroduces the corruption, so the first test
 * below compares the exported conflict target against the column list parsed
 * out of the migration file itself.
 */

const MIGRATION_URL = new URL(
  "../../../supabase/migrations/20260930090000_business_aware_budget_uniqueness.sql",
  import.meta.url,
);
const migrationSql = readFileSync(fileURLToPath(MIGRATION_URL), "utf8");

/**
 * The migration explains in prose why a naive key was rejected, so structural
 * assertions run against the SQL with `--` comments stripped. Otherwise this
 * file would match its own documentation.
 */
const migrationStatements = migrationSql
  .split("\n")
  .map((line) => line.replace(/--.*$/, ""))
  .join("\n");

type BudgetRow = {
  user_id: string;
  business_id: string | null;
  category: string;
  month: string;
  amount: number;
};

const USER = "user-1";
const BIZ_A = "biz-a";
const BIZ_B = "biz-b";
const MONTH = "2026-09-01";

const budget = (business_id: string | null, category: string, amount: number): BudgetRow => ({
  user_id: USER,
  business_id,
  category,
  month: MONTH,
  amount,
});

/**
 * Model of `INSERT ... ON CONFLICT (cols) DO UPDATE` against a unique key.
 *
 * `nullsNotDistinct` mirrors the migration's `unique nulls not distinct`. When
 * false it reproduces PostgreSQL's default behaviour, where NULL values never
 * compare equal and therefore never conflict — the reason a naive
 * `unique (user_id, business_id, category, month)` would permit duplicate
 * personal budgets.
 */
function upsert(
  rows: BudgetRow[],
  incoming: BudgetRow,
  conflictColumns: string[],
  nullsNotDistinct = true,
): BudgetRow[] {
  const keyOf = (row: BudgetRow) => conflictColumns.map((column) => row[column as keyof BudgetRow]);

  const conflicts = (a: unknown[], b: unknown[]) =>
    a.every((value, index) => {
      const other = b[index];
      // PostgreSQL default: a NULL never equals anything, not even another NULL,
      // so a NULL-valued column can never be the source of a conflict.
      if (!nullsNotDistinct && (value === null || other === null)) return false;
      return value === other;
    });

  const existing = rows.findIndex((row) => conflicts(keyOf(row), keyOf(incoming)));
  if (existing === -1) return [...rows, incoming];

  const next = [...rows];
  next[existing] = { ...next[existing], ...incoming };
  return next;
}

const applyBudgetSave = (rows: BudgetRow[], incoming: BudgetRow) =>
  upsert(
    rows,
    incoming,
    BUDGET_UPSERT_CONFLICT.split(",").map((column) => column.trim()),
  );

describe("budget uniqueness migration", () => {
  it("declares a business-aware unique key with NULLS NOT DISTINCT", () => {
    const declared = migrationStatements.match(/unique\s+nulls\s+not\s+distinct\s*\(([^)]+)\)/i);
    expect(declared).not.toBeNull();

    const columns = declared![1].split(",").map((column) => column.trim());

    expect(columns).toEqual(["user_id", "business_id", "category", "month"]);
  });

  it("does not rely on the NULL-permissive default", () => {
    // A plain `unique (user_id, business_id, category, month)` would be silently
    // broken for personal budgets, so its absence is asserted explicitly.
    expect(migrationStatements).not.toMatch(/unique\s*\(\s*user_id\s*,\s*business_id/i);
    expect(migrationStatements).not.toMatch(/create\s+unique\s+index[^;]*business_id/i);
  });

  it("removes the legacy three-column uniqueness", () => {
    // Dropped by introspection over pg_constraint rather than by hard-coded
    // name, so the drop survives a differently-named legacy constraint.
    expect(migrationStatements).toMatch(/array\['user_id',\s*'category',\s*'month'\]/);
    expect(migrationStatements).toMatch(/drop\s+constraint/i);
  });

  it("keeps scope and business id in agreement", () => {
    expect(migrationStatements).toMatch(/budgets_business_scope_requires_business_id/);
  });
});

describe("budget upsert conflict target", () => {
  it("names exactly the columns the migration makes unique", () => {
    const declared = migrationStatements.match(
      /unique\s+nulls\s+not\s+distinct\s*\(([^)]+)\)/i,
    )![1];
    const declaredColumns = declared.split(",").map((column) => column.trim());

    expect(BUDGET_UPSERT_CONFLICT.split(",").map((column) => column.trim())).toEqual(
      declaredColumns,
    );
  });

  it("includes the business dimension", () => {
    expect(BUDGET_UPSERT_CONFLICT).toContain("business_id");
  });
});

describe("budget writes", () => {
  it("keeps a personal budget alongside business budgets for the same category/month", () => {
    let rows: BudgetRow[] = [];
    rows = applyBudgetSave(rows, budget(null, "Food", 20000));
    rows = applyBudgetSave(rows, budget(BIZ_A, "Food", 50000));
    rows = applyBudgetSave(rows, budget(BIZ_B, "Food", 30000));

    expect(rows).toHaveLength(3);
    expect(rows.find((row) => row.business_id === null)?.amount).toBe(20000);
    expect(rows.find((row) => row.business_id === BIZ_A)?.amount).toBe(50000);
    expect(rows.find((row) => row.business_id === BIZ_B)?.amount).toBe(30000);
  });

  it("REGRESSION: a second business does not overwrite the first business's budget", () => {
    // The exact corruption reported against the three-column conflict target.
    let rows: BudgetRow[] = [];
    rows = applyBudgetSave(rows, budget(BIZ_A, "Food", 50000));
    rows = applyBudgetSave(rows, budget(BIZ_B, "Food", 30000));

    expect(rows).toHaveLength(2);
    expect(rows.find((row) => row.business_id === BIZ_A)?.amount).toBe(50000);
    expect(rows.find((row) => row.business_id === BIZ_A)?.business_id).toBe(BIZ_A);
    expect(rows.find((row) => row.business_id === BIZ_B)?.amount).toBe(30000);
  });

  it("would have corrupted budgets under the old three-column conflict target", () => {
    // Demonstrates that the regression test above is load-bearing: the same
    // sequence against the old key collapses to one reassigned row.
    const legacyColumns = ["user_id", "category", "month"];
    let rows: BudgetRow[] = [];
    rows = upsert(rows, budget(BIZ_A, "Food", 50000), legacyColumns);
    rows = upsert(rows, budget(BIZ_B, "Food", 30000), legacyColumns);

    expect(rows).toHaveLength(1);
    expect(rows[0].business_id).toBe(BIZ_B);
    expect(rows[0].amount).toBe(30000);
  });

  it("updating business B leaves business A untouched", () => {
    let rows: BudgetRow[] = [];
    rows = applyBudgetSave(rows, budget(BIZ_A, "Food", 50000));
    rows = applyBudgetSave(rows, budget(BIZ_B, "Food", 30000));
    rows = applyBudgetSave(rows, budget(BIZ_B, "Food", 42000));

    expect(rows).toHaveLength(2);
    expect(rows.find((row) => row.business_id === BIZ_A)?.amount).toBe(50000);
    expect(rows.find((row) => row.business_id === BIZ_B)?.amount).toBe(42000);
  });

  it("repeated saves for the same business/category/month update that budget", () => {
    let rows: BudgetRow[] = [];
    rows = applyBudgetSave(rows, budget(BIZ_A, "Transport", 15000));
    rows = applyBudgetSave(rows, budget(BIZ_A, "Transport", 18000));

    expect(rows).toHaveLength(1);
    expect(rows[0].amount).toBe(18000);
  });

  it("repeated personal saves update the personal budget instead of duplicating it", () => {
    let rows: BudgetRow[] = [];
    rows = applyBudgetSave(rows, budget(null, "Food", 20000));
    rows = applyBudgetSave(rows, budget(null, "Food", 25000));

    // This is what NULLS NOT DISTINCT buys: a naive key would insert a second row.
    expect(rows).toHaveLength(1);
    expect(rows[0].amount).toBe(25000);
  });

  it("a NULL-permissive key would duplicate personal budgets", () => {
    // Justifies rejecting `unique (user_id, business_id, category, month)`.
    const naiveColumns = ["user_id", "business_id", "category", "month"];
    let rows: BudgetRow[] = [];
    rows = upsert(rows, budget(null, "Food", 20000), naiveColumns, false);
    rows = upsert(rows, budget(null, "Food", 25000), naiveColumns, false);

    expect(rows).toHaveLength(2);
  });

  it("treats different categories and different months as separate budgets", () => {
    let rows: BudgetRow[] = [];
    rows = applyBudgetSave(rows, budget(BIZ_A, "Food", 50000));
    rows = applyBudgetSave(rows, budget(BIZ_A, "Transport", 15000));
    rows = applyBudgetSave(rows, { ...budget(BIZ_A, "Food", 60000), month: "2026-10-01" });

    expect(rows).toHaveLength(3);
  });

  it("writes a scope that agrees with the business id it persisted", () => {
    // budgets_business_scope_requires_business_id rejects a row that claims
    // business scope without a business id.
    expect(resolveScopedWrite(BIZ_A)).toEqual({
      business_id: BIZ_A,
      financial_scope: "business",
    });
    expect(resolveScopedWrite(null)).toEqual({
      business_id: null,
      financial_scope: "personal",
    });
    expect(resolveScopedWrite("")).toEqual({
      business_id: null,
      financial_scope: "personal",
    });
  });
});
