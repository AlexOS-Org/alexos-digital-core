# AlexOS Module Audit — Gaps by Module (2026-08-31)

**Session branch:** `arena/01a05a23-alexos-digital-core`
**Baseline commit:** `0c85a31` (`fix: preserve expected income scope on receipt`)
**Scope:** Read-only audit. No application code, schema, migration, or production data changed.
**Commands run:** `npm ci`, `npm run typecheck`, `npm run lint`, `npm run build`, `npm test`.

## 1. Health baseline

| Gate | Result | Notes |
|---|---|---|
| `npm ci` | PASS | 512 packages, 0 vulnerabilities reported |
| `npm run typecheck` | PASS | No TypeScript errors |
| `npm run lint` | PASS (warnings) | 10 `react-refresh/only-export-components` warnings, 0 errors |
| `npm run build` | PASS | Cloudflare/Nitro output built; large-chunk warnings remain |
| `npm test` | PASS | 22 files / 69 tests passed |
| Git working tree | Clean | no tracked artifacts added by install/build |
| CI coverage | GAP | `npm test` is not run in `pr-verify.yml`, `production-verify.yml`, or `validate.yml` |

## 2. Cross-cutting gaps

1. **Governance / CI**
   - Three overlapping workflows (`pr-verify`, `production-verify`, `validate`) duplicate the same build+lint gate.
   - No workflow runs the test suite, so 69 passing unit tests are not a release gate.
   - `typecheck.yml` triggers only on `main`, `migration/**`, and PRs to `main`, so this feature branch never confidently proves type-only CI coverage.
   - No dependency audit step in CI.
   - Existing docs report `main` was previously unprotected; branch protection is not enforced by the repository files.

2. **Supabase reproducibility**
   - `docs/PROJECT_STATE.md` and `supabase/reconciliation/DRIFT-2026-08-22.md` still describe an unresolved GitHub↔live migration-ledger divergence (finance scope, order hardening, DailyGear categories, public function execute revocation, personal/business finance model).
   - This is the highest-risk blocker for treating the repo as the reproducible database source.

3. **Documentation drift**
   - Older reports claim `pnpm-lock.yaml` is absent and that full typecheck/lint fail; the current repo has a `pnpm-lock.yaml`, and both checks pass in this checkout. Older docs should not be quoted as current state without a timestamped refresh.

4. **Branding / naming drift**
   - Approved product naming (Phase 1 attachment): **AlexOS**, **Auren Intelligence**, **Nuvora**, **DailyGear**, **CarBar Motion**.
   - Current code/vendor strings:
     - `Novera` in `src/lib/modules.ts`, `src/routes/_authenticated/businesses.tsx`, `src/routes/_authenticated/businesses.novera.tsx`.
     - `Car-Bar Motion.ke` in `src/lib/modules.ts` and `src/routes/_authenticated/businesses.tsx`.
     - `Alex OS` titles in CRM routes (`people.index.tsx`, `people.contacts.$id.tsx`, `people.leads.tsx`, `people.leads.$id.tsx`).
     - Root metadata says "built-in intelligence layer" instead of "Auren Intelligence".
     - `auth.tsx` says "Powered by the AlexOS intelligence layer" instead of "Powered by Auren Intelligence".

5. **Branding rule violations (Auren must not be an assistant/persona)**
   - `src/routes/_authenticated/route.tsx:44` labels the Auren route as `AI assistant`.
   - `src/components/dashboard/IntelligenceSearch.tsx` placeholder and aria-label use `Ask Auren`.
   - `src/components/dashboard/DashboardHeader.tsx:266` renders an `Ask Auren` button.
   - `src/components/dashboard/IntelligenceSearch.tsx` itself is a UI shell only; comment confirms no model integration yet.

6. **Validation / E2E gap**
   - No Playwright/Cypress tests and no authenticated live acceptance suite for Money Center, DailyGear checkout, CRM, notifications, or admin flows.
   - Several audits tag mobile verification as still requiring a deployed viewport matrix.

---

## 3. Module-by-module gaps

### 3.1 Home / Command Center
**Files:** `src/routes/_authenticated/dashboard.tsx`, `src/components/dashboard/*`, `src/lib/dashboard/*`, `src/lib/intelligence/*`

Working:
- Live cash, income, expenses, business snapshots, pipeline, goals, bills, leads, intelligence feed, today's priorities, mobile command center.
- Robust error boundaries and empty/loading states.

Gaps:
- **Net worth is not the financial-model net worth.** `MoneySnapshot` and `computeMoneyMetrics` use `cash − outstanding debt`. They omit owned assets (vehicles, property, inventory, crypto), qualifying receivables/expected money, and business asset/liability positions.
- **Personal/business net worth** is not shown anywhere on the dashboard, only cash split and debt split.
- **"What changed?"** is only the latest 5 transactions + generated signals. There is no cross-module change/diff feed (e.g. new product, order, lead, bill, goal contribution) and no persistable activity log.
- **Intelligence Search is decorative.** No natural-language query, no model call, no search results, plus branding violation (see cross-cutting).
- **No per-business command center.** Dashboard aggregates DailyGear and CRM metrics but does not let the owner compare Novera/CarBar/DailyGear operating performance side by side (CarBar/Novera are placeholders anyway).
- **No "what should I do next?" with persisted actions.** Signals are generated client-side on render; suggestions are not saved, dismissed, marked done, or scheduled.

### 3.2 Businesses hub
**Files:** `src/routes/_authenticated/businesses.tsx`, `src/lib/modules.ts`

Working:
- Hub selects Novera (currently naming mismatch), Car-Bar Motion.ke, and DailyGear; DailyGear is fully routed.

Gaps:
- **Naming does not match approved brand** (Novera vs Nuvora, Car-Bar Motion.ke vs CarBar Motion).
- **Novera** route is an empty state only.
- **CarBar Motion is not implemented**; `/vehicle-sales` is a localStorage workbench.
- **No business level settings** (coverage, KYC, logo, ownership/scope) in the hub.

### 3.3 Money Center
**Files:** `money-center.*`, `src/components/money/*`, `src/lib/money/*`, `src/lib/debts/api.ts`, `src/lib/goals/api.ts`

Working:
- Accounts, transactions, transfers, income, expenses, budgets, expected money, bills, analytics, debt management, currency-safety guard, multi-currency protection, balance hide/show.
- Strong ledger safety: transfers don't become P&L, debt principal is adjustment, debt interest is expense, loan proceeds are not income.

Gaps:
- **Overview misses full financial picture.** No debt outstanding, no net worth, no personal/business net worth, no cash reserve/operating buffer, no receivable/expected-money inclusion.
- **Income entry cannot attribute to a business.** `TransactionFormDialog` only tracks `financial_scope` from the account; income has no `business_id`/`income_type`/`flow_type` selector.
- **Expected money form omits scope/account/business** even though the schema/API supports them; business expected money falls back to personal.
- **Budget has no personal/business scope**, so personal and business spending share one category budget and analytics mix them.
- **Budgets have no income budgets or reserve/emergency-fund budgets.**
- **Bill scheduling math is wrong as displayed.** "Total Bills" sums every pending bill regardless of frequency (weekly/monthly/one-time) and presents it as one total; weekly bills are not annualized/current-month normalized.
- **Bill form hides supported fields** (`account_id`, `category`, `auto_create_transaction`) in `money-center.bills.tsx`; marking paid lacks confirmation/feedback and doesn't validate that the auto-created transaction succeeded.
- **No bill attachments/receipts**, no salary-schedule UI despite `financial_receipts_salary_schedules` migration.
- **Goal contributions never move money.** `useContribute` inserts a `goal_contributions` row only; it does not create a transaction or reduce any account balance, so Goals are not reconciled with Money Center.
- **Analytics "Net Worth Trend" is cash-flow trend**, not assets/labilities/expected-money reconciliation.
- **No investment/crypto reporting in analytics** despite a Crypto holdings panel existing; crypto holdings are not included in net worth.
- **Tithe/emergency-fund calculations exist and are tested, but there is no user-facing allocation action** to create the corresponding expenses/transfers from income.

### 3.4 Debt Management
**Files:** `src/routes/_authenticated/debt-management.tsx`, `src/components/debts/*`, `src/lib/debts/api.ts`

Working:
- Debt CRUD, loan disbursement to account, split principal/interest, remaining balance, progress, archive/delete.

Gaps:
- **No amortization/payoff simulation** (monthly due, total interest, payoff date), only manual principal/interest split on each payment.
- **No interest accrual or accrual schedule**; interest is only recorded when the owner manually enters an interest amount.
- **No debt-to-income / affordability signal**, no minimum-payment due-date reminders beyond display.
- **No schedule creation or bank-driven payment reconciliation**.
- **Debts are not aggregated into a true net-worth or personal/business net-worth view** in Money Center overview.

### 3.5 CRM / People
**Files:** `people.*`, `src/components/crm/*`, `src/lib/crm/*`

Working:
- Contacts, leads, pipeline stages, stage history, notes, tasks, activities, attachments (URL records), search, detail tabs.

Gaps:
- **Attachments are URL-only**; no Supabase Storage upload.
- **No email/WhatsApp/phone integration** despite the integration registry listing them.
- **No lead/contact segmentation** beyond simple search and status; no tags filter, no list export/import.
- **No file upload, duplicate detection, assignee/owner, priority, or due recurrence.**
- **CRM tasks are per-contact/lead only** and do not feed the global Tasks module (which is a separate localStorage workbench).
- **No marketing automation / campaign link**, no "convert lead to customer order" workflow.
- **No CRM linkage to DailyGear customers**; `banking` can create contacts, but commerce orders don't connect to CRM contacts/leads.

### 3.6 Auren Intelligence
**Files:** `src/routes/_authenticated/auren.tsx`, `src/lib/auren/*`, `src/lib/intelligence/*`

Working:
- Grounded portfolio/business/personal advisory, deterministic fallback when AI is unavailable, confidence labels, forecast ranges, source status, no fabricated values, tests for decision system/public context.

Gaps:
- **No investment intelligence module** (equities, T-bills, bonds, MMFs, crypto, REITs) despite spec.
- **No persisted recommendations or "apply recommendation" actions** (accepted/skipped/read state).
- **No shareable/exportable advisory report** (PDF/CSV).
- **No historical trend/change narration** for "what changed" beyond current period.
- **Enterprise checks:** no user-configured assumptions editor for risk/scoring, no saved investment hypothesis scenarios.
- **Branding violations** in dashboard/route shell (see cross-cutting).

### 3.7 Growth → Goals
**Files:** `src/routes/_authenticated/goals.tsx`, `src/components/goals/*`, `src/lib/goals/api.ts`

Working:
- Goal CRUD, icons, target date, progress, contributions, archive.

Gaps:
- **Contributions do not hit the ledger** (no transaction, no account debit, no cash reconciliation).
- **No personal/business scope** and no goal-to-business/account definition.
- **No recurring contributions, auto-allocation, or paycheck-to-goal automation.**
- **No emergency-fund rule surfaced** as a first-class goal type; the calculations exist but the UI is generic.
- **No view of contributions history on the goal card** (only aggregate progress).

### 3.8 Growth → Marketing (global)
**Files:** `src/routes/_authenticated/marketing.tsx`, `src/components/modules/ModuleWorkbench.tsx`

Gaps:
- **Not implemented.** It is a localStorage quick-add list (`alexos-workbench-marketing-v1`).
- No campaign, audience, creative, budget, channel/ROAS, Meta/Google/TikTok/WhatsApp data.
- Data is device-local and not synchronized, audited, or backupable.

### 3.9 Growth → Reports (global)
**Files:** `src/routes/_authenticated/reports.tsx`

Gaps:
- **Not implemented.** LocalStorage workbench only; no real reporting, filter, export, or drilldown.
- The only real reporting exists inside DailyGear `/e-commerce/reports` (ProfitCashFlowPanel).

### 3.10 Library → Library / Documents / Notes
**Files:** `src/routes/_authenticated/library.tsx`, `documents.tsx`, `notes.tsx`, `src/components/alexos-empty-state.tsx`, `src/components/module-placeholder.tsx`

Gaps:
- **Library** is an empty state; no files, contracts, knowledge base.
- **Documents** and **Notes** use `ModulePlaceholder`, which still renders "Coming Soon" and "Build in Progress" — language explicitly discouraged by the approved Phase 2 instructions.
- No Supabase Storage, no search, no tagging, no sharing, no OCR/versioning.

### 3.11 Missions → Missions
**Files:** `src/routes/_authenticated/missions.tsx`

Gaps:
- **Missions** is empty state only.
- No strategic OKR/mission hierarchy, milestones, owners, due dates, linking to goals/tasks/calendar, or progress reporting.

### 3.12 Missions → Tasks
**Files:** `src/routes/_authenticated/tasks.tsx`

Gaps:
- **Not implemented.** A localStorage workbench with only title/detail/open/done/delete.
- No due date, recurrence, priority, assignee, project, CRM/lead/business link, notifications, or Supabase persistence.

### 3.13 Missions → Calendar
**Files:** `src/routes/_authenticated/calendar.tsx`

Gaps:
- **Not implemented.** A localStorage workbench; no events, times, recurrence, reminders, or Google Calendar integration.
- Duplicates the concept of CRM activities/tasks without sharing data.

### 3.14 Notifications
**Files:** `src/routes/_authenticated/notifications.tsx`, `src/lib/intelligence/*`

Working:
- Derived live signals, priorities, critical/clear states, empty/error states.

Gaps:
- **No persisted notification records.** All signals are regenerated from current data; no read/unread, dismiss, archive, or history.
- **No push/email/WhatsApp delivery.**
- **No notification preferences** are honored — Settings toggles are fake/nonfunctional.
- **No historical date filtering** (UI explicitly says it will appear later).

### 3.15 Settings
**Files:** `src/routes/_authenticated/settings.tsx`

Gaps:
- **Entire screen is a mock.** Currency, timezone, date format, language, and notification preferences are static or local-only `useState`.
- **Save Settings only shows a temporary check**; nothing is persisted.
- **2FA Enable, Session Timeout, Export All Data, Clear Cache, Sync Now buttons do nothing.**
- No profile/workspace management, business identity settings, integration credential management, or Supabase/Cloudflare diagnostics.

### 3.16 Banking
**Files:** `src/routes/_authenticated/banking.tsx`, `banking.acquisition.tsx`, `src/lib/banking/api.ts`

Working:
- `/banking/acquisition`: data-backed employer list, hiring signal list, employee prospects, link-to-CRM.
- Tables exist for `banking_employers`, `banking_recruitment_signals`, `banking_employee_prospects`.

Gaps:
- **Main `/banking` route is a localStorage workbench**, so the nav-level module is not real.
- **No bank feed integration** (P0 from integration registry).
- **No loan, deposit, or account relationship management**, only acquisition leads.
- Acquisition module:
  - No source ingestion; hiring signals are only shown if rows exist externally.
  - No edit/archive/dismiss UI for employers/signals.
  - No prospect creation UI (only link-to-CRM).
  - No consent/KYC/affordability workflow (only a disclaimer).
  - `banking/api.ts` intentionally casts Supabase as `any` until generated types catch up; type-generation debt.

### 3.17 Vehicle Sales / CarBar Motion
**Files:** `src/routes/_authenticated/vehicle-sales.tsx`

Gaps:
- **Not implemented.** localStorage workbench; no vehicle inventory, financing, customer pipeline, CRM link, sales reporting, or CarBar operating data.
- No schema/migration evidence for a dedicated vehicle module.

### 3.18 DailyGear — admin/commerce
**Files:** `src/routes/_authenticated/e-commerce.*`, `src/components/dailygear/*`, `src/lib/dailygear/*`

Working:
- Overview KPIs, products, orders, order lifecycle (edit/payment/fulfilment/refunds/trash), inventory, customers, store preview, checkout, evidence, funnels, reports, settings.
- Publication gates, verified evidence, stock gates, order integrity, refund guards, cart session recovery, Meta read-only performance panel, Resend order emails, Meta Pixel, QR M-Pesa instructions.

Gaps:
- **Market / Competitors / Marketing / Ad Studio are previews.** They are marked `preview: true` in `src/lib/dailygear/registry.ts`, and only the first-party provider is enabled. Marketplace demand, competitor monitor, ad-platform connectors, and AI studio remain pending (`src/lib/dailygear/intelligence.ts`).
- **No real payment gateway.** M-Pesa is manual Paybill instructions only; no Daraja/STK push, no payment webhook, no automatic settlement/reconciliation. `card` is accepted by the server validator but not offered in the public checkout UI.
- **No courier/delivery integration**, no live tracking from a courier, no shipping-label workflow, no county-specific delivery fees beyond flat/free threshold.
- **No product image upload**; images are remote URLs only (`ProductFormDialog`, `ProductEvidencePanel`).
- **No supplier or warehouse management routes** even though registries/types support them; no purchase orders, barcode scanning, multi-warehouse, or reorder automation.
- **Customer module claims segmentation but only shows total, returning, LTV, search.** No tag/segment filtering, no purchase history drilldown, no CRM/marketing integration.
- **Orders lack bulk actions, channel-specific workflows, returns/partial-receipt handling, courier sync, and automatic payment reconciliation.**
- **Reports/registry claim filterable sales/product/customer reporting**, but the actual `/e-commerce/reports` screen contains only `ProfitCashFlowPanel`.
- **Funnels/Landing pages have no A/B testing, audience segmentation, form-capture, or post-order upsell delivery beyond the current order bump.**
- **Public storefront cart is localStorage-only**; no accounts, wishlists, persistent carts across devices, or guest recovery without a recovery link.
- **No tax/VAT configuration**, despite Settings description mentioning "Business, tax, shipping, currency and integrations." No tax calculation exists in checkout.
- **No multi-store/domain support**; store settings assume one `dailygear.co.ke` canonical Worker.

### 3.19 Public Storefront (shop.*)
**Files:** `src/routes/shop.*`, `src/lib/storefront/*`, `src/server/notifications/*`

Working:
- Product/category/home, cart, checkout, thank-you, tracking, about, contact, FAQ, policies, funnels, Kenya county/town picker, order/tracking, order+cart emails, abandoned-cart cron.

Gaps:
- **Payment flow is not automated**; M-Pesa is instructions/QR only, no settlement verification.
- **Cart is client-side only**; no server-side cart identity, no cross-device persistence, no auth checkout for returning customers.
- **No stock/price availability updates in real time until checkout RPC revalidates**; checkout is correct server-side, but cart displays may be stale.
- **No reviews/ratings, wishlist, reorder, or saved addresses UI.**
- **No tax/VAT on any order.**
- **Delivery is flat/free-threshold only**; no county/weight/route cost rules.
- **No WhatsApp Business messaging** despite references to WhatsApp contact.
- **No payment webhook route** in `src/routes/api`.
- **Guest order track leaks only via order number + email/phone**, which is acceptable but not rate-limited visibly (server check needed).

### 3.20 API routes / server automation
**Files:** `src/routes/api/meta/ads-webhook.ts`, `src/routes/api/scheduled/abandoned-cart.ts`, `src/server/*`

Working:
- Meta ads webhook verification path, abandoned-cart cron, order/cart email functions, Ads Manager sync, Auren live-evidence refresh.

Gaps:
- **No payment webhook** (M-Pesa/STK/Daraja), no courier webhook, no bank feed sync, no WhatsApp webhook.
- **No recurring notification/signal persist job**; signals are client-side regenerated.
- **No cron for bill/debt/goal reminders** beyond abandoned-cart.
- **No integration health/monitoring page** for Supabase/Cloudflare/Meta/Resend/API tokens.

---

## 4. Priority summary

### Blocker / high risk
1. Supabase migration ledger reconciliation and schema verification before treating Git as reproducible source.
2. Financial-model net worth ignoring assets/expected/liabilities; goal contributions not moving cash; business income not attributable; expected money losing scope/account.
3. Public checkout payment is instructions-only with no settlement proof.
4. Credential-adjacent work: service-role/Meta/Resend secret handling appears server-only, but no live secret/runtime verification was possible from this checkout; confirm in deployment.

### High priority
5. Replace localStorage workbenches (Tasks, Calendar, Marketing, Reports, Banking, Vehicle Sales) with DB-backed modules or clearly labelled roadmap surfaces.
6. Implement Settings completely or remove fake controls.
7. Add test execution to required CI, add typecheck to PR/production gate, and enforce branch protection/review.
8. Correct approved naming (Nuvora, CarBar Motion, AlexOS) and remove "Ask Auren" / "AI assistant" language.
9. DailyGear payment gateway, shipment/courier integration, image upload, real analytics/ad connectors.
10. Persist notifications and add product/bill/debt reminders.

### Medium / low
11. CRM file uploads, lead/contact segmentation, CRM↔DailyGear customer link.
12. Notifications mark-as-read, Auren recommendation persistence/export, investment intelligence.
13. Bill total math, budget scoping, crypto/net-worth analytics, debt amortization.
14. E2E/accessibility review and deployed mobile matrix.
15. CI dependency audit and output-cleanup.

---

## 5. Recommended next step

Finish this audit before making application changes.

**Recommended follow-ups (in order):**
1. Reconcile/verify the Supabase schema and migrations against the configured project (`goafwbrayepaihxbqsse`), then regenerate types.
2. Establish a single required CI gate: `npm ci → typecheck → lint → test → build`, and protect `main`.
3. Fix branding/naming and remove fake controls/settings before treating the frontend as production-ready.
4. Decide whether the placeholder modules should become real roadmap surfaces or be removed from navigation so the app stops appearing more complete than it is.
5. Add the highest-value financial fixes next: true net worth, business income attribution, goal contributions hitting the ledger, budget scope, bill totals, and automated payment settlement.
