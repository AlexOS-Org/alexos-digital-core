# Live anon catalogue response

Using the live app’s own publishable Supabase key inside the browser context, the exact public product request returned HTTP 200 with an empty JSON array (`[]`). The request targeted project `goafwbrayepaihxbqsse`, owner UUID `c8b05141-4253-4bb0-9ca7-8ea32658a02e`, `status=active`, and `deleted_at=is.null`.

This proves the public catalogue is not failing because of a frontend network error. The anon REST response is being filtered to zero rows. The production database-side predicate check showed the YJ product satisfies `dg_is_published_store`, has active status, confirmed availability, a category, and at least one verified evidence row. The remaining discrepancy is the difference between the database-side service-role check and the anon policy evaluation, likely caused by the evidence policy’s role/security-definer interaction or the published-store policy path under anon.

The app’s public publishable key prefix and length were inspected only in memory and were not written to this report.
