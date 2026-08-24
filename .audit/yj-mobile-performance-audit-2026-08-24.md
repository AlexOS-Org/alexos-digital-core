# YJ Baby Funnel Mobile and Performance Audit

**Audit date:** 2026-08-24

## Scope

This audit covers the updated YJ Baby hero colour cards and the six generated feature/detail visuals integrated into `src/routes/funnel.$slug.tsx`.

## Findings

| Area | Evidence | Assessment |
|---|---|---|
| Exact colour cards | The route uses the shared YJ colour mapping and renders Red, Teal/Green, and Navy Blue with Pink Trim. | Pass |
| Hero image containment | Hero images use `object-contain`, explicit image dimensions, and `min-w-0`/`overflow-hidden` on card wrappers. | Pass |
| Feature image containment | Feature cards use `aspect-[4/3]`, `object-contain`, `min-w-0`, and alternating `sm:grid-cols-2` layout. | Pass |
| Mobile stacking | Feature cards use a single-column default and switch to two columns at the `sm` breakpoint. Benefit summary cards default to one column and switch to two or three columns only at larger widths. | Pass by source review |
| Text wrapping | Variant names and checkout labels use `break-words` and `min-w-0`; card copy is not forced into fixed-height containers. | Pass |
| Image loading | The first hero image is eager; later hero images and all below-fold feature/detail images are lazy-loaded with async decoding. | Pass |
| Image payload | Six WebP feature assets total approximately **304 KB**. Individual files are approximately 28–72 KB. | Good for mobile |
| Build output | Production build completed successfully; the funnel route artifact is approximately 43 KB before compression. | Pass |
| Horizontal overflow risk | No `w-screen` or fixed-width feature layout was found in the inspected YJ route. The route uses `min-w-0`, responsive grids, and contained images. | Low risk |
| Live-device capture | The current session did not provide a physical device emulator capture at multiple viewport widths. | Requires follow-up capture if pixel-level certification is required |

## CRO review

The hero communicates the offer before the checkout area, exposes the three currently supported colours without showing unavailable choices, and keeps the colour label adjacent to the image. The feature cards then explain a small number of concrete, source-supported benefits before the customer reaches the product details and checkout form. This sequencing reduces the need to infer what each image represents and keeps the order path intact.

The main residual CRO risk is density at very narrow widths if all three hero cards remain side by side. The current implementation uses constrained card wrappers and contained images, so it should not overflow, but a real 320–375 px viewport capture should be used to confirm label legibility and tap-target comfort. If labels become too small, the safest improvement is a horizontally scrollable or two-row card strip—not smaller typography or cropped images.

## Recommendations

Keep the current WebP assets and lazy-loading behavior. Do not reintroduce the original multi-megabyte PNGs. Before the next production visual sign-off, capture the funnel at 320 px, 375 px, 390 px, 768 px, and desktop width, and verify that the first-screen CTA and variant selection remain visible without horizontal scrolling. Preserve the exact variant mapping regression test whenever hero cards or product images change.

## Overall result

The source-level mobile and performance audit passes. The new visual payload is approximately 304 KB for six below-fold WebP assets, the build is healthy, and the route contains responsive containment and wrapping protections. A device-width browser capture remains the only outstanding evidence needed for a full pixel-level mobile certification.
