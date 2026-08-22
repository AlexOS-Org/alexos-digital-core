# AlexOS Order Trash and Production Verification

**Date:** 22 August 2026  
**Repository:** `dylextrends/alexos-digital-core`  
**Commit:** [`352bc1e`](https://github.com/dylextrends/alexos-digital-core/commit/352bc1e)

## Completed implementation

AlexOS now has an owner-controlled order Trash workflow. The orders screen separates **Active orders** from **Trash**, shows the time an order entered Trash and its scheduled purge date, and offers Restore while the 14-day retention window remains open. The former direct “Remove test order” action was replaced with **Move to Trash**.

The implementation is additive and preserves existing order status and payment enums. `dg_orders.purge_after` records the retention deadline, while the existing `deleted_at` tombstone keeps active-order queries separate from the Trash view. Existing deleted rows are assigned a retention deadline from their original deletion timestamp rather than being recreated or fabricated.

Paid or partially paid orders cannot be moved directly to Trash. The interface continues to direct paid orders through the existing controlled void/refund flow first. This prevents customer receipts, income transactions, supplier payments, and order-linked costs from being silently removed. Unpaid and refunded orders can be moved to Trash. Restoring an order clears only the order tombstone and retention deadline; it does not create a second receipt or financial transaction.

## Scheduled cleanup

The existing Cloudflare Worker scheduled maintenance handler now calls `dg_purge_expired_order_trash()` alongside salary posting and abandoned-cart recovery. The purge function is restricted to the `service_role` and deletes only orders whose `purge_after` is at or before the current time. The Worker already has the daily `0 3 * * *` cron trigger in `wrangler.jsonc`, so no second Worker or ad hoc task was introduced.

The authenticated Move-to-Trash and Restore functions were hardened to `SECURITY INVOKER`, relying on the existing owner RLS policy. Production verification confirmed `prosecdef = false` for those two functions and `prosecdef = true` only for the service-role purge function.

## Verification evidence

| Area | Result | Evidence |
| --- | --- | --- |
| Local lint | Passed | Repository-local ESLint completed with no errors for the changed source files. |
| TypeScript | Passed | `tsc --noEmit` completed successfully. |
| Tests | Passed | 12 test files and 36 tests passed. |
| Production build | Passed | Vite production build completed successfully. |
| GitHub validation | Passed | [Validate AlexOS run](https://github.com/dylextrends/alexos-digital-core/actions/runs/32589783836) completed successfully for commit `352bc1e`. |
| GitHub production verification | Passed | [Production Verify run](https://github.com/dylextrends/alexos-digital-core/actions/runs/32589783838) completed successfully for commit `352bc1e`. |
| Supabase migrations | Applied | `dailygear_order_trash_retention` and `dailygear_order_trash_rpc_hardening` are the two newest production migration records. |
| Supabase order data | Preserved | Production still contains the two existing orders, both with `deleted_at = null` and `purge_after = null`; no test order was moved or deleted. |
| Supabase security | Hardened for new RPCs | Move and Restore are invoker-scoped; purge is service-role-only. Existing unrelated advisor findings remain. |
| Cloudflare Worker | Live | `alexos-business-os` is on Worker version 138, version ID `0fa6ee5f-bfcb-40a8-8351-60618a57c159`, with 100% deployment at 18:08 UTC. |
| Custom domains | Enabled | `dailygear.co.ke` and `www.dailygear.co.ke` are both enabled production domains attached to `alexos-business-os`. |
| Public storefront smoke test | Passed | Both custom domains returned HTTP 200. The page includes `width=device-width, initial-scale=1, viewport-fit=cover`. |

## Known caveats

The Supabase security advisor still reports pre-existing warnings for several older public `SECURITY DEFINER` functions, including payment confirmation, refund/void, fulfilment, salary posting, and the payment-status guard. These are not introduced by the Trash change and were not altered blindly because they participate in existing financial flows. They should be remediated in a separate, controlled security migration after confirming every caller and RLS path.

The repository build still reports the known large JavaScript chunk warning, including the orders and chart bundles. The build is successful; further bundle splitting should be handled separately and verified against the authenticated dashboard before release.

## Owner-facing use

Open **DailyGear → Orders** while signed in as the AlexOS owner. Use **Move to Trash** for an unpaid or refunded test order. Open **Trash** to see its retention deadline and restore it if needed. For a paid order, use **Void / refund** first, verify the financial reversal, and only then move it to Trash. The scheduled Worker cleanup runs daily and permanently removes only rows whose 14-day deadline has elapsed.
