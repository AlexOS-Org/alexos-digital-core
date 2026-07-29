# AlexOS Orion Project Handbook

## Source of truth

The repository is the source of truth for implementation. The project handbook records intent and decisions, but code, migrations, routes, types, and runtime behavior must be inspected before making assumptions.

## Product identity

- **Platform:** AlexOS
- **Intelligence layer:** Orion
- **Primary user:** Alex first
- **Future audience:** entrepreneurs and small businesses that need one operating layer for customers, money, tasks, marketing, and decisions.

## Product promise

AlexOS should help the user answer four questions quickly:

1. **What matters now?**
2. **What can make or protect money?**
3. **What should I do next?**
4. **What decision should I make based on the evidence?**

## Core operating loop

```text
Signals
  ↓
Orion interprets
  ↓
Priority / Mission
  ↓
Action
  ↓
CRM / Money / Business record
  ↓
Outcome
  ↓
Learning and better next decision
```

## Businesses in scope

### DailyGear
Local products and e-commerce. Alex has local product access and wants AlexOS to help determine what to sell, how to position it, and which advertising tests are worth running.

### BFSUMA
Supplement/product business. Product knowledge, compliant messaging, customer questions, leads, orders, and repeat purchasing are in scope. Health claims must be handled carefully and only from reliable product documentation.

### Vehicle Sales
Vehicles sourced through yards/dealers. AlexOS should eventually connect inventory, buyer demand, financing, deposits, commissions, lead follow-up, and advertising decisions.

## Orion principles

Orion should prioritize evidence over decoration. It may recommend, summarize, score, and create proposed actions, but high-impact external actions such as sending messages, publishing campaigns, or spending advertising money should require explicit user approval unless a future permission model says otherwise.

## Integrations vision

The intended signal layer includes:

- Main Gmail: important personal/business signals only, with least-privilege access.
- Business Gmail accounts: customer, supplier, dealer, order, and important business correspondence.
- Facebook business pages: inquiries and lead signals; advertising data when a supported integration is available.
- Future data sources: advertising platforms, market research, product/vehicle data, and knowledge documents.

## Mobile and web

AlexOS is a responsive web application and should work on desktop browser, mobile browser, and installable/PWA-style phone use where supported. Mobile is not a separate product: responsive behavior must be part of every feature review.

## Safety and engineering rules

- Do not overwrite stable work without inspecting it.
- Do not introduce schema changes without checking migrations and dependencies.
- Do not add paid services unless their expected value is justified by revenue or operational savings.
- Do not expose authenticated/private dashboard pages to search engines.
- Do not claim tests passed without running them.
- Keep the public `main` branch protected while major work is being developed and reviewed.
- Maintain a backlog instead of implementing every idea immediately.
