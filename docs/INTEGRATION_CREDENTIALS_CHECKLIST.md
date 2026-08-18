# AlexOS Integration Credential Checklist

This is the implementation checklist for external connections. Do not put secrets in Git.

| Integration | Credentials / access to obtain | Scope / permission principle |
|---|---|---|
| Supabase | Project URL, publishable key; privileged server secret only where required | Minimum required; server secrets never client-side |
| Cloudflare | Worker/deployment access | Deployment only |
| Meta/Facebook | Meta app, Business Manager/Page access, Ads account, Pixel/dataset identifiers | Read first; write only when a documented feature requires it |
| Instagram | Meta app + connected professional account | Minimum content/insights scopes |
| WhatsApp Business | Meta app + WhatsApp Business Account/phone | Messaging only for approved workflows |
| M-Pesa | Safaricom Daraja/business credentials as applicable | Payments/transaction scopes required by approved flow |
| Banks | Provider-specific/open-banking credentials where available | Read-only first; transaction access only as required |
| Market data | Provider API key | Market-data endpoints only |
| Crypto data | Provider API key | Market-data endpoints only initially |
| Google Calendar | Google OAuth client | Calendar read/write only when required |
| Google Drive | Google OAuth client | Restricted folders/scopes where possible |
| Email | Transactional email provider credentials | Send-only from approved domains where possible |
| Payments | Gateway credentials/webhooks | Payment status/checkout scopes required by DailyGear |
| Delivery | Courier API credentials | Orders/tracking only |
| Vehicle data | Provider API credentials | Vehicle/market endpoints only |

## Rules

- Never commit `.env`, access tokens, refresh tokens, API secrets or private keys.
- Prefer OAuth and short-lived tokens where supported.
- Store secrets in the deployment/platform secret manager or a dedicated secure integration store.
- Record provider, account identifier, granted scopes, created date and revocation path in the integration registry (never the secret itself).
- Test integrations against a non-production/sandbox account where available.
- Use read-only access for the first connection whenever possible.
