# Assurance-before-checkout deployment evidence — 2026-08-27

## Change

The funnel order aside now uses `order-last` on mobile and `lg:order-none` on desktop. This places the guarantee/assurance content before colour selection and checkout on narrow screens while preserving the desktop two-column layout. The product-details section remains after the entire grid and is therefore the final funnel section.

## Validation

Prettier, TypeScript typecheck, ESLint, Vitest, production build, and `git diff --check` all passed.

## Deployment

- Commit: `4a4ef9a62d4126a161c0c3138a68541c4d33e066`
- Cloudflare Workers Build UUID: `8758f87e-831d-49ea-a693-7c926b202c1b`
- Build outcome: success

## Live verification

Live route:

https://dailygear.co.ke/funnel/quality-waterproof-yj-children-school-bag-funnel

The rendered production DOM reports:

- `colorScheme: light`
- no `dark` class
- `data-public-storefront: true`
- aside class includes `order-last` and `lg:order-none`
- assurance section precedes delivery/order information and the order aside in the mobile flow
- product-details section is the final section
- colour controls, checkout fields, Order Now, and Continue shopping remain present

No order was submitted. No ad, budget, WhatsApp, or database settings were changed.
