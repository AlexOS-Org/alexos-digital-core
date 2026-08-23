# AlexOS Final Project Safety and Readiness Audit

**Date:** 23 August 2026  
**Repository:** `dylextrends/alexos-digital-core`  
**Branch:** `main`  
**Canonical Worker:** `alexos-business-os`  
**Canonical Supabase project:** `goafwbrayepaihxbqsse`  
**Production domain:** `https://dailygear.co.ke`

## Executive conclusion

The production DailyGear storefront is reachable, the previously empty public catalogue has been restored, the YJ school-bag product-to-cart flow works, and the current GitHub validation and production-verification workflows pass. The safe production changes in this audit were limited to a publication-policy correction, RPC privilege hardening, environment-name corrections for abandoned-checkout email, and a Firecrawl request-format correction. No orders, payments, stock quantities, financial transactions, refunds, or product publication decisions were created or altered by the browser audit.

The main remaining production blocker is **`FIRECRAWL_API_KEY`**. Because the enabled Firecrawl connector does not expose its underlying credential for transfer, the Worker’s public ads-library research card remains unavailable until the owner adds that secret directly in Cloudflare. The Instagram Business Account ID was obtained through the connected Instagram account and added safely as an encrypted Worker secret; Cloudflare created version 153 as a result.

## Section status summary

| Section                      | Status                                           | Evidence and conclusion                                                                                                                                                      |
| ---------------------------- | ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Public storefront routing    | Verified                                         | `/`, `/shop`, `/shop/products`, `/shop/cart`, `/shop/checkout`, `/auth`, and `www.dailygear.co.ke` returned HTTP 200 in the final smoke test.                                |
| Public catalogue             | Resolved and verified                            | The live products page changed from 0 items to 8 items after the evidence-gate RLS correction.                                                                               |
| YJ product detail            | Verified                                         | Gallery, title, KES 1,650 price, Unisex option, Blue/Pink/Red selectors, availability labels, and Order now CTA loaded.                                                      |
| Cart flow                    | Verified                                         | One YJ item was added; subtotal KES 1,650, delivery KES 150, total KES 1,800.                                                                                                |
| Checkout form                | Verified without submission                      | Required contact and delivery fields, county/town flow, optional reminder, and Pay on delivery/M-Pesa/Bank transfer choices loaded.                                          |
| Auren Instagram evidence     | Configured, pending next scheduled refresh       | `INSTAGRAM_BUSINESS_ACCOUNT_ID` is present in the Worker; live authenticated Auren view was not re-opened because the browser session redirected to `/auth`.                 |
| Auren public research        | Blocked                                          | `FIRECRAWL_API_KEY` is not present in Worker metadata, so the ads-library/public research card remains unavailable.                                                          |
| Auren cron                   | Verified                                         | Cloudflare has `*/30 * * * *` and `0 3 * * *` schedules.                                                                                                                     |
| Money Center                 | Previously validated; no mutation in this audit  | The prior bounded production audit found the expense-scope controls, account-linked posted expenses, order-trash retention, and non-duplicating account-flow rules in place. |
| Orders and fulfilment        | Safe but not end-to-end submitted                | Admin fulfilment/payment RPCs are owner-scoped and authenticated; no real test order was created in this audit.                                                              |
| Authentication               | Public entry verified; provider login not tested | Google/Facebook/email sign-in controls are present, but no login was attempted because no user credentials were supplied.                                                    |
| Responsive mobile storefront | Improved and visually checked                    | The live viewport showed contained product cards, detail columns, checkout fields, and footer surfaces without a confirmed overlap in the tested state.                      |
| CI/CD                        | Passing                                          | `Validate AlexOS` and `Production Verify` completed successfully for current head `c9e0452`.                                                                                 |

## Production changes applied

### Public catalogue publication gate

The public catalogue returned no products even though the service-role audit found an active YJ product with confirmed availability, a category, a published DailyGear storefront, and verified evidence. The root cause was the public product policy checking `dg_product_evidence` directly while that table allowed only authenticated owners to read rows. Under the anonymous role, the evidence check evaluated as false and filtered every product.

A private, non-exposed helper named `private.dg_has_verified_product_evidence(uuid)` was added as a `SECURITY DEFINER` boolean check with a fixed `search_path`. The public product and variant policies now call only this boolean helper, while the evidence payload remains private. After the migration, the live public catalogue returned 8 products and the YJ product detail loaded.

### Sensitive RPC privileges

The effective privilege audit initially found direct `anon` execution on payment confirmation, refund/void, salary posting, and a trigger helper. The first migration revoked privileges from `PUBLIC`, but direct named-role grants remained; this was corrected with an explicit named-role migration. Final effective checks show anonymous execution is false for the payment, trigger, fulfilment, refund, admin-order, and salary functions. Authenticated execution remains only for owner-scoped admin workflows, and salary posting remains service-role-only.

Supabase still reports warnings for authenticated users calling several `SECURITY DEFINER` admin functions. These functions are intentionally used by the signed-in admin UI and validate `auth.uid()` against the target owner. The warnings should remain on the hardening backlog until the application is migrated to a narrower private RPC bridge or an equivalent invoker-safe design. Supabase also reports that leaked-password protection is disabled; this must be enabled in Supabase Auth settings before production login should be considered fully hardened.

### Server integration corrections

The abandoned-checkout sender and scheduled readiness check were corrected to use the existing `DAILYGEAR_EMAIL_FROM` secret rather than the stale `RESEND_FROM_EMAIL` name. The Auren Firecrawl v2 request was corrected so `scrapeOptions.formats` uses the documented string format.

The Instagram connector account check returned the connected DailyGears account with username `daily_gearz`, 93 posts, and 61 followers. Its numeric Business Account ID was written to Cloudflare as the encrypted `INSTAGRAM_BUSINESS_ACCOUNT_ID` secret. The API returned HTTP 201 and Cloudflare created version 153. No secret value was written to source, logs, or this report.

## Cloudflare production state

The latest inspected metadata shows production version 153, created by the Instagram secret write, following version 152 from the source deployment. The Worker has 100% allocation for the latest deployment metadata. Both `dailygear.co.ke` and `www.dailygear.co.ke` are enabled in production and attached to `alexos-business-os`.

The schedules are:

| Schedule       | Intended responsibility                                                             |
| -------------- | ----------------------------------------------------------------------------------- |
| `*/30 * * * *` | Auren evidence refresh and scheduled maintenance path                               |
| `0 3 * * *`    | Daily maintenance path, including salary, cart-recovery, and order-trash operations |

The Worker secret inventory contains the expected Supabase, Meta, Resend, and DailyGear sender bindings, plus `INSTAGRAM_BUSINESS_ACCOUNT_ID`. `FIRECRAWL_API_KEY` is absent. Secret values were never read.

## Supabase production state

The bounded production audit confirmed the presence of the financial scope controls, account-linked transaction model, order-payment and fulfilment structures, evidence snapshots, product variants, funnel records, and order-trash retention. The earlier financial audit found five posted non-deleted expenses with expense scope and funding-account references present, and no duplicate active transaction-reference groups in its bounded check. The account balance model derives from posted transactions, while transfers remain separate from expenses.

This audit did not post a payment, fulfilment cost, refund, void, transfer, salary, tithe, or expense. It also did not delete or restore an order. This preserves the evidence-first rule that production financial records must not be changed merely to test display behaviour.

## Live storefront and checkout evidence

The final public HTTP smoke test returned HTTP 200 for the root page, shop, products, cart, checkout, authentication page, and both apex and `www` domains. The products route initially rendered `0 items`; after the production policy migration it rendered **8 items**.

The YJ product detail route shows a gallery, the SEO title `Quality Waterproof YJ Children School Bag`, price KES 1,650, an Unisex selector, and Blue, Pink, and Red available colour options. Selecting the default product CTA added one item to the cart. The cart showed KES 150 delivery and KES 1,800 total. The checkout displayed required contact and delivery controls and payment choices. No customer information was entered and the Place order button was not pressed.

A remaining catalogue-quality follow-up is that the live YJ detail page currently renders hosted session CDN images. The database evidence and source requirements call for external source URLs where appropriate; exact image provenance should be reviewed product by product before any catalogue expansion or advertising reuse.

## Mobile and performance findings

The tested public mobile layout displays the product grid, detail page, cart, and checkout without an observed blocking overlap. The responsive source changes include bounded image sizing, containment, mobile text wrapping, and scene-aware background treatment. The live public route response times in the final smoke test were approximately 2.0–2.9 seconds from the audit environment.

The build continues to emit a large JavaScript chunk warning. The final build succeeded, but the generated server output includes large e-commerce and chart bundles. Further optimization should split public storefront code from authenticated Money Center/Auren/chart dependencies and should be measured with real Core Web Vitals before changing the deployment architecture.

The HTTP smoke test did not observe the following response security headers on the root response: `Strict-Transport-Security`, `Content-Security-Policy`, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, and `Permissions-Policy`. This is a security hardening follow-up, not evidence that HTTPS or routing is broken.

## Repository and validation

The current branch is `main` and tracks `origin/main`. The targeted final validation passed as follows:

| Check                      | Result                                                    |
| -------------------------- | --------------------------------------------------------- |
| Targeted Prettier check    | Passed for changed source and audit Markdown files        |
| TypeScript `--noEmit`      | Passed                                                    |
| ESLint                     | Passed with 0 errors and 9 existing Fast Refresh warnings |
| Vitest                     | 12 files passed, 36 tests passed                          |
| Vite production build      | Passed                                                    |
| `git diff --check`         | Passed                                                    |
| GitHub `Validate AlexOS`   | Completed successfully for `c9e0452`                      |
| GitHub `Production Verify` | Completed successfully for `c9e0452`                      |

A repository-wide Prettier check still reports 16 unrelated legacy Markdown files. Those files were not reformatted because doing so would create a broad unrelated documentation diff. The changed files are formatted.

## Remaining actions required for full readiness

First, add `FIRECRAWL_API_KEY` directly in the production Worker as an encrypted secret, then wait for the resulting Worker version and run one bounded Auren refresh. The public ads-library card cannot become available without this value or an approved server-side bridge to the Firecrawl connector.

Second, open the authenticated Auren route after the next scheduled refresh and confirm that the Instagram card changes from unavailable to a fresh evidence snapshot. This could not be completed through the current browser session because `/auren` redirected to `/auth`.

Third, enable Supabase leaked-password protection and configure the missing security response headers at the Worker or deployment edge. Fourth, run a controlled checkout submission only after explicit approval, using clearly marked test data and a plan to void/refund the resulting order; this audit intentionally stopped before that irreversible production-side step.

Finally, rotate the previously exposed Meta token before relying on Ads Manager spend data, confirm Meta read permissions, and continue testing Money Center with mock or non-production fixtures rather than altering real account balances.

## Audit evidence files

The detailed live evidence is recorded in the companion files `audit-live-storefront-observations-2026-08-23.md`, `audit-live-catalogue-observations-2026-08-23.md`, `audit-live-catalogue-network-2026-08-23.md`, `audit-live-catalogue-anon-response-2026-08-23.md`, `audit-live-catalogue-recovery-2026-08-23.md`, `audit-live-cart-observations-2026-08-23.md`, and `audit-live-checkout-observations-2026-08-23.md`. The reusable operational procedure is documented in `/home/ubuntu/skills/alexos-visual-evidence-ops/SKILL.md`.
