# YJ Baby School Bag funnel research — 2026-08-22

## Sources

- Mobigear reference funnel: https://mobigear.co.ke/cartflows_step/goloen-wolf-premium-waterproof-laptop-and-travel-backpack/
- Alibaba product reference supplied by the user: https://www.alibaba.com/product-detail/Romar-New-England-Style-Children-Schoolbag_1601446930605.html?productId=1601446930605

## Observed Mobigear flow

The reference uses a focused product offer with a strong headline, product imagery, feature-led sections, a price/offer block, quality assurance, customer proof, payment and delivery guidance, a clear order form, and a reason-to-buy section. It uses repeated purchase cues while keeping the order action visible.

## Evidence available from the user’s DailyGear catalogue

The YJ product is described as a children’s school backpack using Oxford material, with red, pink, and blue options. The user stated that the compact 31 × 20 × 16 cm option is red only and the 42 × 20 × 18 cm option is available in the listed colours. The catalogue also describes water resistance and school-backpack use.

## Copy boundaries

Use parent pain points such as keeping books and daily school essentials organised, making the school-day carry easier to manage, and choosing a practical fit. Use child-facing benefits such as choosing a preferred colour and having a bag sized for school items. Do not claim waterproof performance, ergonomic support, warranty, health outcomes, free delivery, scarcity, or customer testimonials unless those facts are currently verified in the DailyGear catalogue or checkout settings.

## Implementation direction

Use the existing `/funnel/$slug` public route, `dg_funnels` and `dg_funnel_steps` architecture, the canonical YJ product, existing live variant selection, owner-controlled availability, shared checkout, and Pixel events. Keep the first funnel draft until the owner confirms the product images, price, delivery policy, and exact variant matrix. Do not fabricate an order or purchase result.
