# Essential expenses, profit logic, and AlexOS UX review — 2026-08-22

## Scope and limitation

This is an evidence-based planning calculation, not licensed financial advice. The current Supabase connector returned `403 Forbidden` during this pass, so the finance totals below use the persisted bounded read-only extracts from the preceding audit. The model is therefore a **current planning baseline**, not a claim that the user's full historical spending has been captured.

## Essential monthly baseline

The persisted records contain four recurring personal obligations and six personal budget categories that can be combined without double-counting overlapping rent, WiFi, or water rows.

| Essential line | Monthly KES | Evidence basis |
|---|---:|---|
| House rent | 13,000 | Recurring bill; overrides the duplicate Rent budget |
| Home WiFi | 1,500 | Recurring bill; overrides the duplicate Internet/WiFi budget |
| Water | 260 | Recurring bill; use instead of the duplicate Water budget |
| Garbage | 250 | Recurring bill |
| Airtime | 1,500 | Personal budget |
| Electricity | 1,500 | Personal budget |
| Food | 5,000 | Personal budget |
| Kids | 10,000 | Personal budget; should later be split into school fees, children’s expenses, and shopping |
| Medical | 5,000 | Personal budget |
| Transport | 8,000 | Personal budget |
| **Modeled essential monthly baseline** | **46,010** | Sum after overlap removal |

The persisted posted-transaction sample contains only KES 340 of personal expenses (transport 100, airtime 40, food 100, electricity 100). That is insufficient to infer a true monthly average, so KES 46,010 is the best current **budget-and-recurring-obligation baseline**, not an exact observed-spend average.

## Emergency Fund target

Using the current modeled essential baseline:

| Reserve horizon | Target |
|---|---:|
| 3 months | KES 138,030 |
| 6 months | KES 276,060 |

The product should display this as a target range and allow the user to override each essential line. Predictable costs such as school fees should be handled through a separate sinking-fund budget, not silently mixed into the Emergency Fund target. The account created earlier is personal and currently has a zero balance.

## Tithe and net-profit review

The allocation panel previously used a Money Center transaction approximation. It has now been hardened to request the canonical DailyGear server calculation for `today` and use `financials.operatingProfit` when available. That canonical result includes recognized order revenue, order-item COGS, order-level purchase/delivery/advertising/other costs, posted business expenses, and available read-only Meta spend. It excludes cancelled/refunded orders from recognized revenue and prevents linked order-expense transactions from being counted again as general business expenses.

The panel still falls back to the business transaction ledger only when the canonical DailyGear call is unavailable. When Meta spend or COGS is missing, the panel surfaces a data-quality warning rather than presenting an authoritative tithe amount. The tithe suggestion is `max(0, net operating profit) × 10%`; confirmed personal salary received is handled separately as `salary received × 10%`. Approval is required before posting any transaction.

## Contact and brand UX changes

Added a shared verified-link registry for DailyGear:

- Instagram: `https://www.instagram.com/daily_gearz/`
- Facebook: `https://www.facebook.com/dailygear`
- WhatsApp: `https://wa.me/254722658824`
- Support phone: derived from storefront settings, with the known DailyGear fallback only when the storefront value is absent.

The public contact route now displays clickable phone, email, and WhatsApp rows plus real external social cards. The shared public footer displays the same social icons and links. The Instagram connector confirmed the connected profile `@daily_gearz`, profile name `DailyGears`, and website `http://dailygear.co.ke`; the Facebook result is based on the public branded page URL and should be manually confirmed before any campaign use.

## Themes, time, and weather

The dashboard already had a live time-aware greeting, atmosphere states, weather icons, geolocation fallback to Nairobi, sunrise/sunset, precipitation, wind, and Open-Meteo weather retrieval. The existing theme system already uses local 4K-ready mountain assets. Added an `Ocean Mountain` preset that reuses the existing mountain assets with the ocean token palette, avoiding duplicate media storage. No hardcoded business colour values were introduced for the new preset.

## Calendar and avatars

The `/calendar` route is currently a local-only `ModuleWorkbench`; it is not connected to Gmail or Google Calendar. Gmail is enabled, but Google Calendar is disabled in the current cached connector configuration. Real calendar synchronization should not be simulated from email search. It requires enabling the Google Calendar connector or an explicitly approved alternative, followed by scoped read-only calendar access.

Business records currently expose names and finance scope but do not provide a complete reusable avatar/logo registry for every business. DailyGear has a storefront logo and the connected Instagram profile image. Novera and CarBarMotion require confirmed logo/avatar sources before applying identity imagery everywhere. Do not copy private Gmail avatar data into public storefront surfaces.

## Validation

- Direct TypeScript validation: passed after correcting the server-function request envelope.
- Direct Vite production build: passed.
- Supabase mutation during this pass: none.
- External calendar connection: not performed because Google Calendar is disabled.
- External notifications or money movement: not performed.

## Catalogue, image, copy, and security follow-up — 2026-08-22

The current source does not contain creative-level image URLs in the persisted Meta campaign evidence, so exact image matching cannot be truthfully completed automatically from campaign names alone. To support a safe workflow, the admin Product form now accepts one or more external HTTPS image URLs, renders lazy previews, stores only URL strings in the existing `images` field, and blocks active publication when an image URL is missing or invalid. The admin product list now shows a thumbnail or a visible `No image` state for both draft and active products.

Public catalogue security already enforces the desired boundary through existing RLS and server-side publication gates: anonymous readers can see only active products from a published storefront, undeleted variants, confirmed availability, and an active/confirmed parent product. Admin owners retain visibility of draft and unavailable records through owner-only policies. The storefront product route already hides or disables unavailable variants while the admin retains them. No new table or storage bucket was created.

The form already supports SEO title, description, keywords, image alt text, category, brand, supplier, cost, selling price, and source evidence. The publication trigger requires confirmed availability, category, evidence, slug, SEO title, SEO description, image alt text, and at least one image URL. This is safer than bulk-generating copy that could make unsupported product claims. A full product-by-product SEO rewrite still requires verified product specifications, brand/model, dimensions, functions, warranty, and matching images.

The imported Meta draft CSV contains 24 draft rows, not 25; its 24 rows remain unpublished. The YJ blue and pink children’s backpack records should be consolidated only after the exact product identity and source images are confirmed, because merging records without matching dimensions, SKU, image, or colour evidence could damage order history. The correct target is one parent product with colour variants and independent availability flags, with unavailable variants hidden from storefront queries but visible to the owner.

Security scan results: no secret-pattern match was found in the scanned source/public paths; the product RLS/publication policies are present; the production dependency audit reported no known high-severity vulnerabilities. The connector refresh for Google Calendar returned 403, so real calendar synchronization remains unconfigured. Gmail is enabled, but Gmail is not a calendar source and should not be scraped as a substitute for a calendar feed.
