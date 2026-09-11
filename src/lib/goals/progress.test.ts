import { describe, expect, it } from "vitest";
import { buildGoalProgressMap, resolveGoalProgress } from "./progress";

describe("resolveGoalProgress", () => {
  it("uses the linked account balance for a linked goal", () => {
    expect(
      resolveGoalProgress({ account_id: "equity" }, 250, [{ account_id: "equity", balance: 1250 }]),
    ).toEqual({
      currentAmount: 1250,
      source: "linked-account",
      accountBalance: 1250,
    });
  });

  it("falls back to contributions when the goal is not linked", () => {
    expect(resolveGoalProgress({ account_id: null }, 250, [])).toEqual({
      currentAmount: 250,
      source: "contributions",
      accountBalance: null,
    });
  });

  it("falls back to contributions if the linked account balance is unavailable", () => {
    expect(resolveGoalProgress({ account_id: "equity" }, 250, [])).toEqual({
      currentAmount: 250,
      source: "contributions",
      accountBalance: null,
    });
  });

  it("normalizes contribution and balance values to finite numbers", () => {
    expect(resolveGoalProgress({ account_id: "equity" }, Number.NaN, [])).toMatchObject({
      currentAmount: 0,
      source: "contributions",
    });
    expect(
      resolveGoalProgress({ account_id: "equity" }, 250, [{ account_id: "equity", balance: NaN }]),
    ).toMatchObject({
      currentAmount: 0,
      source: "linked-account",
      accountBalance: 0,
    });
  });
});

describe("buildGoalProgressMap", () => {
  it("indexes contribution progress by goal id", () => {
    expect(
      buildGoalProgressMap([
        { goal_id: "goal-1", current_amount: 100, user_id: "user-1" },
        { goal_id: "goal-2", current_amount: "200" as unknown as number, user_id: "user-1" },
      ]),
    ).toEqual(
      new Map([
        ["goal-1", 100],
        ["goal-2", 200],
      ]),
    );
  });
});
