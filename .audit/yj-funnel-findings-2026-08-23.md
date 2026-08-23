# YJ funnel findings — 2026-08-23

Authoritative production Supabase project: `goafwbrayepaihxbqsse` (Alex OS Professional, eu-west-1).

Product: `YJ Children’s School Backpack`, id `0e4b22cd-a2a8-4e5e-a1ca-1218df7de98b`, slug `quality-waterproof-yj-children-school-bag`, status `active`, parent price KES 2,750, sale price null.

Published funnel: id `9c5486e8-177c-455f-b40e-c6098c1864bc`, slug `quality-waterproof-yj-children-school-bag-funnel`, status `published`.

Existing variants: Blue SKU `DG-SCHOOL-BACKPACK-BLUE-463216`, Pink SKU `DG-SCHOOL-BAG-PINK-453016`, Red SKU `DG-SCHOOL-BAG-RED-312016`; each had variant price KES 1,650, stock 14, availability_confirmed true, and a remote image URL.

Safe attempted update to add Green unavailable and clear prices was rejected by database function `dg_enforce_variant_publishability()` because a published product cannot contain an unconfirmed variant. The transaction rolled back.

A price-only update was then executed to set all three existing variant `price` and `sale_price` fields to NULL, so checkout inherits the authoritative parent price KES 2,750. Result should be verified from the saved MCP result.

User supplied only an opaque token beginning `IwY2xjawT36StwZG9m...`, not a complete URL. The requested reference page/ad cannot be opened until the full URL is provided. Do not fabricate exact copy from it.

Relevant source files: `src/routes/funnel.$slug.tsx`, `src/routes/_authenticated/e-commerce.funnels.tsx`, `src/lib/storefront/funnel.server.ts`, `src/routes/shop.checkout.tsx`.
