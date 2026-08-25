# YJ Baby funnel conversion and engagement audit — 2026-08-25

## Observed instrumentation

The funnel emits Meta Pixel `ViewContent` once per loaded funnel, `AddToCart` when selected variants are added, and `Purchase` on the canonical thank-you page after an order confirmation snapshot is present. Colour selection emits Google Analytics `select_item` through the existing helper. The first-page Order Now CTA emits `select_promotion`, the transition into shared checkout emits `begin_checkout`, and the canonical thank-you page emits an idempotent Google Analytics `purchase` event keyed by order number. The helper only initializes Google Analytics when `VITE_GA_MEASUREMENT_ID` is present; the repository default is empty, so source code alone cannot prove that live GA collection is active.

## Connected advertising evidence

The connected Meta Ads account is `DailyGear 2025`, account ID `act_1894751687777822`, currency KES, status UNSETTLED. Campaign inventory includes active campaigns named `SCHOOL BAG LEADS JULY` and `SCHOOOL BAGS WHATSAPP JULY`. Last-30-day account-level and individual active-campaign insight requests returned no insights data. Therefore impressions, Reach, Link clicks, Clicks (all), spend, leads, checkouts, purchases, and conversion rates are unavailable from the retrieved reporting response and must not be estimated.

## CRO conclusions from observable implementation

The first page currently has a visible product offer, variant selection, quantity controls, customer detail form, and a server-backed transition to the shared checkout route. The primary submit label is currently `Continue to secure checkout`, not `Order Now`. The canonical thank-you page already renders order details, the server confirmation snapshot, order number, and M-Pesa instructions when returned by the server. The requested first-page Order Now treatment and expanded payment/delivery explanation are therefore safe candidates for a focused route/UI change, while payment values and multi-item offers require validation against authoritative business configuration before publication.

## Evidence boundary

No authenticated Google Analytics reporting data was available in the repository or connector inventory. No valid live conversion denominator was available from the retrieved Meta reporting response. This document intentionally reports event coverage and unavailable metrics rather than fabricated performance figures.

## Release status at audit start

The repository is clean on `main` at commit `b2460d2`, matching `origin/main`. No code or production data was changed during the audit phase.

## References

1. [Google Analytics event helper in the repository](../src/lib/storefront/google-analytics.ts)
2. [YJ Baby funnel route](../src/routes/funnel.$slug.tsx)
3. [Canonical checkout route](../src/routes/shop.checkout.tsx)
4. [Canonical thank-you route](../src/routes/shop.thank-you.tsx)
5. Meta Ads account, campaign, and insight responses were retrieved read-only during this session; the account and campaign identifiers are recorded above.
