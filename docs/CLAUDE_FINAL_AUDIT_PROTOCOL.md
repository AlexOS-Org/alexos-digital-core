# Claude Final Audit Protocol

Claude is the independent senior reviewer for AlexOS. Review GitHub `main`, the connected Supabase project and Cloudflare deployment as one system. Do not treat old local clones or legacy Lovable projects as sources of truth.

## Review order
1. Establish GitHub `main` commit and working tree state.
2. Inspect repository architecture, routes, modules, services, migrations and configuration.
3. Compare the application schema/migrations against Supabase runtime schema.
4. Inspect Cloudflare build/deployment configuration and current deployment state.
5. Identify duplicate, dead, conflicting or legacy implementations.
6. Validate the end-to-end personal/business financial flow.
7. Validate Command Center and each business dashboard for clarity and actionability.
8. Validate Auren naming and ensure Orion/Lovable are not reintroduced.
9. Validate empty-data behavior without requiring seeded fake records.
10. Run or inspect build/lint/typecheck/test evidence where available.

## Financial flow to test
- Personal income: salary, commission, business profit/owner distribution, personal deal, gift, investment, refund, other.
- Business income: sales revenue and other operating income.
- Business costs: COGS, packaging, delivery, logistics, advertising, platform fees, suppliers, payroll, rent, utilities, tax, interest and other costs.
- Business-to-personal transfers must not become duplicate expenses or duplicate consolidated income.
- Loans are financing, not income. Principal is financing movement; interest is a separate cost.
- Net worth must reconcile as cash + owned assets + qualifying receivables/expected money - outstanding liabilities.
- Personal and business net worth/debt must be separately inspectable and also consolidatable.

## DailyGear review
Confirm existing commerce capabilities remain intact and are connected to the financial business dimension rather than duplicated. Review sales, orders, inventory, customers, marketing, advertising, delivery/logistics, gross profit and operating profit together.

## Command Center review
The first screen should answer:
- What is my net worth?
- How much personal/business cash do I have?
- What debt needs attention?
- How are my businesses performing?
- What changed?
- What needs attention today?
- What should I do next?
- What does Auren recommend and why?

Review the 4K-friendly mountain hero/background concept and user-changeable background without accepting arbitrary hard-coded external image URLs.

## Security review
Check RLS, grants, server/client boundaries, secrets, Supabase functions, authentication/authorization, exposed data, unsafe SECURITY DEFINER patterns and Cloudflare environment configuration. Distinguish new blockers from pre-existing warnings.

## Legacy cleanup review
Search for:
- Orion
- Lovable imports/dependencies/configuration/URLs
- duplicate business identity systems
- duplicate financial calculation paths
- duplicate checkout implementations
- obsolete migrations or dead code that conflicts with the current architecture

Do not delete functionality merely because it is old. First establish whether it is referenced or provides unique required behavior.

## Output
Return:
1. EXECUTIVE VERDICT — PASS / PASS WITH FIXES / BLOCKED
2. Critical blockers
3. High-priority fixes
4. Medium/low recommendations
5. Confirmed working functionality
6. Duplicate/dead functionality found
7. Financial reconciliation findings
8. Supabase findings
9. Cloudflare/deployment findings
10. UX/accessibility findings
11. Exact files/components/migrations needing changes
12. Recommended implementation order
13. Final release checklist

Do not make destructive changes while auditing. If a change is required, describe the exact change and why it belongs in GitHub `main`.
