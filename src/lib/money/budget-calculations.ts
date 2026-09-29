import { normalizeExpenseCategory } from "./constants";

export type BudgetScope = "personal" | "business";
export type BudgetCalculationState =
  "supported" | "no_activity" | "unsupported_currency" | "invalid";

export interface BudgetSnapshot {
  category: string;
  month: string;
  amount: number;
  deleted_at: string | null;
  financial_scope?: BudgetScope | string | null;
  business_id?: string | null;
  business_name?: string | null;
}

export interface BudgetExpense {
  id: string;
  occurred_at: string;
  type: "income" | "expense" | "transfer" | "adjustment" | string;
  status: "posted" | "pending" | "void" | string;
  deleted_at?: string | null;
  amount: number;
  category: string | null;
  expense_scope?: BudgetScope | string | null;
  financial_scope?: BudgetScope | string | null;
  business_id?: string | null;
  currency?: string | null;
  account_id?: string | null;
}

export interface BudgetAccountCurrency {
  id: string;
  currency: string | null | undefined;
  status: string;
  financial_scope?: BudgetScope | string | null;
  business_id?: string | null;
}

export interface BudgetPeriod {
  from: string;
  toExclusive: string;
}

export interface BudgetCalculationInput {
  budget: BudgetSnapshot;
  expenses: BudgetExpense[];
  period: BudgetPeriod;
  accountCurrencies?: BudgetAccountCurrency[];
  budgetCurrency?: string | null;
}

export interface BudgetCalculation {
  state: BudgetCalculationState;
  budgeted: number | null;
  actual: number | null;
  remaining: number | null;
  utilizationPct: number | null;
  overBudget: boolean;
  hasActivity: boolean;
  matchingExpenseCount: number;
  currency: string | null;
  unavailableReason: string | null;
}

export interface ConsolidatedBudgetCalculation {
  state: BudgetCalculationState;
  budgeted: number | null;
  actual: number | null;
  remaining: number | null;
  utilizationPct: number | null;
  overBudget: boolean;
  hasActivity: boolean;
  matchingExpenseCount: number;
  currency: string | null;
  unavailableReason: string | null;
}

/**
 * Returns the latest budget instruction at or before the selected month for
 * each category/scope/business combination. Deleted latest instructions do not
 * resurrect older rows.
 */
export function carryForwardBudgets<T extends BudgetSnapshot>(rows: T[], selectedMonth: string) {
  const latestByKey = new Map<string, T>();

  for (const row of rows) {
    if (!row.category || row.month > selectedMonth) continue;
    const key = budgetKey(row);
    if (latestByKey.has(key)) continue;
    latestByKey.set(key, row);
  }

  return Array.from(latestByKey.values())
    .filter((row) => row.deleted_at == null)
    .sort((a, b) =>
      `${a.financial_scope ?? "personal"}:${a.business_id ?? ""}:${a.category}`.localeCompare(
        `${b.financial_scope ?? "personal"}:${b.business_id ?? ""}:${b.category}`,
      ),
    );
}

/** Expense category labels that roll into the parent "Kids" monthly budget. */
export const KIDS_BUDGET_SPEND_CATEGORIES = [
  "Kids",
  "Kids — School Fees",
  "Kids — Expenses",
  "Kids — Shopping",
] as const;

export function expenseCategoriesForBudget(budgetCategory: string): string[] {
  const cat = normalizeExpenseCategory((budgetCategory ?? "").trim());
  if (cat === "Kids") return [...KIDS_BUDGET_SPEND_CATEGORIES];
  return cat ? [cat] : [];
}

export function spentForBudgetCategory(
  spentByCat: Record<string, number>,
  budgetCategory: string,
): number {
  return expenseCategoriesForBudget(budgetCategory).reduce(
    (sum, key) => sum + (spentByCat[normalizeExpenseCategory(key)] ?? 0),
    0,
  );
}

export function budgetKey(
  budget: Pick<BudgetSnapshot, "category" | "financial_scope" | "business_id">,
) {
  return `${budget.financial_scope === "business" ? "business" : "personal"}:${budget.business_id ?? ""}:${normalizeExpenseCategory(budget.category)}`;
}

export function isBudgetExpense(
  expense: BudgetExpense,
  budget: BudgetSnapshot,
  period: BudgetPeriod,
): boolean {
  if (expense.type !== "expense" || expense.status !== "posted" || expense.deleted_at) return false;
  const amount = Number(expense.amount);
  if (!Number.isFinite(amount) || amount <= 0) return false;

  const occurred = Date.parse(expense.occurred_at);
  const from = Date.parse(period.from);
  const toExclusive = Date.parse(period.toExclusive);
  if (!Number.isFinite(occurred) || !Number.isFinite(from) || !Number.isFinite(toExclusive))
    return false;
  if (occurred < from || occurred >= toExclusive) return false;

  const matchingCategory = expenseCategoriesForBudget(budget.category).includes(
    normalizeExpenseCategory(expense.category),
  );
  if (!matchingCategory) return false;

  if (budget.financial_scope === "business") {
    return expense.expense_scope === "business" && expense.business_id === budget.business_id;
  }

  return expense.expense_scope === "personal" && !expense.business_id;
}

function currencyForExpense(
  expense: BudgetExpense,
  accountsById: Map<string, BudgetAccountCurrency>,
): string | null {
  return (
    (
      expense.currency ??
      (expense.account_id ? accountsById.get(expense.account_id)?.currency : null)
    )
      ?.trim()
      .toUpperCase() ?? null
  );
}

function supportedCurrencies(
  input: BudgetCalculationInput,
  matchingExpenses: BudgetExpense[],
): { currency: string | null; reason: string | null } {
  const budgetCurrency = input.budgetCurrency?.trim().toUpperCase() || "KES";
  const accountsById = new Map(
    (input.accountCurrencies ?? []).map((account) => [account.id, account]),
  );
  const relevantAccounts = (input.accountCurrencies ?? []).filter(
    (account) =>
      account.status === "active" &&
      (input.budget.financial_scope !== "business"
        ? account.financial_scope !== "business" && !account.business_id
        : account.financial_scope === "business" &&
          account.business_id === input.budget.business_id),
  );
  const currencies = new Set(
    [
      ...relevantAccounts.map((account) => account.currency?.trim().toUpperCase() ?? null),
      ...matchingExpenses.map((expense) => currencyForExpense(expense, accountsById)),
    ].filter((currency): currency is string => Boolean(currency)),
  );

  if ([...currencies].some((currency) => currency !== budgetCurrency)) {
    return {
      currency: null,
      reason: `Budget is denominated in ${budgetCurrency}, but matching expenses use another currency and no FX conversion is available.`,
    };
  }
  if (currencies.size > 1) {
    return {
      currency: null,
      reason: "Matching expenses use multiple currencies; no FX conversion is available.",
    };
  }
  return { currency: budgetCurrency, reason: null };
}

const invalidResult = (reason: string): BudgetCalculation => ({
  state: "invalid",
  budgeted: null,
  actual: null,
  remaining: null,
  utilizationPct: null,
  overBudget: false,
  hasActivity: false,
  matchingExpenseCount: 0,
  currency: null,
  unavailableReason: reason,
});

export function calculateBudget(input: BudgetCalculationInput): BudgetCalculation {
  const budgeted = Number(input.budget.amount);
  if (!Number.isFinite(budgeted) || budgeted < 0) {
    return invalidResult("Budget amount must be a finite non-negative number.");
  }
  if (input.budget.financial_scope === "business" && !input.budget.business_id) {
    return invalidResult("Business budgets must identify a business.");
  }

  const matchingExpenses = input.expenses.filter((expense) =>
    isBudgetExpense(expense, input.budget, input.period),
  );
  const currency = supportedCurrencies(input, matchingExpenses);
  if (currency.reason) {
    return {
      state: "unsupported_currency",
      budgeted,
      actual: null,
      remaining: null,
      utilizationPct: null,
      overBudget: false,
      hasActivity: matchingExpenses.length > 0,
      matchingExpenseCount: matchingExpenses.length,
      currency: null,
      unavailableReason: currency.reason,
    };
  }

  const actual = roundMoney(
    matchingExpenses.reduce((sum, expense) => sum + Number(expense.amount), 0),
  );
  const remaining = roundMoney(budgeted - actual);
  const utilizationPct = budgeted > 0 ? roundPercent((actual / budgeted) * 100) : null;
  return {
    state: matchingExpenses.length === 0 ? "no_activity" : "supported",
    budgeted: roundMoney(budgeted),
    actual,
    remaining,
    utilizationPct,
    overBudget: actual > budgeted,
    hasActivity: matchingExpenses.length > 0,
    matchingExpenseCount: matchingExpenses.length,
    currency: currency.currency,
    unavailableReason: null,
  };
}

export function calculateConsolidatedBudgets(
  budgets: BudgetSnapshot[],
  expenses: BudgetExpense[],
  period: BudgetPeriod,
  accountCurrencies: BudgetAccountCurrency[] = [],
  budgetCurrency = "KES",
): ConsolidatedBudgetCalculation {
  const validBudgets = budgets.filter((budget) => {
    const amount = Number(budget.amount);
    return Number.isFinite(amount) && amount >= 0 && budget.deleted_at == null;
  });
  if (validBudgets.length === 0) {
    return {
      state: "no_activity",
      budgeted: 0,
      actual: 0,
      remaining: 0,
      utilizationPct: 0,
      overBudget: false,
      hasActivity: false,
      matchingExpenseCount: 0,
      currency: budgetCurrency,
      unavailableReason: "No active budgets are configured for this period.",
    };
  }

  const calculations = validBudgets.map((budget) =>
    calculateBudget({ budget, expenses, period, accountCurrencies, budgetCurrency }),
  );
  const unsupported = calculations.find(
    (calculation) => calculation.state === "unsupported_currency",
  );
  if (unsupported) {
    return {
      ...unsupported,
      budgeted: roundMoney(validBudgets.reduce((sum, budget) => sum + Number(budget.amount), 0)),
    };
  }

  const qualifying = new Map<string, BudgetExpense>();
  for (const budget of validBudgets) {
    for (const expense of expenses) {
      if (isBudgetExpense(expense, budget, period)) qualifying.set(expense.id, expense);
    }
  }
  const actual = roundMoney(
    [...qualifying.values()].reduce((sum, expense) => sum + Number(expense.amount), 0),
  );
  const budgeted = roundMoney(validBudgets.reduce((sum, budget) => sum + Number(budget.amount), 0));
  return {
    state: qualifying.size === 0 ? "no_activity" : "supported",
    budgeted,
    actual,
    remaining: roundMoney(budgeted - actual),
    utilizationPct: budgeted > 0 ? roundPercent((actual / budgeted) * 100) : null,
    overBudget: actual > budgeted,
    hasActivity: qualifying.size > 0,
    matchingExpenseCount: qualifying.size,
    currency: budgetCurrency.toUpperCase(),
    unavailableReason: qualifying.size === 0 ? "No qualifying expenses match these budgets." : null,
  };
}

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function roundPercent(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
