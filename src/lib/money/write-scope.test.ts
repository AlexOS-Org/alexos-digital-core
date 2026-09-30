import { describe, expect, it } from "vitest";
import {
  normalizeBusinessId,
  resolveAccountOwnership,
  resolveExpenseScope,
  resolveScopedWrite,
  resolveTransactionBusinessId,
  resolveTransactionScope,
  transactionScopeIssue,
} from "./write-scope";
import { buildReceivedExpectedTransaction } from "./expected-money";

/**
 * Behavioural coverage for the Money Center write paths that carry a business
 * dimension.
 *
 * Every assertion below calls the resolver the dialogs and `useSaveBudget`
 * actually call, so a change in production behaviour fails these tests. The
 * dialogs are thin: they read form state and hand it to these resolvers.
 *
 * Accounting semantics held constant throughout:
 * - transactions are the authoritative ledger,
 * - a transfer is a movement, never income or expense,
 * - budgets and expected money are planning records,
 * - expected money only becomes a ledger entry on settlement, and that entry
 *   inherits the expected item's business attribution.
 */

const BIZ_A = "11111111-1111-1111-1111-111111111111";
const BIZ_B = "22222222-2222-2222-2222-222222222222";

describe("normalizeBusinessId", () => {
  it("never produces an empty-string business id", () => {
    expect(normalizeBusinessId("")).toBeNull();
    expect(normalizeBusinessId("   ")).toBeNull();
    expect(normalizeBusinessId(null)).toBeNull();
    expect(normalizeBusinessId(undefined)).toBeNull();
  });

  it("keeps a real business id and trims incidental whitespace", () => {
    expect(normalizeBusinessId(` ${BIZ_A} `)).toBe(BIZ_A);
  });
});

describe("accounts", () => {
  it("creates a personal account with no business dimension", () => {
    // A business is active, but the user explicitly chose Personal.
    expect(resolveAccountOwnership({ scope: "personal", activeBusinessId: BIZ_A })).toEqual({
      business_id: null,
      financial_scope: "personal",
    });
  });

  it("creates a business account with the active business id", () => {
    expect(resolveAccountOwnership({ scope: "business", activeBusinessId: BIZ_A })).toEqual({
      business_id: BIZ_A,
      financial_scope: "business",
    });
  });

  it("creates a portfolio account with no business dimension", () => {
    expect(resolveAccountOwnership({ scope: "personal", activeBusinessId: null })).toEqual({
      business_id: null,
      financial_scope: "personal",
    });
  });

  it("does not attribute a business account to a business that was never active", () => {
    // Claiming business scope with no active business must not borrow one.
    expect(resolveAccountOwnership({ scope: "business", activeBusinessId: null })).toEqual({
      business_id: null,
      financial_scope: "personal",
    });
  });
});

describe("transactions — income", () => {
  it("derives business attribution from the receiving account", () => {
    expect(
      resolveTransactionBusinessId({
        mode: "income",
        scope: "business",
        selectedBusinessId: BIZ_A,
        accountBusinessId: BIZ_A,
      }),
    ).toBe(BIZ_A);
  });

  it("follows the account, not the business chosen on the form", () => {
    // Income offers no business picker: the account owns the money.
    expect(
      resolveTransactionBusinessId({
        mode: "income",
        scope: "business",
        selectedBusinessId: BIZ_A,
        accountBusinessId: BIZ_B,
      }),
    ).toBe(BIZ_B);
  });

  it("writes no business dimension for income into a personal account", () => {
    expect(
      resolveTransactionBusinessId({
        mode: "income",
        scope: "personal",
        selectedBusinessId: BIZ_A,
        accountBusinessId: null,
      }),
    ).toBeNull();
  });
});

describe("transactions — expense", () => {
  it("preserves the business chosen for the expense", () => {
    expect(
      resolveTransactionBusinessId({
        mode: "expense",
        scope: "business",
        selectedBusinessId: BIZ_A,
        accountBusinessId: BIZ_A,
      }),
    ).toBe(BIZ_A);
  });

  it("falls back to the paying account's business when none was chosen", () => {
    expect(
      resolveTransactionBusinessId({
        mode: "expense",
        scope: "business",
        selectedBusinessId: null,
        accountBusinessId: BIZ_A,
      }),
    ).toBe(BIZ_A);
  });

  it("keeps a personal expense out of every business", () => {
    expect(
      resolveTransactionBusinessId({
        mode: "expense",
        scope: "personal",
        selectedBusinessId: BIZ_A,
        accountBusinessId: null,
      }),
    ).toBeNull();
  });
});

describe("transactions — expense account/business validation", () => {
  const base = {
    mode: "expense" as const,
    scope: "business" as const,
    selectedBusinessId: BIZ_A,
    accountId: "acc-1",
    accountScope: "business" as const,
    accountBusinessId: BIZ_A,
  };

  it("accepts a business account owned by the selected business", () => {
    expect(transactionScopeIssue(base)).toBeNull();
  });

  it("rejects an account belonging to a different business", () => {
    expect(transactionScopeIssue({ ...base, accountBusinessId: BIZ_B })).toBe("businessMismatch");
  });

  it("rejects a personal account paying a business expense", () => {
    expect(
      transactionScopeIssue({ ...base, accountScope: "personal", accountBusinessId: null }),
    ).toBe("scopeMismatch");
  });

  it("rejects a business account paying a personal expense", () => {
    expect(
      transactionScopeIssue({
        ...base,
        scope: "personal",
        selectedBusinessId: null,
        accountScope: "business",
        accountBusinessId: BIZ_A,
      }),
    ).toBe("scopeMismatch");
  });

  it("rejects an account id that no longer resolves", () => {
    expect(transactionScopeIssue({ ...base, accountScope: null })).toBe("missingAccount");
    expect(transactionScopeIssue({ ...base, accountScope: undefined })).toBe("missingAccount");
  });

  it("leaves an empty account selection to the form's required-field check", () => {
    // The form reports "Select the account this entry affects." for an empty
    // selection on every mode, so this rule must not pre-empt that message.
    expect(transactionScopeIssue({ ...base, accountId: "" })).toBeNull();
    expect(transactionScopeIssue({ ...base, accountId: null })).toBeNull();
  });

  it("does not apply business validation to income or transfer", () => {
    // Income and transfer derive attribution from the account, so a personal
    // account is a legitimate choice and must not be reported as a mismatch.
    expect(
      transactionScopeIssue({
        mode: "income",
        scope: "business",
        selectedBusinessId: BIZ_A,
        accountId: "acc-1",
        accountScope: "personal",
        accountBusinessId: null,
      }),
    ).toBeNull();
    expect(
      transactionScopeIssue({
        mode: "transfer",
        scope: "business",
        selectedBusinessId: BIZ_A,
        accountId: "acc-1",
        accountScope: "personal",
        accountBusinessId: null,
      }),
    ).toBeNull();
  });
});

describe("transactions — transfer", () => {
  it("derives business attribution from the source account", () => {
    expect(
      resolveTransactionBusinessId({
        mode: "transfer",
        scope: "business",
        selectedBusinessId: BIZ_A,
        accountBusinessId: BIZ_B,
      }),
    ).toBe(BIZ_B);
  });

  it("stays a movement: a transfer is never classified as an expense", () => {
    expect(resolveExpenseScope({ mode: "transfer", scope: "business" })).toBe("personal");
    expect(resolveExpenseScope({ mode: "income", scope: "business" })).toBe("personal");
    expect(resolveExpenseScope({ mode: "expense", scope: "business" })).toBe("business");
  });

  it("reports the account's scope, not the form's fallback", () => {
    expect(resolveTransactionScope({ scope: "personal", accountScope: "business" })).toBe(
      "business",
    );
    expect(resolveTransactionScope({ scope: "business", accountScope: null })).toBe("business");
  });
});

describe("expected money", () => {
  it("preserves the active business on create", () => {
    expect(resolveScopedWrite(BIZ_A)).toEqual({
      business_id: BIZ_A,
      financial_scope: "business",
    });
  });

  it("writes no business dimension in the portfolio view", () => {
    expect(resolveScopedWrite(null)).toEqual({
      business_id: null,
      financial_scope: "personal",
    });
  });

  it("settlement posts an income transaction carrying the item's business", () => {
    const tx = buildReceivedExpectedTransaction(
      {
        amount: 250000,
        source: "Invoice 014",
        description: "Retail order",
        financial_scope: "business",
        business_id: BIZ_A,
        business_name: "DailyGear",
      },
      "user-1",
      "acc-1",
      "2026-09-30T10:00:00.000Z",
    );

    expect(tx.type).toBe("income");
    expect(tx.business_id).toBe(BIZ_A);
    expect(tx.financial_scope).toBe("business");
    expect(tx.business_name).toBe("DailyGear");
    // Settlement realises a receivable; it does not invent new money beyond the
    // expected amount that was already tracked.
    expect(tx.amount).toBe(250000);
  });

  it("settlement of a personal expectation stays personal", () => {
    const tx = buildReceivedExpectedTransaction(
      { amount: 50000, source: "Salary", financial_scope: "personal" },
      "user-1",
      "acc-1",
      "2026-09-30T10:00:00.000Z",
    );

    expect(tx.business_id).toBeNull();
    expect(tx.financial_scope).toBe("personal");
  });
});
