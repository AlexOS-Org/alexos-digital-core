# AlexOS Orion Architecture

## Architectural intent

AlexOS is a responsive web application with Supabase as the application data layer. The UI should remain modular, typed, and driven by live data rather than duplicated local business logic.

## Current stack

```text
React + TypeScript
        ↓
TanStack Router / Start
        ↓
React Query data access
        ↓
Domain APIs / typed models
        ↓
Supabase
        ↓
Postgres + Auth + future integrations
```

Styling and interaction are built with Tailwind CSS, shadcn/Radix UI components, Lucide icons, and Recharts where charts genuinely add decision value.

## Domain boundaries

### Dashboard
Command-center composition only. It should surface important information from domain modules rather than becoming a second source of truth.

### CRM
Contacts, leads, pipeline stages, customer activities and follow-up context.

### Money Center
Accounts, transactions, income, expenses, transfers, budgets, expected money, debts and financial summaries.

### Business modules
DailyGear, Vehicle Sales, BFSUMA, Marketing and future business-specific workflows.

### Orion
A decision/intelligence layer that consumes approved domain signals and produces explanations, priorities, recommendations and proposed actions. Orion should not silently mutate important financial or external records.

## Revenue data flow

```text
Lead source
  ↓
CRM lead
  ↓
Qualification / stage
  ↓
Follow-up task
  ↓
Opportunity value + probability
  ↓
Sale / outcome
  ↓
Revenue + cost
  ↓
Profit
  ↓
Orion insight
```

## External signal flow

```text
Gmail / Facebook / Ads / Market sources
                 ↓
          Signal normalization
                 ↓
          Permission + filtering
                 ↓
              Orion
                 ↓
       Proposed task / CRM update
                 ↓
             User approval
                 ↓
          Domain record update
```

## Data safety

- Prefer existing domain APIs/hooks over direct database access in UI components.
- Keep business calculations close to their domain.
- Reuse shared money formatting and typed models.
- Avoid schema changes for UI-only improvements.
- Review migrations before changing database behavior.
- Protect authenticated data and keep private routes out of public indexing.

## Mobile architecture principle

Mobile is a first-class layout target. Horizontal collections may use swipe/scroll where it reduces vertical page length, while critical actions remain obvious and accessible.

## Validation contract

Before publishing meaningful changes:

```bash
npm run lint
npm run build
```

Then inspect the rendered application at desktop and phone sizes and check browser/runtime errors.
