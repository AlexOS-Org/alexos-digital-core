# DailyGear funnel deployment evidence — 2026-08-27

## Repository

- Repository: https://github.com/dylextrends/alexos-digital-core
- Branch: main
- Deployed commit: `8c1a7fceb6d55d899023d9f2ecfe7fca5d137d5d`
- Focused commit: `Polish DailyGear YJ school bag funnel`

## Cloudflare Workers Build

- Canonical Worker: `alexos-business-os`
- Cloudflare account: configured AlexOS account
- Workers Build UUID: `4a390f21-dd46-484d-950f-afd07a83c60a`
- Build trigger: existing main-branch production trigger
- Build command: `npm run build`
- Deploy command: `npx wrangler deploy`
- Build outcome: `success`
- Build status: `stopped` (terminal/completed state)
- Build time observed: 2026-08-27 02:42–02:43 UTC

## Custom domains

Verified through the Cloudflare account connection:

- `dailygear.co.ke` — enabled, production, service `alexos-business-os`
- `www.dailygear.co.ke` — enabled, production, service `alexos-business-os`

## Live route

URL: https://dailygear.co.ke/funnel/quality-waterproof-yj-children-school-bag-funnel?utm_source=facebook&utm_medium=paid_social&utm_campaign=yj_school_bag_purchase_test&utm_content=deployment_check

Live smoke test confirmed:

- YJ funnel page loaded successfully.
- Hero headline and school-day value proposition are present.
- KES 2,750 per bag is displayed.
- Available colours are displayed dynamically.
- `Order Now` CTA is present.
- Website checkout form and order flow are present.
- The order card is served before the long-form content in the mobile DOM order.
- The evidence-based product-details section is live instead of the empty review placeholder.

## Deployment limitation

The local Wrangler token returned Cloudflare authentication error 10000, so the deployment was triggered through the configured Cloudflare Workers Build connection. An earlier build with a short SHA failed during repository fetch; the successful build used the actual full commit SHA above. No Meta ad settings were changed and no ad was published.

## Source URLs

- Repository: https://github.com/dylextrends/alexos-digital-core
- Live funnel: https://dailygear.co.ke/funnel/quality-waterproof-yj-children-school-bag-funnel
- Cloudflare API: https://api.cloudflare.com/client/v4/
