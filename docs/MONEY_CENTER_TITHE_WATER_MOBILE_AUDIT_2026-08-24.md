# Money Center Tithe, Water, Scope, and Mobile Audit — 2026-08-24

## Scope

This audit reviewed the merged `main` implementation and the Money Center routes that consume transaction categories, account scope, balances, expected money, and allocation metrics. The review covered the transaction dialog, allocation panel, expenses, income, transfers, transactions, budgets, analytics, and the shared Money Center shell.

## Findings and controlled corrections

### Tithe eligibility

Salary-based tithe is now derived only from an explicit `Salary` source or `salary` income type. Gifts are explicitly recognized as non-salary income. The fallback business-profit ledger also excludes gift income, preventing a gift from entering the business-profit tithe base if a legacy record was incorrectly scoped to business. Gifts remain eligible for the separate personal-receipts emergency-fund suggestion because that is a different rule.

The canonical operating-profit function is order/business-expense based and does not treat personal gifts as operating revenue. A data-quality warning remains authoritative where recognized order costs are missing.

### Water category and scope

The new-entry picker now exposes one `Water` category. Legacy `Water — Home` and `Water — Office` values normalize to `Water` for display, budgets, analytics, transaction lists, and expense-type mapping. The expense scope remains a separate explicit choice: `Personal` or `Business`.

When `Business` is selected, the form requires a business-owned account and a matching business. It rejects a personal account or a business account belonging to a different business. The selected account is the only account reduced by the expense; no extra drawdown is created by category labels.

### Dependent modules

Budget and analytics aggregation now use the same category normalizer, preventing legacy Water records from fragmenting reports. Transaction and expense pages already used the normalizer and remain compatible with existing history. Transfers remain separate from income and expenses. Expected-money receipt posting remains a distinct income emitter and is not silently included as salary unless its source/type is explicitly salary.

### Mobile layout

The shared Money Center shell and direct cards now have explicit `min-width: 0` and `max-width: 100%` containment. Narrow screens use reduced shell margins/padding, long monetary values can wrap, and the shared transaction dialog is bounded to the viewport with vertical scrolling. The date/amount row stacks on narrow screens and returns to two columns at the small breakpoint.

## Validation

Focused Money Center and DailyGear tests: 5 files / 12 tests passed.

Typecheck: passed.

Lint: passed with the repository's existing warning set.

Production build: passed.

`git diff --check`: passed.

No production database rows, balances, RLS policies, RPC grants, or Cloudflare configuration were changed by this audit. Deployment remains a separate controlled gate.

## Remaining verification

The mobile changes require a deployed authenticated viewport matrix across representative phone widths before being marked live-verified. Tithe approval itself should be tested only after reviewing the displayed amount and selected funding account. Existing test transactions created during the prior confirmed live smoke test remain identifiable by their `TEST ONLY` descriptions and references and should be reconciled through the approved reversible transaction workflow.
