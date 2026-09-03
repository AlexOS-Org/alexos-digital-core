# Figma Ecommerce Dashboard UI Specification

## Reference

Prototype: Ecommerce Admin Dashboard (SaaS) (Community), starting frame/node `43-422`.

## Observed visual system

The reference uses a light admin canvas with a dark charcoal application chrome and a saturated orange primary navigation rail. The main content is wide and airy, with navy headings, muted gray supporting text, white surfaces, soft gray page background, large corner radii, and low-contrast elevation.

## Layout patterns

1. A persistent left rail anchors the application. It includes a compact wordmark at the top and vertically stacked icon-only navigation buttons. The active item is white on the orange rail; inactive items use translucent orange/white treatments.
2. The main area begins with a page heading and a horizontal KPI strip. Each KPI surface contains a small metric label, a large value, a directional percentage change, and a compact sparkline.
3. The primary analytics surface is a wide white panel with a title row, an optional report action, and a simple vertical bar/time-series visualization.
4. Supporting analytics use a horizontal grid: a larger revenue-by-device donut panel beside a narrower traffic summary panel.
5. Spacing is generous, content is aligned to a consistent left edge, and surfaces avoid dense borders.

## Component mapping for AlexOS

- Preserve AlexOS identity and Auren language; do not copy the reference wordmark or product name.
- Apply the reference's light canvas, surface hierarchy, KPI-first information architecture, and horizontal analytics composition only to authenticated dashboard surfaces.
- Keep the mobile dashboard as a dedicated stacked summary with compact KPI blocks and a single priority/action surface.
- Keep all public DailyGear storefront routes and customer-facing funnel components unchanged.

## Implementation constraints

The implementation must use existing AlexOS components and live data where available. It must not introduce fictional ecommerce metrics, payment actions, or ad performance numbers. Existing Auren evidence, freshness, confidence, and read-only labels remain authoritative.
