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
