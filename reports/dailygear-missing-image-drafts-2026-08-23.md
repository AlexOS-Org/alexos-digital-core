# DailyGear draft products missing images

> Read-only production audit. No product was published, edited, deleted, archived, or assigned an invented image URL.

**Source:** live Supabase catalogue query, filtered to `status = 'draft'`, non-deleted records, and an empty `images` array.

## Summary

| Measure | Count |
|---|---:|
| Draft products missing product images | 30 |
| Have a recorded price | 5 |
| Missing a recorded price | 25 |
| Have at least one variant | 6 |
| Have no variants | 23 |
| Require power-bank capacity/model review | 2 |
| Require marketing-title review | 2 |

## Product-family classification

| Product family | Count |
|---|---:|
| Handbags, travel bags and backpacks | 11 |
| Watches | 8 |
| Power banks | 5 |
| Automotive accessories | 3 |
| Baby and children | 1 |
| Home and office | 1 |
| Consumer electronics and security | 1 |

## Review queue

| Product | Family | Price | Variants | Required flags |
|---|---|---:|---:|---|
| 2-in-1 Travel Bag Sultan | Handbags, travel bags and backpacks | Not set | 0 | MISSING_PRODUCT_IMAGE; NO_VARIANTS; MISSING_PRICE |
| 2024 Ladies Backpack | Handbags, travel bags and backpacks | Not set | 0 | MISSING_PRODUCT_IMAGE; NO_VARIANTS; MISSING_PRICE |
| 3-in-1 Handbag 6-Piece Set | Handbags, travel bags and backpacks | Not set | 0 | MISSING_PRODUCT_IMAGE; NO_VARIANTS; MISSING_PRICE |
| Laptop Backpack | Handbags, travel bags and backpacks | Not set | 0 | MISSING_PRODUCT_IMAGE; NO_VARIANTS; MISSING_PRICE |
| Miyouqi Big Sized Quality Forevermore School Bag | Handbags, travel bags and backpacks | Not set | 0 | MISSING_PRODUCT_IMAGE; NO_VARIANTS; MISSING_PRICE |
| new arrival high quality bags | Handbags, travel bags and backpacks | Not set | 1 | MISSING_PRODUCT_IMAGE; MISSING_PRICE; MARKETING_STYLE_TITLE_REVIEW |
| Sultan School Backpack | Handbags, travel bags and backpacks | Not set | 0 | MISSING_PRODUCT_IMAGE; NO_VARIANTS; MISSING_PRICE |
| Top Bear Kids School Bag | Handbags, travel bags and backpacks | Not set | 0 | MISSING_PRODUCT_IMAGE; NO_VARIANTS; MISSING_PRICE |
| Travel Fitness Bag | Handbags, travel bags and backpacks | Not set | 0 | MISSING_PRODUCT_IMAGE; NO_VARIANTS; MISSING_PRICE |
| Waterproof Oxford Duffel Bag | Handbags, travel bags and backpacks | Not set | 0 | MISSING_PRODUCT_IMAGE; NO_VARIANTS; MISSING_PRICE |
| Women's Sling Bag | Handbags, travel bags and backpacks | Not set | 0 | MISSING_PRODUCT_IMAGE; NO_VARIANTS; MISSING_PRICE |
| COLMI P81 Smartwatch | Watches | Not set | 0 | MISSING_PRODUCT_IMAGE; NO_VARIANTS; MISSING_PRICE |
| COLMI V71 Men's Smartwatch | Watches | Not set | 0 | MISSING_PRODUCT_IMAGE; NO_VARIANTS; MISSING_PRICE |
| Curren Blanche Watch | Watches | Not set | 0 | MISSING_PRODUCT_IMAGE; NO_VARIANTS; MISSING_PRICE |
| HY01 2-in-1 Smartwatch | Watches | Not set | 0 | MISSING_PRODUCT_IMAGE; NO_VARIANTS; MISSING_PRICE |
| Megir Men's Silver Dial Leather Band Watch | Watches | Not set | 0 | MISSING_PRODUCT_IMAGE; NO_VARIANTS; MISSING_PRICE |
| Naviforce 9153 Men's Dual Display Quartz Digital Watch | Watches | Not set | 0 | MISSING_PRODUCT_IMAGE; NO_VARIANTS; MISSING_PRICE |
| NAVIFORCE Men’s Digital Display Watch | Watches | 3999 | 1 | MISSING_PRODUCT_IMAGE |
| Skmei Elegant Retro Women's Watch | Watches | Not set | 0 | MISSING_PRODUCT_IMAGE; NO_VARIANTS; MISSING_PRICE |
| 30,000mAh Solar Wireless Power Bank | Power banks | Not set | 0 | MISSING_PRODUCT_IMAGE; NO_VARIANTS; MISSING_PRICE |
| Excellent P88 30,000mAh Power Bank | Power banks | Not set | 0 | MISSING_PRODUCT_IMAGE; NO_VARIANTS; MISSING_PRICE |
| PZX V79 Power Bank | Power banks | Not set | 0 | MISSING_PRODUCT_IMAGE; NO_VARIANTS; MISSING_PRICE; CAPACITY_OR_MODEL_REVIEW |
| ROZAL Power Bank | Power banks | Not set | 0 | MISSING_PRODUCT_IMAGE; NO_VARIANTS; MISSING_PRICE; CAPACITY_OR_MODEL_REVIEW |
| Sivia Portable 20,000mAh Power Bank | Power banks | Not set | 0 | MISSING_PRODUCT_IMAGE; NO_VARIANTS; MISSING_PRICE |
| Adjustable Appliance Roller Trolley | Automotive accessories | 1999 | 2 | MISSING_PRODUCT_IMAGE |
| Cordless Digital Tyre Inflator | Automotive accessories | 4620 | 1 | MISSING_PRODUCT_IMAGE |
| Foldable Baby Potty Training Seat | Baby and children | 4150 | 1 | MISSING_PRODUCT_IMAGE |
| Laptop Stand | Home and office | Not set | 0 | MISSING_PRODUCT_IMAGE; NO_VARIANTS; MISSING_PRICE |
| Secure Your Space with the 360° Bulb Camera for just Ksh | Consumer electronics and security | 3500 | 1 | MISSING_PRODUCT_IMAGE; MARKETING_STYLE_TITLE_REVIEW |
| LDNIO C506Q Fast Car Charger 5W | Automotive accessories | Not set | 0 | MISSING_PRODUCT_IMAGE; NO_VARIANTS; MISSING_PRICE |

## Safe disposition

Keep all 30 products in `draft` status. The next review should confirm a permanent external image URL, exact parent-product identity, category and subcategory, variant attributes, supplier cost, selling price and availability. Products with no variants need either variant creation or explicit single-variant confirmation. Power banks require model and capacity confirmation before customer-facing copy is written. No image should be generated or assigned automatically from a product name alone.
