# AlexOS Digital Core

AlexOS Digital Core is the single repository behind the AlexOS business operating
system and the public DailyGear storefront. It contains two surfaces that share
one codebase and one deployment target:

- **AlexOS business OS** — the authenticated operator dashboard: Money Center
  (accounts, income, expenses, transfers, budgets, bills, analytics), CRM and
  leads, tasks, documents, goals, banking/debt tracking, and the Auren
  intelligence surface. Routes live under `src/routes/_authenticated/` and are
  served behind the app's authentication boundary.
- **DailyGear storefront and funnels** — the customer-facing commerce surface
  (`/shop*` routes and `/funnel/$slug` campaign pages) that powers
  `dailygear.co.ke`, including catalogue, cart, checkout, order tracking, and
  paid-social sales funnels.

The public storefront is treated as **immutable by default**. The protected path
patterns are `/shop*` routes, `/funnel/$slug`, `src/components/storefront/`,
`src/styles.css`, and `public/storefront/`. An automated guard fails the build if
a change alters one of them without an explicitly approved exception (see
[Validation](#validation) below).

## Stack

| Layer | Technology |
| --- | --- |
| Application framework | [TanStack Start](https://tanstack.com/start) (SSR) with React 19, TanStack Router, and TanStack Query |
| Build tooling | Vite 8 with `@vitejs/plugin-react`, `@tailwindcss/vite`, and `vite-tsconfig-paths` |
| Styling | Tailwind CSS v4 (CSS-first config in `src/styles.css`) |
| UI components | Radix UI primitives with shadcn-style wrappers, Lucide icons, Recharts, Sonner |
| Hosting / runtime | [Cloudflare Workers](https://developers.cloudflare.com/workers/) via Wrangler (`alexos-business-os`, entry `src/server.ts`), built with `@cloudflare/vite-plugin` |
| Scheduled work | Cloudflare Worker cron triggers declared in `wrangler.jsonc` |
| Data, auth, and storage | [Supabase](https://supabase.com/) (PostgreSQL, Row Level Security, Auth). Controlled project: `goafwbrayepaihxbqsse`. Schema lives in `supabase/migrations/` |
| Testing | Vitest (`vitest.config.mjs`) |
| Linting / formatting | ESLint 9 (flat config) and Prettier |

Production deploys to Cloudflare Workers only. A guard script
(`scripts/assert-cloudflare-workers-only.mjs`) fails verification if an
alternative deployment target is reintroduced.

## Getting started

Requires **Node.js 22** (the version used by CI) and npm.

```bash
git clone https://github.com/AlexOS-Org/alexos-digital-core.git
cd alexos-digital-core
npm ci
```

Copy `.env.example` to `.env` and fill in your own Supabase project values.
Never commit `.env` files or service-role credentials — the live deployment
receives these from the hosting environment (Cloudflare) and GitHub Actions
environment secrets.

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the Vite dev server for local development |
| `npm test` | Run the Vitest suite once (`src/**/*.test.ts[x]`) |
| `npm run lint` | Lint the repository with ESLint |
| `npm run typecheck` | Type-check with `tsc --noEmit` |
| `npm run build` | Produce the production Vite build |
| `npm run verify` | **The full gate.** Runs test → lint → typecheck → build, then both guard scripts |
| `npm run preview` | Serve the production build locally |
| `npm run format` | Rewrite files with Prettier |

### Validation

`npm run verify` is the canonical pre-commit and pre-merge gate. It expands to:

```bash
npm test
npm run lint
npm run typecheck
npm run build
node scripts/assert-public-storefront-untouched.mjs
node scripts/assert-cloudflare-workers-only.mjs
```

The two guard scripts enforce the repository's hard safety rules:

- **Public storefront immutability** — compares the working tree against
  `origin/main` and fails if any protected storefront path changed without being
  an explicitly approved exception. See
  `src/test/public-storefront-guard-scope.test.ts`.
- **Cloudflare Workers as sole target** — fails if a competing deployment
  configuration (for example Netlify) reappears, or if the Wrangler manifest
  loses its required entries.

Run the gate, plus `git diff --check`, before every commit.

## Change process

Do not start from this README alone. Two documents govern how changes are made
in this repository, and both are mandatory reading before editing code:

- **[`AGENTS.md`](./AGENTS.md)** — repository guidance, safe-change policy, and
  the Supabase credential rules.
- **[`docs/GOVERNED_BUILD_PROTOCOL.md`](./docs/GOVERNED_BUILD_PROTOCOL.md)** —
  the canonical operating protocol. It is audit-first and evidence-based:
  feature branch → pull request → review → merge; never commit directly to
  `main`; capture a baseline before changing anything; run the full validation
  gate before every commit; verify the public-storefront immutability check; and
  never deploy to production or mutate hosted resources (Cloudflare, Supabase,
  payment settings, ad spend) without explicit human approval.

In short: **feature branch, full `npm run verify`, PR — and no production
mutations without written approval.** Where a task instruction conflicts with
the protocol, the protocol wins.

## Repository layout

| Path | Contents |
| --- | --- |
| `src/routes/` | File-based routes. See [`src/routes/README.md`](./src/routes/README.md) for TanStack Start routing conventions |
| `src/routes/_authenticated/` | Authenticated AlexOS dashboard routes (Money Center, CRM, e-commerce admin, settings) |
| `src/routes/shop.*`, `src/routes/funnel.$slug.tsx` | Protected public DailyGear storefront and funnel routes |
| `src/server/` | Server-only logic (notifications, integration clients) |
| `supabase/` | `config.toml` and `migrations/` for the controlled Supabase project |
| `scripts/` | Validation guards and operational audit utilities |
| `docs/` | Architecture, audit, and protocol documentation |
| `reports/` | Dated audit and evidence reports |
| `packages/` | Shared design-system tokens and CSS |

## License

No license file is currently present in this repository. Treat it as
proprietary and internal unless and until a license is added.
