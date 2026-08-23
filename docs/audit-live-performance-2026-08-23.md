# Live Performance Audit

**Target:** https://dailygear.co.ke/shop/products  
**Date:** 23 August 2026

The live products document was 36,065 bytes and served over HTTP/2. The route returned HTTP 200. Resource inspection found a large shared JavaScript entry asset `index-CDm9T9iS.js` at approximately 592,778 bytes and a chart vendor asset `charts-vendor-BRvr6MQb.js` at approximately 424,263 bytes. The live stylesheet `styles-FvVdHNUM.css` was approximately 323,081 bytes. These are the main client-delivery opportunities for public storefront performance.

The production build also contains large authenticated/server bundles, including chart and e-commerce order chunks. The public products page should not need to load authenticated Money Center, Auren, or chart dependencies on its critical path; route-level and vendor-level splitting should be reviewed.

The sampled JavaScript and CSS responses were Cloudflare cache hits but returned `cache-control: public, max-age=0, must-revalidate` and did not expose a `content-encoding` response header in the audit. Hashed immutable assets should normally use a long-lived immutable cache policy, and Brotli/gzip compression should be confirmed at the edge.

The live public-route response timings from the audit environment were approximately 2.1–3.1 seconds total, with time-to-first-byte approximately 1.8–2.6 seconds for the tested storefront routes. These are synthetic measurements from one audit environment, not Core Web Vitals and not a substitute for real-user monitoring.

The public products page served successfully and the browser-visible mobile surfaces previously checked had no confirmed blocking overlap. A full authenticated admin performance test was not possible without a signed-in browser session.

No production data, orders, payments, secrets, or configuration were changed during this performance check.
