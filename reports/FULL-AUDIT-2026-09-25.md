# AlexOS full audit — 2026-09-25

## 1. Baseline

| Item | Value |
|---|---|
| Repository | `AlexOS-Org/alexos-digital-core` |
| Baseline branch | `main` |
| Baseline HEAD | `1456ba0c50ae116039adc671c8e10c5c9d1bd163` |
| Baseline working tree | clean |
| Remediation branch | `audit/2026-09-25-honesty-gaps` |
| Protocol | `docs/GOVERNED_BUILD_PROTOCOL.md` |
| Audit timestamp | 2026-09-25 |

No hosted resources, Supabase schema, migrations, RLS, payment settings, ad spend, financial mathematics, or protected DailyGear storefront files were changed.

## 2. Current repository verification

| Check | Result | Evidence |
|---|---|---|
| `npm ci` | PASS | 520 packages installed; npm reports 4 high dev-tree advisories through Wrangler/sharp |
| `npm run lint` | PASS with existing warnings | 0 errors; 10 `react-refresh/only-export-components` warnings |
| `npm run typecheck` | PASS | `tsc --noEmit` exits 0 |
| `npm run build` | PASS | TanStack/Vite client and Cloudflare server build completed |
| `npm test` | PASS | 48 files / 206 tests |
| Storefront guard | PASS | 0 protected public files changed |
| `git diff --check` | PASS | no whitespace errors |
| Production dependency audit | Previously verified PASS | `npm audit --omit=dev` had 0 production vulnerabilities in the prior audit |

## 3. Module truth delta

| Surface | Current classification | Evidence |
|---|---|---|
| Repository verification | FULLY FUNCTIONAL | Full gate above; `npm run verify` passed before this remediation |
| Goal contributions | PARTIAL, ledger-backed | `src/lib/goals/api.ts` posts a transaction when an account is linked and invalidates account/transaction queries; contribution-only mode remains explicitly unlinked |
| Settings | PARTIAL but honest | `src/routes/_authenticated/settings.tsx` persists notification preferences device-locally and labels workspace persistence, 2FA, export, cache, and sync as unavailable |
| Local workbench modules | PARTIAL and honestly labelled | `src/components/modules/ModuleWorkbench.tsx` uses `Local Draft`, `Device-only preview`, and explicit device-only persistence language |
| Placeholder modules | PLACEHOLDER / ROADMAP | `src/components/module-placeholder.tsx` states that persistent records, live integrations, and automated actions are not connected |
| Auren Intelligence | PARTIAL | Deterministic advisory/readiness flows and tests exist; persisted recommendations and export remain unimplemented |
| Money Center | PARTIAL | Ledger flows and safety tests exist; dashboard cash-minus-debt metric is explicitly labelled as such, not true net worth |
| DailyGear storefront | PROTECTED / LIVE | Storefront guard passes; no protected path changed |
| Production Worker | UNVERIFIED / STALE | The live site is reachable, but deployment remains blocked by missing GitHub production secrets |
| Supabase live ledger | VERIFIED through connector | Live migration ledger reaches `20260915085639`; repository contains the corresponding migration; no pending safe migration was applied |

## 4. Confirmed gaps remaining

1. **Production release credentials remain unavailable to this session.** GitHub production environment still lacks `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD`, and `CLOUDFLARE_API_TOKEN`. The public publishable key is present.
2. **Live Worker freshness remains unverified/currently stale.** The existing Production Deploy cannot pass its required-secret check, so no release was attempted.
3. **True net worth is not implemented.** Current dashboard metrics intentionally show cash available less tracked outstanding debt. Assets, liabilities, crypto, inventory, and expected money are not yet combined into a true net-worth model. This is financial behavior and requires separate review before implementation.
4. **Auren recommendations are not persisted or exportable.** This is an architecture/data-persistence change and is outside the safe text/type/null-guard scope of this remediation.
5. **Placeholder modules remain roadmap surfaces.** Implementing their persistence or integrations would require schema/API/product decisions and is not safe to guess.
6. **Supabase advisor warnings remain.** They include externally executable security-definer RPCs and disabled leaked-password protection. Changing grants or Auth settings requires security review and is not included here.
7. **Dev-only dependency advisories remain.** The warnings are in the Wrangler/sharp development tree; no production dependency vulnerability was identified in the previous audit.

## 5. Remediation applied in this branch

- Updated root SEO/social metadata in `src/routes/__root.tsx` to name **Auren Intelligence** instead of a generic “built-in intelligence layer”.
- Extended `src/lib/branding.test.ts` to include root metadata and prevent regression to the generic wording.
- Added this dated audit report.

## 6. Safety review

- No protected storefront files changed.
- No financial logic files changed.
- No Supabase migration, schema, RLS, or generated database type changed.
- No secrets, tokens, passwords, service-role keys, or `.env` files changed.
- No hosted mutation or production deployment was attempted.

## 7. Final status

**PARTIAL — repository remediation ready for review.**

The safe, evidence-backed branding gap is fixed and all repository gates pass. Production and the remaining product gaps cannot be marked ready without the missing deployment credentials or explicit review for financial, security, schema, and architecture changes.

## 8. Commands intentionally not run

- `supabase db push` or `supabase migration repair`
- `wrangler deploy` or `wrangler secret`
- Production GitHub workflow dispatch
- Cloudflare, Supabase, payment, or ad mutations
- Direct push or merge to `main`
