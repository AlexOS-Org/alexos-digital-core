# Live HTTP and TLS Security Audit

**Target:** https://dailygear.co.ke  
**Date:** 23 August 2026

## Results

The following routes returned HTTP 200: `/`, `/shop`, `/shop/products`, `/shop/cart`, `/shop/checkout`, `/auth`, and the YJ product detail route. `https://www.dailygear.co.ke/` also returned HTTP 200. The final observed total response times from the audit environment were approximately 2.10–3.10 seconds, with time-to-first-byte approximately 1.34–2.56 seconds for tested routes.

The HTTP endpoint `http://dailygear.co.ke/` returned HTTP 200 rather than visibly redirecting to HTTPS. This should be checked against Cloudflare zone rules and HSTS policy; the origin is reachable over HTTPS, but an explicit HTTP-to-HTTPS redirect is preferable.

TLS negotiation succeeded with TLS 1.3, cipher `TLS_AES_256_GCM_SHA384`, ECDSA certificate CN `dailygear.co.ke`, SHA-256 signature, X25519 key exchange, and certificate verification OK.

`/robots.txt` returned 200 and was Cloudflare cached. `/sitemap.xml` returned 200 and was Cloudflare cached. `/.well-known/security.txt` returned 404.

The response headers observed on public HTML did not include `Strict-Transport-Security`, `Content-Security-Policy`, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, or `Permissions-Policy`. This is a hardening finding, not evidence of a current compromise.

The server identifies itself as Cloudflare. Public HTML is not cached according to the observed headers, while robots and sitemap are cached with `public, max-age=0, must-revalidate`.

## Safety boundary

This was a read-only check. No forms were submitted, no account was accessed, no order was created, and no production configuration was modified.
