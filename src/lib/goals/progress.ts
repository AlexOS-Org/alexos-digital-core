import type { AccountBalance } from "@/lib/money/api";
import type { Goal, GoalProgress } from "./api";

export type GoalProgressSource = "linked-account" | "contributions";

export type ResolvedGoalProgress = {
  currentAmount: number;
  source: GoalProgressSource;
  accountBalance: number | null;
};

/**
 * Resolve the amount shown on a goal card.
 *
 * A linked savings account is authoritative because its balance includes the
 * opening balance and all posted money movements. Unlinked goals retain their
 * contribution-based progress until an account is selected.
 */
export function resolveGoalProgress(
  goal: Pick<Goal, "account_id">,
  contributionAmount: number,
  balances: Pick<AccountBalance, "account_id" | "balance">[],
): ResolvedGoalProgress {
  if (goal.account_id) {
    const linkedBalance = balances.find((balance) => balance.account_id === goal.account_id);
    if (linkedBalance) {
      const parsedBalance = Number(linkedBalance.balance);
      const accountBalance = Number.isFinite(parsedBalance) ? parsedBalance : 0;
      return {
        currentAmount: accountBalance,
        source: "linked-account",
        accountBalance,
      };
    }
  }

  return {
    currentAmount: Number.isFinite(Number(contributionAmount)) ? Number(contributionAmount) : 0,
    source: "contributions",
    accountBalance: null,
  };
}

export function buildGoalProgressMap(progress: GoalProgress[]) {
  return new Map(progress.map((item) => [item.goal_id, Number(item.current_amount) || 0]));
}
