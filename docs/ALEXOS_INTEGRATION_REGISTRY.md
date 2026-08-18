# AlexOS Integration Registry

**Purpose:** canonical integration inventory for AlexOS. External systems feed AlexOS; Supabase remains the application data layer and GitHub remains the development source of truth.

## Priority

- **P0** — required for core financial/business operation
- **P1** — high-value intelligence and business automation
- **P2** — expansion / operational convenience

## Registry

| Integration | Domain | Primary data | Priority | Status |
|---|---|---|---|---|
| Supabase | Core | Auth, database, RLS, functions | P0 | Existing |
| Cloudflare Workers | Core | Runtime/deployment | P0 | Existing |
| M-Pesa / Safaricom | Finance | Payments, collections, transactions | P0 | Planned |
| Kenyan bank feeds | Finance | Balances, transactions | P0 | Planned |
| Meta / Facebook | Marketing/CRM | Pages, ads, campaigns, leads, Pixel/conversions | P1 | Planned/assess current connection |
| Instagram / Meta | Marketing/CRM | Content, engagement, leads | P1 | Planned |
| WhatsApp Business | CRM/Sales | Conversations, leads, notifications | P1 | Planned |
| Google Calendar | Operations | Events, appointments, follow-ups | P1 | Planned |
| Google Drive | Documents | Customer/business documents | P2 | Planned |
| Transactional email | CRM/Commerce | Notifications, receipts, customer mail | P1 | Planned |
| Payment gateway | DailyGear | Checkout/payment status | P1 | Planned |
| Delivery/courier | DailyGear | Fulfilment and tracking | P2 | Planned |
| Market-data provider | Investments | Equities, ETFs, FX, historical data | P1 | Planned |
| Crypto market-data provider | Investments | Prices, volume, volatility, market data | P1 | Planned |
| Kenya investment data | Investments | T-bills, bonds, MMFs, equities/REIT data | P1 | Planned |
| Vehicle/market data | Car-Bar | Vehicle and market information | P2 | Planned |
| Accounting/tax ecosystem | Finance | Invoices, receipts, tax records | P2 | Planned |

## Investment Intelligence

Investment Intelligence is a decision-support module connected to Money Center. It should determine investable capital only after accounting for cash requirements, obligations, reserves and debt.

### Asset classes

- Kenyan fixed income: Treasury bills, Treasury bonds, money-market funds
- Kenyan equities and REITs
- International equities and ETFs
- Bonds and other liquid instruments
- FX
- Crypto assets

### Opportunity scoring

AlexOS should rank opportunities using a configurable risk-adjusted model rather than raw expected return. Candidate factors:

- expected return potential
- downside/risk
- momentum
- valuation/fundamentals where available
- liquidity
- volatility
- time horizon
- portfolio fit

Scores must be explainable and must distinguish market facts, model estimates and user-configured assumptions.

### Safety boundary

Initial Investment Intelligence is research, portfolio tracking, scenario analysis and decision support. Automated trade execution is out of scope until a separate security, compliance, broker/exchange and risk-control review is completed.

## Integration architecture requirements

1. External credentials/tokens must never be hard-coded or stored in ordinary application records.
2. Integrations require least-privilege scopes and revocation/disconnect support.
3. External data should enter through explicit integration services and be normalized into AlexOS-owned records.
4. Money Center remains the source of truth for reconciled financial records; external feeds are inputs, not authoritative balances until reconciled.
5. Investment recommendations must use timestamped market data and clearly label estimates.
6. Every integration must have an owner, status, required credentials/scopes, sync direction, error handling and reconciliation strategy before production activation.
7. No integration should bypass existing RLS, authentication or business-scope isolation.

## Implementation order

### P0 — Core financial connectivity

- Reconcile Supabase schema/migrations with GitHub.
- Stabilize Money Center account/transaction/debt/net-worth model.
- Design bank/M-Pesa connection abstraction without committing to a provider-specific schema too early.

### P1 — Business and market intelligence

- Verify and formalize Meta integration requirements.
- WhatsApp Business + CRM integration design.
- DailyGear payment integration.
- Market-data and crypto-data provider evaluation.
- Build Investment Intelligence domain model, portfolio tracking and opportunity scoring.

### P2 — Operations and expansion

- Google Calendar/Drive.
- Delivery integrations.
- Vehicle data.
- Accounting/tax integrations.

## Definition of done for an integration

An integration is not considered production-ready merely because an API call works. It must have:

- documented credentials/scopes
- secure secret storage
- normalized data model
- sync/retry strategy
- idempotency where applicable
- audit logging
- RLS/business-scope enforcement
- disconnect/revocation handling
- reconciliation procedure
- failure/partial-sync handling
- test coverage appropriate to its risk
