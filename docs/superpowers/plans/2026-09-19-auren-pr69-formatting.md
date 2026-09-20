# Auren PR #69 Formatting and Conflict Remediation Plan

> **For agentic workers:** This is a narrow governed remediation slice. Do not expand scope.

**Goal:** Preserve PR #69’s Auren readiness behavior on top of current `main`, resolve only integration conflicts, correct the five reported Prettier violations, and verify the resulting branch without touching restricted surfaces.

**Architecture:** Start from current `main` on `fix/auren-pr69-formatting`, merge the existing PR branch as a source of the already-reviewed Auren changes, and resolve conflicts by preserving current-main behavior unless the PR change is the targeted Auren readiness change. Apply formatter-only edits to the three failing source files. Keep the change limited to Auren components, Auren data-readiness code/tests, the Auren route, and audit/planning documentation.

**Tech Stack:** TanStack Start, React, TypeScript, Vitest, ESLint, Prettier, GitHub Actions.

**Spec:** `docs/GOVERNED_BUILD_PROTOCOL.md`, `reports/DEEP-AUDIT-2026-09-19.md`, and PR #69.

## Global Constraints

- Never work directly on `main`; deliver through feature branch → pull request → review → merge.
- Do not modify Supabase schema, migrations, RLS, hosted data, financial logic, payment/checkout behavior, or protected DailyGear storefront paths.
- Do not change Auren behavior beyond preserving PR #69’s reviewed readiness copy/link behavior and resolving integration conflicts caused by current `main`.
- Run focused tests, full `npm run verify`, `git diff --check`, and the storefront guard before claiming readiness.

---

### Task 1: Integrate PR #69 onto current main

**Files:**
- Modify only files in PR #69’s five-file change set if Git reports conflicts.

- [ ] Confirm branch is `fix/auren-pr69-formatting`, base is current `main`, and working tree status is known.
- [ ] Merge `origin/feat/auren-empty-state` with `--no-commit`.
- [ ] If conflicts occur, preserve current-main code outside the Auren readiness scope and retain PR #69’s actionable empty-state copy, corrected links, and readiness panel behavior.
- [ ] Confirm no protected storefront, financial, migration, or schema paths appear in the merge diff.

### Task 2: Correct formatter-only violations

**Files:**
- Modify: `src/components/auren/AurenPage.tsx`
- Modify: `src/components/auren/AurenReadinessPanel.tsx`
- Modify: `src/lib/auren/data-readiness.ts`

- [ ] Run Prettier check on the five PR files to reproduce the known failure.
- [ ] Apply only Prettier’s required line wrapping/whitespace changes.
- [ ] Re-run Prettier and ESLint on the changed files.

### Task 3: Verify and commit the atomic remediation

- [ ] Run the targeted Auren data-readiness test.
- [ ] Run `npm run verify`.
- [ ] Run `git diff --check` and `node scripts/assert-public-storefront-untouched.mjs`.
- [ ] Review staged diff and confirm no secrets, financial, schema, migration, or storefront files are staged.
- [ ] Commit with `fix(auren): reconcile empty-state branch with main`.
- [ ] Push only `fix/auren-pr69-formatting` and open a PR against `main`; do not merge without a later explicit approval.
