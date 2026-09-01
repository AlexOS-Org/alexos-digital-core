# DailyGear Full-Functionality Audit — 2026-09-01

Read-only audit. No source, schema, migration, or storefront file was modified.
Baseline: HEAD `376aeb3` on `arena/01a05a23-alexos-digital-core`, 2 commits ahead
of `origin/main` (`0c85a31`). Working tree clean at audit start and end.

---

## A. What DailyGear already has (evidence)

### Storefront / public routes (read-only)
- Public shop exists: `/shop`, `/shop/products`, `/shop/product/:id`,
  `/shop/category/:slug`, `/shop/cart`, `/shop/checkout`, `/shop/thank-you`,
  `/shop/track`, `/shop/about`, `/shop/contact`, `/shop/faq`,
  `/shop/policies/:slug`.
- Funnel route exists: `/funnel/$slug`.
- Public storefront components exist under `src/components/storefront/`
  (ProductCard, ResponsiveProductImage, headers/footers, visual grid, etc.).
- Public reads use `src/lib/storefront/api.ts` with the anon/publishable key;
  admin/orders/customers are not selected there.

### Admin / commerce workspace (read-only)
- `/e-commerce` routes exist: products, inventory, orders, customers, funnels,
  evidence, reports, marketing, ads, competitors, landing pages, market,
  checkout, thank-you, settings, store.
- `src/components/dailygear/ProductFormDialog.tsx` is the product editor.
- `src/lib/dailygear/api.ts` provides a generic auth-scoped CRUD layer for
  `dg_products`, variants, categories, brands, suppliers, warehouses, customers,
  orders, order items, events, stock movements, evidence, funnels, steps.

### Database / contracts (read-only)
- `dg_products`: `status dg_product_status` (`draft/active/archived/out_of_stock`),
  `price numeric default 0`, `sale_price`, `cost_price`, `currency default KES`,
  `stock_quantity`, `low_stock_threshold`, `images text[]`, `attributes jsonb`,
  `seo_title`, `seo_description`, `seo_keywords text[]`,
  `availability_confirmed boolean default false`, `image_alt_text`.
- `dg_product_variants`: exact same commercial shape + `options jsonb`, `color`,
  `image_url`, `sort_order`, `availability_confirmed`.
- `dg_storefronts`, `dg_categories`, `dg_brands`, `dg_suppliers`,
  `dg_warehouses`, `dg_customers`, `dg_orders`, `dg_order_items`,
  `dg_order_events`, `dg_stock_movements`, `dg_product_evidence`, `dg_funnels`,
  `dg_funnel_steps`, `dg_order_attribution`.
- Guest order is an atomic service-role RPC `dg_create_guest_order`; canonical
  version is `20260821120001_dailygear_kenya_checkout_rpc.sql` (later amended by
  `20260822110100_dailygear_owner_controlled_checkout.sql` and
  `20260822230001_yj_school_bag_safe_image_copy_correction.sql`).

### Current published/visible semantics
- "Published" is not a separate status. A product is publicly visible and
  orderable when `status = active` AND `availability_confirmed = true` AND
  `deleted_at is null` (RLS/public catalogue gates also require a published
  storefront). `draft/archived/out_of_stock` are not publicly visible/orderable.
- Publication gates (triggers) already require: active + availability_confirmed
  + category + `seo_title` + `seo_description`. These live in migrations and
  therefore cannot be changed without a new migration.

### Ordering / inventory (read-only)
- Server recomputes price/stock from DB; the client never sends a money amount
  for order lines. Unit price = variant price ?? product price, then sale price
  if lower and > 0. Unit cost variant-cost ?? product-cost.
- Stock decremented atomically with `stock_quantity >= quantity`; stock movement
  rows are written; `dg_products_stock_non_negative` constraint exists.
- Funnel offer items must resolve to a configured funnel step or the order is
  rejected. Kenya counties/towns are validated client + server.

### Existing Auren / intelligence (read-only)
- Auren is infrastructure, not a chatbot. `src/lib/auren/*` implements advisor,
  decision-system, public-context. `src/lib/dailygear/intelligence.ts` is the
  DailyGear first-party signal registry (market/competitor/marketing/landing/
  advertising) with fact-based signals and explicit `enabled: false` providers.
- `src/lib/auren/advisor.server.ts` comments/contracts keep human approval for
  consequential actions. No pricing/publishing/spend mutation found.

### Tests (read-only)
- DailyGear/storefront tests: `src/lib/dailygear/*.test.ts`,
  `src/lib/storefront/*.test.ts` (funnel, funnel-copy, kenya-locations,
  recovery-offer, yj-colours), server notification tests.
- CI gate: `src/test/ci-quality-gate.test.ts` now requires `npm run verify`
  (test, lint, typecheck, build, storefront immutability guard).

---

## B. Confirmed real gaps (from evidence, not speculation)

1. **Zero-price is currently sellable.** The RPC does not check `price > 0`
   before placing an order. A product with `active + availability_confirmed`
   and `price = 0` can create a `new` order with `total = 0 + shipping`.
   There is no `sales_ready`/`catalogue_published` distinction and no server
   zero-price rejection. Confirmed in
   `20260821120001_dailygear_kenya_checkout_rpc.sql` (v_unit_price path) and
   `src/lib/storefront/checkout.server.ts`.
2. **Readiness ignores price/visual/SEO/checkout.** `getProductReadiness`
   (src/lib/dailygear/types.ts) only checks status/availability/category/
   evidence count. It can return `readyToPublish = true` for a KES 0 product; it
   has no price, primary-image, gallery, SEO, or funnel check. Admin UI shows
   "Ready" from that incomplete signal.
3. **No reusable premium product presentation.** There is no premium flag on
   `dg_products` and no reusable premium ProductDetail variant. The current
   product page is a single non-premium renderer. The task's "Premium Product
   Function" would be net-new, not an existing structure.
4. **Variant editor lacks commercial fields.** `ProductFormDialog.tsx`
   `VariantEditor` edits color, audience/sex, image URL, SKU, stock,
   availability only. It does not expose variant price, sale price, cost price,
   or size. Product editor exposes price/sale/cost/currency/stock/SEO/image
   (currency is not in the initial form shown in the snippet or validated).
5. **Stale client price risk is partially mitigated but not eliminated.**
   Order RPC re-derives price server-side (good), but the public cart stores
   price locally and the storefront reads may be stale; no cart-to-server price
   reconciliation/refresh exists.
6. **Publisher/readiness warning UX is thin.** `e-commerce.products.tsx` has
   readiness label + evidence count, but no price-required warning, no
   per-variant readiness, no catalogue-vs-sales-ready wording, no "price required
   before sale" admin block.

---

## C. The blocking conflict (must be resolved before any code)

The immutability guard
`scripts/assert-public-storefront-untouched.mjs` fails any change under:
`src/routes/shop.*`, `src/routes/funnel.$slug.tsx`,
`src/components/storefront/`, `src/styles.css`, `src/lib/dailygear/`,
`public/storefront/`.

This audit task's core requirements require changing those exact paths:
- Zero-price protection → `src/lib/storefront/*`, `shop.*`, possibly a Supabase
  migration (RPC).
- Editable/commercial editor + readiness → `src/lib/dailygear/*` (protected),
  `e-commerce.*` (not protected), `ProductFormDialog` (not protected).
- Premium product presentation + product-price/edit/stale-price behavior →
  `src/routes/shop.product.$id.tsx`, `src/components/storefront/*` (protected).
- Sales-ready vs catalogue-published distinction (if persisted) → would likely
  need a migration (not allowed without approval) or `attributes jsonb`.

So **the requested scope cannot be implemented while the current
public-storefront immutability guard stays intact.** This is exactly the
financial/storefront conflict the governing protocol says to escalate.

---

## D. Options (pending human decision)

1. **Narrow to admin-only, no storefront/migration**: implement product
   readiness engine (price/image/SEO/checkout checks), variant commercial
   fields, premium flag in `attributes jsonb`, and Auren readiness signals —
   all in `src/lib/dailygear/*` (requires re-scoping guard) and `e-commerce/*`.
   Storefront behavior untouched. Lowest financial/storefront risk, but does not
   satisfy the task's full storefront/premium/zero-price goals.
2. **Approved expanded scope (safe order)**: allow changes to `src/lib/dailygear`
   and `src/lib/storefront`, update the guard's protected list explicitly, but
   do **not** change public visual/routes or add a migration until separately
   approved. Implement zero-price server-side rejection via a new additive
   migration (human-approved) or fail-closed in `checkout.server.ts`.
3. **Full task as written**: also change `shop.*`, `storefront` components,
   product page, premium presentation, and add migrations. Requires explicit
   approval to lift all storefront/migration protections and a reviewed
   migration plan.

---

## E. Minimum-safe recommended next step

- Do **not** touch public sellable behavior yet.
- Add a failing-first test for the readiness engine and the zero-price rule.
- Implement readiness + variant commercial fields + Auren product-readiness
  signals in the admin layer only.
- Then submit a separate proposal for the zero-price server guard and premium
  presentation, including the exact migration/guard changes for review.

This is the smallest safe path that delivers real commercial controls while
keeping the public storefront frozen until the human explicitly lifts it.
