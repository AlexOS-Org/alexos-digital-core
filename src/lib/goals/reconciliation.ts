import type { Transaction } from "@/lib/money/api";
import type { Goal, GoalContribution } from "./api";

export type GoalReconciliationStatus = "verified" | "unlinked" | "needs_reconciliation" | "voided";

export type ContributionReconciliation = {
  status: GoalReconciliationStatus;
  reason: string | null;
};

export type GoalReconciliation = {
  status: GoalReconciliationStatus;
  verifiedContributionCount: number;
  needsReconciliationCount: number;
  voidedContributionCount: number;
  reason: string | null;
};

const moneyEqual = (left: number, right: number) => Math.abs(left - right) < 0.005;

/**
 * Reconcile one goal contribution against the authoritative Money Center row.
 * A contribution never becomes verified from its own row alone.
 */
export function reconcileGoalContribution(
  contribution: Pick<GoalContribution, "account_id" | "amount" | "transaction_id">,
  transaction?: Pick<
    Transaction,
    "account_id" | "amount" | "status" | "deleted_at" | "transfer_account_id" | "type"
  > | null,
): ContributionReconciliation {
  if (!contribution.account_id) {
    return { status: "unlinked", reason: "Contribution is not linked to a Money Center account." };
  }
  if (!contribution.transaction_id || !transaction) {
    return {
      status: "needs_reconciliation",
      reason: "No corresponding Money Center transaction is linked.",
    };
  }
  if (transaction.status === "void" || transaction.deleted_at) {
    return { status: "voided", reason: "The associated Money Center transaction was voided." };
  }

  const amount = Number(contribution.amount);
  const transactionAmount = Number(transaction.amount);
  if (!Number.isFinite(amount) || amount <= 0 || !moneyEqual(amount, transactionAmount)) {
    return {
      status: "needs_reconciliation",
      reason: "Contribution and transaction amounts differ.",
    };
  }

  const destinationMatches =
    transaction.type === "income"
      ? transaction.account_id === contribution.account_id
      : transaction.type === "transfer" &&
        transaction.transfer_account_id === contribution.account_id &&
        transaction.account_id !== contribution.account_id;

  if (!destinationMatches) {
    return {
      status: "needs_reconciliation",
      reason: "The linked transaction does not move money into the goal account.",
    };
  }

  if (transaction.type !== "income" && transaction.type !== "transfer") {
    return {
      status: "needs_reconciliation",
      reason: "Goal contributions must link to an income deposit or transfer.",
    };
  }

  return { status: "verified", reason: null };
}

export function summarizeGoalReconciliation(
  goal: Pick<Goal, "account_id">,
  contributions: GoalContribution[],
  transactions: Transaction[],
  hasLinkedAccountBalance: boolean,
): GoalReconciliation {
  if (!goal.account_id) {
    return {
      status: "unlinked",
      verifiedContributionCount: 0,
      needsReconciliationCount: 0,
      voidedContributionCount: 0,
      reason: "Goal is unlinked; contributions are planning records, not verified savings.",
    };
  }

  if (!hasLinkedAccountBalance) {
    return {
      status: "needs_reconciliation",
      verifiedContributionCount: 0,
      needsReconciliationCount: contributions.length,
      voidedContributionCount: 0,
      reason: "The linked account balance is unavailable.",
    };
  }

  const transactionMap = new Map(transactions.map((transaction) => [transaction.id, transaction]));
  const results = contributions.map((contribution) =>
    reconcileGoalContribution(contribution, transactionMap.get(contribution.transaction_id ?? "")),
  );
  const verifiedContributionCount = results.filter((item) => item.status === "verified").length;
  const needsReconciliationCount = results.filter(
    (item) => item.status === "needs_reconciliation",
  ).length;
  const voidedContributionCount = results.filter((item) => item.status === "voided").length;

  if (voidedContributionCount > 0) {
    return {
      status: "voided",
      verifiedContributionCount,
      needsReconciliationCount,
      voidedContributionCount,
      reason: "One or more associated Money Center transactions were voided.",
    };
  }
  if (needsReconciliationCount > 0) {
    return {
      status: "needs_reconciliation",
      verifiedContributionCount,
      needsReconciliationCount,
      voidedContributionCount,
      reason: "One or more contributions have no matching valid ledger movement.",
    };
  }

  return {
    status: "verified",
    verifiedContributionCount,
    needsReconciliationCount,
    voidedContributionCount,
    reason: null,
  };
}
