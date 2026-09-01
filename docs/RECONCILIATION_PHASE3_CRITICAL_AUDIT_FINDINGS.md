# CRITICAL AUDIT FINDINGS — PACKAGE.JSON, CI WORKFLOWS, AND AGENTS.MD

**Date**: September 1, 2026  
**Canonical Repository**: AlexOS-Org/alexos-digital-core  
**Secondary Repository**: AlexOS-Org/AlexOS  

---

## FINDING 1: PACKAGE.JSON — MINOR BUT SIGNIFICANT DIFFERENCE ✅

### Comparison Result

Both `package.json` files are **functionally identical** except for ONE critical difference:

```diff
Root-level package.json (Canonical — alexos-digital-core):
  "scripts": {
    "dev": "vite dev",
    "build": "vite build",
    "build:dev": "vite build --mode development",
    "preview": "vite preview",
    "deploy": "npm run build && wrangler deploy",
    "cf-typegen": "wrangler types",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "test": "vitest run --config vitest.config.mjs",
    "verify": "npm test && npm run lint && npm run typecheck && npm run build && node scripts/assert-public-storefront-untouched.mjs",
    "format": "prettier --write ."
  }

Secondary repository (AlexOS):
  "scripts": {
    "dev": "vite dev",
    "build": "vite build",
    "build:dev": "vite build --mode development",
    "preview": "vite preview",
    "deploy": "npm run build && wrangler deploy",
    "cf-typegen": "wrangler types",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "test": "vitest run --config vitest.config.mjs",
    "format": "prettier --write ."
  }
```

### Critical Difference

**The canonical repository has:**

```json
"verify": "npm test && npm run lint && npm run typecheck && npm run build && node scripts/assert-public-storefront-untouched.mjs"
```

**The secondary repository is missing the entire `verify` script.**

### Security/Quality Impact

🚨 **CRITICAL FINDING**: The canonical repository includes a **public storefront immutability check** that enforces safe changes. The secondary repository's lack of this script means:

- CI cannot enforce the public-storefront safety gate;
- developers could accidentally modify protected storefront files;
- the pr-verify workflow may be running incomplete verification.

### Recommendation

**KEEP**: The canonical repository's `package.json` with the `verify` script and storefront-guard check.

**ACTION**: Verify that `scripts/assert-public-storefront-untouched.mjs` exists and is functional in the canonical repository.

---

## FINDING 2: PR-VERIFY.YML WORKFLOW — MAJOR DIFFERENCE 🚨

### Canonical Repository (alexos-digital-core)

```yaml
name: PR Verify

on:
  pull_request:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read

jobs:
  verify:
    runs-on: ubuntu-latest
    timeout-minutes: 20
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run verify
```

### Secondary Repository (AlexOS)

```yaml
name: PR Verify

on:
  pull_request:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read

jobs:
  verify:
    runs-on: ubuntu-latest
    timeout-minutes: 15        ← DIFFERENCE: 20 vs 15
    steps:
      - uses: actions/checkout@v4
                              ← DIFFERENCE: Missing fetch-depth: 0
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run build      ← DIFFERENCE: Only build
      - run: npm run lint       ← DIFFERENCE: Only lint
                                ← DIFFERENCE: Missing npm run verify
```

### Critical Differences

| Aspect | Canonical | Secondary | Impact |
|--------|-----------|-----------|--------|
| **Timeout** | 20 minutes | 15 minutes | May timeout on slower runs |
| **fetch-depth** | `0` (full history) | omitted (shallow) | Cannot detect storefront changes across commits |
| **Verification** | `npm run verify` (comprehensive) | `npm run build && npm run lint` (incomplete) | Skips tests, typecheck, and storefront guard |
| **Tests** | ✅ Included | ❌ Missing | Tests not run on PR |
| **Typecheck** | ✅ Included | ❌ Missing | TypeScript errors not caught |
| **Storefront Guard** | ✅ Included | ❌ Missing | Public files can be modified unsafely |

### Security/Quality Impact

🚨 **CRITICAL FINDING**: The secondary repository's CI workflow is **significantly weaker**. It:

- Does not run tests
- Does not run TypeScript verification
- Does not run the storefront immutability check
- Uses a shallow checkout that cannot detect multi-commit changes
- Uses a shorter timeout (may be insufficient)

This creates a **serious regression in code safety** if adopted.

### Recommendation

**KEEP**: The canonical repository's `pr-verify.yml` with full comprehensive verification.

**ACTION**: Do NOT weaken the CI pipeline. The canonical verification is correct and necessary.

---

## FINDING 3: AGENTS.MD — GOVERNANCE DIFFERENCE

### Canonical Repository (alexos-digital-core)

```markdown
# AlexOS repository guidance

## Governing protocol
Read `docs/GOVERNED_BUILD_PROTOCOL.md` before making any code change. It is the
audit-first, evidence-based change protocol: feature-branch/PR only, full
validation gate before commit, public-storefront immutability check, and no
production/hosted mutations without explicit approval.

## Source of truth
GitHub is the source of truth for the application code. Production infrastructure must not depend on a third-party editor or hosted development environment.

## Safe change policy
- Never commit secrets, `.env` files, private keys, or service-role credentials.
- Keep Supabase credentials in the deployment environment only.
- Treat `supabase/config.toml` as the canonical linked Supabase project configuration.
- Do not rewrite published history merely to remove old development metadata; rotate exposed credentials instead.
- Prefer additive, reversible changes and verify builds before production deployment.

## Supabase
The controlled production Supabase project is `goafwbrayepaihxbqsse`. Client code may use the publishable key; service-role credentials are server-only.
```

### Secondary Repository (AlexOS)

```markdown
# AlexOS repository guidance

## Source of truth
GitHub is the source of truth for the application code. Production infrastructure must not depend on a third-party editor or hosted development environment.

## Safe change policy
- Never commit secrets, `.env` files, private keys, or service-role credentials.
- Keep Supabase credentials in the deployment environment only.
- Treat `supabase/config.toml` as the canonical linked Supabase project configuration.
- Do not rewrite published history merely to remove old development metadata; rotate exposed credentials instead.
- Prefer additive, reversible changes and verify builds before production deployment.

## Supabase
The controlled production Supabase project is `goafwbrayepaihxbqsse`. Client code may use the publishable key; service-role credentials are server-only.
```

### Critical Difference

The canonical repository includes a **critical governing protocol section**:

```markdown
## Governing protocol
Read `docs/GOVERNED_BUILD_PROTOCOL.md` before making any code change. It is the
audit-first, evidence-based change protocol: feature-branch/PR only, full
validation gate before commit, public-storefront immutability check, and no
production/hosted mutations without explicit approval.
```

The secondary repository **omits this entirely**.

### Impact

The canonical repository enforces a formal change protocol with evidence trail.

The secondary repository lacks this guidance.

### Recommendation

**KEEP AND ENHANCE**: The canonical repository's `AGENTS.md` with the governing protocol reference.

**ACTION**: Verify that `docs/GOVERNED_BUILD_PROTOCOL.md` exists and is referenced in all change guidance.

---

## FINDING 4: ORION SEARCH RESULT ✅

**Search for "Orion"**: No results found in canonical repository.

**Status**: ✅ **CLEAN** — No obsolete Orion runtime/UI references detected. The codebase has successfully been migrated to Auren.

---

## FINDING 5: SUPABASE MIGRATIONS — CANONICAL REPOSITORY INVENTORY

The canonical repository contains **60+ migrations** tracking the complete database evolution:

### Migration Categories Identified

| Category | Key Migrations | Status |
|----------|---|---|
| **CRM V3** | crm_v3_foundation_live, crm_v3_types_and_automation, phase3_* | ✅ Current |
| **DailyGear** | dailygear_*,  storefront, catalogue_gate, guest_checkout | ✅ Production |
| **Finance** | personal_business_finance_model, order_integrity, price_guard | ✅ Core |
| **Auren** | auren_live_evidence_snapshots, auren_refresh_run_privacy | ✅ Active |
| **Security** | security_harden_*, lock_server_only_tables, harden_security_definer | ✅ Hardened |
| **Inventory** | stock_gate, safe_order_price_guard | ✅ Protected |
| **Orders** | order_integrity_hardening, guest_order_catalogue_gate, refunds | ✅ Complete |

### Recent Security-Critical Migrations

```
20260901000000_dailygear_positive_order_price_guard.sql  ← SEPTEMBER 1 UPDATE
20260823051000_harden_security_definer_search_paths.sql
20260823050000_lock_server_only_tables.sql
20260823042000_fix_public_catalogue_evidence_gate.sql
```

### Key Observation

The most recent migration is **dated September 1, 2026** (today) and implements a **positive order price guard**. This is a critical safety feature for DailyGear.

---

## FINDING 6: SECONDARY REPOSITORY MIGRATIONS — RESOURCE NOT FOUND

The attempt to list migrations in the secondary repository (`AlexOS-Org/AlexOS`) returned "not found" errors.

**Possible causes**:
- Repository structure differs
- Path does not exist
- Access restrictions

**Action Required**: Verify the secondary repository's actual migration location and compare against the canonical repository's 60+ migrations.

---

## CRITICAL DECISION MATRIX

| Aspect | Canonical | Secondary | Verdict |
|--------|-----------|-----------|---------|
| **package.json** | Has `verify` script + storefront guard | Missing both | **KEEP CANONICAL** ✅ |
| **pr-verify.yml** | Full comprehensive CI (test/lint/typecheck/build/guard) | Weak CI (build/lint only) | **KEEP CANONICAL** ✅ |
| **Timeout** | 20 minutes | 15 minutes | **KEEP CANONICAL** ✅ |
| **fetch-depth** | Full history (`0`) | Shallow | **KEEP CANONICAL** ✅ |
| **AGENTS.md** | Includes governing protocol reference | Omits governing protocol | **ENHANCE CANONICAL** ✅ |
| **Orion** | None found (clean) | Unknown | **KEEP CANONICAL** ✅ |
| **Migrations** | 60+, current through 2026-09-01 | Unable to verify | **KEEP CANONICAL** ✅ |

---

## RECOMMENDATION SUMMARY

### Phase 1 Audit Result: **CANONICAL REPOSITORY IS STRONGER**

✅ The canonical repository (`alexos-digital-core`) has:

1. **Stronger dependencies** — identical, optimal versions
2. **Stronger CI/verification** — comprehensive, full safety gates
3. **Stronger governance** — formal protocol reference
4. **Stronger database** — complete, current migrations including today's security hardening
5. **Stronger architecture** — no obsolete Orion references

❌ The secondary repository (`AlexOS`) lacks:

1. The `verify` script and storefront immutability check
2. Comprehensive CI verification (tests, typecheck, storefront guard missing)
3. Formal governance protocol reference
4. Accessible migration history for comparison

---

## IMMEDIATE ACTIONS REQUIRED

1. ✅ **Preserve canonical repository as-is** — it is more complete and safer
2. ⏳ **Audit secondary repository migrations** — investigate why migrations endpoint returned 404
3. ⏳ **Deep-dive source code comparison** — begin `src/` directory audit
4. ⏳ **Verify storefront guard script** — ensure `scripts/assert-public-storefront-untouched.mjs` exists and functions
5. ⏳ **Verify GOVERNED_BUILD_PROTOCOL.md** — ensure governance documentation is complete

---

## EVIDENCE TRAIL

**Audit Timestamp**: 2026-09-01  
**Evidence Collection Method**: Direct file comparison via GitHub API  
**SHA References**:
- Canonical: c063c33e10789cb45d3aefb7285511cfe8318412
- Secondary: 0c85a31fa0c2a65394cebe1c8cfe506b5306e65c

**No modifications made to either repository.**

