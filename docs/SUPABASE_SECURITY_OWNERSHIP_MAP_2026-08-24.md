# Supabase Security Ownership Map — 24 August 2026

## Scope and status

This is an **evidence-collection report**, not a migration approval. The reviewed repository checkpoint was branch `production-readiness/2026-08-24` at `db1cf7a`; rollback `72e6060` remains recoverable. The documentation-only follow-up commit may move HEAD, but those recovery points are preserved. No production data, schema, RLS policy, grant, RPC permission, financial record, order, inventory, or deployment was changed.

The current decision remains **80/100 — NO-GO**.

## Final classification

> **OWNERSHIP PROVEN:** `account_balances` at the account-owner level.
>
> **OWNERSHIP NOT FULLY PROVEN:** `business_financial_summary` at the business-owner level and `goal_progress` across the goal/contribution boundary, because composite ownership invariants are not enforced by the verified foreign keys.

The three reported objects are **views**, not base tables. Live Supabase metadata reports `object_kind = view`, `owner = postgres`, `security_invoker=true`, and `rls_enabled=false` for all three. Therefore, direct RLS cannot be enabled on these object names; effective protection comes from view ACLs and the underlying base-table policies.

## 1. `account_balances` ownership evidence

### Object and dependency evidence

The live view definition selects `a.id AS account_id` and `a.user_id` from `public.accounts`, then joins `public.transactions t` with `t.user_id = a.user_id`, excluding deleted accounts/transactions and requiring posted transactions. The view calculates `balance`, `money_in`, and `money_out` from financial amounts.

The live schema reports `accounts.id` as UUID `NOT NULL`, `accounts.user_id` as UUID `NOT NULL`, and `accounts.business_id` as nullable UUID. The verified foreign keys include `transactions.account_id → accounts.id`, `transactions.transfer_account_id → accounts.id`, and `accounts.business_id → businesses.id`.

The live base-table policy is `own accounts`, applying `ALL` to the `public` role with `auth.uid() = user_id`. The live transactions policy is `own transactions`, also applying `ALL` to `public` with `auth.uid() = user_id`.

### Actual callers and operations

| File | Line/range | Operation | Caller | Auth context |
|---|---:|---|---|---|
| `src/lib/money/api.ts` | 127–135 | `SELECT *` from `account_balances` | `useAccountBalances` | Browser Supabase client; authenticated session is required by surrounding authenticated routes |
| `src/components/dashboard/MoneySnapshot.tsx` | 13, 18 | Consumes `useAccountBalances` | Dashboard money snapshot | Authenticated dashboard |
| `src/components/money/MoneyAllocationPanel.tsx` | 17–18 | Consumes `useAccountBalances` | Money allocation panel | Authenticated dashboard |
| `src/routes/_authenticated/money-center.accounts.tsx` | 6, 242 | Consumes `useAccountBalances` | Money Center accounts route | Authenticated route |
| `src/routes/_authenticated/money-center.analytics.tsx` | 5, 26 | Consumes `useAccountBalances` | Money Center analytics route | Authenticated route |
| `src/routes/_authenticated/money-center.index.tsx` | 6, 35 | Consumes `useAccountBalances` | Money Center overview route | Authenticated route |
| `src/lib/auren/advisor.server.ts` | 662–663 | `SELECT *` with `.eq("user_id", userId)` | Auren server advisory aggregator | Server-side user-scoped Supabase context |
| `src/lib/money/api.ts` | 154, 241, 261, 406 | Query invalidation only | Account/transaction mutation hooks | Browser client; no view write |
| `src/lib/dailygear/api.ts` | 376, 565, 771 | Query invalidation only | Payment/fulfilment/refund success handlers | Browser client; no view write |

No repository caller performs `INSERT`, `UPDATE`, or `DELETE` against `account_balances`. The view is derived; writers change base accounts or transactions. No repository RPC or trigger was found that writes the view directly.

### Ownership answer

`account_id` means the primary key of the source `accounts` row; the source `accounts.id` is non-null. `user_id` means the source account owner; the source `accounts.user_id` is non-null and the base policy compares it to `auth.uid()`. The view’s transaction join also requires `transactions.user_id = accounts.user_id`.

At the account-owner level, ownership is **PROVEN** from the source schema, view definition, and base policies. A business relationship is optional because `accounts.business_id` is nullable; the view does not expose `business_id`, so the view is not a business-owned resource in its current shape. It is a system-generated, user-owned derived view. `account_id` is not nullable in the source relation; apparent nullability in generated view metadata must not be used to weaken this conclusion.

## 2. `business_financial_summary` ownership evidence

The live view selects `transactions.user_id`, nullable `transactions.business_id`, month, income, expenses, and operating profit, grouping by `user_id`, `business_id`, and month. `transactions.user_id` is `NOT NULL`; `transactions.business_id` is nullable. The foreign key `transactions.business_id → businesses.id` is verified. `businesses.id` and `businesses.user_id` are both `NOT NULL`, and the base business policies compare `auth.uid()` to `businesses.user_id`.

However, no composite foreign key or database constraint was found proving `transactions.user_id = businesses.user_id` for a transaction’s selected business. The view groups by the transaction’s own `user_id` and business ID; it does not join `businesses` to re-derive or verify business ownership. The view is therefore user-attributed data with a business identifier, not yet proven business-member data.

No runtime `from("business_financial_summary")` call was found in `src`. The object appears in generated types and migration provenance (`supabase/migrations/20260818070000_personal_business_finance_model.sql:177–209`) but no current client, server, route, hook, RPC, trigger, or scheduled-job caller was found.

### Ownership answer

The data is sensitive authenticated financial data. User attribution is structurally present, but business ownership is **NOT PROVEN** because the transaction-to-business owner invariant is not enforced by a verified composite constraint or a verified membership policy. The correct classification is **MIXED/UNKNOWN until the business data invariant and intended caller are proven**. Access should remain `CONDITIONAL`, not be made business-member `ALLOW` from naming alone.

## 3. `goal_progress` ownership evidence

The live view selects `g.id AS goal_id`, `g.user_id`, and the aggregate of `goal_contributions.amount` joined by `goal_id`. The source schema reports `goals.id` and `goals.user_id` as `NOT NULL`; `goal_contributions.id`, `user_id`, and `goal_id` are also `NOT NULL`, while `goal_contributions.account_id` is nullable. The verified foreign key is `goal_contributions.goal_id → goals.id`.

The base policies are `own goals` and `own goal contributions`, both `ALL` for the `public` role with `auth.uid() = user_id`. The authenticated Goals route reads the view at `src/lib/goals/api.ts:62–70`; writes go to base tables through `useSaveGoal` and `useContribute` at `src/lib/goals/api.ts:90–140`. The dashboard also consumes the hook at `src/lib/dashboard/api.ts:21–30`.

### Ownership answer

The parent goal is user-owned: `goals.user_id` is non-null and protected by `own goals`. The view reports that parent owner. But the join uses only `goal_contributions.goal_id = goals.id`; there is no verified composite constraint tying `goal_contributions.user_id` to `goals.user_id`. A contribution row can therefore be structurally associated with a goal while carrying a separate owner ID unless application/RLS behavior prevents that state. The `own goal contributions` policy restricts the contributing user’s row, but it does not itself prove the goal owner matches the contribution owner.

Accordingly, `goal_progress` ownership is **NOT FULLY PROVEN** across the contribution aggregate. The safest classification is private user data with a **REQUIRES DATA-MODEL/INVARIANT REVIEW** status before final RLS policy approval. No direct writes, RPCs, triggers, or admin callers were found for the view itself.

## 4. Dependency and operation summary

| Resource | Direct SELECT callers | Direct writers | RPC/trigger access | Proven ownership |
|---|---|---|---|---|
| `account_balances` | Money Center browser hooks; Auren server with user filter | None; derived from `accounts` and `transactions` | No direct view writer found | **YES, user/account level** |
| `business_financial_summary` | No runtime caller found | None; derived from `transactions` | No direct view writer found | **NO, business-member level not proven** |
| `goal_progress` | Goals browser hook; dashboard hook | None; writes go to `goals` and `goal_contributions` | No direct view writer found | **NO, contribution-to-goal owner invariant not proven** |

## 5. Exact access matrix

| Resource | Anonymous | User | Other User | Business Member | Admin | Service/Server |
|---|---|---|---|---|---|---|
| `account_balances` | **CONDITIONAL** — ACL currently includes `anon`; effective row behavior untested | **ALLOW** for owner path, subject to session test | **DENY** expected from base policies; untested through view | **UNKNOWN** because the view hides `business_id` | **UNKNOWN**; no admin model proven | **ALLOW** for trusted server/service role, subject to need |
| `business_financial_summary` | **CONDITIONAL** — ACL currently includes `anon`; effective behavior untested | **UNKNOWN** pending caller and business invariant | **UNKNOWN** pending cross-user test | **UNKNOWN** pending membership model and composite owner proof | **UNKNOWN** | **ALLOW** for trusted server/service role, subject to need |
| `goal_progress` | **CONDITIONAL** — ACL currently includes `anon`; effective behavior untested | **CONDITIONAL** pending contribution-owner invariant test | **UNKNOWN** pending cross-owner contribution test | **UNKNOWN** | **UNKNOWN**; no admin model proven | **ALLOW** for trusted server/service role, subject to need |
| `dg_confirm_order_payment` | **DENY** expected; not independently session-tested | **CONDITIONAL** — direct browser caller and internal owner checks exist | **DENY** expected from order/account owner checks; untested | **UNKNOWN** | **UNKNOWN**; no explicit admin model proven | **ALLOW** |
| `dg_record_order_fulfilment` | **DENY** expected; not independently session-tested | **CONDITIONAL** — direct browser caller and owner/account checks exist | **DENY** expected; untested | **UNKNOWN** | **UNKNOWN**; no explicit admin model proven | **ALLOW** |
| `dg_refund_or_void_order_payment` | **DENY** expected; not independently session-tested | **CONDITIONAL** — direct browser caller found; full non-production authorization test required | **UNKNOWN** until full body test | **UNKNOWN** | **UNKNOWN**; no explicit admin model proven | **ALLOW** |
| `dg_update_admin_order` | **DENY** expected; not independently session-tested | **CONDITIONAL** — direct browser caller and owner checks exist | **DENY** expected from order/customer owner checks; untested | **UNKNOWN** | **UNKNOWN**; function name does not prove an admin role | **ALLOW** |

## 6. Non-production test procedure

No safe disposable Supabase project was established in this evidence-only run. Do not call production tests non-production. Create or select a disposable branch, provision two test users, one business owner/member scenario if supported, and test-only rows with no real financial or customer data.

For each view, record expected outcomes before execution. Anonymous `SELECT` should be denied after the intended ACL change. User A should read only A-owned account/goal rows. User B should not read A-owned rows. Business summary must test mismatched `transactions.user_id` versus `businesses.user_id` explicitly. Test `SELECT`, `INSERT`, `UPDATE`, and `DELETE` on the views and underlying base tables, but perform mutations only against disposable rows and roll them back or delete them inside the test transaction.

For each RPC, test anonymous denial, authenticated owner success only where the browser path is intentionally retained, authenticated non-owner denial, admin behavior only if an existing admin representation is identified, and service/server success. Capture error class, affected row count, and resulting audit records without using live orders, payments, inventory, or financial records.

## 7. Migration readiness

| Proposed change | Status | Reason |
|---|---|---|
| Remove `PUBLIC`/`anon` access to `account_balances` view | **READY in principle; REQUIRES NON-PRODUCTION TEST** | User ownership is proven and authenticated browser reads exist |
| Preserve authenticated `SELECT` on `account_balances` | **READY in principle; REQUIRES EFFECTIVE-POLICY TEST** | Money Center and Auren consumers are proven |
| Restrict `business_financial_summary` | **REQUIRES OWNER DECISION** | No runtime caller and no composite business-owner invariant are proven |
| Add/approve `goal_progress` protection | **REQUIRES DATA CLEANUP/INVARIANT REVIEW** | Parent/child owner equality is not enforced by verified constraints |
| Revoke authenticated EXECUTE from flagged RPCs | **REQUIRES APPLICATION CHANGE** | Direct browser hooks call these functions today |
| Add explicit admin authorization | **REQUIRES OWNER DECISION** | No existing admin role, claim, membership, or RBAC model was proven |
| Enable RLS on the three named objects | **NOT READY / INVALID TARGET** | They are views; protect view ACLs and underlying base tables instead |

## 8. Final status

**OWNERSHIP: PARTIALLY PROVEN.** Account-level ownership for `account_balances` is proven. Business-member ownership for `business_financial_summary` and contribution-level ownership for `goal_progress` are not fully proven.

**MIGRATION STATUS: NOT READY.** No production grant, RLS, schema, data, or RPC permission change is authorized by this report. The correct next step is disposable-branch authorization testing and data-invariant review.

## References

[1]: https://supabase.com/docs/guides/database/postgres/row-level-security "Supabase Row Level Security"
[2]: https://supabase.com/docs/guides/database/functions "Supabase Database Functions"
[3]: https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable "Supabase database linter: authenticated SECURITY DEFINER function executable"
