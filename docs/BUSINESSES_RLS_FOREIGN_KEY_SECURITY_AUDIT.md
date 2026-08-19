# Canonical `businesses` RLS and Foreign-Key Security Audit

**Scope:** committed Supabase migrations and generated TypeScript contracts.  
**Status:** static audit complete; live Supabase verification pending because the existing connector is disabled.  
**No schema, production data, or RLS policy was changed.**

## Executive result

The current repository does **not yet have a secure canonical businesses model**. The intended finance model is owner-scoped and UUID-based, but the earlier Meta migration creates a global text-key registry and grants broad authenticated visibility. The Meta child-table policies check only `user_id`; they do not prove that the referenced `business_id` belongs to the same authenticated user. This allows inconsistent cross-business references and can become a tenant-isolation defect after persistence is activated.

The legacy finance migration also grants CRUD privileges to the `anon` role on accounts, bills, budgets, debts, expected money, goals, goal contributions, and transactions. RLS policies appear to be present on the foundational finance tables, so the grants may be blocked by RLS for anonymous requests, but this must be verified remotely. The safer contract is to revoke anonymous access explicitly and grant only the public storefront tables that are intentionally public.

## Findings

| Severity | Finding | Evidence | Security impact |
|---|---|---|---|
| **P0** | Business parent contract is inconsistent: legacy Meta table uses `text id`; finance model expects `uuid id` plus `user_id`. | `20260805042235...sql`; `20260818070000...sql` | Migration failure, broken foreign keys, and unreliable tenant boundary |
| **P1** | Legacy business read policy is global: `using (true)`. | Meta migration policy `businesses_read` | Any authenticated user can enumerate all business IDs/names if this migration is active |
| **P1** | Meta child policies validate `user_id` but not ownership of `business_id`. | `own_rows` policies on Meta tables | A user can potentially create a row owned by themselves that points at another business key |
| **P1** | `meta_sync_runs` has RLS enabled but no authenticated policy. | Meta migration lines 176–187 | Intended operational visibility is undefined; service-role-only behavior is not explicit enough for future operators |
| **P1** | Anonymous CRUD grants exist on private finance tables. | `20260722122857_remote_commit.sql` | Defense-in-depth failure; accidental policy changes could expose or mutate personal finance data |
| **P1** | Owner-based business policies in the finance migration cannot coexist with the legacy table. | Finance policies reference `user_id`; legacy table lacks it | The migration may fail or leave the database in a partially reconciled state |
| **P2** | Legacy seeded businesses have no owner mapping. | `dailygears`, `carbar_motion`, `nuvora` inserts | Ownership cannot be safely inferred during migration |
| **P2** | Child FKs lack composite owner-consistency constraints. | Meta tables have independent `user_id` and `business_id` | Database permits inconsistent owner/business combinations unless policies prevent them perfectly |
| **P2** | Several FK columns use default behavior with no explicit `on delete` strategy. | Meta migration FK definitions | Deletion behavior is implicit and can produce operational surprises |
| **P2** | Generated types still represent the legacy businesses table. | `src/integrations/supabase/types.ts` | Application code cannot enforce the intended UUID/owner contract at compile time |
| **P3** | No committed RLS regression test suite exists. | `package.json` has no test script | Policy regressions can reach production undetected |

## Security strengths

The Meta child tables generally have `user_id` columns and authenticated policies with both `using` and `with check` predicates. The asset association policies traverse the parent asset or collection ownership instead of trusting arbitrary IDs. Foundational finance tables use `auth.uid() = user_id` predicates. Stock reservation functions are explicitly revoked from `anon` and `authenticated`, which is a good example of limiting sensitive operations.

These strengths are not sufficient to close the business-isolation gap because business ownership is not yet the authoritative parent relationship.

## Required canonical invariants

1. `public.businesses.id` is UUID and is the only canonical business foreign-key target.
2. Every user-owned business has a non-null `user_id` referencing `auth.users(id)` with `on delete cascade` or an explicitly approved archival strategy.
3. Every business-scoped child row is owned by the same user as its parent business.
4. Authenticated users can see and mutate only businesses they own.
5. Public storefront tables are explicitly separated from private finance/CRM/Meta tables.
6. Service-role-only operational tables have no authenticated or anonymous grants unless a documented read policy is required.
7. Legacy Meta keys are stored as unique compatibility keys, not used as canonical foreign keys.
8. Deletes use explicit behavior: normally `restrict` for financial facts, `set null` for optional references, and `cascade` only for dependent derived/sync data.
9. Every ownership-sensitive table has an RLS test for owner A, owner B, anonymous, and service-role contexts.
10. Generated Supabase types are regenerated only from the verified canonical remote schema.

## Recommended policy pattern

After reconciliation, child policies should validate the parent business owner, not only the child `user_id`. A representative pattern is:

```sql
create policy "business members can read meta accounts"
on public.meta_ad_accounts
for select
to authenticated
using (
  exists (
    select 1
    from public.businesses b
    where b.id = meta_ad_accounts.business_id
      and b.user_id = (select auth.uid())
  )
);
```

For insert and update, use a matching `with check` condition and either remove the redundant child `user_id` or enforce a composite consistency constraint. If the child keeps `user_id` for audit/query performance, require both `user_id = auth.uid()` and parent `businesses.user_id = auth.uid()`.

## Anonymous grants

The old grant migration gives `anon` CRUD privileges on private finance tables. The reconciliation migration should explicitly revoke them:

```sql
revoke all on public.accounts, public.bills, public.budgets,
  public.debts, public.expected_money, public.goals,
  public.goal_contributions, public.transactions
from anon;
```

Only intentionally public DailyGear storefront tables should retain anonymous `select`, and those should expose only the public projection required by the storefront.

## Validation required before activation

Run the following against a staging clone and then against Supabase after enabling the read-only connector:

- Migration replay from empty database.
- Upgrade from legacy Meta migration state.
- RLS matrix: owner A, owner B, anonymous, service role.
- Cross-business insert/update attempts with mismatched `user_id` and `business_id`.
- Enumeration test for business list and Meta child tables.
- Anonymous CRUD attempts against finance tables.
- FK orphan and owner-mismatch queries.
- Delete behavior tests for business, financial facts, Meta assets, and derived insights.
- Generated type regeneration and full TypeScript validation.
- DailyGear dashboard and Meta sync smoke test using empty and owned data.

## Required next action

Enable the existing Supabase connector and perform a read-only preflight of remote migration history, actual schema, policies, grants, and row ownership. Then create a forward-only reconciliation migration that establishes UUID businesses, explicit legacy-key mappings, owner-based policies, revoked anonymous finance grants, and owner-consistent child foreign keys. Do not apply a migration based only on the repository snapshot.
