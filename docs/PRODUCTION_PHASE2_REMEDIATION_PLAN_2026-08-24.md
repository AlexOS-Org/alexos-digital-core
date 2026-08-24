# Phase 2 Remediation Plan

**Baseline:** `72e6060`  
**Branch:** `production-readiness/2026-08-24`  
**Policy:** no automatic merge, no deployment, no real order/payment, no production financial mutation, no secret exposure.

## Safe and evidence-backed actions

| Action                                                                 | Status                | Verification                                                                  |
| ---------------------------------------------------------------------- | --------------------- | ----------------------------------------------------------------------------- |
| Preserve rollback baseline                                             | Complete              | Commit `72e6060` remains available in Git history                             |
| Preserve production-readiness audit evidence                           | Complete              | Phase 0 and Phase 2 reports committed on the remediation branch               |
| Keep CI build/lint/typecheck/test gates                                | Complete from Phase 0 | Local full validation passed; branch workflow must be reviewed after push     |
| Keep Worker security headers                                           | Complete from Phase 0 | Source verified; live response remains unverified while deployment is blocked |
| Add non-production authorization test plan for the five sensitive RPCs | Complete in Phase 2   | Test cases defined below; no production mutation                              |
| Add read-only catalogue/finance/Meta/Auren evidence collection         | Safe next step        | Must use bounded reads and label absent data unavailable                      |

## Supabase RPC remediation

No grant is revoked in Phase 2 because the application’s intended admin/server boundary is not yet confirmed and direct client call sites require a controlled migration. The next implementation should create a Supabase development branch, snapshot exact function signatures and grants, add server-only wrappers where needed, and test anonymous, normal authenticated, authorized owner/admin, and service-role paths. Only after those tests pass should an idempotent migration revoke the exact authenticated grants.

The functions must retain `SECURITY DEFINER` where they need elevated access, retain an explicit safe `search_path`, validate `auth.uid()` and record ownership, and reject unauthorized account/order combinations. `SECURITY INVOKER` is not a universal fix.

## Auth security

Leaked-password protection remains an owner dashboard action. The owner must enable the setting in Supabase Auth, then the team should rerun advisors and test sign-up/password-change behavior. No password policy or auth setting is guessed in code.

## Cloudflare

Deployment remains intentionally blocked. The owner must configure a fresh unexposed token with account-scoped Workers Scripts Edit, Account Settings Read, and Workers AI Read. After the token is available through the secure environment, deploy the exact validated commit and verify the Worker version, custom domains, headers, and YJ funnel. Do not use a token pasted into chat.

## Checkout, accounting, and catalogue

Use a non-payment E2E harness or test branch for customer and admin flows. Do not create production orders, payments, refunds, inventory movements, or financial transactions during this phase. Perform read-only catalogue and finance reconciliation first. Products with uncertain identity, price, supplier cost, variant mapping, or stock remain Draft or UNVERIFIED; do not fabricate values or merge uncertain products.

## Meta and Auren

Pixel `402601214245203` remains owner-action dependent for Events Manager proof. Verify `PageView`, `ViewContent`, `AddToCart`, and `Purchase` using Test Events and Pixel Helper after the correct Worker is live. Meta ad-account insight rows that are absent remain unavailable, not zero. Auren must continue to expose explicit unavailable states when Firecrawl or Instagram server-only credentials are absent.

## Required owner inputs

1. Confirm the desired admin/server invocation boundary for the five sensitive RPCs.
2. Provide dashboard authorization to enable leaked-password protection.
3. Configure a fresh Cloudflare token securely, without pasting it into chat.
4. Provide the canonical DailyGear Ads Manager account for performance reporting.
5. Provide real Firecrawl and Instagram server-only credentials if Auren research is required.
6. Confirm missing supplier costs, stock, product identity, and historical payment references before any catalogue or finance mutation.

## Stop conditions

Stop and request owner action if a change would require production data mutation, an exposed credential, a real payment/order, an unverified financial assumption, a destructive migration, an automatic merge to `main`, or a Cloudflare deployment without confirmed write authorization.
