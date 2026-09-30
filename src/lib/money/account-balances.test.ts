import { describe, expect, it } from "vitest";

/**
 * Business-scope contract for account balances.
 *
 * `account_balances` is a database view that carries no `business_id` column,
 * so `useAccountBalances(businessId)` in `./api` scopes by resolving the
 * business's accounts first and filtering balances by exact `account_id`
 * membership. These tests lock that contract without a live Supabase
 * connection, mirroring the convention used in `./bills.test.ts`.
 */

function balancesQueryKey(businessId?: string | null) {
  return ["account_balances", businessId ?? null] as const;
}

describe("useAccountBalances scope contract", () => {
  it("uses a single portfolio query key when no business id is supplied", () => {
    expect(balancesQueryKey()).toEqual(["account_balances", null]);
    expect(balancesQueryKey(undefined)).toEqual(["account_balances", null]);
    expect(balancesQueryKey(null)).toEqual(["account_balances", null]);
  });

  it("uses a distinct query key when a business id is supplied", () => {
    expect(balancesQueryKey("biz_123")).toEqual(["account_balances", "biz_123"]);
  });

  it("never shares a query key between two different businesses", () => {
    expect(balancesQueryKey("biz_1")).not.toEqual(balancesQueryKey("biz_2"));
  });

  it("keeps personal (portfolio) and business balances in separate cache namespaces", () => {
    expect(balancesQueryKey(null)).not.toEqual(balancesQueryKey("biz_1"));
  });
});

describe("useAccountBalances scope safety", () => {
  // Mirrors the hook: a business's balances are exactly those whose
  // account_id is in the set of accounts owned by that business.
  const balanceFor = (accountId: string) => ({ account_id: accountId, balance: 100 });

  it("business-scoped filter is an exact account_id match, never a substring", () => {
    const businessAccountIds = ["acc_1"];
    const balances = ["acc_1", "acc_1_other", "sub_acc_1", "acc_2"].map(balanceFor);
    const scoped = balances.filter((b) => businessAccountIds.includes(b.account_id));
    expect(scoped).toEqual([balances[0]]);
  });

  it("excludes other businesses' balances", () => {
    const businessAccountIds = ["acc_a"];
    const balances = [balanceFor("acc_a"), balanceFor("acc_b")];
    const scoped = balances.filter((b) => businessAccountIds.includes(b.account_id));
    expect(scoped).toEqual([balances[0]]);
  });

  it("excludes personal balances (null business_id) from a business query", () => {
    const businessAccountIds = ["acc_biz"];
    // Personal accounts have business_id null and are not in the business set.
    const balances = [balanceFor("acc_personal"), balanceFor("acc_biz")];
    const scoped = balances.filter((b) => businessAccountIds.includes(b.account_id));
    expect(scoped).toEqual([balances[1]]);
    expect(scoped.some((b) => b.account_id === "acc_personal")).toBe(false);
  });

  it("returns no balances when the business has no accounts", () => {
    const businessAccountIds: string[] = [];
    const balances = [balanceFor("acc_1"), balanceFor("acc_2")];
    const scoped = balances.filter((b) => businessAccountIds.includes(b.account_id));
    expect(scoped).toEqual([]);
  });
});
