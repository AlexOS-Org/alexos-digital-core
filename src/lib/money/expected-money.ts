export type ExpectedIncomeContext = {
  amount: number;
  source: string;
  description?: string | null;
  financial_scope?: "personal" | "business" | null;
  business_id?: string | null;
  business_name?: string | null;
};

/**
 * Build the posted cash ledger row that realises an expected-money item.
 * The entry inherits the expected item's business scope so the ledger and the
 * receivable stay aligned.
 */
export function buildReceivedExpectedTransaction(
  expected: ExpectedIncomeContext,
  userId: string,
  accountId: string,
  occurredAt: string,
) {
  const financial_scope = expected.financial_scope ?? "personal";
  const business_id = expected.business_id ?? null;
  const business_name = expected.business_name ?? null;

  return {
    user_id: userId,
    type: "income" as const,
    account_id: accountId,
    amount: expected.amount,
    source: expected.source,
    description: expected.description ?? `Expected: ${expected.source}`,
    occurred_at: occurredAt,
    financial_scope,
    business_id,
    business_name,
    income_type: "other" as const,
    flow_type: "standard" as const,
  };
}
