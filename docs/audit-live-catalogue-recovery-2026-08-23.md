# Public catalogue recovery

After applying the production RLS publication-gate fix, the live route `https://dailygear.co.ke/shop/products` now shows **8 items** and exposes categories including Bags & Luggage, Fashion & Clothing, and Home & Living.

The live YJ product detail route now loads successfully. It shows the product title `Quality Waterproof YJ Children School Bag`, price KES 1,650, a gallery with multiple images, the Unisex option, and available Blue, Pink, and Red colour selectors. The page exposes an Order now CTA and delivery, checkout, returns, and support links.

This resolves the previously confirmed zero-item public catalogue issue. The live detail page still needs a checkout-flow test and an image-source review because the page currently shows a hosted session CDN image rather than the external Alibaba/Instagram source URLs described in the evidence-first requirements. No customer order was placed during this check.
