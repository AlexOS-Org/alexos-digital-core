# AlexOS roadmap — audit gaps to production truth

**Source audit:** full module audit on `main` @ `737ebf8` (2026-09-11).
**Rule:** feature branch → PR → green CI → merge. Production needs Workers deploy + Supabase migrations (see `production-deploy.yml`).

---

## Phase 0 — Ops baseline (ongoing)

| Item | Status |
|------|--------|
| Protect `main`, PR-only delivery | Required |
| `production-deploy.yml` secrets (Supabase + Cloudflare) | Owner config |
| After every merge: confirm Workers + migrations applied | Verify on dailygear.co.ke |
| Storefront immutability guard on every PR | Keep |

**Exit:** Deploy pipeline runs on main without secret failures; live JS matches merged commit.

---

## Phase 1 — Goal contributions → ledger *(this PR)*

**Why first:** Goals already link to Equity / NCBA / Family Bank / Absa. Linked progress uses **account balance**. Contributions that only insert `goal_contributions` leave Money Center and goal cards out of sync.

**Scope:**
- Contribute posts a **transfer** when “From account” is set (source → savings).
- Contribute posts **income** on the savings account when no source (external deposit).
- Destination account required for ledger-backed contributions.
- Pure payload builder + unit tests; no schema migration.

**Exit:** Add Contribution updates `account_balances` and goal progress for linked goals.

---

## Phase 2 — True net worth

- Assets: cash accounts + crypto holdings (+ inventory/property when modeled).
- Liabilities: outstanding debts.
- Optional expected money (probability-weighted, clearly labeled).
- Dashboard + Money Center overview show personal / business / total net worth.
- Stop labeling cash−debt as “net worth” without qualification.

---

## Phase 3 — Settings honesty

- Persist real prefs (locale, notification toggles) or remove non-functional controls.
- No fake Save / 2FA / Export buttons.

---

## Phase 4 — DailyGear payment truth

- Manual M-Pesa confirm + reconcile path (minimum).
- Optional Daraja STK / webhook later.
- Never claim settlement without evidence.

---

## Phase 5 — Placeholder nav cleanup

- CarBar, Nuvora, Marketing, Reports, Tasks, Calendar, Library, Documents, Notes, Missions: implement or keep clearly labelled roadmap surfaces only.
- Prefer fewer honest modules over empty workbenches.

---

## Phase 6 — CRM ↔ commerce + notifications

- Link DailyGear customers to CRM contacts.
- Persist notification inbox; bill/debt due reminders.

---

## Phase 7 — Auren depth (optional keys)

- Recommendation accept/skip history + export.
- External SEO/competitor only when connectors + keys exist (keep waiting states until then).

---

## Out of scope without explicit approval

- Financial rule changes to tithe mathematics.
- Public storefront product/price/funnel mutations.
- Hosted secret rotation outside deploy env.
