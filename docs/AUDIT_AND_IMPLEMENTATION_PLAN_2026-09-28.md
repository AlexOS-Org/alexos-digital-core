# AlexOS Multi-Business Operating System — Read-Only Audit & Implementation Plan

**Date:** 2026-09-28
**Status:** Phase 2 audit complete — awaiting user approval before implementation
**Repository:** `AlexOS-Org/alexos-digital-core`
**Baseline HEAD:** `8f7ba64` (local, post-sync with origin/main `aebf67f`)

---

## 1. Current State

### 1.1 Architecture Overview

AlexOS currently operates as a **single-business-per-user** model disguised as multi-business. The codebase contains three "businesses" — DailyGear (full), CarBar Motion (stub), and Novera (stub) — but there is no hostname-based business routing, no business selection at startup, and no true business context propagation beyond a `financial_scope` enum on Money Center records (`"personal" | "business"`).

The system is a React/Vite SSR app deployed as a single Cloudflare Worker. Authentication is handled via Supabase Auth. Data access is RLS-scoped by `user_id`. Business attribution is tracked via `business_id` (nullable UUID) and `business_name` (text) columns on Money Center tables, but the `businesses` table exists in the database and is being reconciled from legacy text keys to UUID.

### 1.2 Key Findings Summary

| Area | Current State | Gap |
|------|--------------|-----|
| Business identity model | `public.businesses` table exists in DB, referenced in `advisor.server.ts` queries | NOT in generated `types.ts`; app code has no typed `Business` model; name hardcoded in multiple places |
| Hostname routing | None — pure TanStack Router file-based paths | No `cbm.dailygear.co.ke` or `novera.dailygear.co.ke` resolution |
| DailyGear | Fully implemented e-commerce, fulfillment, Meta ads sync, M-Pesa, Auren KPIs | Data not joined to business_id; profit-cash-flow filters `financial_scope = "business"` but not `business_id` |
| CarBar Motion | 6-line stub route (`/vehicle-sales`) using `ModuleWorkbench mode="vehicle"` | No vehicle inventory, financing, or sales pipeline data |
| Novera | Placeholder route (`/businesses/novera`) using `AlexOSRoadmapModule` | Named "Nuvora" in 9+ files (stale name); no business context |
| Storefront isolation | One storefront per user (`dg_storefronts` has single row per `user_id`) | Cannot host Novera or CarBar storefronts; brand hardcoded to DailyGear |
| Money Center cross-business | `financial_scope` enum exists; `business_id` column exists but filters by text, not UUID | No business-scoped Money Center views |
| Auren public context | `AurenPublicContextRecord` hardcodes `"DailyGear" | "CarBar Motion" | "Nuvora"` | Name typo; not derived from DB |
| Reconciliation | Two migration scripts exist (prepare + activate UUID) | `02_activate_businesses_uuid.sql` not yet deployed (guarded) |

### 1.3 Stale Naming Issue: "Nuvora" vs "Novera"

The approved business name is **"Novera"**. The codebase contains the stale name **"Nuvora"** in:

- `src/lib/modules.ts:71` — module title and description
- `src/lib/auren/public-context.ts:5,53,61,62` — type union and context record
- `src/routes/_authenticated/businesses.tsx:20,47,49` — workspace name and route check
- `src/routes/_authenticated/businesses.novera.tsx:6,8,12,15,16` — component name and page title
- `src/routes/_authenticated/route.tsx:104` — conditional business title
- `src/lib/branding.test.ts:23` — test assertion
- `src/lib/auren/public-context.test.ts:14` — test assertion
- `src/lib/auren/data-readiness.test.ts:53` — test data
- `supabase/migrations/20260805042235_*.sql:15` — seed data `('nuvora', 'Nuvora')`

The `reports/` directory also references "Nuvora" in audit documents, noting the naming mismatch as a known issue.

### 1.4 Money Center: Business Scope Without Business ID

The `financial_scope` column on `accounts`, `transactions`, `bills`, `budgets`, `debts`, and `expected_money` is an enum (`personal` | `business`). The `business_id` column exists on `accounts`, `transactions`, `bills`, `budgets`, and `expected_money` (as nullable UUID). However:

- `src/lib/money/api.ts:21,53,85` — TypeScript interfaces define `financial_scope` and `business_id` but no typed `Business` model
- `src/lib/money/fuliza-ensure.ts:13,66,70` — reads `business_id` and `business_name` when creating expense transactions for account maintenance
- `src/routes/_authenticated/money-center.transactions.tsx:98,257` — displays `financial_scope` as text, not business name
- `src/routes/_authenticated/money-center.bills.tsx:125` — sets `expense_scope` from `financial_scope`
- `src/components/dashboard/MoneySnapshot.tsx:46-65` — separates personal/business cash and debt but uses `financial_scope` enum, not `business_id`

There is **no business-scoped Money Center view** — the Money Center shows all businesses mixed together with a personal/business binary toggle at best.

### 1.5 DailyGear → Money Center Integration

DailyGear's profit-cash-flow engine (`src/lib/dailygear/profit-cash-flow.server.ts`) queries `transactions` filtered by `financial_scope = "business"` to find business operating expenses not already linked to specific orders. This is the only business-scoped query, but it does NOT filter by `business_id` — it would pick up transactions from ALL businesses if multiple existed.

DailyGear order payments (`dg_order_payments`) create `transactions` records with `business_id` and `financial_scope`, but the Auren advisor reads all transactions by `user_id` without business filtering unless `businessId` is explicitly passed.

### 1.6 Storefront Architecture

- `src/lib/storefront/api.ts` — `useAdminStorefront()` loads a single storefront by `user_id` (no `business_id` filter); the optional `slug` parameter exists in the type but is NOT used in the query
- `src/lib/storefront/brand.ts` — only DailyGear logo/name
- `src/components/dailygear/DailyGearBrand.tsx` — DailyGear-only brand display component
- Protected public storefront files: `src/routes/shop.*`, `src/routes/funnel.$slug.tsx`, `src/components/storefront/*`, `src/styles.css`, `public/storefront/*`

### 1.7 Module Registry & Navigation

- `src/lib/modules.ts` — static module registry; businesses appear under `group: "Businesses"`; Novera and CarBar are marked "Roadmap preview"
- `src/components/app-sidebar.tsx` — renders `DAILYGEAR_SECTIONS` context when path starts with `/e-commerce`; renders `MONEY_CENTER_SECTIONS` for `/money-center` paths; no business context awareness
- `src/components/modules/ModuleWorkbench.tsx` — generic workbench with modes (tasks, calendar, ecommerce, marketing, vehicle, banking, reports) — each mode is a placeholder or local-storage demo
- Bottom nav: `Dashboard`, `Businesses`, `Auren`, `Money`, `Library`

### 1.8 Data Layer

- Supabase client: `src/integrations/supabase/client.ts` — runtime config hydration from worker env
- Generated types: `src/integrations/supabase/types.ts` — **missing `businesses` table type** (reconciliation scripts are migrating from legacy text keys to UUID, not yet complete)
- Reconciliation scripts in `supabase/reconciliation/` are NOT migrations — they are manual runbooks for controlled post-migration activation
- Server entry: `src/server.ts` — Cloudflare Worker with env keys (MPESA, META, DAILYGEAR_*); no hostname routing or business context

### 1.9 Deployment

- `wrangler.jsonc` — Worker named `alexos-business-os`; crons at 3 AM, every 30 min, 5 PM
- `src/routes/_authenticated/route.tsx` — authentication gate (`isAuthorizedAlexOSUser`); no business selection
- Vite config: no basepath or hostname routing
- Protected: `src/routes/shop.*`, `src/routes/funnel.$slug.tsx`, `src/components/storefront/*`, `src/styles.css`, `public/storefront/*` (asserted by `scripts/assert-public-storefront-untouched.mjs`)

### 1.10 Test Coverage

- DailyGear profit/cash-flow: unit tests for calculation logic
- Money Center: tithe calculations, expected money, currency safety
- Dashboard: trend rail tests
- Auren: advisor server, public-context, data-readiness tests
- Branding tests reference stale "Nuvora" name

---

## 2. Business Identity Model

### 2.1 Current State

The database has a `public.businesses` table with columns: `id (uuid)`, `user_id`, `name`, `slug`, `status`. The reconciliation scripts show this table was recently migrated from storing text keys (`'dailygear'`, `'nuvora'`, `'carbar_motion'`) to UUID primary keys with owner-scoped isolation.

However, the generated `types.ts` does NOT include the `businesses` table type. The app code that queries businesses (in `advisor.server.ts:710-713`) uses `.from("businesses")` with inline types, bypassing the generated types.

### 2.2 Gap

No application-level `Business` model exists. The `AurenBusinessRecord` interface in `advisor.server.ts` (lines 29-34) is the closest thing, with `id`, `name`, `slug`, `status` — but it's Auren-specific, not a shared app model.

### 2.3 Requirement

Create a shared `Business` model in the app that:
- References the `public.businesses` table
- Is owner-scoped by `user_id` (RLS)
- Has `id`, `name`, `slug`, `status`, `default_hostname` (nullable)
- Is typed and included in generated types after reconciliation completes

---

## 3. Hostname Resolution

### 3.1 Current State

There is no hostname-based routing anywhere in the codebase. The Cloudflare Worker (`src/server.ts`) serves the same application for all hostnames. TanStack Router routes are purely path-based:
- `/e-commerce/*` → DailyGear
- `/vehicle-sales` → CarBar Motion (stub)
- `/businesses/novera` → Novera (placeholder)
- `/money-center/*` → Money Center (shared)
- `/people/*` → CRM (shared, personal only)
- `/dashboard` → Command center
- `/auren` → Auren AI advisor

### 3.2 Gap

There is no mechanism to resolve `cbm.dailygear.co.ke` → CarBar Motion, `novera.dailygear.co.ke` → Novera, or `app.alexos.co.ke` → portfolio dashboard. No middleware injects a `BusinessContext` into the request lifecycle.

### 3.3 Requirement

Add hostname → business resolution at the Cloudflare Worker entry point (`src/server.ts`):
- Middleware that reads `request.cf.hostname` (or `Host` header)
- Resolves hostname to a `business_id` from the `businesses` table (requires a `domain` or `hostname` column — may need to be added via a NEW migration, not the reconciliation scripts)
- Injects `businessContext` into the request, available to TanStack Router context and Auren
- Falls back to portfolio/dashboard mode for the apex domain (`app.alexos.co.ke` or localhost)

---

## 4. Module Architecture

### 4.1 Current State

`src/lib/modules.ts` defines a static array of modules with `title`, `url`, `icon`, `description`, `group`. Modules are either "Roadmap preview" (stub) or fully implemented (DailyGear e-commerce, Money Center, CRM/People, Auren, Goals, Settings).

Module groups: `Home | Businesses | Money | Auren | Growth | Library | Missions | Notifications | System`.

Each module maps to a route file under `src/routes/_authenticated/`. The module registry is imported by `src/components/app-sidebar.tsx` to render navigation.

### 4.2 Gap

- Modules are static; there is no dynamic module loading based on business context
- CarBar Motion and Novera modules are placeholders
- The sidebar shows DailyGear sections context only for `/e-commerce` prefix
- No mechanism for per-business module visibility or ordering

### 4.3 Requirement

Design a dynamic module registry that:
- Returns different modules based on the active business context
- Maps business slugs to their feature modules (e.g., `dailygear` → ecommerce sections, `carbaramotion` → vehicle sales, `novera` → [TBD])
- Preserves the shared core modules (Money Center, Auren, Goals, People, Library, Settings) across all businesses
- Allows adding new business modules without code changes (configuration-driven where possible)

---

## 5. DailyGear — Fully Live Business

### 5.1 Current State

DailyGear is the only fully implemented business with:

- **Products** (`dg_products`): full CRUD with variants, categories, brands, images, SEO, stock tracking
- **Orders** (`dg_orders`, `dg_order_items`): placement, payment tracking, status lifecycle, refunds
- **Inventory** (`dg_inventory`): purchase cost tracking, cost types
- **Funnel** (`dg_funnel_events`): Meta Pixel event tracking, checkout funnel
- **Fulfillment** (`dg_order_expenses`, `dg_order_payments`): shipping costs, delivery payments
- **M-Pesa integration** via Cloudflare Worker secrets: `MPESA_*`, `DAILYGEAR_*` prefixed vars
- **Meta Ads Manager sync** via `src/server/meta/dailygear-ads-manager-sync.ts`: fetches ad accounts, campaigns, adsets, ads, insights via Meta Graph API
- **Profit/Cash Flow engine** (`src/lib/dailygear/profit-cash-flow.ts` + `.server.ts`): calculates revenue, COGS, gross profit, ad spend, delivery costs, supplier payments, operating profit, cash received, cash outflows, net cash flow, daily snapshots, currency safety
- **Auren KPI** (`src/lib/dailygear/auren-kpi.server.ts`): snapshots product count, low stock, orders, revenue, AOV with AI summary via `@cf/meta/llama-3.2-3b-instruct`
- **Revenue recognition** in `src/routes/_authenticated/e-commerce.index.tsx`: links order payments to transactions with `business_id`, `business_name`, `financial_scope = "business"`

### 5.2 Gap

- DailyGear data is scoped by `user_id` only — not by `business_id`
- Profit-cash-flow engine queries `transactions` by `financial_scope = "business"` but does not filter by `business_id`, meaning it would pick up ALL business transactions if multiple businesses existed
- The DailyGear storefront reads from `dg_storefronts` by `user_id` only (single store per user)
- Auren KPI checks `selectedBusiness.slug` and `selectedBusiness.name` containing "dailygear" to determine if products/orders apply — this is string matching, not a proper business-type check

### 5.3 Requirement

- Add `business_id` column to DailyGear tables (`dg_products`, `dg_orders`, `dg_order_items`, `dg_order_expenses`, `dg_order_payments`, `dg_inventory`, `dg_customers`) — requires new migration
- Update profit-cash-flow engine to filter by `business_id` instead of or in addition to `financial_scope = "business"`
- The `public.storefront` and `public.shop` routes for DailyGear must remain untouched (protected files)
- Ensure DailyGear Auren KPI detection uses business type or slug, not substring matching

---

## 6. CarBar Motion — Vehicle Business (Stub)

### 6.1 Current State

CarBar Motion is a 6-line stub route:

```typescript
// src/routes/_authenticated/vehicle-sales.tsx
export const Route = createFileRoute("/_authenticated/vehicle-sales")({
  component: () => <ModuleWorkbench mode="vehicle" />,
});
```

`ModuleWorkbench` in vehicle mode renders a local-storage demo for vehicle inventory with no real data connections.

### 6.2 Gap

- No vehicle-specific tables in the database
- No vehicle data APIs
- No business-specific Money Center or CRM integration for vehicle sales
- No financing or sales pipeline data

### 6.3 Requirement

Implement a proper business module scaffold:
- Vehicle inventory management (vehicles as products with VIN, make, model, year, mileage, condition, price)
- Sales pipeline (leads → quotes → financing → sale)
- Vehicle-specific expenses (acquisition, reconditioning, holding costs)
- Integration with Money Center: vehicle purchases as expenses, sales as income with `business_id` linkage

---

## 7. Novera — Service Business (Placeholder)

### 7.1 Current State

Novera is a placeholder route using `AlexOSRoadmapModule` with title "Nuvora" (stale name). The route is at `/businesses/novera` — note the URL uses the correct name "novera" but the display name and component use the stale "Nuvora".

### 7.2 Gap

- No Novera-specific data model or tables
- No business context (no `business_id` linkage)
- Named "Nuvora" in 9+ files (naming drift issue)
- The `businesses.tsx` hub page hardcodes "Nuvora" as a workspace name

### 7.3 Requirement

- Rename all "Nuvora" → "Novera" across the codebase
- Build a proper Novera business module based on its service business nature (specific data model TBD from user)
- Wire up business context so Novera's money appears scoped in Money Center

---

## 8. Shared Core Services

### 8.1 Current State

The Money Center (`src/lib/money/`), CRM (`src/lib/crm/`), Goals (`src/lib/goals/`), and Auren (`src/lib/auren/`) are shared services accessed via TanStack Router path-based navigation. They are scoped by `user_id` via Supabase RLS.

Key shared service files:
- `src/lib/money/api.ts` — `Account`, `Transaction`, `Expected`, `Business` interfaces; `useAccounts()`, `useTransactions()`, `useAccountBalances()`, `useExpected()` hooks
- `src/lib/money/expected-money.ts` — `ExpectedIncomeContext` type; `buildReceivedExpectedTransaction()`
- `src/lib/money/fuliza-ensure.ts` — balance check + auto-create expense transactions
- `src/lib/money/constants.ts` — `EXPENSE_SCOPES`, income category mappings
- `src/lib/money/tithe-calculations.ts` — tithe calculation (PROTECTED, do NOT change)
- `src/lib/crm/api.ts` — `Contact`, `Lead` interfaces; `useContacts()`, `useLeads()` hooks scoped by `user_id`

### 8.2 Gap

- Money Center uses `financial_scope: "personal" | "business"` as the only business differentiator; `business_id` column exists but is not filtered in most queries
- CRM (`contacts`, `leads`) is personal-only — no `business_id` column, no business-scoped CRM
- Goals are personal-only (`financial_scope: "personal"` hardcoded in `contribute-ledger.ts:41,92,112`)
- No shared `BusinessContext` type that all services can consume

### 8.3 Requirement

- Extract a shared `BusinessContext` type (business ID, name, slug) that flows through the app
- Update Money Center queries to optionally filter by `business_id`
- Add `business_id` column to CRM tables (`contacts`, `leads`) — requires new migration
- Make Goals business-aware (business goals vs. personal goals)

---

## 9. Money Center Architecture

### 9.1 Current State

Money Center routes (`src/routes/_authenticated/money-center.*`):
- `money-center.index.tsx` — dashboard overview
- `money-center.accounts.tsx` — account management
- `money-center.transactions.tsx` — transaction list/edit
- `money-center.income.tsx` — income recording
- `money-center.expenses.tsx` — expense recording
- `money-center.bills.tsx` — bill management
- `money-center.budgets.tsx` — budget planning
- `money-center.expected.tsx` — expected income tracking
- `money-center.analytics.tsx` — charts and trends
- `money-center.transfers.tsx` — account transfers

`src/lib/money/registry.ts` defines the navigation sections. The `useTransactions({})` hook in `api.ts` fetches all transactions by `user_id` (with optional filters but no `business_id` filter).

Dashboard components:
- `MoneySnapshot.tsx` — shows cash available, personal/business split, debt, income/expenses, loan proceeds; computes `netWorth = cashAvailable - totalDebt`
- `BusinessSnapshot.tsx` — shows revenue, expenses, customers, leads, pipeline (from dashboard metrics)
- `computeDashboardMetrics()` in `calculations.ts` — computes `MoneyMetrics`, `BusinessMetrics`, `GoalMetrics`

### 9.2 Gap

- No business-scoped Money Center views
- `netWorth` = cash - debt only; no true balance sheet (assets - liabilities including inventory, vehicles)
- `BusinessSnapshot` reads from shared dashboard metrics, not business-specific data
- `useTransactions` doesn't support `business_id` filtering

### 9.3 Requirement

- Add `businessId` filter to `useAccounts()`, `useTransactions()`, `useAccountBalances()`, `useExpected()`, `useBills()`, `useDebts()`
- Create business-scoped Money Center views alongside portfolio views
- Extend net worth to include assets (inventory, vehicles) when in a business context
- The "Liquid Net Position" metric (`cashAvailable - totalDebt`) should become "Net Worth" = assets - liabilities when business assets are tracked

---

## 10. Auren Intelligence

### 10.1 Current State

Auren is an evidence-first AI advisory layer (`src/lib/auren/`, `src/components/auren/AurenPage.tsx`). It:

1. Fetches a dashboard snapshot (businesses, accounts, transactions, expected, bills, debts, goals, contacts, leads, DailyGear products/orders)
2. Builds deterministic signals via `src/lib/intelligence/signals.ts`
3. Optionally generates AI narrative via `@cf/meta/llama-3.2-3b-instruct`
4. Supports scopes: `"portfolio" | "personal" | "businesses"` and an optional `businessId`
5. When `businessId` is provided, filters transactions and expected money by `business_id`

Key files:
- `advisor.server.ts` — `buildAurenAdvisory()`, `getAurenAdvisoryForUser()` (server entry point)
- `public-context.ts` — `AurenPublicContextRecord` type with hardcoded business names including "Nuvora"
- `data-readiness.ts` — builds readiness signals from advisory JSON
- `decision-system.ts` — evidence-based decision records
- `capability-gateway.ts` — lists read-only capabilities

### 10.2 Gap

- `AurenPublicContextRecord.business` is a hardcoded string union including "Nuvora"
- `getAurenAdvisoryForUser` supports `businessId` filtering but the frontend (`AurenPage.tsx`) has no business selector — it passes `businessId: null` unless scope is "businesses" and user manually selects
- Auren KPI for DailyGear checks `selectedBusiness.slug/name` containing "dailygear" — string matching, not type checking
- Public context registry is a static array, not driven by the `businesses` table

### 10.3 Requirement

- Fix "Nuvora" → "Novera" in `public-context.ts`
- Add business type/role to the `Business` model (e.g., `"ecommerce" | "vehicle" | "service"`) so Auren can detect DailyGear without substring matching
- Drive `AurenPublicContextRecord` from DB data where possible
- Expose business selector in AurenPage when scope is "businesses"

---

## 11. Data Isolation & Security

### 11.1 Current State

- Supabase RLS policies scope everything by `user_id`
- DailyGear tables use `user_id + deleted_at` (soft delete) pattern
- Money Center tables have `user_id + financial_scope + business_id`
- CRM tables have `user_id` only (no `business_id`)
- `dg_storefronts` has `user_id` only (single store per user)
- Reconciliation scripts provide runbooks for migrating legacy text keys to UUID `business_id`

### 11.2 Gap

- No business-level data isolation — a user with multiple businesses sees all transactions mixed
- `business_id` is nullable and not all records have it set
- No cross-business data leakage prevention at the query level

### 11.3 Requirement

- Ensure `business_id` is populated on all money records for business-scoped data
- Add row-level business scoping (in addition to user scoping) via RLS where business context is available
- Prevent DailyGear public storefront from leaking business-2 data (protected files enforced)

---

## 12. Storefront & Public Presence

### 12.1 Current State

- DailyGear public storefront routes: `src/routes/shop.tsx`, `src/routes/shop.[slug].tsx`, `src/routes/funnel.$slug.tsx`
- Storefront components: `src/components/storefront/*`
- Brand: `src/lib/storefront/brand.ts` (DailyGear only)
- `useAdminStorefront()` loads one storefront per user; `slug` param is accepted but unused
- Protected files: `src/routes/shop.*`, `src/routes/funnel.$slug.tsx`, `src/components/storefront/*`, `src/styles.css`, `public/storefront/*`

### 12.2 Gap

- Single storefront per user model — cannot host Novera or CarBar storefronts
- Brand hardcoded to DailyGear

### 12.3 Requirement

- Extend storefront model to support multiple businesses per user (one storefront per business)
- Add `business_id` to `dg_storefronts` table (requires new migration)
- Make `useAdminStorefront` accept an optional `businessId` or `businessSlug`
- Create brand configuration per business (logo, name, colors)
- Keep DailyGear public storefront files UNTOUCHED (protected)

---

## 13. Exact Implementation Plan

### Phase 3: Naming Consolidation (Nuvora → Novera)
**Risk:** Low (renames only)

1. Fix stale "Nuvora" → "Novera" in all `src/` files:
   - `src/lib/modules.ts:71,74`
   - `src/lib/auren/public-context.ts:5,53,61,62`
   - `src/routes/_authenticated/businesses.tsx:20,47,49`
   - `src/routes/_authenticated/businesses.novera.tsx:6,8,12,15,16`
   - `src/routes/_authenticated/route.tsx:104`
   - Fix `isNuvoraWorkspace` → `isNoveraWorkspace` variable name
   - Update component name `NuvoraPage` → `NoveraPage`
2. Fix stale "Nuvora" → "Novera" in test files:
   - `src/lib/branding.test.ts:23`
   - `src/lib/auren/public-context.test.ts:14`
   - `src/lib/auren/data-readiness.test.ts:53`
3. Fix seed data in `supabase/migrations/20260805042235_*.sql:15`:
   - `('nuvora', 'Nuvora')` → `('novera', 'Novera')`
4. Update `AurenDailyGearRecord` detection logic in `advisor.server.ts:780-782` to use business type/slug, not substring matching
5. Run `npm run verify` to confirm all tests pass

### Phase 4: Business Identity Model
**Risk:** Medium (new model + type generation dependency)

1. Create `src/lib/businesses/types.ts`:
   ```typescript
   export interface Business {
     id: string;
     user_id: string;
     name: string;
     slug: string;
     status: string | null;
     business_type: "ecommerce" | "vehicle" | "service" | null;
     hostname: string | null;
     created_at: string;
     updated_at: string;
   }
   ```
2. Create `src/lib/businesses/api.ts`:
   - `useBusinesses()` hook — fetches all businesses for the user
   - `useBusiness(slug)` hook — fetches a single business by slug
   - `getBusinessByHostname(hostname)` server function — resolves hostname to business
3. Wait for reconciliation scripts to be activated (02_activate_businesses_uuid.sql) so `businesses` table is in generated types

### Phase 5: Hostname Resolution Middleware
**Risk:** Medium (new worker-level logic)

1. Add hostname → business mapping in Cloudflare Worker (`src/server.ts`):
   - Read `request.cf.hostname` or `Host` header
   - For known business hostnames (`cbm.dailygear.co.ke`, `novera.dailygear.co.ke`): inject `businessSlug` into request context
   - For apex/domain (`app.alexos.co.ke`): no business context (portfolio mode)
2. Pass business context through to the client via `__remotes__` or initial data hydration
3. Create `src/lib/businesses/context.ts`:
   - `BusinessContextProvider` React component
   - `useBusinessContext()` hook
   - Falls back to last-selected business or portfolio mode

### Phase 6: Dynamic Module Registry
**Risk:** Medium

1. Refactor `src/lib/modules.ts`:
   - Add `businessSlug?: string` to `ModuleDef` (modules can be business-scoped)
   - Add `getModulesForBusiness(slug: string | null): ModuleDef[]` function
   - DailyGear modules: `businessSlug: "dailygear"`
   - CarBar modules: `businessSlug: "carbaramotion"` (stub)
   - Novera modules: `businessSlug: "novera"` (stub)
   - Core modules (Money, Auren, Goals, People, Library, Settings): no `businessSlug` (always visible)
2. Update `src/components/app-sidebar.tsx`:
   - Read business context
   - Show/hide business modules dynamically
   - Show business-specific workspace header when in a business context

### Phase 7: DailyGear Business Scoping
**Risk:** Medium (data query changes)

1. Add `business_id` column to DailyGear tables — **requires new migration** (cannot modify existing migrations):
   - `dg_products`, `dg_orders`, `dg_order_items`, `dg_order_expenses`, `dg_order_payments`, `dg_inventory`, `dg_customers`
2. Update `src/lib/dailygear/profit-cash-flow.server.ts`:
   - Add `businessId` to request context
   - Filter queries by `business_id` in addition to `user_id`
3. Update `src/lib/dailygear/auren-kpi.server.ts`:
   - Accept `businessId` parameter
   - Replace substring-based DailyGear detection with `business_type === "ecommerce"`
4. Update DailyGear storefront hooks to accept `businessId`:
   - `useAdminStorefront(businessId?)` — falls back to user-scoped if no business

### Phase 8: Money Center Business Scoping
**Risk:** High (financial data scoping)

1. Update `src/lib/money/api.ts`:
   - Add `businessId?: string` parameter to `useAccounts()`, `useTransactions()`, `useAccountBalances()`, `useExpected()`, `useBills()`, `useDebts()`
   - When `businessId` provided, filter by it; when null, show personal only
2. Create business-scoped Money Center variants:
   - `src/routes/_authenticated/money-center.business.tsx` — business-scoped view
   - Shows accounts, transactions, budgets, bills for the selected business only
3. Update dashboard `MoneySnapshot.tsx`:
   - Accept `businessId` from context
   - Show business-scoped cash/debt when in business context
   - Keep portfolio view when no business context

### Phase 9: CarBar Motion Scaffold
**Risk:** Medium

1. Create Business module structure for CarBar Motion:
   - Add `business_type: "vehicle"` in `Business` model
   - Create `src/lib/vehicle/` directory:
     - `types.ts` — Vehicle, VehicleSale, VehicleExpense
     - `api.ts` — hooks for vehicle inventory, sales pipeline, expenses
   - Create `src/routes/_authenticated/_business.carbaramotion/` route group (or update existing `/vehicle-sales`)
2. Vehicle data model (in-code types; table creation via new migration):
   - `vehicle_inventory` — VIN, make, model, year, mileage, condition, price, status
   - `vehicle_sales` — sale price, financing, buyer info
   - `vehicle_expenses` — acquisition cost, reconditioning, holding costs (linked to Money Center transactions)

### Phase 10: Novera Service Business
**Risk:** Low-Medium

1. Create Business module structure for Novera:
   - Add `business_type: "service"` in `Business` model
   - Determine Novera's specific data model (from user — e.g., scheduling, client services, subscription revenue)
   - Create `src/lib/novera/` directory with types and API hooks
   - Replace `AlexOSRoadmapModule` placeholder with a functional service business module

### Phase 11: Cross-Business Money Center Views
**Risk:** Medium-High

1. Create a portfolio-level Money Center that aggregates across all businesses:
   - `src/routes/_authenticated/money-center.index.tsx` — add business breakdown panel
   - Shows income/expenses by business alongside personal
2. Enable Auren to switch scope between portfolio (all businesses), personal (personal only), and specific business
3. Update `BusinessSnapshot.tsx` to show per-business KPIs when in portfolio mode

### Phase 12: Tests & Verification
**Risk:** Low

1. Update existing tests:
   - Fix "Nuvora" → "Novera" assertions in `branding.test.ts`, `public-context.test.ts`, `data-readiness.test.ts`
   - Update `advisor.test.ts` to use business-scoped data
2. Add new tests:
   - Business identity resolution
   - Hostname → business mapping
   - Multi-business Money Center filtering
   - Business-scoped profit/cash-flow
3. Run `npm run verify` — must pass before any commit

### Protected Files (DO NOT MODIFY)
```
src/routes/shop.tsx
src/routes/shop.[slug].tsx
src/routes/funnel.$slug.tsx
src/components/storefront/*
src/styles.css
public/storefront/*
```

### Out of Scope (Explicitly)
- Modifying existing Supabase migrations (reconciliation scripts handle this)
- Deploying to production
- Changing DNS records
- Modifying `public.businesses` schema directly (use reconciliation scripts or new migrations)
- Changing `src/lib/money/tithe-calculations.ts` (protected tithe function)
- Weakening CI/CD guards in `.github/workflows/`

---

## 14. Execution Order

```
Phase 3 → Phase 4 → Phase 5 → Phase 6 → Phase 7 → Phase 8 → Phase 9 → Phase 10 → Phase 11 → Phase 12
```

**Dependencies:**
- Phase 4 depends on reconciliation scripts being activated (UUID businesses in DB)
- Phase 5 (hostname) requires a `hostname` column on `businesses` (new migration)
- Phase 7 (DailyGear scoping) requires `business_id` columns on DailyGear tables (new migration)
- Phase 8 (Money Center) requires `business_id` to be populated on existing records

**Milestone:** After Phases 3-8, the system has:
- Clean "Novera" naming
- Business identity model
- Hostname routing
- Dynamic modules
- DailyGear business-scoped correctly
- Money Center with business context

**Milestone:** After Phases 9-12, all three businesses are fully wired with shared core services.

---

## 15. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Reconciliation scripts not activated | Block Phase 4 | Coordinate with user; scripts are guarded — Phase 4 waits |
| New migrations needed for `business_id` on DailyGear tables | Medium | Create new migration files (appended); never modify existing |
| Hostname resolution needs DNS configuration | Medium | Implement Worker-level resolution; DNS setup is user's responsibility |
| Protected storefront files prevent storefront extension | High | Use business-scoped storefront model via `dg_storefronts` + `business_id`; public routes remain untouched |
| `public.businesses` not in generated types | Medium | Regenerate types after reconciliation completes |
| Multiple currencies in multi-business view | Medium | Currency safety module already exists (`@lib/money/currency-safety.ts`) |
| Test fixtures use stale "Nuvora" name | Low | All test assertions updated in Phase 3/12 |
| Auren substring-based business detection | Medium | Replace with `business_type` enum check in Phase 3/4 |
| Existing transactions lack `business_id` | High | Backfill via reconciliation script or data migration; Money Center falls back to `business_name` text matching temporarily |
