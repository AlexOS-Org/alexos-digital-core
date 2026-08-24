# AlexOS Source of Truth

## Purpose

This document defines the canonical development model for AlexOS. The goal is one coherent application across GitHub, local development, Supabase and Cloudflare, with independent review instead of competing implementations.

## Canonical source

- **Repository:** `dylextrends/alexos-digital-core`
- **Canonical branch:** `main`
- **GitHub main is the source of truth for application code and version-controlled database migrations.**
- Local clones are working copies, not independent sources of truth.
- Do not recover or merge legacy local clones merely because they contain older code.

## Agent responsibilities

### ChatGPT — architecture and primary implementation

ChatGPT is responsible for:

- architecture and product decisions;
- implementing approved features in GitHub;
- inspecting existing code before changing it;
- preserving working functionality;
- preventing duplicate systems and competing data models;
- creating/versioning Supabase migrations when schema changes are needed;
- documenting important decisions;
- coordinating final acceptance after independent review.

### Cline — local execution and synchronization

Cline is responsible for:

- cloning/pulling GitHub `main` into the canonical local workspace;
- keeping the local tree synchronized with GitHub;
- running local development, lint, typecheck, build and focused tests;
- implementing explicitly assigned local tasks;
- reporting blockers instead of inventing architectural alternatives;
- committing and pushing only approved changes.

Cline must not treat old local clones, Lovable projects or stale branches as sources of truth.

### Claude — independent senior review

Claude is responsible for adversarial review across the connected GitHub, Supabase and Cloudflare environments:

- architecture and data-flow review;
- duplicate/dead functionality detection;
- financial logic validation;
- security/RLS review;
- UX and accessibility review;
- responsive/mobile review;
- performance and deployment review;
- user journey and edge-case testing;
- recommendations for fixes and prioritization.

Claude should review and recommend rather than create a competing application architecture. Any implementation recommendation returns to GitHub/main through the controlled workflow.

## Controlled development loop

1. ChatGPT inspects the current GitHub/Supabase state and implements approved architecture/features in `main`.
2. Cline synchronizes the canonical local workspace from GitHub `main` and validates the local build/test state.
3. Claude independently audits GitHub, Supabase and Cloudflare against the current `main` commit.
4. Claude reports findings using the severity and acceptance format in `docs/CLAUDE_REVIEW_PROTOCOL.md`.
5. ChatGPT decides which findings are required, recommended or rejected with rationale.
6. Approved changes are implemented on GitHub `main` (or a reviewed PR that is merged to `main`).
7. Cline pulls the resulting `main` and performs the local verification.
8. Supabase schema changes are applied only from the corresponding version-controlled migration.
9. Cloudflare is deployed only from a verified build/commit.
10. No environment is allowed to become an independent source of truth.

## Environment model

```text
                         CHATGPT
                 architecture + implementation
                            |
                            v
                   GITHUB / main
                  canonical source
                     /          \
                    /            \
                   v              v
                CLINE          CLAUDE
             local execution   independent audit
                   |              |
                   +------>------+
                           |
                           v
                    approved changes
                           |
                           v
                    GITHUB / main
                           |
                           v
                       SUPABASE
                    versioned schema
                           |
                           v
                      CLOUDFLARE
                       deployment
```

## Database rule

Supabase is the runtime database/backend, but schema changes must be represented by migrations in GitHub. Do not make undocumented manual schema changes and assume the repository will catch up later.

## Product identity

- Product/platform: **AlexOS**
- Primary dashboard: **Command Center**
- In-product AI: **Auren**
- **Retired AI naming is not permitted and must not be reintroduced.**
- Lovable is retired from the architecture. Do not reintroduce Lovable dependencies, URLs, configuration wrappers or runtime assumptions.

## Financial architecture

AlexOS models personal finances and businesses as connected but distinct scopes.

A business can receive revenue, pay COGS and operating expenses, generate profit, retain cash and transfer money to the owner. A business-to-personal transfer is movement of already-earned money, not a second expense or new consolidated income.

Personal income includes salary, commission, business profit/owner distribution, personal deals, gifts, investments, refunds and other income.

Business income includes sales revenue and other operating income.

Business expenses include COGS, packaging, delivery, logistics, advertising, platform fees, supplier costs, payroll, rent, utilities, tax, interest and other operating costs. Personal living, education, health and transport remain personal expenses unless deliberately assigned to a business.

Loans are financing, not income. Debt principal movement is financing; interest is a separate cost.

Target net worth:

**Net Worth = Cash + Owned Assets + Qualifying Receivables/Expected Money - Outstanding Liabilities**

Personal and business net worth must remain separately inspectable as well as consolidated.

## Dashboard principles

### AlexOS Command Center

The user should immediately understand:

- total net worth;
- personal net worth;
- business net worth;
- personal/business cash;
- personal/business debt;
- current-period income and expenses;
- operating profit;
- expected/upcoming money;
- alerts;
- Auren recommendations;
- clear next actions.

The Command Center should prioritize decisions and actions over decorative charts.

### Business dashboards

Each business should expose a coherent operating view: revenue, COGS, gross profit, operating expenses, advertising, delivery/logistics, operating profit, cash, debt, assets/inventory, sales/orders where applicable, marketing performance, customer signals, research/recommendations and actions requiring attention.

DailyGear should retain its existing commerce capabilities and connect them to the financial business dimension rather than duplicating financial systems.

## Visual direction

The Command Center should support a 4K-friendly mountain hero/background with a user-changeable background. Do not hard-code arbitrary third-party image URLs into the database. Prefer a controlled asset/configuration mechanism with readable overlays and responsive fallbacks.

## Empty-data principle

AlexOS is intentionally starting fresh. Do not seed fake transactions, accounts, businesses, debts, orders or test records merely to make dashboards appear populated. Empty states must be useful and action-oriented.

## Change-control rules

1. Inspect before modifying.
2. Prefer extending existing functionality over creating parallel functionality.
3. Do not duplicate existing business, finance, marketing, checkout or dashboard logic.
4. Do not silently change accounting semantics.
5. Do not reintroduce Lovable or retired AI naming.
6. Do not make production database changes without a versioned migration.
7. Do not deploy broken builds.
8. When uncertain, stop and report the conflict rather than guessing.
9. Keep GitHub `main` coherent and buildable.
10. Local cleanup must be done by synchronizing from GitHub, not by recovering random old clones.
11. Claude findings must be evaluated against the current `main` commit, not against an older local clone.
12. No agent may silently create a second implementation of an existing domain capability.

## Acceptance gate

A feature is not complete until:

- the code exists in GitHub `main`;
- database changes have a corresponding migration;
- types/contracts are synchronized;
- lint/typecheck/build pass where applicable;
- the main user flow is manually or programmatically tested;
- Claude's independent audit findings are addressed or explicitly accepted;
- no duplicate implementation has been introduced.
