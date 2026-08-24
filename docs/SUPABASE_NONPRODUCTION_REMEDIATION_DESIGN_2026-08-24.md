# Supabase Non-Production Remediation Design — 24 August 2026

## Decision and scope

This document converts the completed ownership and caller evidence into an implementation-ready plan. It is **not production approval** and does not apply migrations, revoke privileges, enable RLS, change data, merge `main`, or deploy.

The protected branch is `production-readiness/2026-08-24`. The requested recovery points `6f1d678`, `db1cf7a`, and `72e6060` must remain recoverable. The current readiness status remains **80/100 — NO-GO**.

The canonical Supabase project evidence shows that `account_balances`, `business_financial_summary`, and `goal_progress` are security-invoker views, not tables. Direct `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` against those names is invalid. Protection must be designed through view ACLs and underlying base-table RLS, together with any required owner-invariant constraints.

## Evidence baseline

The live base policies are user-owner policies on `accounts`, `transactions`, `goals`, and `goal_contributions`, using `auth.uid() = user_id`. The live view ACLs still include API roles, including `anon` and `authenticated`, so effective view access must be tested rather than inferred from the underlying policies.

The repository’s current authentication middleware validates a user Bearer token and exposes `claims.sub` as `userId`. No existing admin role, permissions table, role claim, organization membership, or business-membership model was proven in the searched source and migration paths. The server-only Supabase client is structurally separated from browser code and uses `SUPABASE_SERVICE_ROLE_KEY` only in server modules; runtime secret configuration was not reverified in this design pass.

All four flagged RPC families have direct authenticated browser callers. The RPC bodies use `SECURITY DEFINER`, fixed `search_path=pg_catalog, public`, and owner-oriented checks, but the function name `dg_update_admin_order` does not prove administrator authorization.

## Priority 1 — `account_balances`: proven account-owner model

### Current behaviour

`account_balances` is a security-invoker view derived from `accounts` and posted, non-deleted `transactions`. `accounts.id` and `accounts.user_id` are non-null. The view joins transactions on the same `user_id`. Money Center browser hooks read it directly, and Auren reads it with a user filter. The view ACL currently includes API roles, while the underlying base tables have owner policies.

### Target behaviour

Anonymous users must receive no rows and no usable access. An authenticated user may read only balances whose source account belongs to `auth.uid()`. A different authenticated user must receive zero rows. The view must remain read-only to API roles. Trusted server use is allowed only for a documented user-scoped operation or a separately authorized service operation.

### Code changes

No application code change is required for the first non-production ACL test because current readers already select the view and the proven ownership key is `accounts.user_id`. Before production rollout, retain the explicit Auren `.eq("user_id", userId)` filter as defence in depth. If the view is later moved behind a server function, the function must preserve the caller identity and return only that user’s rows; it must not use service role merely to bypass RLS.

### Database changes — draft only

In the disposable branch, revoke `SELECT` from `PUBLIC` and `anon` on `public.account_balances`, then test whether authenticated `SELECT` is required by the existing browser readers. If required, grant authenticated `SELECT` and rely on security-invoker semantics plus the underlying owner policies. Do not attempt `ALTER TABLE` on the view. Do not grant any view write privilege.

### Authorization model

**User-owned derived resource.** The authoritative ownership path is `account_balances → accounts.user_id = auth.uid()`. Business membership is not needed because the view does not expose business ownership and `accounts.business_id` is optional.

### Non-production test

Use two disposable users and two disposable accounts, with posted and deleted transactions for each. Test anonymous SELECT, User A SELECT, User B SELECT, direct write attempts, deleted-account filtering, and a service-role/server read. Assert that User A cannot see User B’s balance and that account totals change only once when a disposable base transaction is inserted.

### Rollback

Restore the previous view ACL snapshot. If a test reveals that authenticated browser reads depend on the prior grant, keep the grant unchanged and route the readers through a proven user-scoped server function before retrying. No production rollback is authorized from this document.

### Production preconditions

A disposable Supabase branch must pass all access tests; the exact ACL diff must be reviewed; the Money Center and Auren readers must be smoke-tested; and a pre/post advisor snapshot must be captured. Only then may an approved production migration be considered.

## Priority 2 — `goal_progress`: resolve the ownership invariant first

### Current behaviour

`goal_progress` is a security-invoker view joining `goals` to `goal_contributions` on `goal_id`. Both tables have `user_id` columns and owner policies. The verified foreign key only enforces `goal_contributions.goal_id → goals.id`; it does not enforce that contribution and goal owners match. The Goals and dashboard hooks read the view; writes go to the base tables.

### Target behaviour

A goal-progress row must aggregate only contributions belonging to the same owner as the goal. A user must never be able to attach their contribution to another user’s goal and affect the other user’s progress. Anonymous and other-user reads must return no rows. The invariant must be enforced at the database boundary, not only in UI code.

### Code changes

Before migration, inspect `useContribute` and all other contribution writers to confirm they always derive `user_id` from the authenticated session and cannot accept an arbitrary owner ID. Add a regression test for a mismatched `goal_id`/`user_id` attempt against a disposable database. Do not add a new admin or membership model.

The preferred view-level safety predicate is to join contributions with both `gc.goal_id = g.id` and `gc.user_id = g.user_id`. This is defence in depth, not a substitute for correcting the base-table invariant. Any server function that creates a contribution must derive the owner from the authenticated context and verify the goal belongs to that same owner.

### Database changes — draft only

Choose one approved invariant after data review: either add a composite foreign key `(goal_id, user_id) REFERENCES goals(id, user_id)` after confirming a matching unique key and cleaning any mismatches, or replace direct contribution writes with an owner-checking RPC and add a constraint/trigger appropriate to the existing schema. Update the view join to include `gc.user_id = g.user_id`. Revoke anonymous view access and grant authenticated SELECT only after tests pass. Do not silently delete or rewrite existing contributions.

### Authorization model

**Private user-owned resource with a required parent/child owner invariant.** No business-member or admin access is authorized by current evidence.

### Non-production test

Seed two disposable users, goals, and contributions. Test a valid same-owner contribution, a mismatched-owner contribution, a contribution pointing to another user’s goal, anonymous SELECT, User A SELECT, User B SELECT, direct view writes, and aggregation totals. Assert that mismatched rows are rejected or excluded and that a valid contribution changes one owner’s progress exactly once.

### Rollback

Restore the prior view definition and remove the new constraint only within the disposable branch if tests fail. Preserve any pre-migration data snapshot and mismatch report. Do not apply a destructive cleanup or production rollback without explicit approval and backup evidence.

### Production preconditions

An owner mismatch scan must return zero unresolved mismatches or have an approved cleanup plan. A matching unique key must exist before a composite foreign key is added. Both current Goals readers and writers must pass non-production tests. Only then may view ACL and invariant migrations be reviewed.

## Priority 3 — `business_financial_summary`: server-only until ownership is proven

### Current behaviour

The view groups transaction income, expenses, and operating profit by `transactions.user_id`, nullable `business_id`, and month. `transactions.business_id` references `businesses.id`; `businesses.user_id` is non-null. No composite constraint proves `transactions.user_id = businesses.user_id`. No runtime caller was found in `src`.

### Target behaviour

Until a business-membership or owner invariant is proven, anonymous and browser-direct access must be denied. The safe default is no public API exposure. Any future summary must be served only to a verified owner or explicitly modeled business member, with the ownership predicate applied in the query path.

### Code changes

No runtime caller was found, so do not add a new consumer. If Auren or a future dashboard needs the summary, add a server-only read function that accepts an authenticated user identity, resolves allowed business IDs from an existing proven model, and queries only those IDs. If no membership model exists, restrict the first implementation to `businesses.user_id = auth.uid()`; do not claim member access. Do not use service role to manufacture authorization.

### Database changes — draft only

In the disposable branch, revoke `PUBLIC`, `anon`, and authenticated direct access to the view. If an owner-only consumer is approved, create a security-invoker view or server query that joins `transactions.business_id = businesses.id` and requires `transactions.user_id = businesses.user_id` plus `businesses.user_id = auth.uid()`. A composite transaction/business owner invariant may be added only after mismatch discovery and owner approval.

### Authorization model

**Unknown/conditional.** Current evidence proves user attribution and business IDs but not business-member authorization. Admin access is not proven. Service-role access is trusted infrastructure access, not an end-user entitlement.

### Non-production test

Seed two users, two businesses, and transactions covering: matching user/business owner, mismatched user/business owner, null business ID, and cross-user attempts. Test anonymous, owner, other user, prospective member, admin-claim absent, and service-role/server reads. The member and admin tests remain expected `UNKNOWN` until such models exist.

### Rollback

Restore the prior view ACL and definition in the disposable branch. Retain the mismatch results and caller inventory. If no approved consumer exists, keep access denied rather than re-opening broad access for convenience.

### Production preconditions

A real caller must be identified, business ownership/member semantics must be approved, mismatches must be zero or remediated, and the exact read query must pass cross-user tests. Until then this object remains **server-only/deny-by-default**.

## Priority 4 — RPC call-path change before EXECUTE changes

### Current behaviour

`dg_confirm_order_payment`, both `dg_record_order_fulfilment` overloads, `dg_refund_or_void_order_payment`, and `dg_update_admin_order` have direct authenticated browser callers in `src/lib/dailygear/api.ts`. Their live EXECUTE grants include `authenticated`, `service_role`, and `postgres`; anonymous execution was not observed. The functions are SECURITY DEFINER with a fixed search path. Owner checks are proven for payment, fulfilment, and order-update paths; full refund/void authorization behavior remains unverified. No explicit admin/RBAC model exists in the searched paths.

### Target behaviour

Financial and order-mutating operations must be reachable only through an intentionally authorized operation path. The caller’s identity, ownership or approved business role, allowed fields, idempotency key, and audit event must be verified before mutation. Only after all browser callers are migrated and tested may `authenticated` EXECUTE be reconsidered.

### Code changes

Do not revoke grants yet. In the disposable branch, introduce thin `createServerFn` wrappers for each operation using the existing authenticated middleware pattern. The first safe version should forward the authenticated user context, not silently switch to service role. Move browser hooks to these wrappers only after preserving all current validation and return types. Add operation-specific authorization helpers only when the existing owner rule is confirmed; do not invent admin claims.

For `dg_confirm_order_payment`, preserve order-owner, receiving-account-owner, duplicate-transaction, posted-income, and order-event checks. For both fulfilment overloads, preserve order ownership, account ownership, non-negative costs, legal status transitions, and expense posting. For refund/void, first inspect and test the full function body and enforce non-owner denial and refund-bound/idempotency rules. For `dg_update_admin_order`, rename or reclassify the operation in application terminology until a real admin model is approved; its current owner check is not an admin boundary.

After server wrappers are proven, the preferred future privileged design is a server-only endpoint with an explicit authorization layer and service-role call only for operations that are intentionally admin/service actions. Because no admin model is currently proven, this service-role phase is **design-only**, not implementable safely now.

### Database changes — draft only

Keep existing grants unchanged during application migration. After every browser caller is removed or intentionally retained, run a disposable grant-diff test. Only then may a draft migration revoke `authenticated` EXECUTE while retaining `service_role` and `postgres`. No production revoke is authorized now.

### Authorization model

Current proven model: authenticated user plus row-owner checks. Missing model: business membership and admin/RBAC. Minimum safe boundary is owner authorization for owner-owned operations, with explicit business membership required before multi-user operation. No operation may be treated as admin-only from its name.

### Non-production test

For every overload, test anonymous denial, authenticated owner success, authenticated non-owner denial, business-member behavior only if a real model exists, absent-admin behavior, service/server behavior, idempotency, replay, amount bounds, account ownership, status transitions, refund bounds, expense posting, transaction count, balance impact, and audit events. Use disposable rows only. Capture the grant state before and after; do not run these tests against real orders or payments.

### Rollback

Keep the old browser hook path and grants available behind a reversible branch commit until the server wrapper passes the complete test matrix. If any test fails, revert only the wrapper change and keep the database grants unchanged. Never compensate for a failing application test by widening a grant or weakening a function guard.

### Production preconditions

All browser callers must be inventoried and migrated or explicitly approved. Full function-body authorization tests must pass. The admin/business authorization decision must be documented. Service-role runtime configuration must be verified without exposing values. Only then may a separate reviewed grant migration be considered.

## Priority 5 — minimum authorization boundary

The repository proves authenticated identity but not administrator or business-member roles. The minimum safe boundary is therefore:

| Operation class                                                    | Authorized now                                                                                   | Not authorized by current evidence                     |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------ |
| User-owned account, transaction, goal, and contribution operations | `auth.uid() = user_id`, plus parent/child owner invariants                                       | Cross-user access                                      |
| DailyGear order payment/fulfilment/order update                    | Authenticated caller plus proven order/account ownership checks, subject to non-production tests | General admin or business-member access                |
| Refund/void                                                        | No production approval until full guard and non-production tests pass                            | Broad authenticated access based only on UI visibility |
| Business-financial summary                                         | Deny by default; owner-only path only after business-owner join is proven                        | Member/admin access                                    |
| Service-role operation                                             | Trusted server modules only                                                                      | Browser exposure or end-user entitlement               |
| Admin/RBAC operation                                               | None currently proven                                                                            | Any new role/claim invented from function naming       |

A future admin model, if required, must be an explicit owner-approved design with a database-backed membership/role representation, RLS policies, server-side enforcement, audit events, and negative tests. It must not be created implicitly as part of grant cleanup.

## Implementation order

| Order | Action                                                       | Current status                                   |
| ----: | ------------------------------------------------------------ | ------------------------------------------------ |
|     1 | Create disposable Supabase branch and test identities/data   | **BLOCKED: environment not established**         |
|     2 | Test `account_balances` ACL tightening                       | **READY IN PRINCIPLE**                           |
|     3 | Scan and resolve goal/contribution owner mismatches          | **REQUIRES DATA REVIEW**                         |
|     4 | Confirm real business-summary caller and ownership semantics | **REQUIRES OWNER DECISION**                      |
|     5 | Add and test server wrappers for browser RPC callers         | **REQUIRES APPLICATION WORK AND NON-PROD TESTS** |
|     6 | Run complete negative/positive authorization matrix          | **BLOCKED until disposable environment**         |
|     7 | Review draft SQL and rollback evidence                       | **PENDING TEST RESULTS**                         |
|     8 | Consider production migration only after all gates           | **NOT AUTHORIZED**                               |

## Final status

**Application-side safeguards applied in this design pass: none.** No safe implementation could be validated without a disposable Supabase environment and without inventing an admin/business-membership model. The document is implementation-ready, but execution remains gated.

**Database changed: NO.**  
**Production data changed: NO.**  
**RPC EXECUTE privileges changed: NO.**  
**Production RLS changed: NO.**  
**Main merged or deployment performed: NO.**  
**Readiness score: 80/100 — NO-GO.**

## References

[1]: https://supabase.com/docs/guides/database/postgres/row-level-security "Supabase Row Level Security"
[2]: https://supabase.com/docs/guides/database/functions "Supabase Database Functions"
[3]: https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable "Supabase database linter: authenticated SECURITY DEFINER function executable"
