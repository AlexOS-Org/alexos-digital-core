# DailyGear Phase 2 — Premium Commerce, Public Pricing & Auren — 2026-09-01

## A. Starting point
- Branch: `arena/01a05a23-alexos-digital-core`
- Base HEAD: `cc32c02` (end of Phase 1)
- Working tree clean before Phase 2.

## B. What already existed before Phase 2
- Public shop/product/cart/checkout/thank-you routes.
- Admin DailyGear workspace (products, variants, inventory, orders, customers,
  funnels, evidence, reports).
- Product readiness engine + sales-ready/catalogue-ready distinction.
- Admin variant commercial price/cost editing.
- Server-side zero-price guest checkout guard.
- Auren product readiness signals.
- Public storefront immutability guard (public surfaces only).
- Existing YJ Baby assets and variant colour mapping.
- Funnel route and guest checkout RPC with server-authoritative pricing.

## C. Premium Product Function
Added a reusable, schema-free product capability:

- **Flag**: `attributes.premium.enabled` using the existing `attributes jsonb`.
  No new column, table, or migration required.
- **Public reads**: `src/lib/storefront/premium.ts` exposes
  `isPremiumProduct`, `getPremiumConfig`, `getPremiumVisualPlan`,
  `premiumVariantImage` (pure, tested).
- **Premium page**: `src/components/premium/PremiumProductDetail.tsx`, a
  reusable component (hero, gallery, variant selection, price/sale/stock,
  benefits, features, feature/lifestyle imagery, specifications, FAQ, trust).
  It is YJ-agnostic and reads owner-stored premium content.
- **Admin control**: product editor now has `Premium product ON/OFF`; on save it
  writes `attributes.premium = { enabled }` without touching price/stock.
- **Public product page** (`src/routes/shop.product.$id.tsx`, the single
  explicitly approved public file) now renders the premium experience when the
  flag is enabled and keeps the standard page otherwise.
- Guard updated with an explicit `approvedPublicPaths` allowlist that covers only
  this one approved file; all other `shop.*`, funnel, `components/storefront`,
  `styles.css` and `public/storefront` paths remain blocked.

## D. Visual work
- No new/hard-coded product asset was fabricated or created.
- Reused the existing YJ Baby asset set already committed under
  `public/assets/` and the existing `yj-colours` mapping.
- Premium visual architecture is data-driven from `attributes.premium`
  (`hero`, `images`, `featureImages`, `lifestyleImages`) and falls back to the
  product's stored image list when no premium visuals are configured.
- Variant imagery uses the variant's exact stored image first, then the known
  accurate colour card — never an invented image.

## E. Catalogue
No live database query was run against production, so **no real product counts
are reported**. The product catalogue numbers cannot be produced from this
checkout without a live data query, which was intentionally not executed.
The readiness engine provides per-product counts once data is loaded.

## F. Commerce flow
- Applicable flow path: `Product → Variant → Premium page → Add to cart →
  Checkout → Order → Inventory → Thank-you`.
- Cart/checkout/order/inventory code was **not rewritten**; the existing
  server-authoritative RPC remains the purchase path.
- The public product page now enforces **Price coming soon** and disables
  add-to-cart for `price <= 0`, preventing a zero-price line reaching the cart
  from the normal UI.
- The Phase 1 server guard still rejects any zero/non-positive authoritative
  price line before the RPC.
- The DB fallback (`dg_guard_positive_order_price`) is **proposed but not
  applied**.

## G. Auren
Extended `productReadinessSignals` with:
- SKU missing (fact)
- no primary image (fact)
- thin gallery (inference)
- moderate gallery depth (fact)
- premium-enabled but under-visualised (inference)
- low stock (fact)
- price missing (fact)
- sales-ready (recommendation)

Each insight now carries `evidenceLevel: fact | inference | recommendation`.
Auren does not mutate price, stock, products, orders, categories, checkout or
advertising.

## H. Database
- **No database change applied.**
- Added review-only additive migration:
  `supabase/migrations/20260901000000_dailygear_positive_order_price_guard.sql`
  (rejects zero/negative unit price only for `online_store`/`funnel` order
  lines). **NOT applied to production; `supabase db push` not run.**

## I. Tests
- `npm run verify` → **exit 0** (test, lint, typecheck, build, storefront guard)
- `npm test` → 26 files, **107 tests** passing (premium, product-options,
  Auren signal depth, guard-scope added).
- `typecheck` → pass
- `lint` → 0 errors (10 existing Fast Refresh warnings)
- `build` → pass (existing chunk-size warnings only)
- `git diff --check` → pass (reported separately)
- Storefront guard → `PASS: protected public storefront paths remain untouched`
  (1 approved public file change, all other public paths blocked).

## J. Git
- Branch: `arena/01a05a23-alexos-digital-core`
- Commits added in this phase (see below).
- Working tree state will be reported after commits.
- Push is **not permitted** until the GitHub App has `Workflows: read/write`.
  Feature-branch + PR only. No direct main push.

## K. Remaining blockers
### CODE BLOCKERS
- Premium config UI only edits the enable flag; owner keyed benefits/features/
  specs/FAQ/hero images still require either raw `attributes` editing or a
  future structured admin form.
- Funnel page does not yet specially render the premium page; it continues to
  use the existing funnel layout (intentional to avoid breaking URLs).

### DATABASE BLOCKERS
- The positive-price DB trigger is **not applied**; production schema remains
  unchanged. Approval + staging validation are required before it can be
  applied.

### PRODUCTION BLOCKERS
- No live Supabase/Cloudflare smoke test, order, payment, or inventory mutation
  was performed.

### HUMAN ACTIONS
- Grant the bot `Workflows: read & write` to unblock push/PR.
- Review the proposed positive-price migration.
- Decide whether to populate `attributes.premium` content for YJ Baby using
  existing verified assets (currently architecture supports it; data entry is
  an owner action).
