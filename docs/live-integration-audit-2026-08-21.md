# Live DailyGear integration audit — 21 August 2026

## Meta Ads Manager connector

The authorized Meta Ads Manager connection exposes seven operations: ad-account inventory, account/campaign/ad-set/ad reads, performance insights and recommendations. The authorized inventory includes `act_753805746633479` named `Daily Gear 2025`, currency KES, timezone Africa/Nairobi. Its full ad-account object exposes account identity, status, currency, timezone, creation time, spend cap, balance and amount spent, but no Meta Pixel or dataset identifier. The available connector does not expose a general Pixel lookup or Ads Library search endpoint.

Source: authorized Meta Ads Manager connector result for `act_753805746633479` and tool capability list saved on 21 August 2026.

## Gmail connector

The connected Gmail integration exposes search, thread read, label management and send/save-draft operations. Sending messages triggers interactive confirmation in the user interface before a message is sent. The active Gmail connector configuration lists `dailygear.co.ke@gmail.com` and `alexonkwani@gmail.com` as known accounts, but neither is currently in `agentAuthorizedAccountUids` and the active account UID is empty. The app Worker cannot use the connector’s interactive Gmail session as a server-side event sender; durable customer and owner order notifications still require a production email provider/runtime secret or a separate authorized server integration.

## Production secret gaps already documented

The repository’s owner-action completion report states that `RESEND_API_KEY` and `META_ACCESS_TOKEN` are not present in the Worker runtime. `SUPABASE_SERVICE_ROLE_KEY` exists but the previously exposed value requires rotation. No secret values were read or written into this note.

## Data rule

Do not present a Pixel ID, follower count, Ads Library duration, Meta spend, or email-delivery claim unless the value is returned by an authorized source or supplied by the owner. Do not activate browser tracking with a guessed Pixel ID.

## Official Pixel event contract

Meta’s current developer reference documents `fbq('track')` standard events including `ViewContent`, `AddToCart`, `InitiateCheckout` and `Purchase`. `InitiateCheckout` supports `content_ids`, `contents`, `currency`, `num_items` and `value`; `Purchase` requires `currency` and `value`, and supports product identifiers and contents. The implementation will use these standard names and real cart/order values only.

Reference: https://developers.facebook.com/documentation/meta-pixel/reference
