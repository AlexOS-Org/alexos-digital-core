# AlexOS Financial Operating Model

## Purpose

AlexOS treats the user's real financial life and each business as one connected operating system while keeping personal and business accounting distinct.

## Core rule

A business can receive revenue, pay its own operating costs, generate operating profit, retain cash, and later transfer money to the owner. A transfer from a business account to a personal account is **not** a business expense and is **not** new consolidated wealth; it is movement of already-earned money between scopes.

## DailyGear example

1. Customer pays KES 5,000 for an order.
2. DailyGear records sales revenue.
3. DailyGear records cost of goods, packaging, delivery/logistics, platform fees, advertising and other operating costs separately.
4. DailyGear operating profit = operating income - operating expenses.
5. If KES 1,500 is moved from DailyGear to the owner's personal M-Pesa as an owner distribution, record it as a transfer between a business account and a personal account. The personal side may classify the receipt as `business_profit` for the owner's income view, while the business P&L remains unchanged by the transfer.
6. Loans are financing, not operating income. Debt principal payments are financing movements, not operating expenses; interest can be classified separately.

## Personal income types

- Salary
- Commission
- Business profit / owner distribution
- Personal deal
- Gift
- Investment income
- Refund
- Other

## Business income types

- Sales revenue
- Refund reversals/adjustments where appropriate
- Other operating income

## Expense types

- Cost of goods
- Packaging
- Delivery
- Logistics
- Advertising
- Platform fees
- Supplier costs
- Payroll
- Rent
- Utilities
- Tax
- Debt payment
- Interest
- Personal living
- Education
- Health
- Transport
- Other

## Business dimension

The `businesses` table is the canonical business identity. Finance, budgets, expected money, debts, marketing campaigns and ad creatives can reference `business_id`. Existing `business_name` fields are retained for compatibility and are not removed in this phase.

## Net worth

The target consolidated formula is:

**Net Worth = Cash + Owned Assets + Qualifying Receivables/Expected Money - Outstanding Liabilities**

Personal and business net worth should be available separately, as well as consolidated. Business inventory, vehicles, equipment, property and investments can be represented through `assets`. Cash accounts remain in `accounts`; liabilities remain in `debts`.

## Dashboard requirements

### AlexOS Command Center

Show:

- Total net worth
- Personal net worth
- Business net worth
- Cash available
- Personal cash
- Business cash
- Personal debt
- Business debt
- Current-period income
- Current-period expenses
- Current-period operating profit
- Upcoming/expected money
- Low-balance and overdue/debt alerts
- Auren recommendations and explicit next actions

### Business dashboard

Every business should have the same understandable operating pattern:

- Revenue
- COGS
- Gross profit
- Operating expenses
- Advertising spend
- Delivery/logistics spend
- Net operating profit
- Cash position
- Outstanding business debt
- Inventory/assets
- Orders/sales pipeline where applicable
- Marketing performance
- Customer signals
- Recommendations, research and ideas
- Clear "what needs attention today" actions

### DailyGear

Keep the existing commerce dashboard capabilities: revenue, gross profit, orders, inventory, customers, order feed, notifications, recommendations, marketing analytics, Meta analytics, activity timeline, calendar and operating intelligence. The new financial model should connect those operational metrics to the business finance layer rather than duplicate them.

## Dashboard visual direction

The AlexOS Command Center should support a large 4K-friendly hero/background treatment with a mountain visual and allow the user to change the background. This is a UI asset/UX task and should not be implemented by hard-coding an external image URL into the database.

## Auren

The in-product AI is **Auren**. Do not introduce or restore retired AI naming in UI, documentation, routes, or code comments.

## Empty-data test state

The database currently has zero rows in the core finance and DailyGear tables. Keep it that way for initial end-to-end testing. Do not seed fake transactions, accounts, businesses or debts merely to make dashboards look populated.
