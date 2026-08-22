# DailyGear social catalogue import and evidence report — 2026-08-22

## Scope

This task used the user-confirmed Facebook page `https://www.facebook.com/dailygearke` and the connected Instagram account `@daily_gearz`. The goal was to reconcile published social product evidence into DailyGear without duplicates, without importing supplements, without storing product media locally, and without allowing unverified records to appear in the public storefront.

## Source verification

The public Facebook page resolves to **DailyGears** and shows the DailyGear identity, the Discount Store category, phone `+254 722 658824`, email `dailygear.co.ke@gmail.com`, linked Instagram handle `daily_gearz`, and website `dailygear.co.ke`. Facebook exposed only a limited public post surface without an authenticated page session, so no Facebook product inventory was fabricated or imported. The connected Instagram account was the authoritative product-post source for this run.

The Instagram connector returned 93 published posts. After excluding supplements, non-product posts, and source IDs already reconciled in the existing catalogue, the evidence set contained 72 product-like post records. Deterministic reconciliation grouped those into 53 candidate product families, with 64 total social-sourced product rows now present in the production catalogue after idempotent matching with records already marked as Instagram-sourced.

## Production catalogue changes

New social records were inserted as **Draft** rows only. Every imported row has `stock_quantity = 0`, `availability_confirmed = false`, an external HTTPS image URL in the product media field when available, and source metadata containing the Instagram post ID, permalink, account, observed KES prices, and external source image URLs. No local product image files were uploaded.

The bounded post-import verification returned:

| Control | Verified result |
|---|---:|
| Instagram-sourced product rows | 51 newly staged rows in the audit scope; 64 total social-sourced rows including previously existing records |
| Draft rows | 51 of the newly staged rows |
| Zero-stock newly staged rows | 51 |
| Availability-unconfirmed newly staged rows | 51 |
| Active newly staged rows | 0 |
| Product names containing “suma” | 0 |
| Candidate Instagram evidence rows | 60 |
| Variant rows on social-sourced products | 64 |
| Zero-stock social-sourced variants | 64 |
| Unconfirmed social-sourced variant options | 64 |

The second bounded verification confirms the variant safety rule: every social-sourced variant is editable but has zero stock and remains unconfirmed. Existing publication gates still require owner verification before activation or checkout visibility.

## Images, avatars, colours, and audience

The product and variant image fields use the exact external media URLs captured from the source posts. Variant rows include an external `image_url` and an editable `options` object. Where a caption explicitly identified colours or audience, those values were staged as editable options; where the source did not identify a reliable variant, the system created one editable `Default` option rather than guessing. This preserves the exact-source-image requirement and avoids synthetic or misleading product renders. The product editor can now be used to replace a source image, add a gallery image, declare a colour or audience option, and set availability only after review.

## Prices and copy

A price was staged only when the post contained one unambiguous observed KES value after excluding percentage-discount noise and other numbers. Ambiguous or missing prices remain `null` or are retained only inside evidence metadata for owner review. Descriptions follow a compact AIDA structure and are solution-focused, but every imported record is explicitly labelled as draft evidence so marketing copy cannot be mistaken for verified product facts.

## Automatic refresh

An active daily evidence-refresh schedule was created for **03:00 Africa/Nairobi**. It uses the connected Instagram and Supabase integrations, fetches new posts since the last successful run, deduplicates by source ID and product slug, excludes supplements, records external images and observed prices as evidence, stages only Draft/candidate records, and produces trend-watch recommendations from observed recency, frequency, and engagement fields when available. It is explicitly prohibited from activating products, confirming availability, adding stock, deleting records, or overwriting existing prices.

The refresh schedule is intentionally connector-backed because the Worker does not have a separately verified Instagram Graph API credential. A Worker-native refresh can be added later once the correct API token and permissions are confirmed.

## Known limitations and next owner actions

The Facebook page is verified as the correct identity, but its full historical post inventory was not publicly available in the current session. The scheduled refresh therefore covers the connected Instagram account, while Facebook remains a manually reviewable source until an authenticated Facebook Page/Graph API read scope is available.

The imported records are not ready for publication automatically. For each draft that should go live, the owner should verify the external image, merge any product family that is visibly the same item, correct the category if needed, add supplier cost, choose or edit colour/audience variants, set stock, confirm availability, and then publish. Supplements were deliberately excluded from DailyGear and remain reserved for the Novera catalogue.

## Repeatable artefacts

The repository contains the raw social evidence archive, the review table, deterministic clustering script, draft-import SQL, variant-import SQL, and the Facebook identity notes. The SQL is idempotent and can be reviewed or rerun without creating duplicate slugs, source evidence, or variant SKUs.
