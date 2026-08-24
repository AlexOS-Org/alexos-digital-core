# Supabase RPC Caller Map — 24 August 2026

## Scope and status

This report maps the four flagged DailyGear RPC families using repository call sites and live Supabase routine metadata. It is evidence collection only. No RPC was invoked, no grant was changed, no production data was mutated, and no deployment or merge was performed.

The reviewed checkpoint was branch `production-readiness/2026-08-24` at `db1cf7a`; rollback `72e6060` remains recoverable. The production decision remains **80/100 — NO-GO**.

## Final classifications

> **CALLERS PROVEN:** all four RPC families have direct authenticated browser callers in DailyGear UI hooks.
>
> **ADMIN MODEL NOT PROVEN:** no concrete `user_roles`, `is_admin`, RBAC, organization-membership, or business-membership authorization helper was found in the searched `src` and `supabase` paths.
>
> **SERVICE-ROLE EXPOSURE: SAFE AT SOURCE BOUNDARY, RUNTIME SECRET PRESENCE UNVERIFIED.** The service-role client is explicitly server-only and no browser-bundled import was found in the inspected source. Secret values were not read or printed.

## 1. `dg_confirm_order_payment`

| Function | Source file | Call site | User type | Authentication | Expected role | Current EXECUTE grant |
|---|---|---|---|---|---|---|
| `dg_confirm_order_payment(uuid, uuid, numeric, text, timestamptz, text)` | `src/lib/dailygear/api.ts` | Lines 748–767, `useConfirmOrderPayment` | Authenticated DailyGear operator in browser | Direct Supabase client; surrounding authenticated application path; RPC itself checks `auth.uid()` | Conditional owner/operator path; explicit admin role not proven | `authenticated`, `service_role`, `postgres`; no `anon` grant observed in live result |

The UI consumer is `src/components/dailygear/OrderPaymentDialog.tsx:22, 37`. The RPC requires a non-null `auth.uid()`, locks an order only when `dg_orders.user_id = auth.uid()`, verifies the receiving account belongs to that user, rejects a transaction ID already attached to another payment, inserts a posted income transaction, inserts an order payment, updates order payment status, and creates an order event. It is `SECURITY DEFINER`, owned by `postgres`, with `search_path=pg_catalog, public`.

The browser caller is proven. Whether the intended business role is an admin, account owner, or single-user operator is **not proven** by the repository’s authorization model.

## 2. `dg_record_order_fulfilment` — every overload

| Function | Source file | Call site | User type | Authentication | Expected role | Current EXECUTE grant |
|---|---|---|---|---|---|---|
| `dg_record_order_fulfilment(uuid,numeric,numeric,numeric,numeric,uuid,boolean,numeric,uuid,text,dg_order_status)` | `src/lib/dailygear/api.ts` | Lines 541–569, `useRecordOrderFulfilment` | Authenticated DailyGear operator in browser | Direct Supabase client; RPC checks `auth.uid()` | Conditional owner/operator path; explicit admin role not proven | `authenticated`, `service_role`, `postgres`; live metadata returned duplicate rows for the overloaded routine due information-schema join behavior |
| `dg_record_order_fulfilment(uuid,numeric,numeric,numeric,uuid,text,dg_order_status)` | `src/lib/dailygear/api.ts` | Same hook and argument shape through generated overload resolution | Authenticated DailyGear operator in browser | Direct Supabase client; RPC checks `auth.uid()` | Conditional owner/operator path; explicit admin role not proven | `authenticated`, `service_role`, `postgres`; same duplicate metadata artifact |

The UI consumer is `src/components/dailygear/OrderFulfilmentDialog.tsx:22, 65`. The newer overload validates non-negative costs, supplier-payment inputs, account ownership, order ownership, and legal status transitions. It may insert/update `dg_order_expenses` and post Money Center expense transactions for purchase, delivery, advertising, and other costs. Both deployed overload bodies use `SECURITY DEFINER`, owner `postgres`, and `search_path=pg_catalog, public`.

Immediate authenticated EXECUTE revocation would break the current browser workflow unless the application is first migrated to a trusted server path or a proven explicit authorization model is added.

## 3. `dg_refund_or_void_order_payment`

| Function | Source file | Call site | User type | Authentication | Expected role | Current EXECUTE grant |
|---|---|---|---|---|---|---|
| `dg_refund_or_void_order_payment(uuid, text, uuid, numeric, text, text)` | `src/lib/dailygear/api.ts` | Lines 353–384, `useRefundOrVoidOrderPayment` | Authenticated DailyGear operator in browser | Direct Supabase client; full function call tests not run | Conditional privileged operator; explicit admin role not proven | `authenticated`, `service_role`, `postgres`; no `anon` grant observed in live result |

The UI consumer is `src/components/dailygear/OrderRefundDialog.tsx:22, 33`. The hook supports `void` and `refund`, optional refund account/amount/transaction ID, and notes. The operation can reverse payment effects and create financial records. The function is `SECURITY DEFINER` with the hardened search path. The full body’s non-production authorization behavior remains **UNVERIFIED** in this evidence-only run; do not revoke or preserve the grant based on the function name alone.

## 4. `dg_update_admin_order`

| Function | Source file | Call site | User type | Authentication | Expected role | Current EXECUTE grant |
|---|---|---|---|---|---|---|
| `dg_update_admin_order(uuid,dg_order_status,dg_payment_status,text,text,text,text,text,text,text,text,text,text,text,jsonb)` | `src/lib/dailygear/api.ts` | Lines 464–493, `useUpdateOrderDetails` | Authenticated DailyGear operator in browser | Direct Supabase client; RPC checks `auth.uid()` | Intended privileged order-edit operator; explicit admin role not proven | `authenticated`, `service_role`, `postgres`; no `anon` grant observed in live result |

The UI consumer is `src/components/dailygear/OrderEditDialog.tsx:20, 99`. Despite its name, the inspected function authorizes by `auth.uid()` and order/customer ownership rather than a verified admin role or business-membership claim. It validates delivery and order fields and writes order/customer details and order events. This is an authorization-model mismatch requiring an owner decision before permission changes.

## 5. Current grant evidence

The live routine metadata reports `search_path=pg_catalog, public` for all flagged functions. `authenticated`, `service_role`, and `postgres` have EXECUTE for the observed signatures; no `anon` EXECUTE grant appeared in the current result. The duplicated overload rows for fulfilment reflect the metadata query’s join shape, not separate additional function bodies.

The repository migration history confirms the grant intent and evolution: `20260822120000_financial_receipts_salary_schedules.sql:163–164` grants authenticated payment execution; `20260822173000_order_payment_destination_account.sql:98–99` re-grants the current payment signature; `20260822093000_dailygear_supplier_payment_and_ad_cost.sql:194–196` revokes anonymous fulfilment execution and grants authenticated execution; `20260822190000_dailygear_paid_order_refunds.sql:75–76` grants authenticated refund execution; and `20260823040000_harden_sensitive_rpc_grants.sql:5–20` explicitly retains authenticated execution for all five flagged routine families.

## 6. Actual admin authorization model

The searched repository contains authenticated identity handling through `src/integrations/supabase/auth-middleware.ts:34–103`: it requires a Bearer token, validates claims, and exposes `claims.sub` as `userId`. No concrete `user_roles`, `is_admin`, role claim, permissions table, RBAC helper, organization membership, or business membership check was found in the searched `src` and `supabase` paths. The term “admin” appears in the function and UI names, but naming is not authorization evidence.

Therefore, **ADMIN MODEL: NOT PROVEN**. Do not create a new role or invent a claim as part of this investigation.

## 7. Service-role boundary

`src/integrations/supabase/client.server.ts:1–72` defines `supabaseAdmin` from `process.env.SUPABASE_URL` and `process.env.SUPABASE_SERVICE_ROLE_KEY`, with comments explicitly limiting it to trusted server operations and warning against client exposure. Server-side consumers include `src/server.ts`, `src/server/auren/live-evidence-refresh.ts`, and `src/lib/storefront/*.server.ts` modules. No browser-bundled import of `client.server.ts` or `supabaseAdmin` was found in the inspected `src` search.

This proves a safe source-level boundary. Runtime Worker secret configuration and deployed bundle contents were not re-inspected in this run, so runtime secret presence is **UNVERIFIED**, not assumed.

## 8. Required access matrix

| Resource | Anonymous | User | Other User | Business Member | Admin | Service/Server |
|---|---|---|---|---|---|---|
| `account_balances` | **CONDITIONAL** — current view ACL includes anon; effective session behavior not tested | **ALLOW** for account owner path | **DENY** expected from base owner policy; untested through view | **UNKNOWN** | **UNKNOWN** | **ALLOW** subject to trusted use |
| `business_financial_summary` | **CONDITIONAL** — current view ACL includes anon; effective behavior untested | **UNKNOWN** | **UNKNOWN** | **UNKNOWN** | **UNKNOWN** | **ALLOW** subject to trusted use |
| `goal_progress` | **CONDITIONAL** — current view ACL includes anon; effective behavior untested | **CONDITIONAL** pending contribution-owner invariant | **UNKNOWN** | **UNKNOWN** | **UNKNOWN** | **ALLOW** subject to trusted use |
| `dg_confirm_order_payment` | **DENY** expected; not session-tested | **CONDITIONAL**; direct browser caller and internal owner checks proven | **DENY** expected; not tested | **UNKNOWN** | **UNKNOWN** | **ALLOW** |
| `dg_record_order_fulfilment` | **DENY** expected; not session-tested | **CONDITIONAL**; direct browser caller and internal owner/account checks proven | **DENY** expected; not tested | **UNKNOWN** | **UNKNOWN** | **ALLOW** |
| `dg_refund_or_void_order_payment` | **DENY** expected; not session-tested | **CONDITIONAL**; direct browser caller proven, internal guard not fully tested | **UNKNOWN** | **UNKNOWN** | **UNKNOWN** | **ALLOW** |
| `dg_update_admin_order` | **DENY** expected; not session-tested | **CONDITIONAL**; direct browser caller and owner checks proven | **DENY** expected; not tested | **UNKNOWN** | **UNKNOWN** | **ALLOW** |

## 9. Non-production test procedure

No disposable Supabase project or branch was established in this run. Do not test by mutating production and do not label production calls as non-production. In a disposable branch, create two test users, test-only accounts, orders, goals, contributions, and business records.

For each RPC, record expected outcomes before testing. Anonymous calls should fail. A signed-in owner/operator should succeed only where the current browser workflow is intentionally retained. A non-owner must fail. An admin test is **UNKNOWN** until an existing admin representation is identified. Service-role/server calls should succeed only from the trusted server path. Test idempotency, duplicate transaction IDs, account ownership, status transitions, refund bounds, customer ownership, expense posting, and audit-event creation using disposable records only.

For the view resources, test anonymous, owner, other-user, business-owner/member, admin, and service-role `SELECT` behavior. Test direct `INSERT`, `UPDATE`, and `DELETE` against the views and base tables only inside disposable transactions; the views should not receive write grants.

## 10. Migration readiness

| Change | Status | Evidence-based reason |
|---|---|---|
| Revoke `anon`/`PUBLIC` from sensitive views | **READY in principle; REQUIRES NON-PRODUCTION TEST** | Current direct callers are authenticated; views are security invoker |
| Preserve authenticated reads for `account_balances` and `goal_progress` | **READY in principle; REQUIRES EFFECTIVE-POLICY TEST** | Browser and Auren callers are proven |
| Change `business_financial_summary` access | **REQUIRES OWNER DECISION** | No runtime caller and no business-owner invariant proven |
| Add goal/contribution ownership invariant | **REQUIRES DATA CLEANUP** | `goal_contributions.goal_id` FK does not enforce `goal_contributions.user_id = goals.user_id` |
| Revoke authenticated RPC EXECUTE | **REQUIRES APPLICATION CHANGE** | All flagged families have direct browser callers |
| Add or enforce explicit admin authorization | **REQUIRES OWNER DECISION** | No existing admin model proven |
| Enable RLS on the three view names | **NOT READY / INVALID TARGET** | They are views; protect ACLs and base-table RLS |

## Final required status

**CALLERS: PROVEN.** Direct authenticated browser callers exist for all four flagged RPC families; direct view readers are proven for `account_balances` and `goal_progress`; no runtime caller was found for `business_financial_summary`.

**ADMIN MODEL: NOT PROVEN.** No existing role, claim, permissions, organization membership, or business-membership authorization model was found in the searched paths.

**SERVICE-ROLE EXPOSURE: SAFE at source boundary; runtime configuration UNVERIFIED.** The service-role client is server-only by code structure, and no client import was found. Secret values were not read.

**MIGRATION STATUS: NOT READY.** RPC revocation requires an application call-path change; business-summary and goal-progress access require owner/invariant decisions; only view ACL tightening is potentially ready after disposable tests.

## References

[1]: https://supabase.com/docs/guides/database/functions "Supabase Database Functions"
[2]: https://supabase.com/docs/guides/database/postgres/row-level-security "Supabase Row Level Security"
[3]: https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable "Supabase database linter: authenticated SECURITY DEFINER function executable"
