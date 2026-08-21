# DailyGear Funnels, Taxonomy and Kenya Checkout Audit

## Verified repository state

- Funnels are row-driven by `dg_funnels` and `dg_funnel_steps`; the existing admin page has landing copy fields but no records can appear when the tables are empty.
- Production currently has zero `dg_funnels` rows and zero `dg_funnel_steps` rows, so no prior landing experience can be listed or edited from the workspace.
- The current funnel editor synthesizes a fixed sequence on save: landing, checkout, optional order bump, optional upsell, optional downsell, thank-you. It does not expose step order or per-step enabled state as an editable flow.
- Public `/funnel/$slug` renders landing content from the landing step and hands off to the existing `/shop/checkout`; `shop.thank-you` handles explicit upsell/downsell continuation through that same checkout.

## Verified production data state

| Relation              | Non-deleted rows |
| --------------------- | ---------------: |
| `dg_categories`       |                0 |
| `dg_products`         |               10 |
| `dg_product_variants` |               49 |
| `dg_customers`        |                0 |
| `dg_orders`           |                0 |

The existing default-category migration contains an older 11-category taxonomy and a seed trigger, but production currently has no categories. The attached requirements replace that older customer-facing taxonomy with the requested 20-category DailyGear structure. No products, orders or customers will be fabricated.

## Existing schema gaps

- `dg_categories` already supports `slug`, `parent_id`, `description` and `sort_order`, so the requested hierarchy can reuse the existing category table.
- `dg_products` has one canonical `category_id`; the implementation must not duplicate products. Secondary merchandising exposure should not create another product record.
- `dg_customers` currently has `address`, `city` and `country`, but no dedicated county/town fields.
- `dg_orders` currently has only the flattened `shipping_address`; it needs additive historical location snapshot fields so county/town changes cannot rewrite past orders.
- The single guest-order RPC is the authoritative order path and currently accepts `p_address` and `p_city`; it must be extended with Kenya location inputs while preserving one transaction and one checkout implementation.
- The admin checkout already captures county/town in local state but flattens them into `shipping_address`, which confirms the need for canonical persistence rather than another checkout.

## Kenya location evidence

- The Kenya county boundary dataset published through Esri Eastern Africa Mapping and Application Portal describes the 47 legally recognized counties.
- GeoNames publishes a Kenya country dump and `admin1CodesASCII.txt`; its Kenya administrative codes provide a public place-name source for county-dependent towns. This is suitable as a reviewed application data source, not as an instruction source.
- No delivery fee or delivery-zone rules are currently verified. The checkout will therefore collect country, county, town and delivery details without inventing fees.

## Implementation constraints

- Keep the existing React, TanStack Router, Supabase and Cloudflare architecture.
- Do not add WooCommerce, a second checkout, a second order RPC, or a duplicate category/product system.
- Keep draft products private and preserve the existing availability and 15-unit publication gates.
- Seed taxonomy only; do not seed products, customers or orders.
- Keep public funnel publication gated by a published storefront, published funnel, active verified product and available stock.

## Implemented in this change

- Added an honest product-based landing-template inventory to the Funnels workspace. It is derived from the existing catalogue and does not pretend that a saved funnel exists until the user saves one.
- Added native step-order controls for the optional post-purchase offer sequence. Landing, checkout and thank-you remain canonical runtime steps; order bumps remain inside the shared checkout; upsells and downsells can be reordered and are handled explicitly through the existing thank-you-to-checkout handoff.
- Applied the requested 20 top-level DailyGear categories and 112 useful subcategories using the existing `dg_categories` hierarchy. No products, customers or orders were created.
- Added county-dependent Kenya delivery selection with a compact 47-county dataset and reviewed town candidates. Added historical customer fields (`county`, `town`, `delivery_details`) and order snapshot fields (`shipping_country`, `shipping_county`, `shipping_town`, `shipping_address_details`, `shipping_zone`).
- Extended the existing atomic `dg_create_guest_order` RPC rather than creating another checkout or webhook. It now requires Kenya, county and town and retains the service-role-only execution boundary.
- Added public `/shop/category/$slug` and `/shop/category/$slug/$subcategory` routes. Navigation now uses category slugs and the public catalogue filters active products through the existing category relationships.

## Verification note

The initial category count query used a mistyped owner UUID suffix and returned zero; a direct production row audit confirmed the taxonomy rows were seeded for the correct owner. The verification query must use owner UUID `c8b05141-4253-4bb0-9ca7-8ea32658a02e`.

The final checkout pass adds searchable county and town pickers using the existing command/popover UI primitives. County changes clear the town selection, and the town picker stays disabled until a county is chosen. This keeps the mobile flow concise while preventing unrelated town choices.

## Final deployment verification

The repository is clean at `ff0f712` on `main` and `origin/main`. Local verification passed with 20 tests across 6 test files, `npx tsc --noEmit`, lint with the existing 9 Fast Refresh warnings and zero errors, `npm run build`, and `git diff --check`.

Cloudflare Workers Build `f422d35a-0380-44f3-9400-2359b6c67297` completed successfully for commit `ff0f71231534c19182ebd71f7f055ecb0b0ddfdb` on the canonical `alexos-business-os` script. The live `/e-commerce/funnels` page was verified on `https://dailygear.co.ke/e-commerce/funnels` and shows the catalogue landing-template inventory, landing-copy editor and native journey flow controls.

The live public category route also resolves on the Worker. It currently shows the honest unavailable state because `dg_storefronts` still has no published storefront; this is a business configuration prerequisite, not a route or build failure. The same publication gate protects public funnels until a storefront is published.

## References

[1] [Esri Eastern Africa Mapping and Application Portal — Kenya county dataset](https://hub.arcgis.com/maps/f89c5dc641404cff9e1ac86b782e8e50)

[2] [GeoNames — Kenya country dump](https://download.geonames.org/export/dump/KE.zip)

[3] [GeoNames — administrative codes](https://download.geonames.org/export/dump/admin1CodesASCII.zip)

## Earlier re-audit against the attached prompt

At the time of the earlier re-audit, the production owner scope contained 0 published storefront rows, 0 saved native funnels, 0 funnel-step rows, 10 products, 49 variants, 0 customers and 0 orders. The taxonomy contained 132 non-deleted rows, corresponding to 20 top-level categories plus 112 subcategories. The category-assignment gap identified in that audit has since been remediated conservatively from matched first-party evidence; no product, customer or order was fabricated.

The current 49 variants have stock quantity 15 for the reviewed size/color variants and each audited variant has an image URL. The 10 product records each have one primary product image. The two watch records have no variant rows, so colour names remain a business confirmation item rather than something to invent. The attached prompt’s 15-unit publication rule is preserved; only the verified category assignments were changed; stock, prices, variants, evidence status and publication states were not changed.

## Requirement re-audit result

The repository audit found that `main` already contains the category routes, Kenya-first checkout fields, canonical 20-category taxonomy seed, native Funnel template inventory and editable funnel flow. The material gaps were product category assignment and readiness enforcement: the editor and public/runtime paths did not consistently require a canonical category plus verified evidence.

The production category-assignment migration has now assigned the 10 existing matched DailyGear products to canonical subcategories without creating product duplicates: Wardrobe → Home & Living / Home Organization; Berluti Footwear, Boys Leather School Shoes and Girls Leather School Shoes → Fashion & Clothing / Shoes; the two children bags and Tote Bag → Bags & Luggage / Backpacks or Handbags; Ladies Sandals → Fashion & Clothing / Sandals; and both watch records → Fashion & Clothing / Watches. All 10 remain backed by one matched Instagram evidence record, but none is marked `verified`; the new gate therefore keeps them private until the source records are verified by the owner.

## Live smoke test for commit 08d0e1a

The live `https://dailygear.co.ke/e-commerce/funnels` route loads the deployed Funnels workspace, shows all 10 catalogue landing templates, exposes the landing-copy editor, and displays the native journey flow controls. The live `https://dailygear.co.ke/shop/category/bags-luggage/backpacks` route matches the new nested category route and correctly shows the intentional unavailable state because no published `dg_storefronts` row exists; this is a production configuration gate rather than a route or build failure.

## Storefront visibility recovery

The production visibility audit found one canonical published DailyGear storefront, 132 categories, 10 catalogue products, eight products eligible under the verified-evidence gate, two remaining matched evidence records, zero customers and zero orders. The connected first-party Instagram account is `@daily_gearz`; its current posts exactly match eight product identities and prices. OCHSTIN remains matched pending confirmed colour names, while NAVIFORCE remains matched because the current Instagram post shows KES 3,450 and the current catalogue record is KES 3,950.

The canonical storefront row was published with the confirmed DailyGear identity, KES currency, zero unconfirmed shipping fees and blank support contacts left editable in Settings. The live `/shop/products?sort=price-desc` route now renders 10 product cards with images, prices and detail links, plus the public category rail for Bags & Luggage, Fashion & Clothing and Home & Living. The previous empty-shell state is resolved in production.

## Post-deployment smoke test

After Cloudflare Build `0a8869d0-1b32-4ea9-ab46-fa61e1694fb1` completed successfully for commit `5fd3bf6`, the live `/shop/products?sort=price-desc` route was reloaded. It rendered the ten catalogue product cards, product images, prices and detail links, along with Browse all, Bags & Luggage, Fashion & Clothing and Home & Living navigation. The live Bags & Luggage route also rendered three products and its subcategory navigation. The empty-shell regression is therefore resolved in the deployed production path.

The deployed authenticated `/e-commerce/settings` route now shows the canonical DailyGear storefront record as Published, with `dailygear` slug, KES currency and editable support, shipping and publication controls. This gives the owner a real in-app path to maintain the storefront configuration instead of relying on an unavailable settings flow.
