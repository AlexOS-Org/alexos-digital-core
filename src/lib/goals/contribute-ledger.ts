/**
 * Build the Money Center transaction payload for a goal contribution.
 *
 * Rules (ledger-safe):
 * - Destination account required when posting to the ledger.
 * - With a different source account → transfer (source → destination).
 * - Without a source → income on destination (external deposit into savings).
 * - Same source and destination is invalid for a transfer.
 * - Transfers are not P&L; income is intentional only for external top-ups.
 */

export type GoalContributeLedgerInput = {
  goalId: string;
  goalName: string;
  amount: number;
  /** Destination savings account (Equity, NCBA, etc.). */
  accountId: string;
  /** Optional source account when moving money from another wallet/bank. */
  fromAccountId?: string | null;
  note?: string | null;
  occurredAt?: string;
  userId: string;
};

export type GoalContributeLedgerResult =
  | { kind: "none"; reason: string }
  | {
      kind: "transfer" | "income";
      transaction: {
        user_id: string;
        type: "transfer" | "income";
        status: "posted";
        account_id: string;
        transfer_account_id: string | null;
        amount: number;
        category: string;
        source: string;
        description: string;
        reference: string;
        occurred_at: string;
        financial_scope: "personal";
        flow_type: "standard";
      };
    };

export function buildGoalContributionLedger(
  input: GoalContributeLedgerInput,
): GoalContributeLedgerResult {
  const amount = Number(input.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return { kind: "none", reason: "Amount must be a positive number." };
  }
  if (!input.accountId) {
    return {
      kind: "none",
      reason: "Choose the savings account this contribution goes into.",
    };
  }

  const occurred_at = input.occurredAt ?? new Date().toISOString();
  const note = input.note?.trim() || null;
  const reference = `goal:${input.goalId}`;
  const description =
    note ??
    (input.fromAccountId
      ? `Goal contribution: ${input.goalName}`
      : `Goal deposit: ${input.goalName}`);

  const from = input.fromAccountId?.trim() || null;
  if (from && from === input.accountId) {
    return {
      kind: "none",
      reason: "Source and destination accounts must be different for a transfer.",
    };
  }

  if (from) {
    return {
      kind: "transfer",
      transaction: {
        user_id: input.userId,
        type: "transfer",
        status: "posted",
        account_id: from,
        transfer_account_id: input.accountId,
        amount,
        category: "Goals",
        source: "Goal contribution",
        description,
        reference,
        occurred_at,
        financial_scope: "personal",
        flow_type: "standard",
      },
    };
  }

  return {
    kind: "income",
    transaction: {
      user_id: input.userId,
      type: "income",
      status: "posted",
      account_id: input.accountId,
      transfer_account_id: null,
      amount,
      category: "Goals",
      source: "Goal contribution",
      description,
      reference,
      occurred_at,
      financial_scope: "personal",
      flow_type: "standard",
    },
  };
}
