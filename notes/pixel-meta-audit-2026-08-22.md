# DailyGear Pixel and Meta audit — 2026-08-22

## Verified website implementation

- The live DailyGear storefront at https://dailygear.co.ke/shop/products loads `https://connect.facebook.net/en_US/fbevents.js`.
- `window.fbq` is initialized and the browser queue contained `init` and `PageView`.
- Current source event coverage includes `PageView`, `ViewContent`, `AddToCart`, `InitiateCheckout`, `AddPaymentInfo`, and `Purchase`.
- Search now emits `Search` on non-empty storefront search submission.
- Purchase tracking is guarded by a per-order session key to reduce duplicate purchase events on refresh.
- Storefront Pixel ID is loaded from the DailyGear storefront setting; no ID was written into this note.

## Connector findings

- Meta Marketing connector returned 20 connected ad accounts.
- Likely DailyGear account `act_1180189530817052` has an active campaign named `New Sales Campaign` and a paused campaign named `Ladies Canvas Rubber Shoe`.
- Account-level insights for `act_753805746633479` returned no insights data for the last 30 days.
- Campaign-level insights for active campaign `120227209453160727` also returned no insights data for the last 30 days.
- No spend or purchase values should be presented as verified until Meta returns non-empty insights for the selected account/campaign and the account mapping is confirmed.

## Safety boundary

Meta ad spend and Facebook balance must remain separate from AlexOS operating accounts. Any future Facebook balance feature should be a non-posting business liability tracker that changes only when the owner records a payment.
