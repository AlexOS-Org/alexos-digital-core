# AlexOS Project State Log

Last audited: 2026-08-15 (EAT)
Repository: `dylextrends/alexos-digital-core`
Default branch: `main`
Verified current main: `5cad125aa3788bc097c825c7da40ea2b99199a8d`
Current work branch: `feature/dailygear-landing-pages-test`
Current PR: #14
Current PR head after CI formatting: `e1ff96c9269bbbdfda2a7618221ded0add2a2935`

## Source of truth

- GitHub is the development source of truth.
- Lovable is no longer the development workflow.
- Supabase project intended as controlled backend: `goafwbrayepaihxbqsse` (Alex OS Professional).
- Intended production host: Cloudflare.
- The verified `main` branch still does not contain a committed Cloudflare `wrangler.jsonc` deployment configuration.
- The repository remains public.

## What has been completed

### Core platform
- TanStack Start / React / TypeScript / Vite foundation.
- TanStack Router and React Query.
- Supabase integration with client/server separation.
- Graceful Supabase configuration failure handling instead of a blank crash.
- Runtime error reporting moved away from Lovable telemetry.
- GitHub declared as source of truth.
- Existing CI validates install/build/lint on the configured workflow.

### Money Center
- Dashboard and financial account/transaction foundations exist.
- Accounts, transactions, budgets, debts, goals and expected-money functionality are represented in the controlled Supabase project.
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
- Landing Pages now has a conversion-focused preview surface in PR #14, including a 150W Car Inverter campaign pattern, product binding, offer block, trust blocks and checkout hand-off.

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

The backend migration away from the Lovable-managed Supabase project was committed on Aug 9. The controlled Supabase project is `goafwbrayepaihxbqsse`.

The hosting/configuration migration is NOT complete yet:

- `vite.config.ts` on verified `main` still imports `@lovable.dev/vite-tanstack-config`.
- `package.json` on verified `main` still contains `@lovable.dev/vite-tanstack-config`.
- No committed `wrangler.jsonc` was found on verified `main`.
- The existing production smoke workflow still targets `https://alexos-digital-core.lovable.app`.
- Cloudflare is therefore the target architecture, not yet verified production in GitHub.

Cloudflare's current official TanStack Start guidance supports the intended architecture using the Cloudflare Vite plugin, TanStack Start plugin, React plugin and Wrangler; Cloudflare also supports GitHub-connected Worker preview deployments. This has been independently verified against current Cloudflare documentation.

## Current DailyGear landing-page work

The earlier `feature/dailygear-150w-car-inverter-landing` implementation placed the landing page inside `src/routes/shop.product.$id.tsx`. That did not match the requested workflow.

PR #10 has been closed and must not be merged.

Correct target:

`DailyGear -> Landing Pages -> 150W Car Inverter -> Preview/Edit/Publish`

PR #14 now implements the first correct step: a real Landing Pages preview surface. The normal product-detail route remains separate.

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

PR #14 verification is now **GREEN**.

Verified GitHub Actions run:
- `npm ci` — PASS
- `npm run build` — PASS
- `npm run lint` — PASS

The existing `Validate AlexOS` workflow also passed on the same PR head.

The build produced the existing Cloudflare-compatible Nitro output (`cloudflare-module`) successfully. Build warnings remain for existing chunk-size/dynamic-import/deprecation items, but they are warnings, not failures.

No Supabase schema, Supabase data, Cloudflare production resources, DNS, or production secrets were changed by PR #14.

## Open PR / migration caution

PR #12 (`chore/cloudflare-native-migration`) is still open/draft and is **not ready to merge**. Its previous CI run failed during `npm ci` because its lockfile was missing a required `lru-cache` entry. It also contains backup files and package-version changes that need review before using it as the Cloudflare migration baseline.

Do not merge PR #12 blindly. The correct approach is to inspect its intended Cloudflare changes, normalize the dependency lockfile, remove repository backup artifacts, and re-verify from the current `main` baseline.

## Current Supabase state

Project `goafwbrayepaihxbqsse` is currently `ACTIVE_HEALTHY`, region `eu-west-1`, Postgres 17 according to the latest verified audit.

Current advisors show:
- Security WARN: `dg_reserve_stock` has mutable search_path.
- Security WARN: `next_order_number` has mutable search_path.
- Security WARN: leaked-password protection is disabled.
- Performance INFO/WARN: unindexed foreign keys across CRM/DailyGear/Money Center tables.
- Performance WARN: RLS policies using auth functions without initplan optimization.
- Performance WARN: multiple permissive policies on several DailyGear and transaction tables.
- Performance INFO: a number of unused indexes.

These are not being changed blindly during migration.

## Security history

- A Supabase publishable/anon key was previously committed in git history and later removed from the working tree.
- The old key remains recoverable from public history and should be rotated in the old Supabase project if that project is still active.
- No current secret values are recorded in this log.

## Immediate gates

1. **DONE:** Landing Pages implementation built and verified with CI.
2. **NEXT:** Provide a real browser/Worker preview for the landing page without touching production.
3. Add the real 150W Car Inverter product record and images to DailyGear so the campaign can bind real inventory.
4. Complete the Cloudflare/TanStack Start migration in GitHub using the current supported Cloudflare configuration.
5. Establish a non-production Cloudflare Worker preview from GitHub before any production cutover.
6. Verify the controlled Supabase DailyGear/CRM data before production cutover.
7. Update production smoke testing to the real Cloudflare URL once established.
8. After migration stability, address Supabase security/performance advisor findings systematically.

## Working rule going forward

Do not restart an audit from memory. Before changing architecture or production, inspect this file plus the current GitHub `main`, current open PRs, Supabase project status/advisors, and current deployment configuration. Update this file after every material project change.
