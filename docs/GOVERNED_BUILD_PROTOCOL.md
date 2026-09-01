# AlexOS — Governed Build & Safe Commit Protocol

This file is the canonical operating protocol for future AlexOS development.
It supersedes any ad-hoc task prompt that conflicts with the safety rules
below. It is audit-first, evidence-based, and protects financial records,
hosted infrastructure, and the DailyGear public storefront.

Scope: `dylextrends/alexos-digital-core`.

---

## 1. Authority & Branch Policy (hard rules)

- Always start from the latest `origin/main`, then create a dedicated feature
  branch. Never work directly on `main`.
- The default delivery path is **feature branch -> pull request -> review ->
  merge**. Direct push to `main` is prohibited without explicit human approval.
- This Arena session is pinned to `arena/01a05a23-alexos-digital-core`. That
  branch is the dedicated feature branch for work performed in this session;
  `agent/*` branches cannot be created from here.
- Keep each logical change in a separate atomic commit with a clear
  conventional commit message.
- Before committing, run the complete validation gate (section 8) and review the
  staged diff against the safety checklist (section 9).
- After committing, report the required summary (section 10).

---

## 2. Global Safety Rules (non-negotiable)

You MUST NOT:

- Assume backend functionality from UI presence without evidence.
- Modify Supabase schema, run migrations, run `supabase db push`, or run
  `supabase migration repair`.
- Change financial logic except where explicitly approved in writing. The only
  current financial exception is the existing, already-tested pure tithe
  function; even that function must not be changed without separate review.
- Alter DailyGear public storefront behavior, routes, checkout, product
  prices/images, funnel copy, public light-mode behavior, or Purchase
  attribution.
- Expose secrets, service-role keys, tokens, passwords, private keys, or `.env`
  files.
- Delete systems, modules, migrations, or legacy files without classification.
- Deploy to production or mutate hosted resources (Cloudflare, Supabase,
  payment settings, ad spend).
- Mark a system as READY without full evidence.

---

## 3. Phase 1 — Baseline Capture (required first)

Before any change, record:

- Current branch.
- HEAD commit hash.
- Repo status (clean/dirty).
- Timestamp.

Stop if baseline cannot be captured.

---

## 4. Phase 2 — Full System Audit (read-only)

Inspect, read-only:

- Modules and routes.
- Supabase usage and generated types.
- API calls and server/client boundaries.
- localStorage usage.
- Financial logic.
- CI/CD workflows.
- Auren / intelligence system structure.
- Public storefront paths and the immutability guard.

No production or storefront mutation occurs in this phase.

---

## 5. Phase 3 — Module Truth Classification

Classify each module with evidence:

- `FULLY FUNCTIONAL` — behavior verified against code and tests.
- `PARTIAL` — core behavior works but has a documented gap.
- `MISLEADING` — fake or local-only persistence that looks live.
- `PLACEHOLDER` — static/empty/coming-soon surface.
- `UNVERIFIED` — evidence is insufficient.

Every classification must cite the evidence used (file, line, test, or report).

---

## 6. Phase 4 — Gap Identification

Identify only real, evidence-backed issues:

- Missing validation.
- Unsafe assumptions.
- Broken API calls.
- Fake persistence.
- Inconsistent types.
- Unclaimed/unwired module behavior.

Do not infer gaps without evidence. If evidence is insufficient, mark the item
as `UNVERIFIED` or `BLOCKED` and document the gap rather than guessing.

---

## 7. Phase 5 — Understand Before Build

Before implementing anything:

- Trace how data flows (UI -> API -> database and reverse).
- Identify dependencies.
- Confirm no impact on:
  - DailyGear storefront.
  - Financial records.
  - Authentication.
  - Supabase schema/migrations.

If uncertain about any impact, mark the item `BLOCKED` and stop.

---

## 8. Scope — Allowed vs Not Allowed

### Allowed (after failing-first test and evidence)

- Frontend validation fixes.
- Type safety improvements.
- Null/undefined guards.
- Error handling improvements.
- Safe labeling of localStorage modules.
- Additive documentation and audit reports.
- Reversible, non-production changes that do not touch restricted surfaces.

### Not allowed without explicit human approval

- Migrations, schema changes, RLS updates.
- CI/CD restructuring (the existing CI gate change is part of an already
  committed Phase 2 change and is separate from this protocol).
- AI/Auren architecture changes.
- Checkout/payment changes.
- Any DailyGear storefront route, product, price, image, funnel, or Purchase
  attribution change.
- Any hosted Supabase, Cloudflare, payment, or ad change.

---

## 9. Financial Rule (strict; change blocked without review)

Tithe mathematics already exists as a pure, deterministic, tested function:

- File: `src/lib/money/tithe-calculations.ts`
- Rate: `TITHE_RATE = 0.1`
- Base: posted income receipts only.
- Excluded: gifts (by source/income type), transfers, expenses, pending rows,
  void rows, non-positive/invalid amounts.
- Tests: `src/lib/money/tithe-calculations.test.ts`

The pasted master prompt's tithe rule ("base = posted income receipts, exclude
gifts/loans/transfers/refunds, amount = base x 0.10") is already realized by
this function. Because tithe is financial correctness, any proposed behavioral
change must go through separate review and approval before implementation. No
tithe code change may be made under this protocol without that approval.

---

## 10. Validation Before Commit

Run, in this order, and require all to pass:

```bash
npm ci
npm run lint
npm run typecheck
npm run build
npm test
node scripts/assert-public-storefront-untouched.mjs
git diff --check
```

The repo also exposes `npm run verify` (test -> lint -> typecheck -> build ->
storefront guard). Running `npm run verify` plus `git diff --check` satisfies
the combined gate for ordinary changes.

If any check fails, do not commit. Diagnose and fix only the verified cause.

---

## 11. Storefront Protection Check

Verify zero changes in protected paths:

- `src/routes/shop.*`
- `src/routes/funnel.$slug`
- `src/components/storefront/`
- `src/styles.css`
- `src/lib/dailygear/`
- `public/storefront/`

If any protected path changed, STOP immediately and do not commit.

---

## 12. Safety Gate Before Commit — 6-point check

You may commit only when ALL of these are true:

1. No financial logic broken.
2. No storefront changes.
3. No schema/migration/RLS changes.
4. No BLOCKED critical issues introduced.
5. All validation gates pass (section 10).
6. Changes are minimal and reversible.

---

## 13. Safe Commit

If ALL gates pass:

- Stage only the intended files by explicit path. Never use `git add .` without
  enumerating the exact paths.
- Commit with a conventional message describing the logical change.
- Push the feature branch only (`git push -u origin <feature-branch>`).
- Open a PR against `main`. Do not merge.

---

## 14. Stop Conditions

Stop immediately and report when any of these arise:

- Migration or schema changes are required.
- Financial ambiguity exists.
- Authentication behavior is unclear.
- Module classification is uncertain with insufficient evidence.
- Tests fail.
- A protected storefront path is touched.
- A secret would be exposed or committed.
- Evidence cannot be gathered.

---

## 15. Final Output Required After Each Change

1. Baseline report.
2. Module truth table (or delta to the previous one).
3. Gap analysis (or delta).
4. Fixes applied.
5. Validation results.
6. Storefront regression result.
7. Final status: `PARTIAL` / `BLOCKED` / `READY`.
8. Remaining risks.
9. Commands intentionally not run because they require approval.

---

## 16. Current Standing (records, not permission)

- Baseline freeze: `reports/PHASE-1-FREEZE-2026-08-31.md`.
- Module gap audit: `reports/MODULE-AUDIT-GAPS-2026-08-31.md`.
- CI verification gate: committed on the session feature branch
  `arena/01a05a23-alexos-digital-core`; not yet merged to `main`.
- Tithe function: exists, tested, and verified against the financial rule
  described in section 9; no code change made.

---

## 17. Review Escalation

If a decision affects financial correctness, security, customer data,
payments, ads, or production infrastructure, stop and request review before
proceeding. The default authority for this protocol is inspect, test,
implement on a feature branch, commit, push the feature branch, and open a PR.
Merging, deploying, and mutating hosted systems are restricted actions.
