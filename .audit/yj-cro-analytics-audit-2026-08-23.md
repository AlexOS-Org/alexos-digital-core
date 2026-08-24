# YJ Baby Funnel CRO and Analytics Audit

## Scope

Reviewed the live YJ Baby funnel checkout card, customer-feedback block, colour selector, mobile hierarchy, and Google Analytics colour-selection path.

## Findings

The page has a clear parent problem-solution headline and a visible YJ price of KES 2,750. The checkout card exposes the three current customer-facing variants—Navy Blue with Pink Trim, Red, and Green—with thumbnail controls and quantity increment/decrement actions. The first-page form contains first name, phone, email, address, county, town/area, and delivery instructions with browser autofill attributes.

The main conversion weakness is that the right-hand purchase column is narrow on desktop. The customer-feedback block is honest but currently a review-pending placeholder because no verified YJ customer-review records were found. It should not be replaced with invented testimonials. The price and selected-variant summary are visible, but the CTA appears after several fields; a tighter reassurance line immediately above the CTA would reduce uncertainty.

The page uses a water-resistant claim rather than a guaranteed-waterproof claim. Product facts are limited to the supplied information: nylon exterior, pockets, padded straps/back panel, and visible storage areas.

## Analytics

The live page currently has no Google Analytics measurement script, no `window.gtag`, and an empty `dataLayer`. The colour-selection event hook exists in source as a lazy `select_item` event, but it cannot fire in production until `VITE_GA_MEASUREMENT_ID` is configured.

## Visual generation

Generation of new mixed-colour child lifestyle images was attempted after the requested quota reset, but the service still returned the daily free-plan limit (20/20). No inaccurate substitute was published. The existing live hero remains the exact supplied Red reference, and the exact Teal/Green and Navy Blue with Pink Trim references remain mapped to the live selector/gallery.

## Recommended next actions

1. Configure a real GA4 measurement ID and verify a `select_item` event in DebugView.
2. Collect and approve genuine YJ customer reviews before publishing testimonials.
3. Generate the mixed-colour child lifestyle hero after the image quota becomes available.
4. Widen the desktop purchase column or move the review/reassurance content to a full-width section above checkout.

Audit date: 2026-08-23.
Author: Manus AI.
