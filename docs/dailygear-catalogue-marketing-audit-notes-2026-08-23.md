# DailyGear Catalogue and Marketing Audit Notes

## Verified production baseline

Supabase project: `goafwbrayepaihxbqsse`. The non-deleted catalogue contains 83 products, 8 active products, 30 products without parent images, 0 products with price exactly zero, 114 non-deleted variants, 0 variants without an image URL, 64 variants without confirmed availability, 72 evidence rows, 1 funnel, and 3 funnel steps. The current funnel has enabled landing, checkout, and thank-you steps but the step records are not directly product-linked.

Exact-match duplicate checks found no shared external image URL and no duplicate SKU. One normalized-name candidate exists: `30000mholarirelessowerank`, product IDs `3827cadc-78e0-40f3-bd86-7f735ff0044f` and `0292894f-ff02-43f5-a109-b227afdc1195`. This is only a candidate; no merge is safe without confirming product identity, specifications, price, and image identity.

Recent stock evidence includes two purchase movements of quantity 10 for product `f4bb6d69-1aa5-4982-978b-0d29f8f86135`, each with unit cost 0, which requires review before claiming accurate inventory or cost. Two sale movements exist for prior orders, also with unit cost 0.

## Connector state

Enabled connectors include Meta Ads Manager for `onkwani@outlook.com`, Instagram for `@daily_gearz`, Gmail for `dailygear.co.ke@gmail.com`, and Firecrawl. Firecrawl connector-scoped read-only search succeeded, but its underlying API key is not exposed for Cloudflare secret transfer. `FIRECRAWL_API_KEY` remains a Worker-side prerequisite.

## User-supplied visual requirements

The supplied screenshots show the desired polished desktop data presentation: compact but spacious dashboard cards, clear section titles, charts/graphs where data exists, readable status chips, a catalogue readiness summary, inventory KPI cards, market/competitor intelligence surfaces, marketing intelligence, source reconciliation, funnel management, Ads Studio, and profit/cash-flow reporting. The screenshots should be treated as visual reference only; no screenshot numbers are authoritative business data.

## Safety constraints

Do not merge products from image or name similarity alone. Keep uncertain products as draft or review candidates. Do not publish zero-price items to customers; allow zero/null price only as an explicitly unavailable draft state if the editor supports it. Do not fabricate stock, supplier cost, competitor followers, active-ad duration, Meta spend, Pixel purchases, conversion rates, or product demand. Use exact Meta metric names and label unavailable data. Do not create test orders or financial transactions in production during this audit.
