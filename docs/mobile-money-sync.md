# Mobile money sync backend

This repository provides the authenticated backend foundation for a future mobile client. It contains no Android code and never accepts or stores raw SMS, inbox exports, access tokens in a payload, or service-role credentials.

## Authentication and device lifecycle

The user signs in through Supabase Auth in the mobile app. Registration and every later API request use that user's Supabase access token as `Authorization: Bearer <access-token>`. The API verifies the token with Supabase Auth `getUser`, derives the owner from the verified user, and uses a publishable-key Supabase client carrying that same token. Database reads and writes therefore run under the user's RLS identity.

Register a device with `POST /api/mobile/devices/`:

```json
{ "deviceLabel": "My phone", "platform": "android" }
```

The response contains a server-generated `deviceId`. It is an identifier, not a credential. Pairing is complete only for the authenticated owner who registered it. Store the user's Supabase session using the platform secure keystore; never store or send a service-role key.

Revoke a device with `POST /api/mobile/devices/{deviceId}` using the same authenticated session. Revocation is one-way in the database. The mobile device table permits owner reads and inserts; client-side update/delete grants are removed. The revocation RPC can only set `revoked_at` for the caller's own active device.

## Sync endpoint

`POST /api/mobile/transactions/sync`

Headers: `Authorization: Bearer <access-token>` and `Content-Type: application/json`.

The request allows at most 20 normalized entries and 64 KiB. Unknown keys are rejected, so raw SMS fields cannot be sent by this API. Each item contains:

```json
{
  "accountId": "<owned-account-uuid>",
  "amount": 125.5,
  "occurredAt": "2026-09-30T10:11:12+03:00",
  "provider": "mpesa",
  "providerReference": "QW12345ABC",
  "direction": "CREDIT",
  "transactionType": "income",
  "classificationConfirmed": true
}
```

For an explicitly classified transfer, the payload instead uses `transactionType: "transfer"` and must include a different owned `transferAccountId`:

```json
{
  "accountId": "<owned-source-account-uuid>",
  "amount": 500,
  "occurredAt": "2026-09-30T10:11:12+03:00",
  "provider": "mpesa",
  "direction": "DEBIT",
  "transactionType": "transfer",
  "transferAccountId": "<owned-destination-account-uuid>",
  "classificationConfirmed": true
}
```

`providerReference` is optional and restricted to an identifier-shaped string. The API accepts no free-text message, description, or category fields. `income` must use `CREDIT`, `expense` must use `DEBIT`, while transfers may use either message direction because SMS direction describes the provider message rather than the destination account's ledger classification. Transfer destinations are validated server-side as active accounts owned by the authenticated user and must differ from the source account. The API never derives ledger type from direction; every ledger classification must be explicitly confirmed by the client.

## Scope, ledger, and idempotency

The API does not accept `user_id` or `business_id`. A constrained Postgres invoker function derives the user from `auth.uid()`, verifies the active device, checks that the account is owned and active, and verifies any account-associated business is owned and active. The transaction's business and financial scope come from that validated account. The mobile client cannot select a different business scope.

The function inserts directly into `public.transactions`, which remains the canonical ledger. Each entry stores only normalized transaction fields plus device/provider/reference/fingerprint metadata. Free-text transaction fields remain null. Provider references are unique per user and provider. When the provider reference is absent, the server computes SHA-256 over a canonical representation of the verified user, account, amount, timestamp, provider, direction, and explicit classification. Partial unique indexes enforce both keys atomically; retries return the prior transaction ID and do not create a second ledger row. A provider-reference collision with conflicting normalized details returns a safe conflict status.

## Responses and operational notes

Successful sync returns per-entry `inserted` or `duplicate` statuses and the canonical transaction ID. Authentication, device, account, scope, malformed request, and write failures return generic error codes without echoing financial payloads. Request bodies and credentials are never logged. The endpoint has a 64 KiB body cap, a 20-item cap, strict schemas, verified authentication, owner RLS, account/business checks, and database-enforced deduplication.

No hosted migration has been applied by this change. Apply the migration only through the repository's reviewed deployment process after the PR is approved.

## Phase 2

Build the separate mobile client: secure Supabase sign-in/session storage, device registration/revocation screens, local on-device SMS parsing and normalization, user review/confirmation of direction and classification, account selection, and bounded sync/retry UX. Keep SMS parsing and any source SMS storage on device unless a separately reviewed product requirement explicitly changes this privacy boundary.
