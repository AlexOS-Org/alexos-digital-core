# AlexOS Project State Log

Last audited: 2026-08-15 (EAT)
Repository: `dylextrends/alexos-digital-core`
Default branch: `main`
Current main: `9a4d859d80cc9ea5bdbbf37d9a9b422875e0e209`

## Source of truth

- GitHub is the development source of truth.
- Lovable is no longer the development workflow.
- Supabase project intended as controlled backend: `goafwbrayepaihxbqsse` (Alex OS Professional).
- Intended production host: Cloudflare, but the current `main` branch does not yet contain a committed `wrangler.jsonc`/Cloudflare deployment configuration.
- The repository remains public.

## What has been completed

### Core platform
- TanStack Start / React / TypeScript / Vite foundation.
- TanStack Router and React Query.
- Supabase integration with client/server separation.
- Graceful Supabase configuration failure handling instead of a blank crash.
- Runtime error reporting moved away from Lovable telemetry.
- GitHub declared as source of truth.
- CI workflow for npm install, build and lint.
- Production smoke verification was added to CI, but it still targets the legacy Lovable production URL and therefore must be changed when Cloudflare becomes the real production host.

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
- A dedicated `Landing Pages` admin section already exists at `/_authenticated/e-commerce/landing-pages`.
- The Landing Pages screen currently lists product campaigns and provides store/checkout navigation, but it is not yet a full landing-page builder/manager.

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

However, the migration is NOT complete at the hosting/configuration level:

- `vite.config.ts` on `main` still imports `@lovable.dev/vite-tanstack-config`.
- `package.json` still contains `@lovable.dev/vite-tanstack-config`.
- No committed `wrangler.jsonc` was found on `main` at this audit.
- CI smoke testing still points to `https://alexos-digital-core.lovable.app`.
- Therefore Cloudflare should be treated as the target architecture, not yet as proven production deployment in this repository.

## Current DailyGear landing-page work

A separate branch `feature/dailygear-150w-car-inverter-landing` contains a conversion-focused 150W car inverter page, but it was implemented in the product-detail route (`src/routes/shop.product.$id.tsx`). This is architecturally wrong for the user's requested workflow.

PR #10 is open and must NOT be merged as-is.

Correct target:

`DailyGear -> Landing Pages -> 150W Car Inverter -> Preview/Edit/Publish`

The high-conversion landing page should be implemented through the existing DailyGear Landing Pages section, while the normal product-detail route remains a normal product page.

## Current Supabase state

Project `goafwbrayepaihxbqsse` is currently `ACTIVE_HEALTHY`, region `eu-west-1`, Postgres 17.

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

## Immediate blockers / next gates

1. Finish the Cloudflare production migration in GitHub: replace the remaining Lovable Vite configuration dependency with the intended Cloudflare/TanStack Start setup and commit the deployment configuration.
2. Establish a non-production preview deployment from GitHub before production cutover.
3. Verify the controlled Supabase project contains the intended production DailyGear/CRM data before cutover; do not assume the old Lovable project has no required data.
4. Update CI production smoke verification to the real Cloudflare production URL once established.
5. Rebuild the 150W inverter landing page inside DailyGear -> Landing Pages, not the product-detail route.
6. Validate the complete DailyGear flow: product -> landing page -> simple checkout -> order -> stock reservation.
7. After the migration is stable, address Supabase security/performance advisor findings systematically.

## Working rule going forward

Do not restart an audit from memory. Before changing architecture or production, inspect this file plus the current GitHub `main`, current open PRs, Supabase project status/advisors, and current deployment configuration. Update this file after material project changes.
