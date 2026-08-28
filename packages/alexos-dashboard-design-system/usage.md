# Usage guidance

## Auth shell

Use the auth shell for the `/auth` route only. Keep the desktop split layout and mobile single-column layout. Pair the brand panel with one clear form card and one primary submit action.

## Dashboard surfaces

Use dashboard surfaces for internal KPI, activity, Auren, Money Center, and module sections. Prefer one information hierarchy per section instead of a wall of equal cards. Keep visual accents restrained and use semantic tokens.

## Accessibility

Use visible `:focus-visible` states, labels connected to controls, text that remains readable at 390px width, and a minimum practical touch target of approximately 44px. Respect `prefers-reduced-motion: reduce`.

## Theme isolation

Never attach these classes to public storefront markup. The public DailyGear and Novera experiences must retain their own light-mode and retail styling. Avoid broad selectors such as `body`, `button`, or `.card` in application-level overrides.

## Review checklist

1. Login renders at mobile and desktop widths.
2. Dashboard navigation remains reachable and readable.
3. No horizontal overflow exists.
4. Public shop and funnel routes have no source diff.
5. Typecheck, tests, lint, build, and diff checks pass.
