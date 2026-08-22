# AlexOS Frosted-Glass Dashboard Design System

**Status:** Implementation specification and usage guide  
**Scope:** AlexOS command centre, DailyGear operations dashboard, Money Center, Auren, shared sidebar, KPI cards, charts, and greeting surfaces  
**Source of truth:** `src/styles.css`, `src/components/theme/visual-themes.ts`, `src/components/theme/visual-scenes.ts`, `src/components/theme/ThemeProvider.tsx`, and `src/components/theme/VisualThemePicker.tsx`

## 1. Design intent

The AlexOS visual system uses a premium command-centre language inspired by the supplied dashboard references: dark or warm atmospheric canvases, frosted-glass panels, restrained borders, high-contrast typography, compact signal badges, and chart-forward information hierarchy. The visual system is intentionally token-driven. Pages consume semantic classes and CSS variables rather than selecting one-off colours in individual modules.

The system has four independent visual axes:

| Axis            | Purpose                                                                  | Persistence             |
| --------------- | ------------------------------------------------------------------------ | ----------------------- |
| Appearance mode | System, light, or dark rendering                                         | Local device preference |
| Visual theme    | Palette, surface, sidebar, accent, and chart-series family               | Local device preference |
| Greeting scene  | Clean gradient, mountain, ocean, basketball, sunset, or night scene      | Local device preference |
| Time atmosphere | Morning, day, evening, or night context used by automatic scene rotation | Derived from local time |

A user can select a fixed scene or use **Time-aware rotation**. With automatic rotation enabled, AlexOS uses the existing mountain backdrop when the chosen visual preset is mountain-based; otherwise it maps morning to ocean, daytime to basketball energy, evening to sunset focus, and night to a low-light navy scene.

## 2. Core surface tokens

These variables live in `src/styles.css` and are consumed by shared dashboard utilities.

| Token                      | Role                   | Intended use                                              |
| -------------------------- | ---------------------- | --------------------------------------------------------- |
| `--dashboard-panel-bg`     | Translucent base panel | Standard dashboard surfaces and glass cards               |
| `--dashboard-panel-strong` | Higher-opacity panel   | Primary KPI and high-priority content                     |
| `--dashboard-panel-muted`  | Low-opacity panel      | Supporting explanations and secondary regions             |
| `--dashboard-glass-border` | Frosted surface border | Panel boundaries and visual grouping                      |
| `--dashboard-glass-shadow` | Depth shadow           | Glass elevation without heavy black boxes                 |
| `--dashboard-grid-line`    | Chart grid line colour | Cartesian grids and graph plotting surfaces               |
| `--alexos-glow`            | Shared accent glow     | Hero depth, focused panels, and selected signals          |
| `--primary`                | Active accent          | Buttons, active navigation, focus rings, and key headings |
| `--card` / `--color-card`  | Card surface           | Standard component backgrounds                            |
| `--muted-foreground`       | Secondary text         | Metadata, chart axes, and supporting copy                 |

### Surface recipe

A dashboard surface should use the shared `dashboard-surface` or `dashboard-surface-muted` class. New modules should not create hardcoded background colours. The visual recipe is:

```css
background: var(--dashboard-panel-bg);
border: 1px solid var(--dashboard-glass-border);
box-shadow: var(--dashboard-glass-shadow);
backdrop-filter: blur(22px) saturate(135%);
```

Use a stronger surface for a primary metric group and a muted surface for explanatory content. Avoid stacking more than two glass levels in a single visual region.

## 3. Premium visual presets

The selectable presets are registered in `visual-themes.ts` and styled in `styles.css`.

| Preset                  | Reference direction                         | Base palette                              | Recommended chart emphasis                                                    |
| ----------------------- | ------------------------------------------- | ----------------------------------------- | ----------------------------------------------------------------------------- |
| **OpsMind Command**     | Black command centre with violet signals    | Black glass, electric violet, blue, green | Violet primary, blue context, green positive, amber warning, coral alert      |
| **DroneView Ember**     | Smoky operations view with telemetry warmth | Smoke, ember orange, coral, blue          | Amber primary, coral alerts, blue telemetry, green healthy, violet secondary  |
| **PulseAI Warm Light**  | Cream analytics workspace                   | Warm white, peach, amber, soft violet     | Amber primary, coral movement, blue context, green positive, violet secondary |
| **PricePilot Lavender** | Airy watchlist and price trend view         | White, lavender, blue, green              | Violet primary, blue trend, green positive, amber attention, coral alert      |
| **FinAI Neon Ledger**   | Deep navy finance wall                      | Navy, cyan, violet, pink, green           | Cyan primary, violet secondary, coral risk, green positive, amber attention   |

Every preset defines `--chart-1` through `--chart-5` in addition to the shared palette tokens. Chart components should reference these variables instead of raw colour values.

## 4. Greeting scenes

The scene registry is in `src/components/theme/visual-scenes.ts`. Scene selection is persisted by `ThemeProvider` under the `alexos-dashboard-scene` key and is included in the exported dashboard JSON preset.

| Scene                 | Visual treatment                                               | Automatic time mapping                  |
| --------------------- | -------------------------------------------------------------- | --------------------------------------- |
| **Clean gradient**    | Theme-only layered gradient                                    | Never selected automatically            |
| **Mountain command**  | Existing local AlexOS mountain command-centre image            | Automatic for mountain-backdrop presets |
| **Ocean waves**       | Cool layered radial wave lines with teal and blue depth        | Morning, 05:00–10:59                    |
| **Basketball energy** | Warm court-inspired circle treatment with amber/coral momentum | Day, 11:00–16:59                        |
| **Sunset focus**      | Copper, rose, and violet horizon treatment                     | Evening, 17:00–20:59                    |
| **Night focus**       | Navy low-light field with subtle blue and violet pools         | Night, 21:00–04:59                      |

The current implementation uses lightweight CSS scene art rather than large image downloads for ocean, basketball, sunset, and night. This keeps first-paint performance predictable, avoids storing additional media in AlexOS, and still gives each theme a visual scene that can change over time. The mountain option intentionally reuses the existing local image asset.

## 5. Scene implementation contract

Dashboard greeting sections expose both attributes:

```tsx
<section
  data-atmosphere={activeAtmosphere}
  data-scene={activeScene}
  className="alexos-dashboard-hero"
>
```

DailyGear uses the same `data-scene` contract on `dailygear-workspace-hero`. The shared CSS selectors apply the scene treatment to both products. The scene selector must remain independent from the visual palette so users can pair, for example, FinAI Neon Ledger with Ocean Waves or PulseAI Warm Light with Clean Gradient.

The automatic rotation is refreshed every 30 seconds in AlexOS and DailyGear. A fixed manual selection does not change with time.

## 6. Chart and analytics contract

Charts must remain data-first. Theme styling may change colour, grid opacity, tooltip surfaces, and emphasis, but must never change the underlying values or calculation logic.

### Required chart variables

```css
--chart-1: primary series;
--chart-2: secondary series;
--chart-3: comparison or context series;
--chart-4: warning or expense series;
--chart-5: additional series;
--dashboard-grid-line: low-contrast grid line;
```

### Money Flow chart

The AlexOS Money Flow chart displays six months of **posted income and posted expenses only**. Transfers are excluded. Income uses `--chart-2`; expenses use `--chart-4`. The chart surface uses `dashboard-chart-grid`, which inherits `--dashboard-grid-line` from the selected visual preset.

Responsive contract:

| Viewport  | Chart placement                                    | Chart height | Required behaviour                                             |
| --------- | -------------------------------------------------- | -----------: | -------------------------------------------------------------- |
| Mobile    | Single-column dashboard stack                      |       208 px | No horizontal overflow; condensed axis labels; full-width card |
| Tablet    | Single-column or available grid column             |       240 px | Chart expands to the available content width                   |
| Desktop   | Two-column Money section beside explanatory panel  |       256 px | Chart uses the primary Money section column                    |
| Ultrawide | Wider primary column with bounded supporting panel |       256 px | Chart must not stretch to unreadable axis spacing              |

The chart container uses `min-w-0`, `ResponsiveContainer minWidth={0}`, and breakpoint-specific height classes. New charts should follow the same pattern.

## 7. KPI and signal hierarchy

KPI cards use `.dashboard-kpi-card` with `data-tone="blue|green|purple|amber|danger"`. The tone sets a semantic accent token, a narrow top signal bar, an icon surface, and a restrained glow. The meaning of the number remains in the label and supporting copy; colour is not the only indicator.

Money Center account cards follow the institution map:

| Institution | Normal surface family | Low-balance override                           |
| ----------- | --------------------- | ---------------------------------------------- |
| M-Pesa      | Green                 | Red balance, warning copy, and alert indicator |
| KCB         | Blue                  | Red balance, warning copy, and alert indicator |
| I&M         | Orange                | Red balance, warning copy, and alert indicator |
| SBM         | Red                   | Red warning treatment with readable contrast   |
| Salary      | Violet                | Red warning treatment                          |
| Binance     | Amber/gold            | Red below the configured KES threshold         |
| Cash        | Neutral               | Red warning treatment                          |

Institution colour may fill the card surface, border, logo container, and icon background. Red is reserved for low-balance warnings, danger states, and alert copy.

## 8. Theme picker and exported presets

The shared `VisualThemePicker` exposes visual presets, custom accent/surface/sidebar colours, appearance mode, greeting scene selection, and preset export. Exported JSON includes:

```json
{
  "schema": "alexos.dashboard-preset",
  "version": 1,
  "theme": {
    "mode": "dark",
    "resolvedMode": "dark",
    "visualTheme": "finai",
    "dashboardScene": "ocean",
    "customAccent": "#4f7cff",
    "customSurface": "#202337",
    "customSidebar": "#11182f"
  }
}
```

Exports contain visual preferences only. They do not include business data, customer information, credentials, secrets, orders, transactions, or account balances.

## 9. Accessibility and performance rules

Use readable foreground/background contrast in every preset, especially in light themes and on translucent surfaces. Focus rings must continue to use `--ring`. Icons are supporting signals and require adjacent text or an accessible label. Scene art is decorative and must use empty `alt` text plus `aria-hidden="true"` when rendered as an image.

Keep decorative scene layers pointer-free. Do not use large remote background images for routine dashboard scenes unless the asset is approved, cached, and performance-tested. Prefer CSS gradients or small optimized local assets for first-view decoration. Avoid animation-heavy scenes; the current implementation changes the scene at time boundaries and uses a restrained background transition only.

Do not introduce page-level horizontal scrolling. Dashboard grids should use `minmax(0, 1fr)`, cards should be shrinkable with `min-w-0`, and charts must use responsive containers. Test at 320 px, 375 px, 768 px, 1024 px, 1440 px, and ultrawide widths.

## 10. Change checklist

Before merging a visual-system change:

1. Confirm the new visual behaviour is expressed through shared tokens or a reusable semantic class.
2. Confirm no financial or commerce calculations changed.
3. Confirm the selected preset updates panels, sidebar, KPI signals, chart colours, and grid lines.
4. Confirm fixed and automatic scene modes both work.
5. Confirm the greeting scene is decorative and does not block text or controls.
6. Confirm Money Flow is present and legible on mobile and tablet.
7. Run formatting, TypeScript, lint, tests, production build, and `git diff --check`.
8. Verify the exact commit through GitHub and Cloudflare before describing it as live.
