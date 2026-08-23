# Live public catalogue observations

**Date:** 23 August 2026

The live route `https://dailygear.co.ke/shop/products` loaded successfully but displayed **0 items** and the message “No products match your filters.” The live public home page also showed an empty featured-products state.

The active production database snapshot contains an active product named `Quality Waterproof YJ Children School Bag` with stock quantity 42, price KES 2,750, cost price KES 1,650, and confirmed availability. However, opening its public detail route at `/shop/product/0e4b22cd-a2a8-4e5e-a1ca-1218df7de98b` returned **Product not found**.

This establishes a confirmed public catalogue mismatch: active catalogue data exists in Supabase, but the public product list and detail route do not expose it. This must be investigated in the public read/query path, storefront ownership filtering, and business/storefront linkage. No data mutation was performed during this check.
