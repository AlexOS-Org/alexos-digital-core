# Auren Connector Gateway & Capability Registry — 2026-09-01

## 1. Branch-state reconciliation (important)

The supplied "Audit and commit result" claimed:
- active branch `feature/high-priority-audit-fixes`
- base `0c85a31`
- no difference from `main`
- clean tree, no untracked, no commits

**That state does not exist in this session.** The actual workspace is:
- active branch: `arena/01a05a23-alexos-digital-core`
- HEAD: `a5ba226`
- `origin/main`: `0c85a31`
- commits ahead of `origin/main`: **12**
- working tree: clean
- no `feature/high-priority-audit-fixes` branch, no worktree divergence

No "empty/misleading" commit was created, but also no reconciliation commit was
silently invented. The branch is clean and validated, just not aligned with
`main` (it contains the accumulated governance, CI, Phase 1 and Phase 2 work).

## 2. What already exists (audit finding)

AlexOS already has a substantial evidence-first Auren layer:

- `src/lib/auren/advisor.server.ts` — scopes every Supabase query to
  `user_id`, aggregates owner data, builds forecasts/decisions, and can call a
  Cloudflare AI binding for a constrained narrative.
- `src/lib/auren/decision-system.ts` — evidence metadata
  (`sourceType`, `sourceKey`, `sourceUrl`, `sourceScope`, `observedAt`,
  `windowStart/End`, `status`, `confidence`, `label`, `freshnessSeconds`,
  `payload`), freshness/aging/stale classification, approval gates.
- `src/lib/auren/public-context.ts` — external brand context, explicitly
  labelled as background and prohibited from contributing to financial truth.
- `src/server/auren/live-evidence-refresh.ts` — reads Meta/Firecrawl evidence
  with source URL, status, confidence, payload and error handling; read-only.
- `src/lib/dailygear/intelligence.ts` and `product-readiness-signals.ts` —
  first-party commerce signals with `evidenceLevel`.

So the recommended "server-side connector adapters, evidence snapshots,
freshness/provenance, read-only defaults, approval gates" is **already partly
built**. The missing piece is a typed server-side capability registry and a
per-workspace authorization boundary that connector adapters must pass through.

## 3. Implemented in this change

New module: `src/lib/auren/capability-gateway.ts` (pure, additive).

- Declares read-only capabilities: `supabase:read`, `dailygear:read`,
  `analytics:read`.
- Each capability carries source, authorization (`read_only`), mutation
  approval requirement and a human-facing freshness label.
- `authorizeCapability` enforces:
  - authenticated caller must be the requested workspace owner (same `user_id`);
  - mutation capability id `finance:write` is **refused** until an explicit
    approval gate is wired;
  - unknown capability ids are **refused**;
  - every registered capability is read-only.
- `listReadOnlyCapabilities` returns a deterministic, stable list.

Wired into `advisor.server.ts`:
- `AurenAdvisorySnapshot` now includes `capabilities` so the Auren/advisory
  surface can display available read-only connectors honestly.
- Populated from `listReadOnlyCapabilities()` in `buildAurenAdvisory`.

New regression test: `src/lib/auren/capability-gateway.test.ts` (6 tests,
written before the implementation; first run failed on missing module, then the
test caught a real cross-user authorization bug that was fixed).

## 4. Safety

- No secrets, `.env`, credentials, service-role keys, tokens or private key
  material added.
- No Supabase schema/migration change. No `supabase db push`, no migration
  repair, no RLS/grant change.
- No production data, payment, ad, Cloudflare or storefront route change.
- No public storefront files changed (`src/routes/shop.*`,
  `funnel.$slug`, `src/components/storefront/`, `src/styles.css`,
  `public/storefront/` all unchanged).
- No connector makes a network call or mutation. The gateway is a
  contract + authorization boundary; actual credential-based adapters are not
  wired in and remain blocked pending explicit approval.

## 5. Validation

- `npm run verify` → exit 0 (test, lint, typecheck, build, storefront guard).
- `typecheck` → pass.
- `lint` → 0 errors (existing Fast Refresh warnings only).
- Storefront guard → PASS, 0 protected files changed.

## 6. Remaining blockers

### CODE
- No connector adapter actually fetches Supabase/analytics data yet. `dailygear:read`
  and `analytics:read` are declared but not bound to a provider.

### DATABASE
- No database change. If evidence snapshots need a dedicated capability table,
  that is a separate additive migration requiring review.

### PRODUCTION
- Credentials for external connectors are not configured in this workspace and
  must remain server secrets only.

### HUMAN ACTIONS
- Approve which non-first-party connectors (if any) should be enabled.
- Approve any specific mutation capability before it is released from the
  `mutation_not_approved` gate.
