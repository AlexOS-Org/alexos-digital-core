# AlexOS Phase 3 Readiness

## Purpose

This branch is the controlled handoff into Phase 3. The application identity is **AlexOS**. The primary experience is **Command Center** and the intelligence capability is **AlexOS Intelligence**.

## What is ready

- AlexOS branding cleanup is carried forward from the validated branding branch.
- The root document shell preserves `HeadContent`, route children, scripts, authentication invalidation, theme handling, and Supabase integration.
- Command Center remains the primary authenticated dashboard.
- Money Center remains protected and is not changed by the Phase 3 module workbench.
- Tasks, Calendar, E-Commerce, Marketing, Vehicle Sales, Banking, and Reports now have a testable V1 workspace instead of placeholder-only screens.
- The temporary V1 workspace stores only test entries in browser local storage and does not alter core financial data.

## Phase 3 priorities

1. Validate the current production build on desktop and mobile.
2. Build the revenue pipeline: **lead → follow-up → sale → profit**.
3. Make Mission & Tasks derive from real priorities and revenue opportunities.
4. Add approved business Gmail signals and important-email triage.
5. Add Facebook business-page signals.
6. Add Market & Ad Intelligence.
7. Add SEO and acquisition measurement.
8. Build monetization and growth capabilities after the revenue loop is proven.

## Validation contract

Before merging or deploying meaningful Phase 3 changes:

```bash
npm run lint
npm run build
```

Then verify:

- authenticated routing;
- Command Center rendering;
- Money Center behavior;
- Supabase reads/writes and RLS assumptions;
- desktop layout;
- mobile layout and horizontal overflow;
- light/dark/system themes;
- browser/runtime errors;
- production deployment behavior.

Do not claim a check passed unless it was actually run against the current working tree.

## Engineering rule

Phase 3 should be revenue-first. Prefer work that creates revenue, improves conversion, protects cash/profit, saves meaningful time, or materially improves a business decision. Decorative work remains secondary until the revenue operating loop is functional.
