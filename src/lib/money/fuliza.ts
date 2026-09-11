/**
 * M-Pesa account card overdraft (Fuliza-style) charges for Money Center.
 * Only applies to accounts identified as M-Pesa — not other banks or wallets.
 *
 * Access fee: 1% of overdraft when balance first goes below 0 in an episode.
 * Daily fee: fixed band on outstanding overdraft while balance stays < 0.
 * Fees are posted as expense transactions (category "Fuliza charges").
 */

export const FULIZA_CATEGORY = "Fuliza charges";

/** Match M-Pesa account cards by name (case-insensitive). */
export function isMpesaAccountName(name: string | null | undefined): boolean {
  return /m[- ]?pesa/i.test(String(name ?? "").trim());
}

/** Outstanding overdraft amount (positive KES) when balance is negative. */
export function overdraftAmount(balance: number): number {
  if (!Number.isFinite(balance) || balance >= 0) return 0;
  return Math.round(Math.abs(balance) * 100) / 100;
}

/**
 * One-time access fee: 1% of the overdraft amount at the moment of going negative.
 * Rounded to 2 decimal places (KES).
 */
export function fulizaAccessFee(overdraft: number): number {
  const od = overdraftAmount(-Math.abs(overdraft));
  if (od <= 0) return 0;
  return Math.round(od * 0.01 * 100) / 100;
}

/**
 * Daily maintenance fee inclusive of typical 20% excise bands (2026).
 * Bands are on outstanding overdraft (positive amount).
 */
export function fulizaDailyFee(overdraft: number): number {
  const od = overdraftAmount(-Math.abs(overdraft));
  if (od <= 0) return 0;
  if (od <= 100) return 0;
  if (od <= 500) return 3;
  if (od <= 1000) return 6;
  if (od <= 1500) return 21.6;
  if (od <= 2500) return 24;
  return 30;
}

/** Nairobi calendar date YYYY-MM-DD for idempotent daily keys. */
export function nairobiDateKey(date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Nairobi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function fulizaDailyReference(accountId: string, dayKey: string): string {
  return `fuliza-daily:${accountId}:${dayKey}`;
}

export function fulizaAccessReference(accountId: string, episodeDayKey: string): string {
  return `fuliza-access:${accountId}:${episodeDayKey}`;
}

export type LedgerTx = {
  type: "income" | "expense" | "transfer" | "adjustment";
  amount: number;
  account_id: string;
  transfer_account_id?: string | null;
  status?: string | null;
  deleted_at?: string | null;
  occurred_at: string;
  reference?: string | null;
};

/**
 * Running balance after each posted transaction (oldest → newest).
 * Opening balance is the account's opening_balance.
 */
export function runningBalances(
  openingBalance: number,
  accountId: string,
  txs: LedgerTx[],
): { occurred_at: string; balance: number; reference: string | null }[] {
  const ordered = [...txs]
    .filter((t) => !t.deleted_at && t.status !== "void")
    .sort((a, b) => a.occurred_at.localeCompare(b.occurred_at));

  let bal = Number(openingBalance) || 0;
  const out: { occurred_at: string; balance: number; reference: string | null }[] = [];

  for (const t of ordered) {
    const amount = Math.abs(Number(t.amount) || 0);
    if (t.type === "income") {
      if (t.account_id === accountId) bal += amount;
    } else if (t.type === "expense") {
      if (t.account_id === accountId) bal -= amount;
    } else if (t.type === "adjustment") {
      if (t.account_id === accountId) bal += Number(t.amount) || 0;
    } else if (t.type === "transfer") {
      if (t.account_id === accountId) bal -= amount;
      if (t.transfer_account_id === accountId) bal += amount;
    }
    out.push({
      occurred_at: t.occurred_at,
      balance: Math.round(bal * 100) / 100,
      reference: t.reference ?? null,
    });
  }
  return out;
}

/**
 * Day the current overdraft episode started (first day balance went < 0
 * after a non-negative balance). Null if currently not overdrawn.
 */
export function currentOverdraftEpisodeDay(
  openingBalance: number,
  accountId: string,
  txs: LedgerTx[],
  currentBalance: number,
): string | null {
  if (currentBalance >= 0) return null;
  const series = runningBalances(openingBalance, accountId, txs);
  if (series.length === 0) {
    return openingBalance < 0 ? nairobiDateKey(new Date(0)) : nairobiDateKey();
  }
  let lastNonNegIdx = -1;
  for (let i = 0; i < series.length; i++) {
    if (series[i].balance >= 0) lastNonNegIdx = i;
  }
  const start = series[lastNonNegIdx + 1] ?? series[0];
  return nairobiDateKey(new Date(start.occurred_at));
}

export type FulizaFeeToPost =
  | {
      kind: "access";
      amount: number;
      reference: string;
      description: string;
    }
  | {
      kind: "daily";
      amount: number;
      reference: string;
      description: string;
      dayKey: string;
    };

/**
 * Decide which Fuliza fees are missing for an M-Pesa account given current balance.
 */
export function planFulizaFees(input: {
  accountId: string;
  accountName: string;
  openingBalance: number;
  currentBalance: number;
  txs: LedgerTx[];
  todayKey?: string;
}): FulizaFeeToPost[] {
  if (!isMpesaAccountName(input.accountName)) return [];
  const balance = Number(input.currentBalance);
  if (!Number.isFinite(balance) || balance >= 0) return [];

  const od = overdraftAmount(balance);
  const today = input.todayKey ?? nairobiDateKey();
  const episodeDay = currentOverdraftEpisodeDay(
    input.openingBalance,
    input.accountId,
    input.txs,
    balance,
  );
  if (!episodeDay) return [];

  const existingRefs = new Set(
    input.txs
      .filter((t) => !t.deleted_at && t.status !== "void" && t.reference)
      .map((t) => String(t.reference)),
  );

  const planned: FulizaFeeToPost[] = [];

  const accessRef = fulizaAccessReference(input.accountId, episodeDay);
  if (!existingRefs.has(accessRef)) {
    const access = fulizaAccessFee(od);
    if (access > 0) {
      planned.push({
        kind: "access",
        amount: access,
        reference: accessRef,
        description: `Fuliza access fee (1% of KES ${od.toLocaleString()} overdraft)`,
      });
    }
  }

  const dailyRef = fulizaDailyReference(input.accountId, today);
  if (!existingRefs.has(dailyRef)) {
    const daily = fulizaDailyFee(od);
    if (daily > 0) {
      planned.push({
        kind: "daily",
        amount: daily,
        reference: dailyRef,
        description: `Fuliza daily fee (overdraft KES ${od.toLocaleString()})`,
        dayKey: today,
      });
    }
  }

  return planned;
}
