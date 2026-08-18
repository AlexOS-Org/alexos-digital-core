# AlexOS Integration Roadmap

## Gate 0 — Repository and data integrity

- [x] Establish integration registry
- [x] Define Investment Intelligence boundary
- [x] Define credential/security rules
- [ ] Reconcile GitHub migration history with controlled Supabase state
- [ ] Confirm production/runtime environment variables
- [ ] Verify CI/build/deployment state

## Gate 1 — Core finance

- [ ] Money Center account model
- [ ] Transactions/income/expenses/transfers
- [ ] Debt and obligations
- [ ] Expected money
- [ ] Net worth
- [ ] Investable-capital calculation
- [ ] Reconciliation/audit trail

## Gate 2 — Financial connectivity

- [ ] M-Pesa connection architecture
- [ ] Bank-feed abstraction
- [ ] Provider selection and sandbox testing
- [ ] Secure token storage
- [ ] Idempotent transaction ingestion
- [ ] Reconciliation UI

## Gate 3 — Business integrations

- [ ] Meta/Facebook integration verification
- [ ] Instagram
- [ ] WhatsApp Business
- [ ] CRM lead-source synchronization
- [ ] DailyGear payments
- [ ] DailyGear delivery/fulfilment
- [ ] Car-Bar lead/vehicle workflows

## Gate 4 — Investment Intelligence

- [ ] Market-data provider evaluation
- [ ] Crypto-data provider evaluation
- [ ] Kenyan investment data evaluation
- [ ] Instrument master
- [ ] Portfolio/holdings model
- [ ] Price history model
- [ ] Opportunity scoring engine
- [ ] Risk/scenario model
- [ ] Watchlists/alerts
- [ ] Command Center integration

## Gate 5 — Operations

- [ ] Google Calendar
- [ ] Google Drive
- [ ] Transactional email
- [ ] Notifications
- [ ] Document workflows

## Gate 6 — Accounting/tax and advanced automation

- [ ] Accounting export/integration
- [ ] KRA/eTIMS requirements assessment
- [ ] Advanced reconciliation
- [ ] Automated actions only after security/risk review

## Implementation rule

Do not activate an integration in production simply because its API is reachable. Each integration must pass the definition of done in `docs/ALEXOS_INTEGRATION_REGISTRY.md`.
