/** Shared thresholds for dashboard + intelligence calculations. */
export const LOW_BALANCE_THRESHOLDS = {
  mobileMoney: 300,
  bank: 500,
} as const;

export const MOBILE_MONEY_PATTERN = /m[- ]?pesa|airtel money|t[- ]?kash/i;
export const BANK_PATTERN =
  /bank|kcb|equity|coop|co-operative|absa|ncba|stanbic|family|dtb|i&m|im bank|sidian|prime/i;

/** Bills due within this many days count as "due soon". */
export const BILLS_DUE_SOON_DAYS = 7;

/** A lead untouched for this long is considered stale. */
export const LEAD_STALE_DAYS = 7;

/** Deals with an expected close date inside this window are "closing soon". */
export const LEAD_CLOSING_SOON_DAYS = 14;

/** Spending increase over previous period that is worth surfacing. */
export const SPEND_SPIKE_PCT = 15;

/** Healthy monthly savings-rate floor, in percent. */
export const HEALTHY_SAVINGS_RATE = 15;

export const OPEN_LEAD_STAGES = [
  "new",
  "contacted",
  "qualified",
  "proposal",
  "negotiation",
] as const;

export const DAY_MS = 86_400_000;
