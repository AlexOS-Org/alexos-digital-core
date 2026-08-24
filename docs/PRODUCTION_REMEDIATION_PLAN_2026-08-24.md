# Production Remediation Plan

**Repository:** `dylextrends/alexos-digital-core`  
**Audit basis:** `docs/PRODUCTION_READINESS_AUDIT_2026-08-24.md`  
**Approach:** small, reversible, evidence-backed changes; no production data deletion, reset, real payment, or financial mutation.

## P0 / production blocker

| Change                                     | Status  | Required input                                                                                             | Rollback                                            |
| ------------------------------------------ | ------- | ---------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| Cloudflare Worker deployment authorization | Blocked | Fresh unexposed account-scoped token with Workers Scripts Edit, Account Settings Read, and Workers AI Read | Keep current Worker version until successful upload |

## P1 / security and authorization

| Change                                                                                                                                                  | Status                                    | Required input                                                             | Rollback                                                                  |
| ------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Review authenticated grants on `dg_confirm_order_payment`, `dg_record_order_fulfilment`, `dg_refund_or_void_order_payment`, and `dg_update_admin_order` | Needs controlled non-production review    | Confirm intended admin invocation path and canonical owner allowlist       | Reapply prior grant migration on non-production first                     |
| Enable leaked-password protection                                                                                                                       | Needs owner approval/dashboard credential | Confirm desired password policy and acceptance of Have I Been Pwned checks | Disable only through Auth settings if a tested compatibility issue occurs |
| Confirm OAuth provider callback and server-side owner authorization                                                                                     | Needs dashboard/provider access           | Real Google/Facebook provider configuration and allowlist confirmation     | Keep current `/auth` route and app-level sign-out behavior                |

## P2 / quality, performance, and observability

| Change                                                      | Status                            | Verification                                        |
| ----------------------------------------------------------- | --------------------------------- | --------------------------------------------------- |
| Add `npm test` and `npm run typecheck` to Production Verify | **Applied and locally validated** | GitHub workflow run on the remediation commit       |
| Add global security response headers at the Worker boundary | **Applied and locally validated** | `curl -I` on public custom domains and asset routes |

| Measure and reduce public bundle/image payloads | Needs measurement | Before/after bundle and mobile loading report |
| Run catalogue and variant/image reconciliation | Read-only first | Counts, duplicates, SKU/variant/image mapping |
| Run read-only finance reconciliation | Safe read-only | Order receipts, costs, balances, transfers, and duplicate-posting scan |
| Verify Meta Pixel through Events Manager | Needs Meta Events Manager access | Test Events evidence for PageView, ViewContent, AddToCart, Purchase |
| Verify Auren/Firebase/Instagram/Firecrawl freshness | Needs server-only secret state | Timestamped success or explicit unavailable state |

## Applied safe changes in this audit cycle

The production-verification workflow now runs build, lint, typecheck, and the full test suite. The Cloudflare Worker response boundary now adds `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, and HTTPS-only HSTS. No database, payment, catalogue, inventory, or financial records were mutated.

## Safe implementation order

1. Commit the audit and remediation documents.
2. Add CI coverage for tests and typecheck.
3. Add security headers and run route/build smoke tests.
4. Run read-only catalogue, finance, Meta, and Auren evidence collection.
5. Create a dedicated `production-readiness/2026-08-24` branch for schema/RLS remediation.
6. Reproduce sensitive RPC and migration changes on non-production only.
7. Apply approved Supabase migrations with explicit rollback evidence.
8. Configure a fresh Cloudflare token outside chat and deploy the exact validated commit.
9. Verify the Worker version, custom domains, public DailyGear, YJ funnel, checkout, and Meta Test Events.
10. Produce the final readiness score with all unverified items labelled `UNVERIFIED`.

## Owner input required before irreversible or privileged work

The owner must provide or confirm the fresh Cloudflare token through a secure environment/connector, the intended admin/server boundary for sensitive RPCs, approval to enable leaked-password protection, the canonical DailyGear Ads Manager account, and any missing real Firecrawl/Instagram credentials. No values should be pasted into chat or committed to the repository.
