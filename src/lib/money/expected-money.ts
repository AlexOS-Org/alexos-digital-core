export type ExpectedIncomeContext = {
  amount: number;
  source: string;
  description?: string | null;
  financial_scope?: "personal" | "business" | null;
  business_id?: string | null;
  business_name?: string | null;
};

export function buildReceivedExpectedTransaction(
  expected: ExpectedIncomeContext,
  userId: string,
  accountId: string,
  occurredAt: string,
) {
  return {
    user_id: userId,
    type: "income" as const,
    account_id: accountId,
    amount: expected.amount,
    source: expected.source,
    description: expected.description ?? `Expected: ${expected.source}`,
    occurred_at: occurredAt,
    financial_scope: expected.financial_scope ?? "personal",
    business_id: expected.business_id ?? null,
    business_name: expected.business_name ?? null,
  };
}
