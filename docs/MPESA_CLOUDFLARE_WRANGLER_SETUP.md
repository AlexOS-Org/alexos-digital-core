# Daraja M-Pesa sandbox secrets with Wrangler

The AlexOS Worker is named `alexos-business-os` and is configured in `wrangler.jsonc`.

## 1. Authenticate Wrangler

From the repository root, use either an approved Wrangler OAuth login or a least-privilege Cloudflare API token. Never commit the token.

```bash
export CLOUDFLARE_API_TOKEN='keep-this-only-in-your-shell'
export CLOUDFLARE_ACCOUNT_ID='0589152be18f79fa5331e089b6055762'

npx wrangler whoami
```

If using a browser login instead:

```bash
npx wrangler login --use-keyring
npx wrangler whoami
```

## 2. Add the four Daraja secrets

Wrangler prompts for each value. Input is not placed in the command line or repository.

```bash
npx wrangler secret put MPESA_CONSUMER_KEY --config wrangler.jsonc
npx wrangler secret put MPESA_CONSUMER_SECRET --config wrangler.jsonc
npx wrangler secret put MPESA_PASSKEY --config wrangler.jsonc
npx wrangler secret put MPESA_SHORTCODE --config wrangler.jsonc
```

`wrangler secret put` creates and deploys a new Worker version immediately. Run one command at a time and verify the deployment after the final secret.

## 3. Configure non-secret values

The application reads these runtime values:

```text
MPESA_ENVIRONMENT=sandbox
MPESA_CALLBACK_URL=https://dailygear.co.ke/api/mpesa/callback
MPESA_TRANSACTION_TYPE=CustomerPayBillOnline
DAILYGEAR_PUBLIC_URL=https://dailygear.co.ke
```

For a sandbox smoke test, do not set `MPESA_ENVIRONMENT=production`. The four Daraja credentials must be from the Safaricom Daraja sandbox application.

## 4. Verify without exposing values

```bash
npx wrangler secret list --config wrangler.jsonc
npx wrangler deployments list --config wrangler.jsonc
curl -fsSI https://dailygear.co.ke/money-center
```

The secret list verifies binding names only; it does not validate credential correctness. The application STK endpoint should return `configured: true` before an outbound test is attempted. A missing binding returns HTTP 503 and no Daraja request is made.

## 5. Run the guarded sandbox smoke test

Use an existing unpaid test order and a registered sandbox MSISDN. The runner refuses production mode and does not print secrets:

```bash
ALLOW_LIVE_STK_TEST=true \
MPESA_ENVIRONMENT=sandbox \
MPESA_TEST_BASE_URL=https://dailygear.co.ke \
MPESA_TEST_ORDER_NUMBER='DG-...' \
MPESA_TEST_PHONE='2547XXXXXXXX' \
MPESA_TEST_POLL_SECONDS=90 \
node scripts/mpesa-sandbox-stk-test.mjs
```

The order's authoritative total is used. Do not create or change a public product merely to force a test amount.

## Security rules

- Do not use `--config` with a file containing secret values.
- Do not pass secret values as command-line arguments.
- Do not print, paste, or commit the secret values.
- Use `MPESA_ENVIRONMENT=sandbox` for this runbook.
- Rotate the Daraja sandbox credentials if they are ever exposed.
- A successful STK acceptance is not a successful settlement; verify the callback and linked Money Center transaction separately.

References:

- [Cloudflare Workers secrets](https://developers.cloudflare.com/workers/configuration/secrets/)
- [Wrangler secret commands](https://developers.cloudflare.com/workers/wrangler/commands/general/#secret)
- [Safaricom Daraja API](https://developer.safaricom.co.ke/)
