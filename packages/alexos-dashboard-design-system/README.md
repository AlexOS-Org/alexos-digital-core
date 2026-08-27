# AlexOS Dashboard Design System

Reusable presentation primitives for authenticated AlexOS login and dashboard experiences.

## Scope

This package is for `/auth` and `/_authenticated/**` only. Do not import it into DailyGear or Novera public storefront routes, funnels, checkout, product pages, or customer-facing external pages.

## Principles

- Use existing AlexOS CSS custom properties for color, foreground, background, border, ring, primary, purple, and blue accents.
- Keep visual hierarchy clear: one primary action, restrained accent color, generous but bounded spacing, and readable supporting text.
- Prefer namespaced classes (`alexos-auth-*`, `dashboard-*`, `alexos-module-*`) to prevent style leakage.
- Preserve existing route structure and all data/authentication behavior.
- Keep public storefront theming independent and light-mode safe.

## Included assets

- `tokens.css`: internal design tokens and semantic usage guidance.
- `components.css`: reusable auth-shell, panel, focus, and dashboard-surface styles.
- `usage.md`: component and responsive usage rules.

## Responsive contract

Test authenticated surfaces at 390×844, desktop 1440×900, and wide 2560×1440. Confirm no horizontal overflow, touch-friendly controls, visible keyboard focus, readable contrast, and reduced-motion behavior.

## Validation contract

Run formatting on changed files, `git diff --check`, typecheck, the full test suite, production build, and the public-route immutability regression script. Do not publish without an explicit owner-approved review gate.
