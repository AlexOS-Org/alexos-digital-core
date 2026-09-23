# AlexOS full audit — 2026-09-23

## 1. Baseline

| Item | Value |
|---|---|
| Branch at audit start | `main` |
| HEAD | `463e9126e31ffee20585b64f7584bde56058da47` |
| Message | `fix(money): resolve bank logos for punctuated account names` |
| Working tree | clean |
| Timestamp | 2026-09-23T12:20:00Z |
| Protocol | `docs/GOVERNED_BUILD_PROTOCOL.md` |

This audit is evidence-based. No storefront, schema, financial-rule, or hosted-resource mutation was performed during inspection. Remediation is limited to the production-deploy workflow, its quality-gate test, and this report.

## 2. Verification evidence (fresh on `463e912`)

| Check | Result | Evidence |
|---|---|---|
| `npm ci` | PASS | 520 packages |
| `npm test` | PASS | 48 files / 205 tests |
| `npm run lint` | PASS | 0 errors, 10 existing `react-refresh/only-export-components` warnings |
| `npm run typecheck` | PASS | `tsc --noEmit` exit 0 |
| `npm run build` | PASS | Vite/TanStack Start client + Cloudflare server build |
| Storefront guard | PASS | 0 protected public files changed |
| Production `npm audit --omit=dev` | PASS | 0 vulnerabilities |
| Full-tree `npm audit` | PARTIAL | 4 high findings in **dev** `sharp` via `wrangler` / `@cloudflare/vite-plugin`; not in production dependencies |
| Open pull requests | none | GitHub PR search |
| Open issues | 2 enhancement/follow-ups | #15, #18 |

`main` is **READY for the repository verification gate**. That is not a claim that production is current.

## 3. Production deploy — confirmed error

All 25 GitHub **production** deployments failed. The latest run is Production Deploy #23 (`35492923901`, 2026-09-20T05:56:17Z) on `463e912`.

Job `Migrate Supabase and deploy Cloudflare Worker` failed at **Check required deployment secrets** (step 4). Logs show empty values for:

- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_DB_PASSWORD`
- `CLOUDFLARE_API_TOKEN`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Exact failure:

```text
SUPABASE_ACCESS_TOKEN: Missing GitHub secret SUPABASE_ACCESS_TOKEN
```

This is **not a code, type, lint, test, or build failure**. Typecheck, Validate, and Production Verify are green on the same commit.

The workflow uses `environment: production`. Secrets must be set on **Settings → Environments → production**, not only as repository files. This audit cannot create those secrets: the GitHub token cannot list or write Actions secrets (HTTP 403), and secret values must never be committed.

### Live hosting

`https://dailygear.co.ke/` returns HTTP 200 (`AlexOS — Business Operating System`). `/shop` returns HTTP 200 (`DailyGear Kenya — Gear worth choosing for everyday life`). Asset hashes on the live Worker (`styles-92NhscYd.css`) do not match the current `main` build (`styles-Dn3v_jXp.css`). Production is serving an **older Worker**. New `main` commits have not been released because the deploy job never gets past the secret check.

### Workflow gap fixed in this change

The deploy job previously set `VITE_SUPABASE_URL` only on the verify step. `npm run deploy` (`vite build && wrangler deploy`) did not inherit a public Supabase URL. Runtime `/api/runtime-config` can still hydrate Worker secrets, but the production build should also receive the known public URL. The workflow now sets job-level:

- `SUPABASE_URL` / `VITE_SUPABASE_URL` = `https://goafwbrayepaihxbqsse.supabase.co`
- `VITE_SUPABASE_PROJECT_ID` = `goafwbrayepaihxbqsse`

The secret check now reports **every** missing secret in the job summary and as GitHub error annotations, instead of stopping on the first empty value.

## 4. Module truth (delta from 2026-09-19)

| Area | Classification | Evidence |
|---|---|---|
| Repository verify/tooling | FULLY FUNCTIONAL | Fresh 205-test verify on `463e912` |
| Production Deploy workflow | PARTIAL | Logic is correct; GitHub production secrets are empty |
| Cloudflare Worker (live) | PARTIAL / STALE | Site responds 200; asset hashes lag `main` |
| Money Center | PARTIAL | Ledger, branding, Fuliza, tithe, goal-contribution *payload builder* exist and are tested; true net worth and live drift remain incomplete |
| Auren | PARTIAL | Advisory + readiness tests pass; recommendations are not persisted |
| DailyGear public storefront | PROTECTED / LIVE | Guard pass; `/shop` serves on dailygear.co.ke; no storefront files changed |
| Settings / Tasks / Calendar / Reports / Marketing / Nuvora / CarBar | PLACEHOLDER or MISLEADING | Local-only or empty-state workbenches remain |
| Supabase live ledger | BLOCKED / UNVERIFIED | Connector and GitHub secrets unavailable; no `supabase db push` run |
| Ghost workflows | FIXED | `AlexOS CI` and `Repair PR Formatting` were not in the `main` tree; disabled in Actions |

## 5. Gaps that are real, not guessed

1. **GitHub production environment secrets are empty.** This is the only hard error blocking merge-to-live. Owner action required. See `docs/PRODUCTION_DEPLOY_CHECKLIST.md`.
2. **Production Worker is behind `main`.** Direct consequence of (1).
3. **Net worth is still cash − debt**, not assets − liabilities. Documented; financial behavior is approval-gated.
4. **Placeholder modules** (Tasks, Calendar, Marketing, Reports, Nuvora, CarBar) still look like products.
5. **Dev-tree `sharp` advisories** via Wrangler. Production audit is clean. Do not bump Wrangler in this slice without a dedicated verify pass.
6. **24 leftover branches** (backups, old features). None are open PRs. Do not merge them onto `main`.
7. **Issues #15 and #18** remain open enhancements, not build breakers.

## 6. Fixes applied

- Production deploy workflow: public Supabase URL on the deploy job; complete missing-secret report.
- CI quality-gate test covers the production deploy contract.
- Disabled stale Actions workflows that no longer exist on `main`.
- This report.

No DailyGear storefront, schema/migration, tithe, or hosted mutation.

## 7. Remaining owner action (required for a green Production Deploy)

In **GitHub → Settings → Environments → production**, set:

1. `SUPABASE_ACCESS_TOKEN`
2. `SUPABASE_DB_PASSWORD`
3. `CLOUDFLARE_API_TOKEN`
4. `VITE_SUPABASE_PUBLISHABLE_KEY`

Then re-run **Actions → Production Deploy → Run workflow** on `main`. Confirm Worker secrets still include `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`.

## 8. Commands intentionally not run

- `supabase db push` / `supabase migration repair`
- `wrangler deploy` / `wrangler secret`
- Any hosted Cloudflare or Supabase mutation
- Merge of stale feature/backup branches

## 9. Final status

| Surface | Status |
|---|---|
| `main` repository gate | `READY` |
| Production GitHub Deploy | `BLOCKED` on environment secrets |
| Live Worker freshness | `PARTIAL` (up, but not on `463e912`) |

After secrets are present, the existing Production Deploy workflow is the release path. Do not mark production complete from a green local build alone.
