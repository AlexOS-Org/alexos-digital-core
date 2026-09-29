export type ExpectedMoneyScope = "personal" | "business";
export type ExpectedMoneyStatus = "pending" | "received" | "cancelled";
export type ExpectedMoneyState =
  | "expected"
  | "due"
  | "overdue"
  | "received"
  | "cancelled"
  | "needs_reconciliation"
  | "unsupported";

export type ExpectedMoneyRecord = {
  id: string;
  expected_date: string;
  amount: number;
  probability: number;
  status: ExpectedMoneyStatus;
  deleted_at?: string | null;
  financial_scope?: ExpectedMoneyScope | string | null;
  business_id?: string | null;
  received_transaction_id?: string | null;
};

export type ExpectedMoneyTransaction = {
  id: string;
  status: "posted" | "pending" | "void" | string;
  deleted_at?: string | null;
  type?: string;
  amount?: number;
  financial_scope?: ExpectedMoneyScope | string | null;
  business_id?: string | null;
};

export function utcDateKey(value: Date | string): string {
  if (typeof value === "string") return value.slice(0, 10);
  return value.toISOString().slice(0, 10);
}

export function classifyExpectedMoney(
  expected: ExpectedMoneyRecord,
  today: Date | string,
  transaction?: ExpectedMoneyTransaction | null,
): ExpectedMoneyState {
  if (expected.deleted_at) return "unsupported";
  if (expected.status === "cancelled") return "cancelled";
  if (expected.status === "received") {
    if (!expected.received_transaction_id || !transaction) return "needs_reconciliation";
    if (
      transaction.id !== expected.received_transaction_id ||
      transaction.status !== "posted" ||
      transaction.deleted_at ||
      transaction.type !== "income" ||
      (transaction.amount != null && Number(transaction.amount) !== Number(expected.amount)) ||
      (transaction.financial_scope ?? "personal") !== (expected.financial_scope ?? "personal") ||
      (expected.financial_scope === "business" && transaction.business_id !== expected.business_id)
    ) {
      return "needs_reconciliation";
    }
    return "received";
  }
  if (expected.received_transaction_id) return "needs_reconciliation";

  const expectedDate = utcDateKey(expected.expected_date);
  const todayKey = utcDateKey(today);
  if (expectedDate < todayKey) return "overdue";
  if (expectedDate === todayKey) return "due";
  return "expected";
}

export function isActiveExpectedMoneyState(state: ExpectedMoneyState): boolean {
  return state === "expected" || state === "due" || state === "overdue";
}

export function isQualifyingReceivable(
  expected: ExpectedMoneyRecord,
  transaction?: ExpectedMoneyTransaction | null,
  today: Date | string = new Date(),
): boolean {
  const state = classifyExpectedMoney(expected, today, transaction);
  return state === "overdue" || state === "due" || state === "expected";
}

export function expectedMoneyScopeMatches(
  expected: Pick<ExpectedMoneyRecord, "financial_scope" | "business_id">,
  account: { financial_scope?: string | null; business_id?: string | null },
): boolean {
  const scope = expected.financial_scope ?? "personal";
  if (scope === "business") {
    return (
      account.financial_scope === "business" &&
      Boolean(expected.business_id) &&
      account.business_id === expected.business_id
    );
  }
  return scope === "personal" && account.financial_scope !== "business" && !account.business_id;
}

export function expectedCurrencyState(
  expected: Pick<ExpectedMoneyRecord, "amount"> & { currency?: string | null },
  targetCurrency: string | null | undefined,
): "supported" | "unsupported" {
  const expectedCurrency = expected.currency?.trim().toUpperCase();
  const currency = targetCurrency?.trim().toUpperCase();
  if (!expectedCurrency || !currency) return "unsupported";
  return expectedCurrency === currency ? "supported" : "unsupported";
}

export function aggregateExpectedMoney(
  records: Array<ExpectedMoneyRecord & { account_id?: string | null }>,
  accounts: Array<{ id: string; currency?: string | null; status: string }>,
  stateFilter: (record: ExpectedMoneyRecord) => boolean,
): number | null {
  const accountsById = new Map(accounts.map((account) => [account.id, account]));
  const currencies = new Set<string>();
  let total = 0;
  for (const record of records.filter(stateFilter)) {
    const account = record.account_id ? accountsById.get(record.account_id) : undefined;
    const currency = account?.status === "active" ? account.currency?.trim().toUpperCase() : null;
    if (!currency) return null;
    currencies.add(currency);
    total += Number(record.amount);
  }
  if (currencies.size !== 1) return records.some(stateFilter) ? null : 0;
  return Math.round((total + Number.EPSILON) * 100) / 100;
}

export function buildReceivedExpectedTransaction(
  expected: {
    id?: string;
    amount: number;
    source: string;
    description?: string | null;
    financial_scope?: ExpectedMoneyScope | null;
    business_id?: string | null;
    business_name?: string | null;
  },
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
    reference: expected.id ? `EXPECTED:${expected.id}` : null,
    occurred_at: occurredAt,
    financial_scope: expected.financial_scope ?? "personal",
    business_id: expected.business_id ?? null,
    business_name: expected.business_name ?? null,
    flow_type: "standard",
  };
}
