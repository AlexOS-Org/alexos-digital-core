import { describe, expect, it } from "vitest";
import type { Transaction } from "@/lib/money/api";
import type { GoalContribution } from "./api";
import { reconcileGoalContribution, summarizeGoalReconciliation } from "./reconciliation";

const contribution = (overrides: Partial<GoalContribution> = {}): GoalContribution => ({
  id: "contribution-1",
  user_id: "user-1",
  goal_id: "goal-1",
  account_id: "savings-1",
  transaction_id: "transaction-1",
  amount: 10_000,
  occurred_at: "2026-09-29T08:00:00.000Z",
  note: null,
  deleted_at: null,
  created_at: "2026-09-29T08:00:00.000Z",
  ...overrides,
});

const transaction = (overrides: Partial<Transaction> = {}): Transaction => ({
  id: "transaction-1",
  user_id: "user-1",
  occurred_at: "2026-09-29T08:00:00.000Z",
  type: "transfer",
  account_id: "mpesa-1",
  transfer_account_id: "savings-1",
  category: "Goals",
  source: "Goal contribution",
  description: "Audi Fund",
  reference: "goal-contribution:contribution-1",
  amount: 10_000,
  business_id: null,
  financial_scope: "personal",
  business_name: null,
  income_type: null,
  expense_type: null,
  expense_scope: "personal",
  attachment_url: null,
  status: "posted",
  deleted_at: null,
  created_at: "2026-09-29T08:00:00.000Z",
  ...overrides,
});

describe("reconcileGoalContribution", () => {
  it("verifies a linked transfer without treating it as income or expense", () => {
    expect(reconcileGoalContribution(contribution(), transaction())).toEqual({
      status: "verified",
      reason: null,
    });
  });

  it("verifies a linked external deposit", () => {
    expect(
      reconcileGoalContribution(
        contribution(),
        transaction({
          type: "income",
          account_id: "savings-1",
          transfer_account_id: null,
        }),
      ).status,
    ).toBe("verified");
  });

  it("marks a contribution without an account as unlinked", () => {
    expect(
      reconcileGoalContribution(contribution({ account_id: null, transaction_id: null })),
    ).toEqual({
      status: "unlinked",
      reason: "Contribution is not linked to a Money Center account.",
    });
  });

  it("marks a missing transaction relationship for reconciliation", () => {
    expect(reconcileGoalContribution(contribution({ transaction_id: null }), null).status).toBe(
      "needs_reconciliation",
    );
  });

  it("marks an absent transaction row for reconciliation", () => {
    expect(reconcileGoalContribution(contribution(), undefined).status).toBe(
      "needs_reconciliation",
    );
  });

  it("exposes a voided or deleted transaction", () => {
    expect(reconcileGoalContribution(contribution(), transaction({ status: "void" })).status).toBe(
      "voided",
    );
    expect(
      reconcileGoalContribution(contribution(), transaction({ deleted_at: "2026-09-29T09:00:00Z" }))
        .status,
    ).toBe("voided");
  });

  it("rejects mismatched amounts, destinations, and transaction types", () => {
    expect(reconcileGoalContribution(contribution(), transaction({ amount: 9_999 })).status).toBe(
      "needs_reconciliation",
    );
    expect(
      reconcileGoalContribution(
        contribution(),
        transaction({ transfer_account_id: "other-account" }),
      ).status,
    ).toBe("needs_reconciliation");
    expect(
      reconcileGoalContribution(
        contribution(),
        transaction({ type: "expense", transfer_account_id: null }),
      ).status,
    ).toBe("needs_reconciliation");
  });

  it("accepts decimal money within one cent but rejects invalid contribution amounts", () => {
    expect(
      reconcileGoalContribution(contribution({ amount: 100.105 }), transaction({ amount: 100.104 }))
        .status,
    ).toBe("verified");
    expect(
      reconcileGoalContribution(contribution({ amount: -1 }), transaction({ amount: -1 })).status,
    ).toBe("needs_reconciliation");
  });
});

describe("summarizeGoalReconciliation", () => {
  it("keeps a linked goal verified when its account balance is authoritative", () => {
    expect(summarizeGoalReconciliation({ account_id: "savings-1" }, [], [], true).status).toBe(
      "verified",
    );
  });

  it("requires reconciliation when the linked balance is unavailable", () => {
    expect(
      summarizeGoalReconciliation(
        { account_id: "savings-1" },
        [contribution()],
        [transaction()],
        false,
      ).status,
    ).toBe("needs_reconciliation");
  });

  it("aggregates missing and voided contribution relationships", () => {
    const result = summarizeGoalReconciliation(
      { account_id: "savings-1" },
      [contribution(), contribution({ id: "contribution-2", transaction_id: null })],
      [transaction({ status: "void" })],
      true,
    );
    expect(result.status).toBe("voided");
    expect(result.voidedContributionCount).toBe(1);
    expect(result.needsReconciliationCount).toBe(1);
  });

  it("does not treat unlinked planning records as verified savings", () => {
    const result = summarizeGoalReconciliation(
      { account_id: null },
      [contribution({ account_id: null, transaction_id: null })],
      [],
      false,
    );
    expect(result.status).toBe("unlinked");
  });

  it("keeps separate goals independently auditable", () => {
    const verified = summarizeGoalReconciliation(
      { account_id: "savings-1" },
      [contribution()],
      [transaction()],
      true,
    );
    const missing = summarizeGoalReconciliation(
      { account_id: "savings-2" },
      [contribution({ account_id: "savings-2" })],
      [],
      true,
    );
    expect(verified.status).toBe("verified");
    expect(missing.status).toBe("needs_reconciliation");
  });
});
