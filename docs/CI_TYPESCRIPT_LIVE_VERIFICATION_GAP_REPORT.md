# AlexOS CI, TypeScript, and Live Verification Gap Report

**Audit date:** 19 August 2026  
**Repository:** [`dylextrends/alexos-digital-core`](https://github.com/dylextrends/alexos-digital-core)  
**Branch:** `main`  
**Latest audited commit:** [`13c2dca`](https://github.com/dylextrends/alexos-digital-core/commit/13c2dca)

## Executive conclusion

AlexOS has a successful local production build, but it does not yet have a green or trustworthy release gate. The main branch is unprotected, the latest GitHub `Validate AlexOS` and `Production Verify` workflows are failing, full TypeScript validation fails because generated Supabase contracts lag application assumptions, and live Supabase/Cloudflare verification cannot be completed because both connectors are disabled and the local Cloudflare CLI is unauthenticated.

The failures are separable:

1. **CI/lint baseline:** two concrete Prettier errors block all lint-based workflows.
2. **TypeScript baseline:** two debt-module errors reveal schema/type drift, specifically missing debt fields in generated Supabase types and an update field typed as `never`.
3. **Workflow governance:** three overlapping workflows exist, but `main` has no branch protection or required checks.
4. **Supabase verification:** the canonical UUID reconciliation has not been confirmed remotely, so generated types must not be overwritten.
5. **Cloudflare verification:** deployment account, Worker state, secrets, routes, compatibility settings, and bindings are not verified.

## 1. CI workflow and branch governance

### Current workflows

| Workflow | Trigger | Steps | Current issue |
|---|---|---|---|
| `PR Verify` | Pull requests to `main` | `npm ci`, build, lint | Duplicates other validation and has no typecheck/test step |
| `Production Verify` | Pushes to `main` | `npm ci`, build, lint | Fails at lint; runs after direct pushes |
| `Validate AlexOS` | Pull requests and pushes to `main`/`migration/**` | `npm ci`, lint, build | Described as canonical but not enforced by branch protection |

The workflows use Node 22 and `npm ci`. The repository does contain `package-lock.json`, so the prior lockfile concern is resolved; the install dry run succeeds. There is no test script in `package.json`, and no Vitest, Jest, or Playwright runner is configured.

### Latest GitHub evidence

The latest audited runs include:

| Workflow | Commit | Run | Result |
|---|---|---:|---|
| `Validate AlexOS` | `13c2dca` | `32242041942` | Failure |
| `Validate AlexOS` | `d43a6c7` | `32241500598` | Failure |
| `Production Verify` | `d43a6c7` | `32241500616` | Failure |
| `Validate AlexOS` | `f682981` | `32241081379` | Failure |
| `Production Verify` | `f682981` | `32241081457` | Failure |

The failure logs show the workflows reach `npm run lint` and exit with code 1. The recurring failure is not caused by the recent Meta/DailyGear implementation files; it is the repository-wide baseline described below.

### Branch protection

The GitHub API returns **Branch not protected** for `main`. This means direct pushes can reach the default branch even when `Production Verify` and `Validate AlexOS` are red. There is no enforced pull-request review gate or required status-check gate confirmed by the repository API.

### Remediation

Consolidate to one canonical required workflow, or clearly define the roles of the existing workflows. Add typecheck and permanent tests to the gate. Protect `main` with required pull requests, required successful checks, and restricted direct pushes. This is a governance change and should be reviewed before activation.

## 2. Lint failure details

Full local lint reports **11 problems: 2 errors and 9 warnings**.

### Blocking errors

| File | Line | Error | Meaning |
|---|---:|---|---|
| `src/lib/error-reporting.ts` | 45 | `prettier/prettier: Insert ⏎` | File is missing the formatting expected by the repository Prettier rule |
| `src/routes/__root.tsx` | 151 | `prettier/prettier: Insert ⏎` | File is missing the final formatting newline expected by the repository rule |

These are low-risk, deterministic fixes. They are currently high priority because every lint-based CI workflow fails on them.

### Advisory warnings

Nine `react-refresh/only-export-components` warnings occur in shared component files such as `CrmTabs.tsx`, `GoalFormDialog.tsx`, `ThemeProvider.tsx`, and UI primitives. The warning means a module exports both React components and non-component values, which can weaken Fast Refresh behavior during development. It is not currently a production build failure.

The warnings should be corrected gradually by moving constants/hooks/helpers into separate modules or explicitly documenting intentional exceptions. They should not be used to justify disabling the rule globally.

## 3. TypeScript failure details

Full `tsc --noEmit` fails with two errors in `src/lib/debts/api.ts`.

### Error A: application Debt type exceeds generated row type

At `src/lib/debts/api.ts:52`, the code casts Supabase query results to `Debt[]`. The application interface requires:

```text
interest_paid
financial_scope
business_name
 disbursement_account_id
```

The generated `public.debts` row contract does not contain those fields. TypeScript correctly warns that the cast is unsafe.

**Root cause:** application code has moved ahead of the generated Supabase schema contract, or the remote schema/type generation is stale. This is the same broader contract-drift pattern affecting the businesses migration.

**Correct fix:** verify the remote `debts` schema and migration history, regenerate types from the verified schema, then update the application interface or migration so both represent the same contract. Do not silence the error with `as unknown as Debt[]`.

### Error B: `interest_paid` is rejected in the generated update type

At `src/lib/debts/api.ts:172`, the code updates:

```ts
.update({ amount_paid: newPaid, interest_paid: newInterestPaid, status })
```

The generated update type has no `interest_paid` field, so Supabase's excess-property inference turns that property into `never`.

**Root cause:** the generated `debts` update contract does not include the field used by the application.

**Correct fix:** verify whether `interest_paid` exists remotely. If it should exist, create/verify the versioned migration and regenerate types. If it does not exist, the application must use the authoritative existing field model instead. This cannot be safely resolved from the local repository alone.

### TypeScript remediation order

1. Verify remote migration history and `public.debts` columns.
2. Reconcile any debt schema drift using a forward-only migration.
3. Regenerate Supabase types.
4. Update `Debt` application types and query/update code.
5. Run full typecheck and targeted debt tests.

## 4. Supabase live-verification gap

### What is confirmed locally

The project ID is present in `supabase/config.toml` as `goafwbrayepaihxbqsse`. The committed generated types still describe the legacy businesses model with only `id`, `display_name`, and `created_at`. The reconciliation package is stored under `supabase/reconciliation/` but has not been executed.

### What is unavailable

The Supabase and Supabase API connectors exist but are **disabled**. The Supabase CLI is not installed locally. Therefore, the following cannot be confirmed:

| Required evidence | Status |
|---|---|
| Remote migration history | Unverified |
| Actual `public.businesses` column types | Unverified |
| Whether finance migration partially/applied | Unverified |
| Remote business rows and owner mappings | Unverified |
| Actual Meta/finance foreign keys | Unverified |
| Remote RLS policies and grants | Unverified |
| `anon`, `authenticated`, and service-role behavior | Unverified |
| Remote `debts` columns used by TypeScript | Unverified |
| Production generated schema contract | Unverified |

### Why this matters

Regenerating types now could simply reproduce the legacy schema, or could overwrite committed types with an unreviewed remote state. Applying the UUID reconciliation without knowing whether the finance migration is pending, partially applied, or already applied could break foreign keys or duplicate the business model.

### Required Supabase verification

Enable the existing connector and perform a read-only preflight that records migration history, table definitions, constraints, grants, RLS policies, business rows, debt columns, and foreign-key dependencies. Export or regenerate types only after the remote schema matches the approved canonical branch.

## 5. Cloudflare live-verification gap

### What is confirmed locally

The application uses `@cloudflare/vite-plugin` in `vite.config.ts`, exposes `npm run deploy` as `npm run build && wrangler deploy`, and provides a Cloudflare-compatible `src/server.ts` fetch entry.

A local `wrangler deploy --dry-run` completed the build and reported **No bindings found**. This verifies only that the bundle can be prepared; it does not verify the production account or runtime.

### What is unavailable

The Cloudflare and Cloudflare API connectors exist but are disabled. The local Wrangler CLI reports **You are not authenticated**. There is no tracked `wrangler.toml` or `wrangler.json` deployment manifest in the repository.

The following are therefore unverified:

| Required evidence | Status |
|---|---|
| Cloudflare account and Worker identity | Unverified |
| Deployed Worker version/commit | Unverified |
| Production route/custom domain | Unverified |
| Meta webhook HTTPS reachability | Unverified |
| Server-only secrets | Unverified |
| Supabase runtime bindings | Unverified |
| Meta runtime bindings | Unverified |
| Compatibility flags and Node compatibility | Unverified |
| Logs, error rates, and request limits | Unverified |
| Queue/cron/background execution | Unverified |
| Cloudflare cache behavior | Unverified |

### Runtime risk

The source currently reads server secrets through `process.env`, while Cloudflare Worker deployments require deliberate environment/secret binding configuration. The source can compile without proving those values will exist at runtime. The Meta webhook also performs best-effort process-local refresh work; it is not a durable queue and may lose events across Worker restarts or multiple instances.

### Required Cloudflare verification

Enable the existing Cloudflare connector or authenticate Wrangler in the approved environment. Inspect the deployed Worker, routes, variables/secrets metadata without printing values, compatibility settings, logs, and bindings. Add a tracked deployment manifest and run a staging smoke test for authenticated Supabase reads, Meta reads, webhook challenge verification, signature validation, and timeout behavior.

## 6. Gap severity and priority

| Priority | Gap | Why |
|---|---|---|
| **P0** | `main` unprotected while required workflows fail | Broken code can be merged/pushed directly to the default branch |
| **P0** | Businesses schema and generated types are unresolved | Meta/finance persistence and RLS cannot safely activate |
| **P1** | Two blocking lint errors | All canonical CI workflows fail immediately |
| **P1** | Debt schema/type drift | Financial debt features are not type-safe and may fail at runtime |
| **P1** | Live Supabase state unknown | No reliable basis for type generation or migration activation |
| **P1** | Live Cloudflare state unknown | No proof of production secrets, routes, webhook, or Worker runtime |
| **P2** | No permanent test runner | Deterministic financial harness is not repeated in CI |
| **P2** | Duplicate/overlapping CI workflows | Multiple red gates create ambiguous ownership and maintenance cost |
| **P2** | No durable Meta event queue | Webhook-triggered refresh can be lost or duplicated |
| **P3** | Fast Refresh warnings | Development ergonomics and hot-reload correctness are weaker than intended |

## 7. Recommended correction sequence

### Step 1: restore the local CI baseline

Fix the two Prettier errors, add `typecheck` and `test` scripts, and run the full local gate. Do not change lint rules to make the gate green.

### Step 2: protect the release branch

After the gate is green, enable branch protection requiring pull requests and successful canonical checks. Remove or consolidate duplicate workflows so the required check names are stable.

### Step 3: verify Supabase

Enable the read-only Supabase connector. Inspect the remote schema and migration history. Select the correct businesses reconciliation branch. Apply only the approved staging migration, regenerate types, and repair debt contracts.

### Step 4: verify Cloudflare

Enable the read-only Cloudflare connector. Inspect deployment and secret/binding metadata. Add a deployment manifest, configure server-only secrets, and perform a staging smoke test.

### Step 5: make tests permanent

Add a real test runner and commit the deterministic integration harness. Include financial formula tests, Meta pagination/cache/webhook tests, RLS matrix tests, migration replay tests, and staging acceptance checks.

### Step 6: harden production synchronization

Move webhook deduplication and refresh work to durable sync/event records with timestamp validation, retries, idempotency keys, queue/cron execution, and dead-letter handling.

## Final state

The repository is clean at commit `13c2dca` for this audit. The local build is successful, but release readiness is blocked by the red CI baseline, unverified remote data/deployment state, and the unresolved canonical businesses migration. The safest next action is not a blind type regeneration or migration application; it is enabling the existing read-only Supabase and Cloudflare verification surfaces and resolving the evidence gaps in the sequence above.

## References

[1]: https://github.com/dylextrends/alexos-digital-core/actions "AlexOS GitHub Actions"
[2]: https://github.com/dylextrends/alexos-digital-core/blob/main/.github/workflows/validate.yml "Validate AlexOS workflow"
[3]: https://github.com/dylextrends/alexos-digital-core/blob/main/.github/workflows/production-verify.yml "Production Verify workflow"
[4]: https://github.com/dylextrends/alexos-digital-core/blob/main/src/lib/debts/api.ts "Debt API and application contract"
[5]: https://github.com/dylextrends/alexos-digital-core/blob/main/src/integrations/supabase/types.ts "Generated Supabase TypeScript definitions"
[6]: https://github.com/dylextrends/alexos-digital-core/blob/main/supabase/migrations/20260805042235_70e77afa-30f1-42d1-b3a6-6b3e045a5598.sql "Legacy Meta businesses migration"
[7]: https://github.com/dylextrends/alexos-digital-core/blob/main/supabase/migrations/20260818070000_personal_business_finance_model.sql "Finance businesses migration"
[8]: https://github.com/dylextrends/alexos-digital-core/blob/main/supabase/reconciliation/README.md "Businesses reconciliation execution plan"
[9]: https://github.com/dylextrends/alexos-digital-core/blob/main/vite.config.ts "Cloudflare Vite configuration"
[10]: https://github.com/dylextrends/alexos-digital-core/blob/main/src/server.ts "Cloudflare-compatible server entry"
[11]: https://supabase.com/docs/guides/database/postgres/row-level-security "Supabase RLS documentation"
[12]: https://developers.cloudflare.com/workers/configuration/environment-variables/ "Cloudflare Workers environment variables and secrets"
