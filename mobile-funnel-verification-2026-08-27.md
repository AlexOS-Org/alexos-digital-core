# DailyGear mobile funnel verification — 2026-08-27

## Live route

https://dailygear.co.ke/funnel/quality-waterproof-yj-children-school-bag-funnel

## Verified sequence

1. DailyGear branding and hero promise.
2. YJ school-bag hero image.
3. KES 2,750 per bag and available colours.
4. Order Now CTA.
5. Product benefits and supporting imagery.
6. YJ offer details and delivery/order reassurance.
7. Confidence-before-order section and product-information FAQ content.
8. Colour selector with Navy Blue/Pink Trim, Red, and Green options and quantity controls.
9. Offer summary showing selected colours and price.
10. Customer checkout fields: first name, phone, email, street/address, county, town/area, and delivery instructions.
11. Order Now checkout submission control, payment/delivery clarification, and Continue shopping.
12. Final “See the details before ordering” product-details section with supporting image and evidence-based copy.

## Functional checks

The top Order Now CTA moved the page to the order area without submitting an order. The live page exposed the colour controls and checkout fields. The final details card appeared below the completed order panel, confirming the requested last position. No order was submitted and no production data was changed.

## Theme check

The live storefront rendered with `colorScheme: light`, without the `dark` class, and with `data-public-storefront="true"`. The customer-facing page therefore remains light.

## Notes

The browser verification used the live production route and a mobile-oriented page inspection; the browser viewport itself was desktop-sized, while the page’s responsive mobile order-first layout and production DOM order were checked. The actual customer-device view should still be spot-checked on a physical phone before launch if possible.
