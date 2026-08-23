# DailyGear Live Security and Performance Audit

**Author:** Manus AI  
**Target:** `https://dailygear.co.ke`  
**Canonical Worker:** `alexos-business-os`  
**Audit date:** 23 August 2026  
**Audit mode:** Read-only production verification

## Executive conclusion

DailyGear is live and reachable through the canonical Cloudflare Worker. The public storefront, catalogue, product detail, cart, checkout, authentication, apex domain, and `www` domain all returned successful responses during the audit. The final GitHub validation and production-verification workflows for commit `c0fb4cc` completed successfully, and Cloudflare reports Worker version **154** at **100% allocation**.

The highest-priority weaknesses are hardening and performance issues rather than evidence of an active compromise. Public HTML responses did not include common browser-security headers, HTTP did not visibly redirect to HTTPS, and the storefront critical path includes large shared assets: approximately **593 KB** for the main JavaScript entry, **424 KB** for the chart vendor chunk, and **323 KB** for CSS. Supabase also reports six security warnings and 102 performance advisories. These findings should be addressed in a planned hardening/performance release rather than through unreviewed production edits.

Auren remains partially unavailable because `FIRECRAWL_API_KEY` is not present in the Worker. Instagram is configured with an encrypted Worker secret, but an authenticated Auren refresh was not run in this audit because the browser session redirected to `/auth`. No orders, payments, refunds, transfers, stock changes, financial postings, secret rotations, or production configuration changes were performed.

## Overall scorecard

| Area | Status | Severity / interpretation |
|---|---|---|
| Availability and routing | Pass with observation | Public routes returned 200; scheduled API GET fallback should be corrected to return an API-appropriate method response. |
| TLS | Pass | TLS 1.3, certificate verification successful, ECDSA certificate for `dailygear.co.ke`. |
| HTTPS enforcement | Needs hardening | Plain HTTP returned 200 rather than a visible redirect; verify Cloudflare redirect and HSTS policy. |
| Browser security headers | Needs hardening | CSP, HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, and Permissions-Policy were not observed. |
| Public secret/source exposure | Pass | `.env`, package/config files, source maps, and server source probes returned 404; no server secret names were found in live products HTML. |
| Dependency risk | Pass | `npm audit --omit=dev` reported zero known production vulnerabilities in 263 production dependencies. |
| Frontend performance | Needs optimization | Large main bundle, chart vendor, and stylesheet; public assets use `max-age=0, must-revalidate`. |
| Cloudflare deployment | Pass | Worker version 154 is 100% active; both custom domains are enabled; schedules are present. |
| Supabase database security | Needs hardening | RLS/no-policy informational findings plus authenticated SECURITY DEFINER warnings and disabled leaked-password protection. |
| Supabase database performance | Needs optimization | 102 advisor findings, mostly unindexed foreign keys and unused indexes. |
| Auren live evidence | Partial | Instagram secret is present; Firecrawl secret is missing, so public ads-library research remains unavailable. |
| Authenticated admin verification | Incomplete | Public auth route is available, but no signed-in browser session was available for end-to-end admin/mobile verification. |

## 1. Availability, routes, and HTTP behavior

The following public routes returned HTTP 200 in the audit environment: `/`, `/shop`, `/shop/products`, `/shop/cart`, `/shop/checkout`, `/auth`, and the YJ product-detail route. Both `dailygear.co.ke` and `www.dailygear.co.ke` returned successfully. `robots.txt` and `sitemap.xml` returned 200 and were Cloudflare cache hits.

The plain HTTP URL `http://dailygear.co.ke/` returned HTTP 200 rather than a visible redirect to HTTPS. This is a **medium-priority hardening issue** because production traffic should be forced to the canonical secure scheme. Confirm the Cloudflare Redirect Rule or “Always Use HTTPS” setting, then add HSTS only after confirming all subdomains and resources are HTTPS-safe. HSTS is a browser-enforced policy and should be rolled out deliberately [1].

The live `GET /api/scheduled/abandoned-cart` request returned the application HTML fallback with status 200. The source route defines a protected `POST` handler requiring `ABANDONED_CART_SCHEDULE_SECRET`. The observed GET behavior does not expose the scheduled job, but it is an API contract issue: unsupported methods should return an API-shaped 404/405 rather than storefront HTML. The protected POST handler was not invoked.

## 2. TLS and browser security headers

TLS negotiation succeeded with TLS 1.3, cipher `TLS_AES_256_GCM_SHA384`, ECDSA certificate CN `dailygear.co.ke`, SHA-256 signature, X25519 key exchange, and certificate verification OK.

The sampled public HTML responses did not include the following headers:

| Header | Observed | Priority | Recommended treatment |
|---|---:|---:|---|
| `Strict-Transport-Security` | No | High after HTTPS enforcement | Add with a controlled max-age; include subdomains only after validation. |
| `Content-Security-Policy` | No | High | Start with Report-Only, inventory Supabase, Meta Pixel, fonts, images, and analytics, then enforce. |
| `X-Content-Type-Options` | No | Medium | Add `nosniff`. |
| `X-Frame-Options` | No | Medium | Add `SAMEORIGIN` or use CSP `frame-ancestors`. |
| `Referrer-Policy` | No | Medium | Use a restrictive policy such as `strict-origin-when-cross-origin`. |
| `Permissions-Policy` | No | Low/Medium | Disable browser capabilities not required by the storefront. |

These are hardening observations from response headers, not evidence that the site is compromised. OWASP recommends a deliberate security-header policy that matches the application’s external resources and embedding requirements [2]. A CSP must be tested in Report-Only first so that Meta Pixel, Supabase, external product images, social links, and any payment-related resources are not broken.

## 3. Public exposure and secrets

Probes for `/.env`, `/.env.local`, `/config.json`, `/package.json`, `/wrangler.toml`, `/src/server.ts`, and two guessed JavaScript source-map paths returned 404. The live products HTML contained no matches for `SUPABASE_SERVICE_ROLE_KEY`, `META_ACCESS_TOKEN`, `FIRECRAWL_API_KEY`, `RESEND_API_KEY`, or `SERVICE_ROLE`. This is a positive result.

The Meta ads webhook returned 403 to an unauthenticated request, which is the expected safe outcome for a protected webhook challenge or delivery path. No webhook payload was submitted.

The public HTML includes the publishable storefront application and route manifest, as expected for a browser-rendered site. A publishable Supabase key is not a secret when protected by RLS; the service-role key must remain server-only. The Worker metadata audit confirmed that the service-role key is stored as a secret binding and was never retrieved or printed.

## 4. Frontend performance and asset delivery

The live products document was approximately 36 KB. The primary assets observed were:

| Asset | Approximate raw size | Finding |
|---|---:|---|
| `index-CDm9T9iS.js` | 593 KB | Largest shared application entry; likely too much code for the public critical path. |
| `charts-vendor-BRvr6MQb.js` | 424 KB | Chart dependency appears in the root preload set; should be isolated from storefront routes. |
| `styles-FvVdHNUM.css` | 323 KB | Large global stylesheet; identify unused or admin-only CSS. |

Observed route timings from the audit environment were approximately 2.1–3.1 seconds total, with time-to-first-byte approximately 1.8–2.6 seconds for tested storefront routes. These are synthetic single-location measurements, not Core Web Vitals or real-user measurements.

Hashed JavaScript and CSS resources were Cloudflare cache hits but returned `public, max-age=0, must-revalidate`. Hashed immutable assets can usually use a longer cache lifetime after confirming deployment invalidation behavior. The audit did not observe a `content-encoding` header on the sampled assets; confirm Brotli/gzip behavior with a browser or edge configuration check before treating this as definitive uncompressed delivery.

### Recommended performance sequence

First, ensure the public `/shop` route does not preload charting, Money Center, Auren, or other authenticated-only vendors. Second, split the public storefront and admin dashboard bundles, especially the chart vendor. Third, audit Tailwind/global CSS output and remove admin-only rules from the public critical path. Fourth, configure long-lived immutable caching for hashed assets and retain short/no-store semantics for HTML and personalized/API responses. Finally, add real-user monitoring for LCP, INP, CLS, TTFB, JavaScript errors, and route-level resource timing. Lighthouse performance guidance distinguishes lab measurements from field data and recommends using both [3].

## 5. Cloudflare Worker and deployment posture

Cloudflare metadata confirmed the canonical Worker `alexos-business-os` is serving version **154** at 100% allocation. The deployment was created by Wrangler at `2026-08-23T03:31:15Z`. Both production custom domains are enabled:

- `dailygear.co.ke`
- `www.dailygear.co.ke`

The Worker schedules are present for the 30-minute refresh (`*/30 * * * *`) and daily maintenance (`0 3 * * *`). Cloudflare observability and persisted invocation logs are enabled with a 100% head-sampling rate. This provides useful visibility but should be reviewed for retention, personal-data minimization, and log redaction before production volume increases.

The secret-name inventory contains `DAILYGEAR_EMAIL_FROM`, `INSTAGRAM_BUSINESS_ACCOUNT_ID`, `META_ACCESS_TOKEN`, `RESEND_API_KEY`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and `SUPABASE_URL`. `FIRECRAWL_API_KEY` is absent. Secret values were not read.

## 6. Supabase security posture

The current Supabase security advisor returned eight findings: two informational RLS-enabled-without-policy findings for `auren_evidence_refresh_runs` and `dg_cart_sessions`, five warnings for authenticated users being able to execute `SECURITY DEFINER` payment/fulfilment/refund/admin-order functions, and one warning that leaked-password protection is disabled.

The five function warnings should be reviewed against the application’s intended owner-admin flow. If the functions must be callable through PostgREST, retain strict in-function ownership checks and validate all account/order identifiers; otherwise move them out of the exposed API schema or revoke authenticated execution. The Supabase advisor documentation specifically flags exposed `SECURITY DEFINER` functions because they execute with elevated privileges [4].

The RLS-without-policy findings may be intentional for server-only tables, but they should be moved to a private schema or given explicit deny-by-default policies if the public schema is retained. The leaked-password protection setting should be enabled in Supabase Auth after confirming the desired password policy; this does not affect OAuth users.

The auth middleware validates a Bearer token, rejects missing or malformed tokens, uses Supabase `getClaims`, and disables server-side session persistence. The AlexOS owner allowlist is configured in application code and must continue to be backed by server-side authorization and database RLS; a client-visible email allowlist is not itself a security boundary.

## 7. Supabase performance posture

The performance advisor returned 102 findings: 48 unindexed foreign-key findings, 44 unused-index findings, seven RLS init-plan findings, two multiple-permissive-policy findings, and one duplicate-index finding. All were reported at INFO level by the advisor response.

These should not be fixed as a blind bulk migration. For each candidate index, review query frequency, table size, write cost, and whether another composite index already covers the access pattern. Start with high-traffic tables and foreign keys used by storefront catalogue queries, order items/payments/expenses, transactions, accounts, and Auren snapshots. For unused indexes, confirm the observation window is long enough to include normal business cycles before removal.

RLS init-plan and multiple-permissive-policy findings should be reviewed for policy performance and accidental broadening. Supabase’s database-linter guidance should be used alongside query plans and production traffic evidence [5].

## 8. Auren and connector availability

Instagram configuration is present in the Worker as an encrypted `INSTAGRAM_BUSINESS_ACCOUNT_ID` secret. The enabled Instagram connector previously confirmed the connected DailyGear account and read-only post access. The Worker’s live Instagram refresh still requires a signed-in Auren verification after the next scheduled run.

Public ads-library research remains unavailable because `FIRECRAWL_API_KEY` is not present in Cloudflare. The Firecrawl connector can perform read-only connector calls, but connector credentials are not automatically transferable into Worker secrets. This is an availability/configuration gap, not a security exposure. Add the key directly in Cloudflare as a secret, then observe one scheduled refresh and verify that Auren stores a fresh evidence snapshot without logging the key or full external payloads.

## 9. GitHub, repository, and dependency integrity

GitHub Actions for commit `c0fb4cc` completed successfully for both `Validate AlexOS` and `Production Verify`. The local repository is at `c0fb4cc`; the audit generated documentation only and did not modify application code. `npm audit --omit=dev` reported zero known vulnerabilities in the 263-production-dependency tree. The audit did not claim that zero advisories proves the absence of application-level vulnerabilities.

## 10. Mobile and authenticated-surface limitations

The public catalogue, cart, checkout, and related mobile surfaces had previously been checked in a mobile viewport and no confirmed blocking overlap was observed. This audit did not have an authenticated browser session for AlexOS administration, Money Center, CRM, or Auren. Therefore, authenticated mobile flows, owner-only authorization behavior in the browser, admin chart performance, and form submission behavior remain partially unverified.

A safe follow-up requires a signed-in owner browser session and should test only non-mutating screens first. Any checkout, payment, refund, or order mutation must use a clearly labeled test environment or an explicitly confirmed production test plan.

## Prioritized remediation plan

| Priority | Action | Why |
|---|---|---|
| P0 | Confirm no production secrets have been exposed in Git history; rotate any previously exposed Meta or Supabase service-role credentials. | Credential exposure can bypass all application controls. |
| P1 | Enforce HTTP-to-HTTPS at Cloudflare and add HSTS after validating subdomains. | Prevent downgrade and plaintext access. |
| P1 | Add CSP in Report-Only, then enforce; add `nosniff`, frame, referrer, and permissions policies. | Reduce browser attack surface and clickjacking/content-type risks. |
| P1 | Add `FIRECRAWL_API_KEY` directly as a Cloudflare secret and verify one Auren refresh. | Restore the public ads-library evidence source. |
| P1 | Review the five exposed `SECURITY DEFINER` functions and owner checks; reduce their public API exposure where possible. | Limit elevated database execution paths. |
| P1 | Enable Supabase leaked-password protection. | Improve password-account security. |
| P1 | Split the storefront bundle from charts/admin modules and reduce global CSS. | Improve mobile load time and interaction readiness. |
| P2 | Set long-lived caching for hashed assets and verify Brotli/gzip. | Reduce repeat-visit transfer and parse cost. |
| P2 | Add explicit method handling for scheduled API routes. | Avoid misleading HTML 200 responses from API URLs. |
| P2 | Triage RLS init-plan, permissive-policy, and high-value index findings using query plans. | Improve database performance without unsafe bulk indexing changes. |
| P2 | Add field monitoring for Web Vitals and JS errors. | Track real user impact rather than relying only on synthetic checks. |
| P3 | Add `security.txt`, define log retention/redaction, and complete authenticated mobile/admin verification. | Improve responsible disclosure and operational assurance. |

## Audit boundary and final safety status

This audit was read-only. It did not submit a checkout, create or delete an order, confirm a payment, send an email or WhatsApp message, publish a product, change stock, modify a budget, post a financial transaction, rotate a secret, apply a database migration, or change Cloudflare settings. No financial or inventory conclusion was estimated from missing data.

## References

[1]: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Strict-Transport-Security "MDN: Strict-Transport-Security"

[2]: https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Headers_Cheat_Sheet.html "OWASP: HTTP Headers Cheat Sheet"

[3]: https://web.dev/articles/vitals "web.dev: Web Vitals"

[4]: https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable "Supabase database linter: authenticated SECURITY DEFINER function executable"

[5]: https://supabase.com/docs/guides/database/database-linter "Supabase database linter documentation"
