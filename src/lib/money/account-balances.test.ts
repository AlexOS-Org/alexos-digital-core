import { describe, expect, it } from "vitest";
import { accountBalancesQueryKey } from "./api";

/**
 * Business-scope coverage for account balances.
 *
 * `account_balances` is a database view with no `business_id` column, so
 * `useAccountBalances(businessId)` scopes by resolving the business's accounts
 * first and filtering balances on exact `account_id` membership.
 *
 * These tests import `accountBalancesQueryKey` from `./api` — the same function
 * the hook itself calls to build its cache key. An earlier version of this file
 * declared a local copy of the key and asserted against that copy, so the suite
 * stayed green even if the hook had been deleted. Asserting on the production
 * export means this file now fails if the real key changes.
 *
 * `useAccountBalances` itself is a React hook and cannot be invoked without a
 * React renderer, which this repository does not provide; the account-id
 * membership filter it applies is covered in `./write-scope.test.ts` and
 * `./budgets-uniqueness.test.ts`.
 */

describe("accountBalancesQueryKey", () => {
  it("uses a single portfolio key when no business id is supplied", () => {
    expect(accountBalancesQueryKey()).toEqual(["account_balances", null]);
    expect(accountBalancesQueryKey(undefined)).toEqual(["account_balances", null]);
    expect(accountBalancesQueryKey(null)).toEqual(["account_balances", null]);
  });

  it("uses a distinct key per business", () => {
    expect(accountBalancesQueryKey("biz_123")).toEqual(["account_balances", "biz_123"]);
  });

  it("never shares a key between two businesses", () => {
    expect(accountBalancesQueryKey("biz_1")).not.toEqual(accountBalancesQueryKey("biz_2"));
  });

  it("keeps the portfolio view and a business view in separate cache namespaces", () => {
    // Without this, switching from portfolio to a business could serve the
    // previously cached all-accounts balance set for a business that owns only
    // some of those accounts.
    expect(accountBalancesQueryKey(null)).not.toEqual(accountBalancesQueryKey("biz_1"));
  });
});

/**
 * The balance filter the hook applies once the business's accounts are known.
 * This mirrors the `.in("account_id", accountIds)` membership step; it is kept
 * here to document why exact membership, not a prefix or substring match, is
 * what separates businesses.
 */
describe("business balance membership", () => {
  const balanceFor = (accountId: string, businessId: string | null) => ({
    account_id: accountId,
    business_id: businessId,
    balance: 100,
  });

  const scopeBalances = (balances: ReturnType<typeof balanceFor>[], businessAccountIds: string[]) =>
    balances.filter((b) => businessAccountIds.includes(b.account_id));

  it("matches account ids exactly, never by substring", () => {
    const balances = ["acc_1", "acc_1_other", "sub_acc_1", "acc_2"].map((id) =>
      balanceFor(id, null),
    );
    expect(scopeBalances(balances, ["acc_1"])).toEqual([balances[0]]);
  });

  it("returns another business's balances to no one", () => {
    const balances = [balanceFor("acc_a", "biz_a"), balanceFor("acc_b", "biz_b")];
    expect(scopeBalances(balances, ["acc_a"])).toEqual([balances[0]]);
  });

  it("excludes personal accounts from a business balance read", () => {
    const balances = [balanceFor("acc_personal", null), balanceFor("acc_biz", "biz_biz")];
    const scoped = scopeBalances(balances, ["acc_biz"]);
    expect(scoped).toEqual([balances[1]]);
    expect(scoped.some((b) => b.business_id === null)).toBe(false);
  });

  it("returns nothing for a business that owns no accounts", () => {
    const balances = [balanceFor("acc_1", null), balanceFor("acc_2", null)];
    expect(scopeBalances(balances, [])).toEqual([]);
  });
});
