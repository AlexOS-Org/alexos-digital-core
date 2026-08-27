# DailyGear live funnel audit — 27 August 2026

**Audited route:** `https://dailygear.co.ke/funnel/quality-waterproof-yj-children-school-bag-funnel`

## Verified flow

The live customer sequence contains the hero hook, KES 2,750 price, available colour messaging, Order Now CTA, benefit sections, product details, offer summary, confidence-before-order section, FAQ/support section, visual detail section, colour selection, quantity controls, delivery form, and final Order Now action.

The form includes first name, phone, email, street/building/house number, county, town/area, and landmark or delivery instructions. Checkout guidance tells customers to review delivery and payment options. The page states that payment is not treated as settled until DailyGear confirms it. No fabricated testimonials or star ratings were detected; the page uses an honest awaiting-feedback message.

The live rendered selector showed Navy Blue with Pink Trim, Red, and Green options, with Green selected at quantity one in the observed browser state. The final order summary displayed Green × 1 at KES 2,750.

## Event and safety audit

Source inspection confirms a shared Meta Pixel helper is used rather than a second loader. The checkout route emits `InitiateCheckout` and `AddPaymentInfo`, the funnel route contains Meta event calls for the customer journey, and the thank-you route emits server-confirmed, sessionStorage-idempotent `Purchase` using the order number, value, currency, and content identifiers.

No order, checkout, payment, ad, or financial action was submitted during the audit. No production data was changed.

## Findings

The primary follow-up is consistency review: the hero summarizes available colours as “Navy Blue with Pink Trim, Red & Green,” while the selector presents Red and Green separately. This is not changed automatically because variant identity must remain tied to canonical catalogue data. Confirm the intended copy against the current product record before changing it.

The live browser screenshot was unavailable in this session, so mobile layout and image-crop quality remain source/build evidence rather than a completed pixel-level browser capture. No conversion rate was estimated; analytics performance metrics remain unavailable without the connected reporting source.
