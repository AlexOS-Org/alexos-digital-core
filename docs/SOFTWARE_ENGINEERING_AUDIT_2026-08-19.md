# AlexOS Software Engineering Audit

**Audit date:** 19 August 2026  
**Repository:** [`dylextrends/alexos-digital-core`](https://github.com/dylextrends/alexos-digital-core)  
**Audited branch:** `main` at commit `30a112c`  
**Scope:** GitHub source, CI/CD, application architecture, Supabase migrations/RLS contracts, Cloudflare deployment configuration, Meta/DailyGear integration boundaries, and operational reliability.

## Executive assessment

AlexOS has a strong product direction and a useful separation between UI, server functions, normalized provider data, financial calculations, and database migrations. The recent DailyGear Meta work is logically isolated and the production build succeeds. However, the repository is **not currently release-safe** because the main branch is unprotected, the GitHub validation workflows are failing, the repository-wide TypeScript baseline is failing, and the Supabase migration history contains a confirmed incompatible `businesses` contract.

The most serious issue is the Supabase migration conflict. The earlier Meta foundation creates `public.businesses` with a text primary key and no `user_id`; the later finance migration expects a UUID primary key plus `user_id`, then creates policies that reference that missing `user_id`. A clean migration replay can therefore fail, and an existing production database can be left with two incompatible application models. No Supabase migration was applied during this audit.

The second serious issue is delivery control. GitHub reports that `main` is **not protected**, while the latest `Production Verify` and `Validate AlexOS` checks for commit `30a112c` are failing. Direct pushes can therefore land on the default branch while the canonical gates are red.

Live Supabase and Cloudflare resource inspection was not possible in this session because the existing Supabase and Cloudflare connectors are present but disabled, and the local Cloudflare CLI reports that it is unauthenticated. The live findings below are therefore explicitly marked **unverified** rather than invented.

## Severity summary

| Severity | Confirmed finding | Immediate consequence |
|---|---|---|
| **P0 — release blocker** | `public.businesses` is defined incompatibly in two migrations: text/no owner versus UUID/`user_id` | Migration replay or finance activation can fail; Meta and finance domains cannot share a stable business key |
| **P0 — release blocker** | `main` is unprotected | Failing code can be pushed directly to production branch without required review or passing checks |
| **P0 — release blocker** | GitHub `Production Verify` and `Validate AlexOS` are failing on the latest commit | The canonical CI gate is red; the repository does not have a trustworthy green release baseline |
| **P1 — high** | Full TypeScript validation fails in the debt module | Type contracts are already drifting from generated Supabase types; future changes can hide real regressions |
| **P1 — high** | Cloudflare deployment configuration is incomplete/unverified | Secrets, webhook activation, bindings, and runtime behavior are not proven in the target environment |
| **P1 — high** | Meta webhook refresh is process-local and best-effort | Events can be lost on worker restart; `void` background work is not a durable job guarantee |
| **P1 — high** | Earlier Meta `businesses_read` policy uses `using (true)` for all authenticated users | If that migration is active, authenticated users can see every business registry row |
| **P1 — high** | No permanent automated test runner or integration suite exists in `package.json` | Financial and webhook regressions are not continuously detected |
| **P2 — medium** | Dashboard auto-refresh invokes the full authenticated financial orchestration every minute | Repeated order reads can increase Supabase load even when Meta data is cached |
| **P2 — medium** | Webhook replay protection is only in-memory and has no timestamp window/rate limit | A valid captured event can be replayed across restarts or instances |
| **P2 — medium** | Meta account IDs are hard-coded in application source | Adding businesses or ad accounts requires code changes instead of business-scoped configuration |
| **P2 — medium** | Profit depends on verified line-item `unit_cost` and explicit settlement events | Missing COGS or inferred cash can overstate profit or misstate cash conversion |
| **P3 — low** | Nine Fast Refresh warnings and two formatting errors remain | Developer feedback is noisy and canonical lint remains red even where runtime behavior is unaffected |

## Confirmed GitHub and CI findings

### Repository governance

The repository is public, and the GitHub API reports that `main` is not protected. There is no evidence of required pull requests, required status checks, required review, or restricted direct pushes. This is a process-level production risk, independent of application code.

The repository contains three overlapping validation workflows: `pr-verify.yml`, `production-verify.yml`, and `validate.yml`. They all install with `npm ci`, build, and/or lint. Duplication is not inherently wrong, but the current setup creates multiple red checks without a single clearly enforced canonical gate. The `validate.yml` comments call lint the canonical gate, yet the branch is not protected by it.

### Current validation state

| Check | Result | Evidence |
|---|---|---|
| `npm ci --dry-run` | Passed | `package-lock.json` exists and npm can resolve the current tree |
| Production Vite build | Passed | Local `vite build` completed successfully |
| Repository lint | Failed | Two Prettier errors in `src/lib/error-reporting.ts` and `src/routes/__root.tsx`; nine Fast Refresh warnings |
| Repository TypeScript | Failed | Two errors in `src/lib/debts/api.ts` caused by drift between `Debt` application type and generated Supabase row/update types |
| `git diff --check` | Passed | No whitespace errors |
| Latest GitHub checks | Failed | `Production Verify` and `Validate AlexOS` failed for `30a112c` |
| Automated tests | Missing | No Vitest, Jest, Playwright, or test script is defined in `package.json` |

### Required correction

Make CI enforce one canonical workflow, fix the two blocking lint errors and two TypeScript errors, then enable branch protection requiring the canonical workflow before merge. Do not solve this by weakening lint or excluding the debt module from TypeScript; the debt errors are evidence of a real contract-drift problem.

## Confirmed Supabase migration and RLS findings from source

### P0: incompatible business contracts

[`20260805042235_...sql`](https://github.com/dylextrends/alexos-digital-core/blob/main/supabase/migrations/20260805042235_70e77afa-30f1-42d1-b3a6-6b3e045a5598.sql) creates:

```sql
public.businesses (
  id text primary key,
  display_name text not null,
  created_at timestamptz not null default now()
)
```

[`20260818070000_personal_business_finance_model.sql`](https://github.com/dylextrends/alexos-digital-core/blob/main/supabase/migrations/20260818070000_personal_business_finance_model.sql) then uses `create table if not exists` with a different contract:

```sql
public.businesses (
  id uuid primary key,
  user_id uuid not null references auth.users(id),
  name text not null,
  slug text not null,
  ...
)
```

The later migration subsequently creates policies using `user_id`. If the earlier table exists, `if not exists` does not transform it; the missing `user_id` makes the later policy definitions invalid. If the migrations are replayed in a different state, foreign-key types can also diverge. This must be resolved before Meta persistence, business-scoped financial reporting, or production migration reconciliation.

### P1: business registry isolation is too broad

The Meta migration creates:

```sql
create policy "businesses_read"
on public.businesses
for select to authenticated
using (true);
```

That policy exposes every business registry row to every authenticated user. Even if the rows contain only names and IDs, it violates the intended business-isolation model. Replace it with owner-based access after adopting one canonical UUID business model. Seeded businesses should be attached to an explicit owner or represented as a separate global catalog with an intentional access policy.

### P1: migration state cannot be trusted without live reconciliation

The source contains many domain migrations, generated Supabase types, a Meta migration, order hardening, and a later personal/business finance model. Because the Supabase connector is disabled, this audit could not compare the remote migration history table, remote schema, actual policies, extensions, triggers, or live generated types. The repository must not assume that local migration order equals production state.

### RLS positives

The Meta entity tables generally include `user_id` and use `auth.uid()`-based policies. The DailyGear order-hardening migration also shows an effort to move sensitive operations into controlled database functions. The server orchestration reads DailyGear orders through the authenticated Supabase client rather than using the service-role key in the browser.

### Required correction

Choose one canonical `businesses` model, create a dedicated reconciliation migration rather than editing applied migrations, backfill/migrate seeded business rows, update every foreign key and generated type, and validate the result against a database clone before production. Then run an RLS matrix test for owner A, owner B, anonymous, and service-role contexts across businesses, transactions, orders, Meta data, and sync-run records.

## Confirmed Cloudflare/deployment findings from source

The application uses the Cloudflare Vite plugin and exposes `npm run deploy` as `npm run build && wrangler deploy`, but the repository has no tracked `wrangler.toml`, `wrangler.json`, or equivalent deployment manifest. The local command `wrangler deploy --dry-run` can build the bundle, but it reports **no bindings found**. The local Cloudflare CLI also reports **not authenticated**.

This does not prove production is broken; it proves that this audit cannot verify the deployed Worker, environment secrets, custom domains, routes, observability, compatibility flags, or bindings. The current source uses `process.env` for Supabase and Meta secrets, while Cloudflare Worker deployments normally depend on runtime environment bindings passed into the Worker. This boundary must be verified explicitly in the actual deployment rather than inferred from a successful local bundle build.

The webhook endpoint is correctly public by design and uses Meta challenge verification plus HMAC validation. However, it starts refresh work with a non-awaited `void` promise and stores cache/deduplication state in process memory. That is acceptable as a development foundation, but not a durable production queue on an ephemeral or horizontally scaled Worker runtime.

### Required correction

Add and review a real Cloudflare deployment manifest, document compatibility settings, configure server-only secrets through Cloudflare secret bindings, and run a staging deployment smoke test. For continuous Meta syncing, add durable event/sync-run records and a retryable queue or scheduled Worker/Queues workflow. Return `200` only after the webhook is authenticated and durably recorded; process the follow-up Insights read outside the request lifecycle with retry and dead-letter handling.

## Confirmed application-architecture weak points

### Financial correctness

The DailyGear calculation module correctly separates accounting profit from cash timing, which is a strong design choice. It excludes cancelled/refunded sales, calculates COGS from line-item costs, classifies Meta spend as advertising expense, and keeps supplier payments separate from COGS.

The weak point is data completeness. If `unit_cost` is missing or zero, profit is still calculated while a warning is emitted. That is useful for exploration but unsafe for a production KPI unless the UI visibly labels the result as provisional and the system blocks “final profit” reporting when material COGS is missing. Cash receipts can also be inferred from `payment_status = paid`, which is not the same as confirmed payment settlement.

### Dashboard load behavior

The dashboard refreshes every minute, but each refresh calls the authenticated financial orchestration, which reads orders and order items in addition to consulting the Meta cache. Meta cache hits reduce Graph API traffic, but they do not eliminate repeated Supabase reads or financial recalculation. Cache the complete user/business/period financial result for a short bounded interval or use a query cache with invalidation on order/payment events.

### Business extensibility

The read-only Ads Manager service currently allowlists three DailyGear account IDs in source code. This is safe for the current verified scope but conflicts with the intended architecture of `Business → Meta Connection → Asset`. Future businesses and ad accounts should be stored in an owner-scoped configuration table after migration reconciliation, with the source allowlist retained only as an emergency safety boundary.

### Automated verification

The deterministic integration test run passed for mocked Graph pagination, normalization, caching, webhook HMAC validation, duplicate detection, order recognition, COGS, ad spend, profit, explicit cash events, inferred cash, and multi-currency warnings. The harness was temporary and there is no permanent test runner in the repository. This means the strongest recent financial verification is not repeated automatically in GitHub.

## Prioritized correction plan

### Phase 0: restore a trustworthy release baseline

First, fix the two repository lint errors, fix the two debt TypeScript errors, run the complete build/lint/typecheck set, and consolidate CI into one canonical required workflow. Enable branch protection on `main` and prohibit direct production pushes without passing checks.

### Phase 1: reconcile the data model before activation

Freeze new Supabase schema changes temporarily. Decide whether `businesses` is UUID/user-owned or a text global registry; the recommended direction is UUID/user-owned because it matches the finance model and RLS requirements. Create a forward-only reconciliation migration, backfill identifiers, update foreign keys, regenerate types, and run RLS tests against a database clone.

### Phase 2: prove deployment and secret boundaries

Enable the existing read-only Supabase and Cloudflare connectors for a separate live audit. Inspect remote migrations, RLS, auth configuration, Worker deployments, routes, secrets metadata, logs, and bindings. Add a Cloudflare deployment manifest and staging environment. Do not print or commit secret values.

### Phase 3: make synchronization durable

Replace process-local webhook deduplication and cache invalidation with durable event records, idempotency keys, retry state, sync-run records, and a queue or scheduled Worker. Add a webhook timestamp/replay window and rate limiting. Keep Meta reads read-only and fetch current Insights after verified events.

### Phase 4: make financial metrics production-grade

Add order/payment settlement events, explicit delivery and supplier payment records, cost completeness thresholds, currency policy, attribution identifiers, and a distinction between provisional and finalized profit. Cache the complete financial result and invalidate it from order/payment/Meta sync events.

### Phase 5: automate regression coverage

Add a permanent test runner and commit the deterministic integration fixtures. Add unit tests for profit formulas, RLS policy tests, webhook verification/replay tests, Meta pagination/error tests, and one staging end-to-end test. Make those tests required before merge.

## Immediate correction list

| Priority | Action | Why it must happen |
|---|---|---|
| 1 | Stop direct pushes to `main`; enable required branch checks | Current main is unprotected and latest checks are red |
| 2 | Reconcile the two `businesses` migrations | Current Meta and finance models cannot safely coexist |
| 3 | Fix lint and TypeScript baseline failures | CI cannot provide reliable regression protection |
| 4 | Enable Supabase and Cloudflare connectors for live read-only audit | Source alone cannot prove remote schema or deployment state |
| 5 | Add a real Cloudflare deployment manifest and secret-binding verification | Current deploy path has no tracked bindings/configuration |
| 6 | Make webhook processing durable and replay-safe | Current process-local best-effort refresh can lose events |
| 7 | Add permanent financial integration tests | Current strongest test harness was temporary |
| 8 | Separate provisional from final profit and settlement cash | Missing COGS/settlement data can mislead cash-flow decisions |

## Audit limitations

I did not modify production, apply migrations, change RLS, deploy Cloudflare resources, enable connectors, rotate credentials, or change GitHub protection. Supabase and Cloudflare live inspection remains pending because both existing connectors are disabled and the local Cloudflare CLI is unauthenticated. Those are access limitations, not assumptions about the production environment.

## References

[1]: https://github.com/dylextrends/alexos-digital-core/blob/main/supabase/migrations/20260805042235_70e77afa-30f1-42d1-b3a6-6b3e045a5598.sql "AlexOS Meta foundation migration"
[2]: https://github.com/dylextrends/alexos-digital-core/blob/main/supabase/migrations/20260818070000_personal_business_finance_model.sql "AlexOS finance/business migration"
[3]: https://github.com/dylextrends/alexos-digital-core/blob/main/.github/workflows/validate.yml "Canonical validation workflow"
[4]: https://github.com/dylextrends/alexos-digital-core/blob/main/src/server/meta/dailygear-ads-manager-sync.ts "DailyGear Meta read-only sync"
[5]: https://github.com/dylextrends/alexos-digital-core/blob/main/src/routes/api/meta/ads-webhook.ts "Meta webhook endpoint"
[6]: https://github.com/dylextrends/alexos-digital-core/blob/main/vite.config.ts "Cloudflare and TanStack build configuration"
[7]: https://github.com/dylextrends/alexos-digital-core/blob/main/src/server.ts "Cloudflare-compatible server entry"
[8]: https://github.com/dylextrends/alexos-digital-core/actions "GitHub Actions history"
[9]: https://supabase.com/docs/guides/database/postgres/row-level-security "Supabase Row Level Security documentation"
[10]: https://developers.cloudflare.com/workers/configuration/environment-variables/ "Cloudflare Workers environment variables and secrets"
