# AlexOS Project State Log

Last audited: 2026-08-18 (EAT)
Repository: `dylextrends/alexos-digital-core`
Default branch: `main`
Verified current main: `3642ff646b1bfbece5f69883da2e836b8bc65d14`

## Source of truth

- GitHub is the development source of truth.
- The application is independent of any third-party app builder.
- Supabase project intended as controlled backend: `goafwbrayepaihxbqsse` (Alex OS Professional).
- Production host: Cloudflare (Wrangler/Vite plugin configuration is committed on `main`).
- The repository remains public.

## What has been completed

### Core platform
- TanStack Start / React / TypeScript / Vite foundation.
- TanStack Router and React Query.
- Supabase integration with client/server separation.
- Graceful Supabase configuration failure handling instead of a blank crash.
- Runtime error reporting with no third-party telemetry dependency.
- GitHub declared as source of truth.
- CI validates install/build/lint on the configured workflow.
- Cloudflare-native Vite configuration committed (`vite.config.ts` + `wrangler.jsonc`).
- Remaining third-party builder references removed from configuration and application code.

### Money Center
- Dashboard and financial account/transaction foundations exist.
- Accounts, transactions, budgets, debts, goals and expected-money functionality are represented in the controlled Supabase project.
- Personal/business money flow separation, debt funding linking and split principal/interest on debt payments.
- Order/transaction hardening work includes safer transaction handling and database-side integrity protections.

### CRM
- CRM schema and application foundation exist.
- Leads/customers and supporting CRM activity/note/task/attachment structures exist.
- CRM is not yet considered production-validated end-to-end.

### DailyGear
- DailyGear commerce module exists in the application.
- Storefront/product/category/checkout foundations exist.
- Category hierarchy and primary store category filtering were added on Aug 11.
- Default DailyGear category taxonomy was added.
- Order integrity hardening was added: unique order numbers, sequence-based order numbers and atomic stock reservation.
- A dedicated `Landing Pages` admin section exists at `/_authenticated/e-commerce/landing-pages`.
- Landing Pages has a conversion-focused preview surface, including a 150W Car Inverter campaign pattern, product binding, offer block, trust blocks and checkout hand-off.

### Landing page reference captured
The approved reference pattern is the Haven4 Premium Wear example supplied by the user:
- benefit-led hero
- Why Own One section
- feature-to-benefit copy
- use cases
- product specifications
- offer pricing and savings
- urgency
- guarantee/trust
- customer proof
- simple Kenyan checkout
- COD where applicable
- minimal checkout fields

The user also explicitly wants the checkout to remain simple and mobile-friendly.

## Current migration status

The backend migration away from the controlled Supabase project was committed on Aug 9. The controlled Supabase project is `goafwbrayepaihxbqsse`.

The hosting/configuration migration to Cloudflare is committed on `main`:

- `vite.config.ts` uses the Cloudflare Vite plugin, TanStack Start plugin, and React plugin.
- `wrangler.jsonc` is committed with the Cloudflare Worker configuration.
- `package.json` has no third-party app-builder dependencies.
- The production smoke workflow no longer targets a third-party hosting URL.

### Migration reconciliation status

An independent audit has identified a **GitHub-to-live migration ledger divergence that requires reconciliation before a fresh Supabase environment can be considered reproducible from Git alone**. Reported discrepancies include:

- a version mismatch for `finance_flow_scope_and_debt_linking`;
- hash-named Git migration files with no matching live ledger entries;
- live migration entries with no matching Git files;
- `order_integrity_hardening` versus a differently named live DailyGear order-hardening entry;
- `dailygear_default_categories` versus differently named live DailyGear storefront entries;
- a live `revoke_public_function_execute_privileges` security migration not currently represented by a matching Git migration file;
- a version mismatch for `personal_business_finance_model`.

These are currently treated as **migration-history/reproducibility findings, not proof of schema corruption**. Migration names and timestamps must not be assumed equivalent without comparing the actual SQL and resulting schema state. No production migration has been replayed or altered as a result of this finding.

## Current DailyGear landing-page work

The earlier `feature/dailygear-150w-car-inverter-landing` implementation placed the landing page inside `src/routes/shop.product.$id.tsx`. That did not match the requested workflow.

PR #10 has been closed and must not be merged.

Correct target:

`DailyGear -> Landing Pages -> 150W Car Inverter -> Preview/Edit/Publish`

PR #14 implements the first correct step: a real Landing Pages preview surface. The normal product-detail route remains separate.

The preview binds live product data when a DailyGear product exists. If the controlled database has no products yet, it shows a safe non-transactional demo state rather than inventing inventory, pricing or stock.

The landing page includes:
- benefit-led hero
- product image/gallery binding
- tailored 150W Car Inverter copy
- Why Own One benefit blocks
- feature-to-benefit proof
- offer/pricing/savings block
- availability/stock state
- trust and Kenya delivery signals
- 30-day confidence block
- direct add-to-cart -> existing `/shop/cart` flow
- safe empty-database state

## Current testing status

CI verification on `main` is GREEN according to the latest recorded project state.

Verified GitHub Actions runs:
- `npm ci` — PASS
- `npm run build` — PASS
- `npm run lint` — PASS

The build produces the Cloudflare-compatible Nitro output (`cloudflare-module`) successfully. Build warnings remain for existing chunk-size/dynamic-import/deprecation items, but they are warnings, not failures.

No Supabase schema, Supabase data, Cloudflare production resources, DNS, or production secrets were changed by the migration commits.

## Current Supabase state

Project `goafwbrayepaihxbqsse` is currently recorded as `ACTIVE_HEALTHY`, region `eu-west-1`, Postgres 17 according to the latest verified project state.

The independent audit reports the following current advisory areas:
- Security: leaked-password protection is disabled.
- Performance: unindexed foreign keys across CRM/DailyGear/Money Center tables.
- Performance: RLS policies using auth functions without initplan optimization.
- Performance: multiple permissive policies on several DailyGear and transaction tables.
- Performance: a number of unused indexes.
- The previously tracked mutable `search_path` warnings for `dg_reserve_stock` and `next_order_number` were reported as resolved by the latest hardening migration and should remain verified rather than reworked.

These findings are not being changed blindly. In particular, overlapping permissive RLS policies must be compared by command, role, `USING`, and `WITH CHECK` semantics before consolidation, and indexes must be evaluated against actual table size/query patterns before removal or addition.

## Security history

- A Supabase publishable/anon key was previously committed in git history and later removed from the working tree.
- The old key remains recoverable from public history and should be rotated in the old Supabase project if that project is still active.
- No current secret values are recorded in this log.

## Immediate gates

1. **DONE:** Landing Pages implementation built and verified with CI.
2. **DONE:** Cloudflare/TanStack Start migration committed on `main`.
3. **IN PROGRESS:** Reconcile GitHub migration history against the controlled Supabase migration ledger/schema before treating Git as a reproducible database source.
4. **NEXT:** Establish a non-production Cloudflare Worker preview from GitHub after repository/database reconciliation is sufficiently understood.
5. Add the real 150W Car Inverter product record and images to DailyGear so the campaign can bind real inventory.
6. Verify the controlled Supabase DailyGear/CRM data before production cutover.
7. After migration stability, address remaining Supabase security/performance advisor findings systematically.

## Working rule going forward

Do not restart an audit from memory. Before changing architecture or production, inspect this file plus the current GitHub `main`, current open PRs, Supabase project status/advisors, and current deployment configuration. Update this file after every material project change.
