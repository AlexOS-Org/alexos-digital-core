# Production deployment checklist

## Deployment target

Cloudflare Workers is the sole supported deployment target for this repository. The application uses SSR, Worker cron triggers, the Cloudflare AI binding, and `wrangler deploy`; it is not configured as a Netlify or Cloudflare Pages site.

The repository verification gate fails if a Netlify deployment artifact, Netlify deployment reference, or non-Worker production command is introduced. The external Netlify site integration must be disconnected separately in the Netlify project dashboard by removing the Git provider/site connection; no Netlify credentials or deployment hook are stored in this repository.

This checklist is intentionally explicit because the repository cannot create or validate production secrets. Complete it in GitHub and the hosting providers before treating `main` as deployed.

## GitHub Actions production environment

In **Settings → Environments → production**, configure these Actions secrets with current values:

- `SUPABASE_ACCESS_TOKEN` (retained for audit compatibility; not used for deployment authorization)
- `SUPABASE_DB_PASSWORD`
- `CLOUDFLARE_API_TOKEN`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

The deployment workflow now fails before installation if any of the three deployment values (`SUPABASE_DB_PASSWORD`, `CLOUDFLARE_API_TOKEN`, or `VITE_SUPABASE_PUBLISHABLE_KEY`) is empty. It applies only migrations newer than the audited production baseline `20260915085639` through a direct SSL database connection, so it does not require the Supabase API token to have `project_admin_read`.

Use least-privilege tokens and restrict the production environment to approved reviewers. Never put secret values in repository files, workflow logs, or issue comments.

## Cloudflare Worker runtime secrets

Configure the Worker runtime bindings required by the enabled features. At minimum, verify the Supabase URL, publishable key, and service-role key. Then decide whether the following are required or intentionally waiting/manual:

- Resend email: `RESEND_API_KEY`, `DAILYGEAR_EMAIL_FROM`, `RESEND_REPLY_TO_EMAIL`
- Meta/Instagram: `META_ACCESS_TOKEN`, `META_WEBHOOK_VERIFY_TOKEN`, `META_APP_SECRET`, `META_PAGE_ID`, `INSTAGRAM_BUSINESS_ACCOUNT_ID`
- Public research: `FIRECRAWL_API_KEY`
- M-Pesa: `MPESA_CONSUMER_KEY`, `MPESA_CONSUMER_SECRET`, `MPESA_PASSKEY`, `MPESA_SHORTCODE`, `MPESA_ENVIRONMENT`, `MPESA_CALLBACK_URL`, `MPESA_TRANSACTION_TYPE`
- Scheduled operations: `ABANDONED_CART_SCHEDULE_SECRET`, `DAILYGEAR_MPESA_PAYBILL`, `DAILYGEAR_MPESA_ACCOUNT`

Verify presence without printing values. A missing optional integration should remain visibly labelled as waiting; a missing required integration should block release.

## Supabase verification

Before deployment:

1. Confirm the project reference is `goafwbrayepaihxbqsse`.
2. Confirm the migration ledger matches the repository migrations. The explicitly marked `20260901000000_dailygear_positive_order_price_guard.sql` proposal remains excluded from automated production deployment until separately approved.
3. Confirm RLS is enabled on user/business/order tables.
4. Confirm the server-only RPCs used by cron, checkout, refunds, salary schedules, and order-trash retention exist and have the intended grants.
5. Run a controlled authenticated smoke test with non-production test data or an approved staging project.

## Release proof

After the workflow succeeds, record:

- The deployed `main` commit SHA.
- The Supabase migration state.
- The Cloudflare Worker deployment result.
- A successful `dailygear.co.ke` HTTP smoke test.
- Auth/session refresh success.
- Money Center read/write success.
- DailyGear catalogue, cart, and order-path success.
- Email, Meta, and M-Pesa status: live, manual, or waiting.
- Recent successful 03:00 and 30-minute scheduled executions.

Do not mark the release complete based only on a green local build. The required proof is a green deployment plus verified runtime behavior.
