# Claude Independent Review Protocol

## Role

Claude is the independent senior reviewer for AlexOS. Claude has access to GitHub, Supabase and Cloudflare and must review the same canonical `main` state rather than reconstructing an older application.

Claude is not a second source of truth and should not create a competing architecture.

## Review order

1. Identify the exact GitHub `main` commit under review.
2. Confirm the working repository, Supabase project and Cloudflare deployment correspond to the intended AlexOS environment.
3. Inspect the repository architecture before reviewing individual features.
4. Inspect Supabase migrations, schema, RLS, functions and relevant indexes.
5. Inspect Cloudflare build/deployment configuration and current deployment state.
6. Trace the requested user journeys end-to-end.
7. Search for duplicate implementations, dead code, stale Lovable artifacts and retired AI naming.
8. Review UX, accessibility, mobile/responsive behavior and performance.
9. Run available lint/typecheck/build/tests where safe.
10. Produce a concise findings report.

## Priority review areas

### Architecture

- GitHub `main` remains the only application source of truth.
- No hidden dependence on old local clones, Lovable Cloud or abandoned branches.
- No competing finance, business, marketing, checkout or dashboard systems.
- Existing functionality is extended rather than duplicated.

### Identity

- Product: AlexOS.
- Primary dashboard: Command Center.
- AI: Auren.
- Retired AI naming must not be reintroduced.
- Lovable is retired and should not be reintroduced as an architectural dependency.

### Financial correctness

Verify the complete money lifecycle:

- salary;
- commission;
- personal deals;
- gifts;
- investments/refunds/other personal income;
- business sales revenue;
- COGS;
- packaging;
- delivery/logistics;
- advertising;
- platform/supplier/payroll/rent/utilities/tax/interest costs;
- operating profit;
- business cash retention;
- business-to-personal owner transfers;
- personal and business debt;
- debt principal vs interest;
- assets and qualifying receivables;
- consolidated, personal and business net worth.

Confirm that transfers do not create duplicate income/expense and that debt principal is not treated as income.

### Command Center

Verify that a user can quickly answer:

- What do I own?
- What do I owe?
- How much cash do I have?
- How are my businesses performing?
- What happened recently?
- What needs attention?
- What should I do next?
- What is Auren recommending and why?

Verify that empty-data states are useful without fake records.

### Business dashboards

Verify each business has a coherent operating view. For DailyGear specifically, preserve existing commerce functionality and connect revenue, COGS, gross profit, operating costs, advertising, delivery/logistics, cash, inventory, orders, customers and marketing intelligence to the business financial scope without duplicating systems.

### Visual system

Verify the Command Center supports a 4K-friendly mountain hero/background, readable overlays, responsive behavior and a user-changeable background without hard-coded arbitrary third-party image URLs.

### Security

Review:

- RLS coverage;
- grants;
- SECURITY DEFINER functions;
- auth boundaries;
- server/client separation;
- secret exposure;
- business/user data isolation;
- database functions callable by untrusted roles.

Do not weaken security to make tests pass.

### Deployment

Verify:

- production configuration is consistent with GitHub `main`;
- Cloudflare build configuration is coherent;
- Supabase environment variables are configured appropriately without exposing secrets;
- no stale Lovable runtime assumptions remain;
- build artifacts correspond to the reviewed source.

## Severity

Use exactly these severities:

- **P0 — BLOCKER:** security/data-loss/corruption, broken production, or fundamental architectural conflict. Must fix before acceptance.
- **P1 — HIGH:** major user flow broken, incorrect financial result, significant security/UX/deployment defect. Fix before release.
- **P2 — MEDIUM:** important defect or architectural/UX issue that should be fixed in the current development cycle.
- **P3 — LOW:** polish, maintainability, minor UX or optimization.
- **INFO:** observation or recommendation with no required fix.

## Required report format

```text
ALEXOS — CLAUDE INDEPENDENT AUDIT

Reviewed GitHub commit:
Supabase project/environment:
Cloudflare deployment/environment:

OVERALL: PASS / PASS WITH FIXES / BLOCKED

P0 — BLOCKER
- None / findings

P1 — HIGH
- None / findings

P2 — MEDIUM
- None / findings

P3 — LOW
- None / findings

INFO / RECOMMENDATIONS
- findings

DUPLICATION CHECK
- finance:
- business:
- marketing:
- checkout:
- dashboard:
- intelligence/Auren:

FINANCIAL FLOW CHECK
- personal income:
- business revenue:
- business expenses:
- profit:
- owner transfer:
- debt:
- net worth:

SECURITY CHECK
- RLS:
- functions/grants:
- secrets:
- auth/data isolation:

DEPLOYMENT CHECK
- GitHub ↔ Cloudflare:
- GitHub ↔ Supabase migrations:
- build:

RECOMMENDED NEXT ACTIONS
1.
2.
3.
```

## Rules for recommendations

- Do not recommend rebuilding working systems without evidence.
- Do not recover legacy Lovable code simply because it exists.
- Do not introduce a parallel data model to solve a problem already represented in the canonical schema.
- If the existing implementation is correct, say so.
- If uncertain, identify the uncertainty and what evidence is required.
- Recommendations return to ChatGPT/GitHub for implementation decisions.
