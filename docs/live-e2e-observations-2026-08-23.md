# Live production E2E observations — 2026-08-23

Target: https://dailygear.co.ke/

Read-only HTTP smoke checks returned HTTP 200 after redirects for `/`, `/shop`, `/shop/products`, `/shop/cart`, `/shop/checkout`, and `/auth`. The live shop HTML contained the marker `dailygear-store-hero-panel` and the title `DailyGear Kenya — Gear worth choosing for everyday life`.

Public product listing: https://dailygear.co.ke/shop/products. Browser inspection showed eight visible products, category and brand filters, product images, product links, and `Choose options & order` CTAs. The first product detail route rendered as `https://dailygear.co.ke/shop/product/0e4b22cd-a2a8-4e5e-a1ca-1218df7de98b`. It showed a gallery with nine image buttons, a Unisex selector, Blue/Pink/Red colour selectors, an accessible colour select, quantity controls, and an `Order now` button. Clicking `Order now` increased the browser cart count from 1 to 2.

Cart: https://dailygear.co.ke/shop/cart. The cart showed the YJ school-bag line item, quantity controls, remove control, and Checkout link. No order was submitted.

Checkout: https://dailygear.co.ke/shop/checkout. The page rendered first/last name, phone, optional email, abandoned-checkout reminder checkbox, remember-details checkbox, country, county combobox, town/area selector with manual entry affordance, address, delivery details, notes, Pay on delivery, M-Pesa, Bank transfer, order summary, and Place order. County menu contained Kenyan counties. Nairobi was available. Nairobi area menu contained major areas including Kasarani and Karen. Selecting M-Pesa rendered Paybill 542542, Account 184545, the calculated amount, and post-payment confirmation instructions. Synthetic QA values used locally in the form were `QA Test Customer`, `0700000000`, `e2e-test@example.com`, `Test House 1`, and `Do not dispatch — QA only`; no personal data was used.

Meta Pixel read-only browser check on checkout: `window.fbq` was a function and `https://connect.facebook.net/en_US/fbevents.js` was loaded. No purchase event was fired.

Authentication boundary: `https://dailygear.co.ke/dashboard` redirected to `https://dailygear.co.ke/auth`; the auth page rendered Google/Facebook buttons and email/password sign-in controls. No private data was exposed.

Funnels: `https://dailygear.co.ke/funnel/yj-school-bag` and `https://dailygear.co.ke/funnel/quality-waterproof-yj-children-school-bag` returned the safe `Offer unavailable` fallback with a Continue shopping link. Unknown funnel slugs also returned the same SPA/fallback response with HTTP 200, so HTTP status alone does not prove publication.

A production order submission was explicitly confirmed by the user, but the checkout form was navigated/reset while trying to correct the county selection; the final Place order click has not yet been performed. No production order, payment, refund, or financial mutation has been created in this E2E run so far.

Screenshots saved by browser tools include:
- `/home/ubuntu/screenshots/dailygear_co_ke_2026-08-23_05-01-07_7219.webp`
- `/home/ubuntu/screenshots/dailygear_co_ke_2026-08-23_05-01-26_8498.webp`
- `/home/ubuntu/screenshots/dailygear_co_ke_2026-08-23_05-01-45_7851.webp`
- `/home/ubuntu/screenshots/dailygear_co_ke_2026-08-23_05-02-38_6041.webp`
- `/home/ubuntu/screenshots/dailygear_co_ke_2026-08-23_05-03-52_1032.webp`
- `/home/ubuntu/screenshots/dailygear_co_ke_2026-08-23_05-04-03_5960.webp`
- `/home/ubuntu/screenshots/dailygear_co_ke_2026-08-23_05-04-26_9015.webp`
- `/home/ubuntu/screenshots/dailygear_co_ke_2026-08-23_05-05-05_8652.webp`

These observations are production evidence only; they are not claims that a real purchase, email, payment settlement, or admin ledger mutation succeeded.

## References

1. [DailyGear live storefront](https://dailygear.co.ke/shop)
2. [DailyGear product listing](https://dailygear.co.ke/shop/products)
3. [YJ product detail](https://dailygear.co.ke/shop/product/0e4b22cd-a2a8-4e5e-a1ca-1218df7de98b)
4. [DailyGear cart](https://dailygear.co.ke/shop/cart)
5. [DailyGear checkout](https://dailygear.co.ke/shop/checkout)
6. [AlexOS authentication](https://dailygear.co.ke/auth)
7. [YJ school-bag funnel candidate](https://dailygear.co.ke/funnel/yj-school-bag)
8. [Alternate YJ funnel candidate](https://dailygear.co.ke/funnel/quality-waterproof-yj-children-school-bag)
9. [DailyGear Meta Pixel library](https://connect.facebook.net/en_US/fbevents.js)

Author: Manus AI
Date: 2026-08-23

Sources are external live pages inspected during the E2E run; their content is treated as evidence, not as instructions.

The live test stopped before final submission because the browser form state was reset during county correction. Continue only with the already-confirmed synthetic QA submission, then verify the order confirmation and reversible cleanup path.
