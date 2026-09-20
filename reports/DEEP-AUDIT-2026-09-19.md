# AlexOS Deep Audit — 2026-09-19

## Baseline

The audited checkout is `main` at `ae14c1d25ac15b906ac643b9eb6b11d321c251c2`, aligned with `origin/main`. The working tree was clean at baseline and remains clean after the read-only audit. The governed protocol in `docs/GOVERNED_BUILD_PROTOCOL.md` was applied: no direct work on `main`, no schema or migration changes, no hosted-resource mutations, no financial behavior changes, and no protected DailyGear storefront changes.

## Current verification evidence

Fresh verification on current `main` produced the following results:

| Check | Result | Evidence |
|---|---|---|
| `npm test` | PASS | 47 test files, 197 tests |
| `npm run lint` | PASS | 0 errors; 10 existing `react-refresh/only-export-components` warnings |
| `npm run typecheck` | PASS | exit code 0 |
| `npm run build` | PASS | Vite/TanStack Start build completed |
| `npm run verify` | PASS | exit code 0 |
| Storefront guard | PASS | 0 protected public files changed |
| `git diff --check` | PASS | no whitespace errors |
| Production dependency audit | PASS | 0 production vulnerabilities in the captured audit |

The earlier `npm ci` log contains four high-severity findings from the complete dependency tree; the separate production-only audit contains zero vulnerabilities. This distinction should remain explicit until the development-tree findings are resolved or risk-accepted.

## PR #69 assessment

PR #69 (`feat/auren-empty-state`) remains open, targets `main`, and is currently `DIRTY`/`CONFLICTING`. Its seven commits are based on `00832e6`, while current `main` has advanced to `ae14c1d`. The PR changes only Auren readiness UI and data-readiness behavior:

- `src/components/auren/AurenPage.tsx`
- `src/components/auren/AurenReadinessPanel.tsx`
- `src/lib/auren/data-readiness.ts`
- `src/lib/auren/data-readiness.test.ts`
- `src/routes/_authenticated/auren.tsx`

The targeted test passes in an ephemeral checkout (`1` test file, `2` tests). The branch fails formatting/lint only: three changed source files fail Prettier and ESLint reports five fixable `prettier/prettier` errors. The failures are at `AurenPage.tsx:196`, `AurenReadinessPanel.tsx:38-39`, and `data-readiness.ts:56,89`. No functional test failure was reproduced. The branch must not be merged as-is because it is stale/conflicting and CI is red.

## Security audit findings

### Confirmed controls

The migrations include ownership-oriented RLS policies using `TO authenticated` plus `auth.uid()` predicates, `WITH CHECK` clauses for owner-controlled updates, explicit revocation/grant patterns for sensitive RPCs, and a dedicated security-definer search-path hardening migration. Sensitive server-only routines are generally restricted to `service_role` or authenticated callers according to their intended boundary.

### Static-scan correction

An initial text-only inventory appeared to show 17 media/Meta tables without explicit RLS statements. That was a false positive. Migration `20260805042235_70e77afa-30f1-42d1-b3a6-6b3e045a5598.sql` creates those tables and uses a `DO` block with `FOREACH` plus dynamic `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`. The same migration adds the ownership policies and grants. Static scanners must understand this dynamic migration pattern before reporting those tables as unprotected.

### Remaining security blockers

Live Supabase verification is unavailable because the connector authorization is still blocked. Therefore the audit cannot prove live migration history, effective grants, deployed RLS state, function ownership, or advisor results. The repository also documents unresolved GitHub-to-live migration-ledger divergence in finance scope, order hardening, DailyGear categories, public function grants, and the personal/business finance model. These are `BLOCKED`/`UNVERIFIED`, not claims of a live vulnerability.

Security-definer routines remain an approval-gated review area. The repository shows search-path hardening and function-level grant restrictions, but live privilege and ownership verification is required before classifying the database as production-ready. No migration or RLS remediation is authorized under the current governed phase.

## Module truth and priority

The current evidence supports the following high-level classifications:

| Area | Classification | Evidence-backed gap |
|---|---|---|
| Main verification/tooling | FULLY FUNCTIONAL | Current governed gate passes; lint has warnings |
| Auren advisory | PARTIAL | Grounded/deterministic advisory exists; recommendations and history are not persisted |
| Auren empty-state PR #69 | PARTIAL | Useful readiness copy/links, but branch is stale and unformatted |
| Money Center | PARTIAL | Core ledger behavior exists; true net worth and goal-to-ledger reconciliation remain incomplete |
| Settings / Tasks / Calendar / Reports / Marketing | PLACEHOLDER or MISLEADING | Local-only workbenches and non-persistent controls remain documented gaps |
| Supabase production state | BLOCKED / UNVERIFIED | Connector authorization and live drift/advisor evidence unavailable |
| DailyGear public storefront | PROTECTED | No changes permitted in this audit/remediation slice |

The approved roadmap prioritizes goal-contribution ledger reconciliation, then true net worth, then settings honesty. Financial and Supabase work remain approval-gated. The safest immediate implementation is the isolated PR #69 formatting/conflict remediation because it does not touch restricted surfaces or financial behavior.

## Audit disposition

`main`: **READY for the audited repository gate**, not a claim of production readiness.

PR #69: **BLOCKED pending conflict resolution and formatting correction**.

Supabase live security posture: **BLOCKED/UNVERIFIED pending connector authorization and read-only drift/advisor evidence**.

No schema, RLS, migration, financial, payment, storefront, deployment, or hosted-resource action was taken during the audit.
