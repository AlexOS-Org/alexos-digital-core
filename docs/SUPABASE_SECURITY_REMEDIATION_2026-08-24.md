# Supabase Security Remediation Plan — 24 August 2026

## Status and safety boundary

This document records a read-only investigation of the canonical Supabase project `goafwbrayepaihxbqsse` for the AlexOS application. The reviewed repository checkpoint is branch `production-readiness/2026-08-24` at `db1cf7a`; rollback `72e6060` remains recoverable. No production migration, grant, revoke, RPC permission change, data write, financial mutation, order mutation, inventory change, or deployment was performed.

The production decision remains **80/100 — NO-GO**. This plan is remediation-ready, but it is not authorization to apply the SQL.

## 1. Current exposure

The three objects originally reported as RLS-disabled tables are, in the live schema, **security-invoker views** owned by `postgres`: `public.account_balances`, `public.business_financial_summary`, and `public.goal_progress`. Each currently reports `security_invoker=true`, `rls_enabled=false`, and an ACL containing `anon`, `authenticated`, and `service_role` entries.

RLS is not enabled directly on these view names because they are views. Their security depends on view grants and on RLS policies applied to the underlying base tables. Treating them as ordinary tables and issuing `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` would be an incorrect and potentially disruptive remediation.

The Supabase security advisor separately reports six warnings: leaked-password protection is disabled, and authenticated users can execute five sensitive `SECURITY DEFINER` RPC families. These findings remain unresolved and are not suppressed by this document.

## 2. Data sensitivity and classification

| Object | Verified contents and dependencies | Classification | Required exposure |
|---|---|---|---|
| `account_balances` view | Per-account `balance`, `money_in`, and `money_out`; derives from `accounts` and posted `transactions` for the same user | **Private user financial data** | Authenticated owner-scoped read; no anonymous read; trusted server/service-role read only where needed |
| `business_financial_summary` view | Monthly `income`, `expenses`, and `operating_profit` grouped by `user_id` and `business_id`; derives from `transactions` | **Authenticated business financial data** | No public read; authenticated read only after business-scope policy and caller need are proven; trusted server/service-role as required |
| `goal_progress` view | `goal_id`, `user_id`, and aggregate `current_amount`; derives from `goals` and `goal_contributions` | **Private user goal/progress data** | Authenticated owner-scoped read; no anonymous read; base-table writes remain owner-controlled |

The view definitions expose financial amounts and progress metrics. None should be classified as public catalogue data.

## 3. Application callers

The repository call graph establishes direct browser reads for two views. `src/lib/money/api.ts` calls `supabase.from("account_balances").select("*")`, and the Money Center routes and dashboard consume that hook. `src/lib/goals/api.ts` calls `supabase.from("goal_progress").select("*")`, and the authenticated Goals route consumes it. `src/lib/auren/advisor.server.ts` also reads `account_balances` and `goal_progress` server-side with an explicit `user_id` filter.

No runtime `from("business_financial_summary")` call was found in `src`. The object is present in migration provenance and generated Supabase types, but a live application caller was not established. Its authenticated grant must therefore not be removed or retained as a release decision solely from the object name; the next non-production caller test must confirm whether it is unused, reserved for a future dashboard, or accessed indirectly.

The four flagged DailyGear RPC families are invoked directly from authenticated browser hooks in `src/lib/dailygear/api.ts`: `useConfirmOrderPayment`, `useRecordOrderFulfilment`, `useRefundOrVoidOrderPayment`, and `useUpdateOrderDetails`. The corresponding UI callers are `OrderPaymentDialog`, `OrderFulfilmentDialog`, `OrderRefundDialog`, and `OrderEditDialog`. This call graph proves that immediately revoking authenticated `EXECUTE` would break current operations unless a trusted server path is introduced first.

## 4. Database dependencies

The live dependency graph is:

- `account_balances` → `accounts` + `transactions`, filtering deleted accounts and posted transactions.
- `business_financial_summary` → `transactions`, filtering business-linked, non-deleted transactions and aggregating by month.
- `goal_progress` → `goals` + `goal_contributions`, aggregating non-deleted contributions by goal.

The underlying base tables have owner-scoped policies using `auth.uid() = user_id`: `accounts`, `transactions`, `goals`, and `goal_contributions`. These policies are currently defined for the `public` role and perform owner checks for `ALL` commands. The views are security invoker, so the underlying table policies are the relevant row filter; this must still be tested with real anonymous and authenticated sessions in a disposable branch.

No foreign-key constraint was returned for the three view names, which is expected because they are views. The view definitions themselves are the authoritative dependency evidence for this review.

## 5. SECURITY DEFINER function review

| Function | Security properties | Authorization observed | Impact |
|---|---|---|---|
| `dg_confirm_order_payment` | `SECURITY DEFINER`, owner `postgres`, `search_path=pg_catalog, public` | Requires non-null `auth.uid()`; locks an order only when `dg_orders.user_id = auth.uid()`; requires the receiving account to belong to the same user; rejects duplicate transaction IDs for another payment | Inserts a posted income transaction, inserts an order payment, updates payment status, and writes an order event |
| `dg_update_admin_order` | `SECURITY DEFINER`, owner `postgres`, `search_path=pg_catalog, public` | Requires non-null `auth.uid()`; locks and updates only an order where `dg_orders.user_id = auth.uid()`; updates customer only where customer `user_id = auth.uid()`; validates Kenya delivery details | Updates order/customer delivery and payment fields and writes an order event; no separate admin allowlist was observed |
| `dg_record_order_fulfilment` overloads | `SECURITY DEFINER`, owner `postgres`, `search_path=pg_catalog, public` | Requires non-null `auth.uid()` and locks only the caller’s order; validates costs, account ownership, supplier-payment inputs, and status transitions | Inserts/updates order expenses and may post Money Center expense transactions; affects supplier-payment and fulfilment accounting |
| `dg_refund_or_void_order_payment` | `SECURITY DEFINER`, owner `postgres`, hardened search path | Advisor flags authenticated execution; internal authorization must be tested from the complete function body and non-production call matrix before grant changes | Can reverse/void payment records and create refund-side financial effects |

The inspected functions have meaningful owner checks, but **owner authorization is not equivalent to explicit administrator authorization**. The function names and UI placement suggest an admin workflow, while the database predicate currently authorizes the order owner. This mismatch must be resolved as an application security decision, not hidden by merely changing grants.

## 6. Proposed least-privilege matrix

| Object or operation | Anonymous | Authenticated owner | Authorized admin | Service role | Server path | Reason and verification path |
|---|---|---|---|---|---|---|
| `account_balances` SELECT | **DENY** | **ALLOW** own rows only | **CONDITIONAL** | **ALLOW** | **ALLOW** | Direct authenticated Money Center and Auren reads exist; test owner/non-owner and anonymous sessions |
| `business_financial_summary` SELECT | **DENY** | **CONDITIONAL** pending caller/business-scope proof | **CONDITIONAL** | **ALLOW** | **ALLOW** | No runtime caller was found; confirm whether future business dashboard access is required |
| `goal_progress` SELECT | **DENY** | **ALLOW** own rows only | **CONDITIONAL** | **ALLOW** | **ALLOW** | Direct authenticated Goals read exists; writes flow through owner-scoped base tables |
| Sensitive financial/order RPC EXECUTE | **DENY** | **CONDITIONAL** only while direct browser path remains and owner checks are proven | **CONDITIONAL** after explicit admin model is proven | **ALLOW** | **ALLOW** | Current direct browser callers mean immediate revoke would break operations; migrate to trusted server path first |
| Base-table writes | **DENY** for anonymous | **CONDITIONAL** owner policies already exist | **CONDITIONAL** | **ALLOW** | **ALLOW** | Verify effective policy behavior and do not broaden writes while remediating views |

Every conditional allow requires a disposable-branch authorization test. The current production evidence is insufficient to convert the conditional entries into release approvals.

## 7. Draft migration SQL

The following SQL is a **draft only**. It targets view ACLs, not RLS on views. It removes `PUBLIC` and `anon` view access while preserving authenticated reads required by the established `account_balances` and `goal_progress` browser callers. `business_financial_summary` remains a deliberate decision point until its caller need is proven.

```sql
BEGIN;

REVOKE ALL ON TABLE public.account_balances FROM PUBLIC, anon;
REVOKE ALL ON TABLE public.business_financial_summary FROM PUBLIC, anon;
REVOKE ALL ON TABLE public.goal_progress FROM PUBLIC, anon;

GRANT SELECT ON TABLE public.account_balances TO authenticated;
GRANT SELECT ON TABLE public.goal_progress TO authenticated;
-- Grant SELECT on business_financial_summary only after a verified caller requires it.

-- These names are security-invoker views. Do not use ALTER TABLE ... ENABLE ROW LEVEL SECURITY.
-- Verify the underlying policies on accounts, transactions, goals, and goal_contributions first.

COMMIT;
```

A separate future RPC migration may revoke authenticated execution from the five flagged RPC families, but it must not be applied until the direct browser call graph is migrated to a trusted server path and non-production tests prove the replacement preserves payment, fulfilment, refund, and order-edit workflows. The existing draft file `/home/ubuntu/supabase_sensitive_rpc_grants_draft.sql` is intentionally not production-ready authorization because it requires that caller migration first.

## 8. Test plan before any production migration

The disposable branch must establish expected outcomes before tests run. Anonymous users must receive no rows and no write capability for all three views. An authenticated owner must read only their own `account_balances` and `goal_progress` rows. An authenticated user must not read another user’s derived rows. `business_financial_summary` must be tested against both user and business ownership boundaries. Admin behavior must be tested only after the project’s actual admin representation is identified. Service-role and trusted-server reads must be verified separately.

For the flagged RPCs, test anonymous denial, authenticated non-owner denial, authenticated owner behavior only if the browser workflow is intentionally retained, authorized-admin behavior only after an explicit admin check exists, and service-role/server success. Use disposable records and rollback after each mutation test. Do not invoke payment, refund, fulfilment, or order-edit functions against live customer records.

## 9. Rollback procedure

Because no migration has been applied, the immediate rollback is to apply nothing. In a disposable branch, rollback the view-grant draft with `GRANT SELECT ON TABLE public.account_balances, public.business_financial_summary, public.goal_progress TO anon;` only if the pre-migration ACL snapshot proves those grants were required, then re-run the anonymous exposure test. Do not restore broad grants in production without a documented owner and security approval.

For any future applied migration, capture `relacl`, view options, policy definitions, and routine privileges before execution. Revert only from that captured baseline, never from assumptions or generated SQL alone.

## 10. Production deployment sequence

First create or select a disposable Supabase branch and snapshot the relevant object definitions and grants. Next identify and repair any NULL or ambiguous owner mappings in the underlying base tables using an approved data-owner process. Then run the full anonymous/owner/non-owner/admin/service-role matrix. Migrate direct browser RPC callers to a trusted server path or add the project’s canonical explicit admin authorization check. Apply view ACL changes and any approved underlying-policy changes only in the disposable branch. Re-run Supabase security advisors, local tests, browser smoke tests, and business-flow tests. Only after review approval, a separate production change window may apply the exact reviewed migration with rollback evidence and post-deployment verification.

## 11. Finding status

| Finding | Status | Explanation |
|---|---|---|
| Three named objects have no direct RLS | **VERIFIED** | They are security-invoker views, not tables; direct RLS on the view names is not the correct control |
| Sensitive view ACLs include `anon` and `authenticated` | **VERIFIED** | Live ACL evidence returned those roles for all three views |
| Underlying owner policies exist | **VERIFIED** | Live policy evidence returned owner-scoped policies for `accounts`, `transactions`, `goals`, and `goal_contributions` |
| Effective anonymous/non-owner behavior | **UNVERIFIED** | Requires disposable authenticated and anonymous session tests |
| Five authenticated SECURITY DEFINER RPC warnings | **VERIFIED** | Supabase advisor and live routine privilege evidence agree |
| RPC internal owner checks | **VERIFIED for inspected functions** | `auth.uid()` and order/account ownership checks were observed; separate admin allowlist was not observed |
| RPC browser migration safety | **BLOCKED** | Direct authenticated client callers still exist in DailyGear UI code |
| Leaked-password protection | **VERIFIED as disabled** | Supabase security advisor warning remains |
| Remediation SQL | **REMEDIATION READY — DRAFT ONLY** | Corrected to target view grants and preserve established client reads; requires non-production validation |

## 12. Final decision

The evidence establishes a clear remediation path but does not authorize production changes. Maintain **80/100 — NO-GO**. The next safe action is a disposable Supabase authorization test and application call-path design review, followed by a separately approved migration—not a blind grant revoke or an attempt to enable RLS on views.

## References

[1]: https://supabase.com/docs/guides/database/postgres/row-level-security "Supabase Row Level Security"
[2]: https://supabase.com/docs/guides/database/functions "Supabase Database Functions"
[3]: https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable "Supabase database linter: authenticated SECURITY DEFINER function executable"
[4]: https://supabase.com/docs/guides/auth/password-security "Supabase password strength and leaked-password protection"
