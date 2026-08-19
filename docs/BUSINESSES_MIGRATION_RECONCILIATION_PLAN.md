# `businesses` Migration Reconciliation Plan

**Status:** Prepared; live Supabase migration state required before SQL activation.  
**Repository:** `dylextrends/alexos-digital-core`  
**Canonical branch:** `main`

## Decision

AlexOS should use an **owner-scoped UUID business identity** as the canonical business model. This matches the finance migration, the source-of-truth requirement for personal/business isolation, and the need to add future businesses without redesigning Meta, CRM, commerce, or Money Center tables.

The legacy Meta registry's text keys—`dailygears`, `carbar_motion`, and `nuvora`—must not be discarded. They should be preserved as stable external/business keys during reconciliation, ideally in a column such as `legacy_key` or `slug`, with a unique constraint appropriate to the owner model. Meta tables should then reference the canonical UUID `businesses.id`.

## Confirmed source conflict

The Meta migration creates `public.businesses` with `id text`, `display_name`, and `created_at`, then seeds three global rows and exposes them with `using (true)`. The finance migration expects `public.businesses.id uuid`, `user_id uuid`, `name`, `slug`, `status`, `currency`, and ownership policies. `create table if not exists` cannot transform the existing text-key table into the UUID/user-owned table, so the finance migration is not a safe reconciliation mechanism by itself.

## Required live preflight

Before any SQL is applied, inspect the remote migration history and schema. The preflight must record:

1. Whether the Meta migration is applied.
2. Whether the finance migration is applied, partially applied, or absent.
3. The actual type and constraints of `public.businesses`.
4. Existing rows and every foreign key referencing `public.businesses`.
5. Whether any `business_id` columns contain legacy values.
6. Existing RLS policies, grants, triggers, and generated types.
7. Whether any production application rows already depend on the seeded legacy keys.

The preflight must abort without changes if the observed state does not match one of the explicitly supported branches.

## Supported migration branches

### Branch A: finance migration is pending

Use a clean forward-only migration sequence in a staging database first. The canonical business table should be created once with UUID ownership, a stable `slug`/legacy-key field, currency, status, timestamps, and owner-based RLS. Meta tables should be created or altered to reference UUID business IDs. The legacy seeded rows should be inserted only with an explicit owner or through a separate global catalog—not as globally visible user-owned businesses.

### Branch B: legacy Meta table exists and finance migration failed or is absent

Create a controlled repair migration that first adds nullable compatibility columns to the legacy table, creates an explicit mapping for each legacy key, and requires an owner assignment before enforcing user ownership. Migrate dependent Meta rows through the mapping. Only after foreign keys and row counts are verified should the canonical UUID constraints and owner-based RLS be enforced.

The repair must not silently assign a production user's ownership. If the owner cannot be determined from existing records, the migration must stop with an actionable exception or place the rows in a clearly isolated administrative reconciliation state.

### Branch C: finance migration is already applied

Do not edit or replay earlier migrations. Inspect the actual UUID table and add only the missing Meta compatibility columns, foreign keys, indexes, policies, and data mappings in a new migration. Existing finance rows and business UUIDs remain authoritative.

## Invariants for the final schema

| Invariant | Required condition |
|---|---|
| Canonical identity | `public.businesses.id` is UUID and is the only business foreign-key target |
| Ownership | Every user-owned business has a non-null `user_id` referencing `auth.users(id)` |
| Legacy compatibility | Legacy Meta keys are preserved in a unique, indexed mapping/slug field |
| Isolation | Authenticated users can access only businesses they own or an explicitly documented global catalog |
| Foreign keys | Meta, finance, CRM, commerce, and reporting business links use the same UUID type |
| Idempotency | Re-running the migration does not duplicate business mappings or rows |
| Auditability | A reconciliation table or migration log records source key, canonical UUID, owner, and migration time |
| No silent loss | Row counts and orphan counts are checked before constraints are tightened |
| Generated contracts | Supabase TypeScript types are regenerated after the remote schema is validated |

## Validation gates

The migration is not ready for production until the following checks pass in a database clone:

- Full migration replay from an empty database.
- Upgrade replay from a snapshot representing the legacy Meta state.
- Zero orphaned Meta rows after conversion.
- One-to-one legacy-key to canonical-business mapping.
- RLS tests for owner A, owner B, anonymous, and service-role contexts.
- Insert/update/delete checks for businesses and Meta rows.
- Type generation and full application TypeScript validation.
- DailyGear and finance dashboard smoke tests with empty data.
- A rollback/restore rehearsal using the pre-migration database backup.

## Explicit non-actions

Until the remote state is verified, do not edit the already committed migrations, apply SQL through the Supabase dashboard, drop or recreate `public.businesses`, cast text IDs to UUIDs, assign owners by guesswork, or regenerate types from an unverified remote schema.

## Next exact action

Enable the existing Supabase connector and run the read-only preflight. Then select Branch A, B, or C from the observed state, write the corresponding forward-only migration, validate it against a clone, and only then request production approval.
