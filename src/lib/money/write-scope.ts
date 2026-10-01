/**
 * Pure business-scope resolution for Money Center writes.
 *
 * Every function here is a plain data-in / data-out resolver with no React and
 * no Supabase import, so the rules that decide which business a financial row
 * belongs to can be tested directly instead of being re-implemented inside a
 * component and asserted against a copy.
 *
 * The single rule this module enforces everywhere: a business dimension is only
 * written when it names a real business. Absent, empty and whitespace-only ids
 * all collapse to `null`, which is the personal dimension. That is what keeps
 * `business_id` from ever being persisted as `""` -- a value that no
 * `.eq("business_id", ...)` filter would ever match, and that would silently
 * make a row invisible under every business scope.
 *
 * Accounting semantics are unchanged by any of this:
 * - transactions remain the authoritative ledger,
 * - transfers remain a single movement row, never income or expense,
 * - budgets remain planning/reporting only,
 * - expected money remains a receivable until it is settled.
 */

/** Which side of the personal/business split a financial row belongs to. */
export type FinancialScope = "personal" | "business";

/** The scope columns written alongside a financial row. */
export type ScopedWriteFields = {
  business_id: string | null;
  financial_scope: FinancialScope;
};

/** The transaction entry modes the Money Center form can submit. */
export type TransactionMode = "income" | "expense" | "transfer";

/**
 * Normalise a business id for persistence.
 *
 * Returns `null` for anything that is not a non-empty, non-whitespace string so
 * that `business_id` is either a real business id or the personal dimension.
 */
export function normalizeBusinessId(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Scope columns for a record that simply follows the active business
 * (budgets and expected money). Neither offers a per-row business picker: the
 * row belongs to whichever business is active, or to the portfolio when none is.
 */
export function resolveScopedWrite(activeBusinessId: string | null): ScopedWriteFields {
  const businessId = normalizeBusinessId(activeBusinessId);
  return {
    business_id: businessId,
    financial_scope: businessId ? "business" : "personal",
  };
}

/**
 * Scope columns for an account, which does offer an explicit personal/business
 * choice independent of the active business.
 *
 * The business dimension is only written when the row actually claims business
 * scope, so an account that claims business scope with no active business is
 * stored as `business_id = null` rather than being attributed to a business the
 * user never picked.
 */
export function resolveAccountOwnership(input: {
  scope: FinancialScope;
  activeBusinessId: string | null;
}): ScopedWriteFields {
  const businessId =
    input.scope === "business" ? normalizeBusinessId(input.activeBusinessId) : null;
  return {
    business_id: businessId,
    financial_scope: businessId ? "business" : "personal",
  };
}

/**
 * Business attribution for a transaction.
 *
 * Attribution is inherited from the money actually involved, not from the page
 * the form was opened on:
 *
 * - expense  — follows the business chosen for the expense, falling back to the
 *   paying account's business when no business was chosen. The form separately
 *   rejects a business account whose business_id disagrees with the selection.
 * - income   — follows the receiving account. Income previously persisted
 *   `business_id = null` unconditionally.
 * - transfer — follows the source account. A transfer stays one movement row and
 *   is never recorded as income or expense, so the destination account does not
 *   contribute attribution.
 */
export function resolveTransactionBusinessId(input: {
  mode: TransactionMode;
  scope: FinancialScope;
  selectedBusinessId: string | null;
  accountBusinessId: string | null;
}): string | null {
  const accountBusinessId = normalizeBusinessId(input.accountBusinessId);
  if (input.mode === "expense" && input.scope === "business") {
    return normalizeBusinessId(input.selectedBusinessId) ?? accountBusinessId;
  }
  return accountBusinessId;
}

/**
 * Financial scope reported by a transaction. The account owns the money, so its
 * scope wins; the form's own choice is only a fallback for an account that
 * predates the personal/business split.
 */
export function resolveTransactionScope(input: {
  scope: FinancialScope;
  accountScope: FinancialScope | null | undefined;
}): FinancialScope {
  return input.accountScope ?? input.scope;
}

/**
 * Expense classification. Only an expense carries an expense scope, and it
 * follows the scope chosen for that expense; income and transfer are always
 * classified "personal" so they never inflate expense reporting.
 */
export function resolveExpenseScope(input: {
  mode: TransactionMode;
  scope: FinancialScope;
}): FinancialScope {
  return input.mode === "expense" ? input.scope : "personal";
}

/** Why an expense's account and business context disagree, if they do. */
export type TransactionScopeIssue = "missingAccount" | "scopeMismatch" | "businessMismatch";

/**
 * Validate that an expense's chosen account and chosen business agree.
 *
 * Returns `null` when the context is coherent. Precedence mirrors the order the
 * form reported problems in:
 *
 * 1. the account id did not resolve to a real account,
 * 2. the account's ownership differs from the expense scope (a personal account
 *    cannot pay a business expense),
 * 3. the account belongs to a different business than the one selected.
 *
 * This is the guard that stops an expense from being written with a
 * `business_id` that contradicts the account it actually moved money in and out
 * of. Only expenses are checked: income and transfer derive their attribution
 * from the account itself and offer no business picker.
 */
export function transactionScopeIssue(input: {
  mode: TransactionMode;
  scope: FinancialScope;
  selectedBusinessId: string | null;
  accountId: string | null;
  accountScope: FinancialScope | null | undefined;
  accountBusinessId: string | null;
}): TransactionScopeIssue | null {
  if (input.mode !== "expense") return null;

  // An empty account selection is already reported by the form's own
  // required-field check for every mode, so this rule only judges a selection
  // that was actually made.
  if (typeof input.accountId !== "string" || input.accountId.trim().length === 0) {
    return null;
  }

  // A supplied account id that does not resolve against the loaded accounts
  // means the account no longer exists or is not selectable here.
  if (input.accountScope === undefined || input.accountScope === null) {
    return "missingAccount";
  }

  if (input.accountScope !== input.scope) return "scopeMismatch";

  const selectedBusinessId = normalizeBusinessId(input.selectedBusinessId);
  if (input.scope === "business" && selectedBusinessId) {
    const accountBusinessId = normalizeBusinessId(input.accountBusinessId);
    if (accountBusinessId !== selectedBusinessId) return "businessMismatch";
  }

  return null;
}
