# Auren live evidence refresh audit — 2026-08-22

## Current connector evidence

- Meta Ads Manager connector is enabled. The connected ad-account read returned 20 selected accounts. Relevant DailyGear-labelled accounts include `act_753805746633479` (Daily Gear 2025, KES, UNSETTLED), `act_1180189530817052` (DAILY GEAR 25, KES, UNSETTLED), and `act_1894751687777822` (DailyGear 2025, KES, UNSETTLED). The account list also includes other KES and USD accounts; account-level analysis must not be aggregated across mixed currencies without explicit handling.
- Instagram connector is enabled and returned the connected Business account `@daily_gearz`, name `DailyGears`, 61 followers, 16 following, 93 posts, website `http://dailygear.co.ke`, and publishing limit usage 0/100. Profile-picture source URL was returned by the connector but is not copied into this note.
- Firecrawl connector is enabled for public read-only web search/scraping.
- Supabase connector is enabled.

## Current schedule evidence

There is one active recurring schedule titled `Saturday DailyGear refresh and expense audit`, timezone `Africa/Nairobi`, cron `0 21 * * 6`, with Instagram and Supabase connectors. It stages newly observed DailyGear evidence and Draft, zero-stock, availability-unconfirmed products; it does not publish products or mutate financial transactions. It also produces a read-only weekly expense audit. This schedule is not suitable for a 30-minute poll because every run starts a full agent task.

## Current Auren implementation evidence

- `src/routes/_authenticated/auren.tsx` fetches `getAurenAdvisory` on page load or manual Refresh and currently displays Money Center, CRM, goals, and DailyGear operational summaries.
- `src/lib/auren/advisor.server.ts` builds the current advisory from Supabase-owned records plus `getAurenPublicContext`. The external context is currently informational only and cannot contribute to revenue, stock, orders, financial totals, or forecasts.
- `src/lib/auren/public-context.ts` currently contains a static Firecrawl-reviewed registry. DailyGear is marked `verified_brand_context` using `https://dailygear.co.ke/`; Car-Bar Motion.ke and Novera are `source_missing` because no entity-verified first-party public source was found.
- The repository’s own audit report says current Meta syncing has a five-minute process-local cache and about one-minute client rechecking, but the webhook refresh is best-effort and not durable. The report recommends durable sync/event records, idempotency, retries, replay controls, and a queue or scheduled Worker before production activation.

## Guardrails for the requested refresh

- Meta Ads Manager metrics must use exact names and verified scope. Use `Reach` as a standalone metric and refer to audience units as `Accounts Center accounts`; use `Clicks (all)` or `Link clicks`, never an unqualified “clicks”. Do not fabricate values. If a range includes today, label the result partial.
- Public Facebook Ads Library and competitor-page evidence can support trend-watch context, but must not be treated as DailyGear revenue, stock, or demand proof.
- A 30-minute refresh should run as a durable backend job with bounded reads, deduplication, freshness timestamps, and an evidence table or cache; do not implement it as a Manus scheduled task. The existing weekly schedule should remain for its weekly audit unless the user explicitly asks to replace it.
- Any automatic product output must remain candidate/Draft, zero-stock, and availability-unconfirmed until an operator confirms product identity, supplier data, price, and stock.

## Sources

- Meta Ads Manager connector output, retrieved 2026-08-22: connected ad accounts and currencies/statuses.
- Instagram connector output, retrieved 2026-08-22: `@daily_gearz` profile and post counts.
- `docs/ALEXOS_COMPLETE_WORK_REPORT_2026-08-19.md`: current Meta cache, webhook, and durable-sync gap statements.
- `src/routes/_authenticated/auren.tsx`, `src/lib/auren/advisor.server.ts`, and `src/lib/auren/public-context.ts`: current Auren implementation.
- `automation-and-scheduling` guidance: high-frequency polling should use a durable backend job rather than full agent-task schedules.
- `meta-ads-analyzer` guidance: exact Meta metric terminology, scope, currency, date, and no-fabrication rules.

## Public-source baseline

A Firecrawl search on 2026-08-22 located the public Facebook Ads Library entry and a third-party creative-library result describing Kilimall as having 24 active ads and approximately 7 new creatives per week. That third-party description is discovery evidence only; it has not been promoted to verified Auren metrics. The official Ads Library result is a search entry, not a complete advertiser-level export. No verified follower count or ad start-date evidence for Jumia Kenya or Kilimall Kenya was established in this pass. Therefore the existing Competitor Intelligence UI is correctly labelled `Not verified` for the 2,500+ audience and 30+ day ad criteria.

The public search result sources were:

- https://www.facebook.com/ads/library/?active_status=all&ad_type=political_and_issue_ads&country=KE&media_type=all — official Ads Library discovery page.
- https://motionapp.com/library/kilimall-affordable-online-shopping-in-kenya — third-party creative-library description; not treated as a verified Meta metric source.
- https://www.facebook.com/jumiagroup/videos/jumia-advertising-services-helps-you-find-attract-and-engage-millions-of-consume/2697101640604233/ — Jumia advertising-service content; not treated as campaign performance evidence.

## Approved 30-minute refresh architecture

The owner approved the additive Cloudflare Worker plus Supabase evidence-snapshot approach. The production migration `auren_live_evidence_snapshots` was applied successfully to project `goafwbrayepaihxbqsse`. It creates owner-scoped timestamped snapshots and refresh-run provenance with RLS; these rows are advisory context only and cannot alter orders, catalogue publication, cash balances, or financial totals.

The Worker is configured with `0 3 * * *` for existing maintenance and `*/30 * * * *` for Auren evidence refresh. The refresh reads the existing allowlisted Meta Ads Manager adapter for DailyGear campaign insights, optionally reads Instagram Business media through the Meta Graph API, and optionally uses Firecrawl Search for public research. Public competitor observations remain low-confidence background context. Products are never auto-created or published from public research.

Required Worker-only configuration for full coverage:

- `META_ACCESS_TOKEN` with read permission for the DailyGear Meta Ads account.
- `META_PAGE_ID` or `INSTAGRAM_BUSINESS_ACCOUNT_ID` for connected Instagram discovery.
- `FIRECRAWL_API_KEY` for public Facebook Ads Library and competitor-page search. Firecrawl’s official API uses Bearer authentication and `/v2/search`.

Without the Instagram identifier or Firecrawl key, the refresh records an explicit `unavailable` snapshot rather than implying that the source was checked. The Auren page exposes freshness, status, confidence, and source links for the latest snapshots.
