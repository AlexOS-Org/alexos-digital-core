# DailyGear / AlexOS SEO, Copy & Supabase Readiness Audit

**Audit date:** 2026-08-23  
**Repository:** `dylextrends/alexos-digital-core`  
**Audit baseline:** commit `c0fb4cc227a8b31bac5eed9a44456b93e6b64366`  
**Supabase project:** `Alex OS Professional` / `goafwbrayepaihxbqsse`  
**Scope:** repository structure, DailyGear storefront/catalogue copy, checkout/email copy, Supabase catalogue schema/data, security/performance advisories, and launch-readiness gaps.

## Executive conclusion

AlexOS has a substantial DailyGear commerce foundation, but the store is **not yet fully ready for unrestricted production launch**.

The largest content/commercial blocker is catalogue publication quality: the database contains **85 products, of which 75 are draft and only 8 are active**. The active products have strong basic SEO fields, but several descriptions are still evidence-oriented rather than conversion-oriented. The draft catalogue contains social-media-derived titles and generic placeholder copy that should not be exposed to customers until verified and rewritten.

The largest data-architecture/content-taxonomy blocker is duplicated top-level categories. The database contains **264 category rows**, including duplicate top-level category names/slugs such as Phones & Tablets, Laptops & Computers, Electronics, Bags & Luggage, Fashion & Clothing and others. This creates avoidable ambiguity for navigation, SEO landing pages and product assignment.

The storefront record is published and configured for KES, with a KES 150 flat shipping fee and Kenya-oriented contact details. Hero copy was previously incomplete; this audit added stronger conversion-oriented storefront messaging.

## Changes made safely

### Supabase content-only edits

Updated only customer-facing wording fields; no schema, RLS, payment logic, inventory logic or order status logic was changed.

Updated the 8 active products:

- Leather School Shoes for Boys & Girls
- Four-Colour Everyday Tote Bag
- YJ Children’s School Backpack
- Ladies Sandals — Sizes 37–43
- 3-Column Plastic Wardrobe
- OCHSTIN Chronograph Gents Watch #6063
- NAVIFORCE Ladies Watch #NF5060
- Berluti Footwear — Sizes 40–45

For each, the title, short description, SEO title, SEO description and image alt text were rewritten to be clearer, more search-aligned and more action-oriented while preserving the verified evidence boundaries.

The DailyGear storefront was also given:

- a clearer value proposition
- a stronger hero headline
- a useful hero subheadline
- a concise announcement bar

No product was promoted from draft to active by this audit.

## Repository copy changes

A dedicated branch was created:

`audit/seo-copywriting-2026-08-23`

The following were improved on that branch:

- `src/server/notifications/order-email.ts` — stronger order-confirmation language, clearer next step, improved payment CTA and support language.
- `src/server/notifications/cart-recovery-email.ts` — benefit-led abandoned-cart reminder with a clear recovery CTA and lower-pressure objection handling.
- `docs/DAILYGEAR_COPYWRITING_BIBLE.md` — internal SEO and conversion-copy standard covering AIDA, PAS, benefit/proof/action, objection handling, trust rules, product titles, descriptions, CTAs, email structure and Kenya-specific checkout copy.

## SEO assessment

Google's current ecommerce guidance recommends informative product descriptions that match shopper search language, descriptive titles/meta descriptions, strong ecommerce navigation, product structured data and Merchant Center product data where appropriate.

The current schema supports dedicated product SEO fields: `slug`, `short_description`, `seo_title`, `seo_description`, `seo_keywords`, and `image_alt_text`.

The next implementation step should ensure these fields are consistently populated for every product intended for indexing and that the rendered storefront exposes the corresponding content in crawlable HTML.

## Product catalogue findings

### Current state

- Total products: 85
- Non-deleted products: 83
- Draft: 75
- Active: 8
- Active products with short descriptions: 8
- Active products with SEO titles: 8
- Active products with SEO descriptions: 8
- Active products with image alt text: 8

### Critical content gap

The 75 draft products contain a mixture of:

- social-media captions used as product names
- unfinished promotional sentences
- generic evidence placeholders
- missing SEO fields
- missing short descriptions
- missing image alt text
- zero stock / unconfirmed availability
- products that require current supplier or owner verification

Examples of titles that should not be customer-facing in their current form include promotional fragments such as “@28% off”, “Invest in a solar power bank and say goodbye to outlet dependence”, “new arrival high quality bags”, and “Don’t let your child miss out on these exceptional school shoes”.

These are campaign/copy fragments, not stable product titles.

### Required rule

Draft catalogue records should remain non-public until each record passes:

1. product identity verification
2. current price verification
3. current stock/availability verification
4. variant verification
5. image verification
6. category assignment
7. product-title rewrite
8. short-description rewrite
9. SEO title/meta rewrite
10. alt-text rewrite

## Category findings

There are 264 category rows. Duplicate top-level categories were detected, including repeated names/slugs for major categories. The taxonomy should be consolidated to one canonical row per top-level category before serious SEO indexing.

Recommended canonical top-level taxonomy includes:

- Phones & Tablets
- Laptops & Computers
- Electronics
- TV, Audio & Entertainment
- Power & Energy
- Car Accessories
- Bags & Luggage
- Fashion & Clothing
- Beauty & Personal Care
- Home & Living
- Kitchen & Dining
- Health & Fitness
- Baby, Kids & Toys
- Office & Stationery
- Travel & Outdoor
- Smart Home & Security
- Tools & DIY
- Pet Supplies
- Gadgets & Accessories
- Deals & Featured

Subcategories should have one parent and one canonical slug. Do not create duplicate category pages merely to preserve duplicate database records.

## Storefront findings

Current storefront:

- published: yes
- currency: KES
- flat shipping fee: KES 150
- free-shipping threshold: KES 0
- support email configured
- support phone configured
- WhatsApp configured
- Meta Pixel ID field exists

The storefront now has stronger hero copy, but launch QA must still verify that the actual public page renders these fields and that the announcement does not promise a service condition that operations cannot fulfil.

## Checkout/content findings

The database supports Kenya-specific delivery fields including country, county, town, address details and delivery zone. This is appropriate for the intended Kenya checkout journey.

The content should consistently reinforce:

- guest checkout
- county selection
- town selection
- clear delivery details
- transparent shipping fee
- payment choice
- order confirmation
- post-order support

Avoid unnecessary account-creation language at checkout.

## Email findings

The repository already contains:

- order notification email
- abandoned-cart recovery email
- scheduled abandoned-cart processing

The email copy has been strengthened on the audit branch. However, the production email system still requires environment/configuration verification for:

- `RESEND_API_KEY`
- `DAILYGEAR_EMAIL_FROM`
- `DAILYGEAR_PUBLIC_URL`
- M-Pesa payment settings

The system should also be tested end-to-end for deliverability, correct sender domain authentication, customer email capture and recovery-link validity.

Recommended lifecycle email set for launch:

1. Order received
2. Payment instructions / payment received
3. Order confirmed
4. Order dispatched
5. Order delivered
6. Abandoned cart
7. Post-purchase review request
8. Cross-sell / repeat purchase
9. Customer support / issue resolution

Only the first and abandoned-cart flows were found directly in the current notification implementation during this audit.

## Supabase security findings

Supabase security advisories currently report:

- RLS enabled with no policies on `auren_evidence_refresh_runs`
- RLS enabled with no policies on `dg_cart_sessions`
- multiple `SECURITY DEFINER` DailyGear functions executable by authenticated users, including payment/order/fulfilment functions
- leaked-password protection disabled in Supabase Auth

These are not copy problems and must be treated as release blockers until intentionally reviewed.

Particularly sensitive functions include order payment confirmation, order fulfilment recording, refund/void payment handling and admin order update operations. Their authorization model must be verified before production exposure.

## Supabase performance findings

The performance advisor reports a large number of unindexed foreign keys, including DailyGear product, order, variant, stock, customer and fulfilment relationships.

It also reports:

- RLS init-plan issues caused by row-by-row `auth` evaluation
- multiple permissive policies on `dg_products` and `dg_product_variants`
- duplicate indexes on `dg_funnels`
- multiple unused indexes

These should be triaged by query frequency and workload rather than blindly removing indexes. Foreign-key indexes on high-volume order/product paths should receive priority.

## Production-readiness blockers

### P0 — must resolve before public launch

- Verify all 8 active products end-to-end on the public storefront.
- Keep 75 unverified draft products out of the public catalogue.
- Resolve duplicated canonical categories.
- Review and lock down the flagged SECURITY DEFINER functions.
- Add/fix RLS policies where required, especially cart sessions and evidence refresh data.
- Verify production email provider/domain configuration.
- Test guest checkout from product → cart → checkout → order → notification → fulfilment.
- Verify payment status cannot be forged through exposed RPC calls.
- Verify current price/stock/variant data at the final checkout step.

### P1 — high-value before scaling traffic

- Populate and validate SEO fields for every product intended for indexing.
- Add/verify Product, Offer, BreadcrumbList and Organization structured data.
- Ensure product/category links are crawlable through normal navigation.
- Consolidate duplicate/unused indexes after workload review.
- Add indexes for important unindexed foreign keys.
- Add the remaining customer lifecycle emails.
- Add real customer reviews and review moderation workflow.
- Add product recommendations/cross-sells tied to actual catalogue relationships.

### P2 — growth improvements

- Build category landing-page copy for the canonical taxonomy.
- Create buying guides and comparison content around real search intent.
- Build campaign-specific landing pages using the existing funnel system.
- Add structured promotional campaigns instead of embedding promotions into product titles.
- Connect analytics events to product view → add to cart → checkout start → purchase.

## Copy standard for future product imports

Every imported product should pass the DailyGear Copywriting Bible before publication. The system should automatically reject or flag:

- promotional-caption titles
- emoji-heavy titles
- missing product type
- missing SEO title
- missing SEO description
- missing alt text
- unsupported claims
- missing current availability confirmation
- missing variant data where variants are advertised

## Definition of “ready to use”

DailyGear should only be declared launch-ready when:

- the public catalogue contains only verified products
- every public product has complete conversion and SEO copy
- every category has a unique canonical URL
- checkout works without account creation
- Kenya county/town selection works
- shipping totals are correct
- payment flows are protected
- order notifications are delivered
- abandoned-cart recovery works
- RLS/security advisories are intentionally resolved
- critical order/product foreign keys are indexed
- structured data passes validation
- Lighthouse/mobile QA passes
- a real test order completes from storefront to fulfilment without manual database intervention
