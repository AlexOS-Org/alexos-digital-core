# Money Center Expense Constraint Fix — 24 August 2026

## Status

**Final status: FIXED IN BRANCH — CONTROLLED PRODUCTION VERIFICATION PENDING.**

The targeted application fix is present on the protected remediation branch. No production database, financial record, account balance, order, inventory, constraint, RLS policy, RPC permission, or deployment was changed. The production-readiness decision remains **80/100 — NO-GO** until the reviewed branch is deployed through the secure process and the live expense flow is verified without creating unapproved production test data.

The protected recovery points remain available: `db1cf7a` and rollback `72e6060`. The branch working tree must remain clean before delivery.

## Observed error

The Money Center Expenses form failed when saving a personal Food expense with the database error:

> new row for relation "transactions" violates check constraint "transactions_expense_type_check"

The visible label was `Food`, but the label is not the database value. The form-to-insert trace proves the exact submitted value:

1. `src/components/money/TransactionFormDialog.tsx:120–140` builds the transaction payload.
2. Before the fix, `expense_type` was produced by lowercasing and slugifying the visible category: `Food` became **`food`**.
3. `src/lib/money/api.ts:217–237` adds `user_id` and forwards the payload unchanged to `transactions.insert`; there is no second normalization.
4. The live database rejected `food` because it is not in the active constraint allowlist.

## Live database constraint

The live Supabase constraint was inspected read-only on the canonical project. The authoritative definition is:

```sql
CHECK (
  expense_type IS NULL OR expense_type = ANY (ARRAY[
    'cost_of_goods', 'packaging', 'delivery', 'logistics', 'advertising',
    'platform_fee', 'supplier', 'payroll', 'rent', 'utilities', 'tax',
    'debt_payment', 'interest', 'personal_living', 'education', 'health',
    'transport', 'airtime', 'other'
  ])
)
```

The live `transactions_expense_scope_check` accepts only `personal` and `business`. Although an older migration comment mentions `shared`, the live database is the current source for this diagnosis and does not accept `shared`.

| Field                   | Evidence                                                                                                                                                                                                                                       |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Column                  | `transactions.expense_type`                                                                                                                                                                                                                    |
| Constraint              | `transactions_expense_type_check`                                                                                                                                                                                                              |
| Accepted values         | `cost_of_goods`, `packaging`, `delivery`, `logistics`, `advertising`, `platform_fee`, `supplier`, `payroll`, `rent`, `utilities`, `tax`, `debt_payment`, `interest`, `personal_living`, `education`, `health`, `transport`, `airtime`, `other` |
| Rejected observed value | `food`                                                                                                                                                                                                                                         |

## Complete UI-to-database category comparison

The current form presents 28 categories. The previous slugification sent the following values. The current fix maps every label through an explicit allowlisted internal code while preserving the user-facing `category` label for display and reporting.

| UI label           | Previous submitted value | Database accepted? before fix | New submitted value | Result          |
| ------------------ | ------------------------ | ----------------------------: | ------------------- | --------------- |
| Rent               | `rent`                   |                           Yes | `rent`              | Fixed/unchanged |
| Transport          | `transport`              |                           Yes | `transport`         | Fixed/unchanged |
| Fuel               | `fuel`                   |                            No | `transport`         | Fixed           |
| Food               | `food`                   |                            No | `personal_living`   | Fixed           |
| Electricity        | `electricity`            |                            No | `utilities`         | Fixed           |
| Water              | `water`                  |                            No | `utilities`         | Fixed           |
| Water — Home       | `water___home`           |                            No | `utilities`         | Fixed           |
| Water — Office     | `water___office`         |                            No | `utilities`         | Fixed           |
| WiFi               | `wifi`                   |                            No | `utilities`         | Fixed           |
| Internet           | `internet`               |                            No | `utilities`         | Fixed           |
| Airtime            | `airtime`                |                           Yes | `airtime`           | Fixed/unchanged |
| Facebook Ads       | `facebook_ads`           |                            No | `advertising`       | Fixed           |
| Google Ads         | `google_ads`             |                            No | `advertising`       | Fixed           |
| Ads                | `ads`                    |                            No | `advertising`       | Fixed           |
| Rider / Delivery   | `rider___delivery`       |                            No | `delivery`          | Fixed           |
| Packaging          | `packaging`              |                           Yes | `packaging`         | Fixed/unchanged |
| Supplier           | `supplier`               |                           Yes | `supplier`          | Fixed/unchanged |
| Business           | `business`               |                            No | `other`             | Fixed           |
| Office             | `office`                 |                            No | `other`             | Fixed           |
| Shopping           | `shopping`               |                            No | `personal_living`   | Fixed           |
| Medical            | `medical`                |                            No | `health`            | Fixed           |
| Kids               | `kids`                   |                            No | `personal_living`   | Fixed           |
| Kids — School Fees | `kids___school_fees`     |                            No | `education`         | Fixed           |
| Kids — Expenses    | `kids___expenses`        |                            No | `personal_living`   | Fixed           |
| Kids — Shopping    | `kids___shopping`        |                            No | `personal_living`   | Fixed           |
| Tithe              | `tithe`                  |                            No | `other`             | Fixed           |
| Entertainment      | `entertainment`          |                            No | `personal_living`   | Fixed           |
| Other              | `other`                  |                           Yes | `other`             | Fixed/unchanged |

**Affected categories:** 22 of 28 previous UI options would have violated the current database constraint. The observed `Food` failure was one instance of broader category drift, not an isolated category problem.

## Additional invalid path found

The approved-tithe path in `src/components/money/MoneyAllocationPanel.tsx:134–146` previously submitted `expense_type: "charitable"`, which is also absent from the live allowlist. The fix routes `Tithe` through the same canonical mapper and stores the valid internal code `other`, while retaining `category: "Tithe"` and its existing description/reference for user-facing and audit context. A distinct `charitable` reporting code would require a separately approved database migration and historical-data review; it was not invented or added here.

## Root cause

**Root cause 1 — expense type:** the UI treated descriptive category labels as if they were the constrained internal database codes. `TransactionFormDialog` lowercased and slugified labels, so `Food` became `food`; the database model instead requires canonical codes such as `personal_living`, `utilities`, `advertising`, `delivery`, and `health`. `useSaveTransaction` forwarded that invalid value unchanged. A second invalid emitter, the tithe approval path, hardcoded `charitable`.

The database constraint is not weakened or dropped. The application now maps labels to the existing accepted model.

**Root cause 2 — financial scope:** the Receive Money form previously set `financial_scope` to `null` for income and transfer modes. The live `transactions_financial_scope_check` constraint requires `personal` or `business`, and the screenshot confirms the resulting database error. Expected-income receipt insertion also omitted `financial_scope`, so it was a second latent failure path.

The application now resolves the selected account under the authenticated user and uses the shared `financialScopeForAccount` normalizer. Business accounts emit `business`; personal, null, or unknown account scope values safely emit `personal`. No database constraint was weakened.

## Fix applied

The smallest safe fix is an explicit `EXPENSE_TYPE_BY_CATEGORY` mapping and `expenseTypeForCategory` helper in `src/lib/money/constants.ts`. The transaction form now calls this mapper rather than slugifying labels. The tithe approval path uses the same mapper. The visible `category`, `expense_scope`, `financial_scope`, `business_id`, amount, account, date, description, and reference fields are unchanged.

The single-account debit model is unchanged: an expense still creates one transaction against `account_id`; transfers remain a separate transaction type. No balance calculation or historical transaction rewrite was introduced.

## Regression test

**Regression test: PASS.** `src/lib/money/constants.test.ts` proves that:

- Every current UI category maps to one of the 19 live database-accepted `expense_type` values.
- Receive Money and Transfer Money emit a non-null `financial_scope` from the selected account.
- Expected-income receipts verify account ownership and emit the selected account’s non-null `financial_scope`.
- `Food` maps to `personal_living`.
- `Tithe` maps to the valid fallback `other`.
- The mapping contains an explicit entry for every current UI category, preventing silent drift when labels change.

The focused test result now covers 5 tests, including the non-null financial-scope normalizer.

## Validation and production safety

| Check                                   | Result                              |
| --------------------------------------- | ----------------------------------- |
| Database changed                        | **NO**                              |
| Production data changed                 | **NO**                              |
| Database constraint dropped or weakened | **NO**                              |
| Historical transactions rewritten       | **NO**                              |
| Expense vs transfer behavior changed    | **NO**                              |
| Personal/business scope model changed   | **NO**                              |
| Focused category regression test        | **PASS**                            |
| Full local gates                        | **PENDING FINAL RUN**               |
| Live production expense/income save     | **PENDING CONTROLLED VERIFICATION** |

The final controlled test must use a disposable/non-production environment or an owner-approved existing test fixture. It must verify personal Food, business Advertising, account selection, amount, date/time, description, reference, transaction creation, exact account balance reduction once, recent-expense display, analytics, and the distinction between Expense and Transfer. Do not create a fake financial transaction in production merely to test this fix.

## References

[1]: https://supabase.com/docs/guides/database/postgres/constraints "Supabase PostgreSQL constraints"
[2]: https://supabase.com/docs/guides/database/postgres/row-level-security "Supabase Row Level Security"
