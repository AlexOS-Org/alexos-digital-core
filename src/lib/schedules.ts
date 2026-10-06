/**
 * Cloudflare Workers cron weekday values are 1=Sunday through 7=Saturday.
 * The weekday abbreviation avoids the common Unix-cron `6=Saturday` assumption.
 */
export const WEEKLY_MONEY_SUMMARY_CRON = "0 17 * * SAT";
