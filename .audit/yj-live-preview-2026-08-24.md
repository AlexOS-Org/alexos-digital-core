# YJ live preview audit — 2026-08-24

The live URL `https://dailygear.co.ke/funnel/quality-waterproof-yj-children-school-bag-funnel` is serving an older Worker build, not commit `9a3a8ff`.

At the inspected viewport (1422 × 1222), the live DOM contains 22 images and a scroll height of 7327px. The live page still references the old assets:

- `yj-direct-card-storage.webp` appears twice.
- `yj-reference-back-comfort.webp` appears three times.
- `yj-reference-device-compartment.webp` appears three times.
- `yj-reference-strap-buckle.webp` appears twice.
- `yj-reference-zipper-base.webp` appears three times.

The live page therefore does not yet contain the new eight-image one-to-one mapping. The current production page still shows the earlier benefit cards, the old visual-story block, and the old detail block. The classroom hero is present and visually fits the desktop viewport. Checkout colour buttons for Navy Blue with Pink Trim, Red, and Green are present.

The local `main` branch contains the corrected mapping from commit `9a3a8ff`, which uses `yj-feature-card-01-clean.webp` through `yj-feature-card-08-clean.webp` exactly once. A new Cloudflare deployment is still required before the live page can reflect that correction.

No production changes were made during this preview.

## Sources

- Live page: https://dailygear.co.ke/funnel/quality-waterproof-yj-children-school-bag-funnel
- Local route: `/home/ubuntu/alexos-source/src/routes/funnel.$slug.tsx`
- Local commit: `9a3a8ff`
- Cloudflare Worker: `alexos-business-os`
