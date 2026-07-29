# AlexOS Orion

AlexOS is a personal and multi-business revenue operating system. Orion is the intelligence layer inside AlexOS.

## Product purpose

AlexOS is being built first for Alex to help him **make money, protect money, save time, and make better business decisions** across his personal life and businesses.

The long-term product loop is:

**Market → Decide what to sell → Choose customer → Choose offer/ad → Capture lead → Follow up → Close sale → Record profit → Learn → Improve the next decision**

## Current stack

- Vite + React + TypeScript
- TanStack Router / TanStack Start
- React Query
- Supabase
- Tailwind CSS + shadcn/Radix UI
- Recharts
- Zod

## Current product areas

- Dashboard / Command Center
- Orion Intelligence
- Today's Mission
- Revenue Command Center
- CRM / Contacts / Leads
- Money Center
- Accounts / Transactions / Budgets / Expected Money / Debts
- Business Snapshot
- Vehicle Sales foundation
- DailyGear foundation
- Marketing foundation

## Development workflow

We work from the repository as the source of truth.

1. Inspect before changing anything.
2. Protect working features and database behavior.
3. Implement the smallest useful change.
4. Run lint and production build when the local environment is available.
5. Review desktop and mobile behavior.
6. Commit intentionally.
7. Review the diff and only then publish/merge.

Do not treat generated code, AI summaries, or old plans as authoritative over the repository.

## Revenue-first principle

Every major feature should do at least one of these:

- create revenue;
- improve conversion;
- protect cash/profit;
- save meaningful time;
- improve a business decision.

Nice-to-have polish belongs in the backlog until the revenue engine is working.

## Phase 3 direction

The current Phase 3 workspace is focused on turning the dashboard into a real command center and moving toward a revenue operating system.

Priority order:

1. Validate the current build.
2. Revenue Pipeline: lead → follow-up → sale → profit.
3. Mission & Tasks based on Alex's actual priorities.
4. Business Gmail signals and important-email triage.
5. Facebook business-page signals.
6. Market & Ad Intelligence.
7. SEO and acquisition.
8. Monetization and growth.

See `docs/` for the project handbook, architecture, roadmap, backlog, revenue model, and SEO plan.

## Validation commands

```bash
npm run lint
npm run build
```

Do not claim validation success unless these checks have actually been run in the current working tree.
