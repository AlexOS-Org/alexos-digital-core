import { describe, expect, it } from "vitest";
import { buildGoalContributionLedger } from "./contribute-ledger";

const base = {
  goalId: "goal-1",
  goalName: "Emergency",
  amount: 5_000,
  accountId: "equity-1",
  userId: "user-1",
  occurredAt: "2026-09-11T10:00:00.000Z",
};

describe("buildGoalContributionLedger", () => {
  it("rejects non-positive amounts", () => {
    const result = buildGoalContributionLedger({ ...base, amount: 0 });
    expect(result.kind).toBe("none");
  });

  it("requires a destination account", () => {
    const result = buildGoalContributionLedger({ ...base, accountId: "" });
    expect(result.kind).toBe("none");
  });

  it("rejects transfer when source equals destination", () => {
    const result = buildGoalContributionLedger({
      ...base,
      fromAccountId: "equity-1",
    });
    expect(result.kind).toBe("none");
  });

  it("builds a transfer from source into goal savings account", () => {
    const result = buildGoalContributionLedger({
      ...base,
      fromAccountId: "mpesa-1",
    });
    expect(result.kind).toBe("transfer");
    if (result.kind !== "transfer") return;
    expect(result.transaction.type).toBe("transfer");
    expect(result.transaction.account_id).toBe("mpesa-1");
    expect(result.transaction.transfer_account_id).toBe("equity-1");
    expect(result.transaction.amount).toBe(5_000);
    expect(result.transaction.status).toBe("posted");
    expect(result.transaction.reference).toBe("goal:goal-1");
  });

  it("builds income deposit when no source account is provided", () => {
    const result = buildGoalContributionLedger(base);
    expect(result.kind).toBe("income");
    if (result.kind !== "income") return;
    expect(result.transaction.type).toBe("income");
    expect(result.transaction.account_id).toBe("equity-1");
    expect(result.transaction.transfer_account_id).toBeNull();
    expect(result.transaction.category).toBe("Goals");
  });
});
