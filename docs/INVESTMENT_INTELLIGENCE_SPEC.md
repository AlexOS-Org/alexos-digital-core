# AlexOS Investment Intelligence — Product Specification

## Objective

Turn the Money Center into a capital-allocation guide that helps the user identify attractive risk-adjusted opportunities across Kenyan and global investments, while protecting required cash and obligations.

## Core flow

```text
Accounts + transactions + debt + expected money
                    ↓
             Available capital
                    ↓
        Required reserves/obligations
                    ↓
             Investable capital
                    ↓
         Market/investment universe
                    ↓
        Opportunity scoring engine
                    ↓
          Portfolio allocation view
                    ↓
        Explainable recommendations
```

## Initial capabilities

### Portfolio

- holdings
- cost basis
- current value
- realized/unrealized P&L
- allocation by asset class
- concentration
- cash allocation
- performance by period

### Opportunity research

- asset overview
- current price and timestamp
- historical performance
- volatility
- liquidity
- drawdown
- momentum
- valuation/fundamental indicators when available
- scenario ranges
- risk flags

### Opportunity score

The score is a decision-support ranking, not a promise of return. It should be configurable and explainable. A first model can weight:

- return potential: 25%
- risk/downside: 20%
- momentum: 15%
- valuation/fundamentals: 15%
- liquidity: 10%
- volatility: 5%
- time horizon: 5%
- portfolio fit: 5%

Weights must remain configurable rather than permanently encoded as financial advice.

## Capital guardrails

The engine must not recommend investing capital that is identified as:

- required for near-term obligations
- required for emergency/reserve policy
- committed to debt repayment
- required for known business operating expenses

The user must be able to override assumptions explicitly, with the override recorded.

## Data provenance

Every market-derived metric should retain:

- provider/source
- observation timestamp
- instrument identifier
- currency
- data quality/status where available

Estimated values and model outputs must never be presented as guaranteed returns.

## Crypto

Crypto is included as an asset class. The first version should focus on liquid assets and market intelligence. It should monitor price, volume, volatility, drawdown, momentum and other provider-supported indicators. High-risk/illiquid assets should receive explicit risk flags.

Automated exchange/broker execution is not part of the first implementation.

## UX

The module should surface:

- Investable capital
- Current portfolio
- Risk profile
- Top opportunities
- Why each opportunity ranks highly
- Downside/scenario information
- Allocation impact
- Watchlist
- Alerts

The UI must make clear the difference between **market data**, **AlexOS calculations**, and **AI-generated commentary**.

## Compliance and safety

Investment Intelligence is decision support. It must not claim guaranteed profits. Execution, custody and regulated advisory functionality require a separate review of applicable law, provider terms, user disclosures and technical controls before activation.
