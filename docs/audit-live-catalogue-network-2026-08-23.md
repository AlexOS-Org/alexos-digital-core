# Live catalogue network evidence

On 23 August 2026, the live `/shop/products` page issued these relevant Supabase REST requests:

- `dg_storefronts?published=eq.true&order=created_at.asc&limit=1`
- `dg_brands?...&user_id=eq.c8b05141-4253-4bb0-9ca7-8ea32658a02e...`
- `dg_categories?...&user_id=eq.c8b05141-4253-4bb0-9ca7-8ea32658a02e...`
- `dg_products?...&user_id=eq.c8b05141-4253-4bb0-9ca7-8ea32658a02e...&status=eq.active&deleted_at=is.null...`

The public route correctly resolved the DailyGear owner UUID `c8b05141-4253-4bb0-9ca7-8ea32658a02e` and issued the expected product query, yet the UI rendered `0 items`. The database-side check shows the active YJ product satisfies the `dg_is_published_store` predicate and has verified evidence. This narrows the issue to the anon REST response/RLS behavior, query response shape, or a mismatch between the live Worker’s database/publishable key and the audited Supabase project. No customer or financial data was changed.
