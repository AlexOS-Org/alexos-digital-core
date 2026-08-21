# DailyGear Funnels, Taxonomy and Kenya Checkout Audit

## Verified repository state

- Funnels are row-driven by `dg_funnels` and `dg_funnel_steps`; the existing admin page has landing copy fields but no records can appear when the tables are empty.
- Production currently has zero `dg_funnels` rows and zero `dg_funnel_steps` rows, so no prior landing experience can be listed or edited from the workspace.
- The current funnel editor synthesizes a fixed sequence on save: landing, checkout, optional order bump, optional upsell, optional downsell, thank-you. It does not expose step order or per-step enabled state as an editable flow.
- Public `/funnel/$slug` renders landing content from the landing step and hands off to the existing `/shop/checkout`; `shop.thank-you` handles explicit upsell/downsell continuation through that same checkout.

## Verified production data state

| Relation | Non-deleted rows |
|---|---:|
| `dg_categories` | 0 |
| `dg_products` | 10 |
| `dg_product_variants` | 49 |
| `dg_customers` | 0 |
| `dg_orders` | 0 |

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
