# YJ live deployment access — 2026-08-23

The validated source change is on `main` at commit `6253123`. GitHub Typecheck, Validate, and Production Verify passed. The live custom domain still served the previous single-variant selector before this deployment attempt.

Direct `npm run deploy` built successfully but Wrangler failed with Cloudflare API authentication error code 10000. The local API token could not list accounts or upload Worker scripts. The authenticated browser was opened at the Worker dashboard URL but remained on a blank/loading Cloudflare screen; no deploy control was available yet.

The current source implements multi-colour quantities, hides Blue through zero stock, uses YJ Baby names, removes the duplicate mobile Order now bar, and maps feature images to the supplied product-detail images.
