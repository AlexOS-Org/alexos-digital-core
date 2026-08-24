# Live Smoke Findings — 24 August 2026

## Observed

- `https://dailygear.co.ke` redirected to `/shop` and returned a rendered DailyGear storefront.
- `https://dailygear.co.ke/shop` rendered the DailyGear header, navigation, hero, support links, footer, and public checkout messaging.
- `https://www.dailygear.co.ke` returned HTTP 200 in a read-only HEAD request.
- The canonical YJ route `https://dailygear.co.ke/funnel/quality-waterproof-yj-children-school-bag-funnel` initially displayed a loading state, then rendered successfully after waiting.
- The live YJ funnel title is `YJ Children’s School Backpack | DailyGear Kenya | DailyGear`.
- The live funnel rendered the three selectable variants: `YJ Baby – Navy Blue with Pink Trim`, `YJ Baby – Red`, and `YJ Baby – Green`, each with quantity decrement/increment controls.
- The live funnel rendered the observed hero and feature images, colour-selection section, customer-detail form, and `Continue to secure checkout` CTA.
- The rendered copy states `KES 2,750 per bag`, describes the bag as water-resistant rather than guaranteed waterproof, and says verified customer feedback will be added after delivered orders are reviewed.
- The public HTTP response observed during this run returned HTTP 200 for both domains but did not expose the requested security headers in the response headers captured by `curl -I`. This is not a source-code claim; it is a live-response observation.

## Not performed

No real customer data, real payment, real order, or mutation was performed. Authenticated admin routes, Meta Test Events, Supabase authorization tests, Cloudflare Worker metadata, and Auren refresh remain unverified when provider connectors are unavailable.
