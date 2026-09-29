import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { carryForwardBudgets } from "./budget-calculations";
import type { ExpenseScope } from "./constants";
import { buildReceivedExpectedTransaction } from "./expected-money";
import { resolveScopedWrite } from "./write-scope";
import type { Asset, CryptoHolding } from "./net-worth-types";

export interface Account {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  color: string;
  type: "cash" | "bank" | "mobile_money" | "credit_card" | "wallet" | "other";
  currency: string;
  opening_balance: number;
  status: "active" | "archived";
  sort_order: number;
  deleted_at: string | null;
  created_at: string;
  financial_scope: "personal" | "business" | null;
  business_name: string | null;
  business_id: string | null;
}

export interface AccountBalance {
  account_id: string;
  user_id: string;
  balance: number;
  money_in: number;
  money_out: number;
}

export interface Business {
  id: string;
  name: string;
  status: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  occurred_at: string;
  type: "income" | "expense" | "transfer" | "adjustment";
  account_id: string;
  transfer_account_id: string | null;
  category: string | null;
  source: string | null;
  description: string | null;
  reference: string | null;
  amount: number;
  business_id: string | null;
  financial_scope: "personal" | "business" | null;
  business_name: string | null;
  income_type: string | null;
  expense_type: string | null;
  expense_scope: ExpenseScope | null;
  attachment_url: string | null;
  status: "posted" | "pending" | "void";
  deleted_at: string | null;
  created_at: string;
}

export interface Budget {
  id: string;
  user_id: string;
  category: string;
  month: string;
  amount: number;
  deleted_at: string | null;
  business_id?: string | null;
}

export interface Expected {
  id: string;
  user_id: string;
  expected_date: string;
  source: string;
  description: string | null;
  amount: number;
  probability: number;
  status: "pending" | "received" | "cancelled";
  account_id: string | null;
  received_transaction_id: string | null;
  deleted_at: string | null;
  financial_scope: "personal" | "business" | null;
  business_id: string | null;
  business_name: string | null;
}

export interface DeliveryPrepayment {
  id: string;
  order_id: string;
  courier_provider: string;
  status: string;
  amount: number;
  currency: string;
  payment_reference: string;
  due_on_delivery: number;
  paid_at: string;
}

export function useAssets() {
  return useQuery({
    queryKey: ["assets", "net-worth"],
    queryFn: async (): Promise<Asset[]> => {
      const { data, error } = await supabase
        .from("assets")
        .select("*")
        .order("valuation_date", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCryptoHoldings() {
  return useQuery({
    queryKey: ["money_crypto_holdings", "net-worth"],
    queryFn: async (): Promise<CryptoHolding[]> => {
      const { data, error } = await supabase
        .from("money_crypto_holdings")
        .select("*")
        .order("valued_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

async function uid() {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Not authenticated");
  return data.user.id;
}

/* ---------------- Accounts ---------------- */
export function businessSlugFromName(name: string): string {
  return (
    name
      .trim()
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "") || "business"
  );
}

export function useBusinesses() {
  return useQuery({
    queryKey: ["businesses", "finance"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("businesses")
        .select("id,name,status")
        .eq("status", "active")
        .order("name")
        .limit(50);
      if (error) throw error;
      return (data ?? []) as Business[];
    },
  });
}

export function useSaveBusiness() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; currency?: string; business_type?: string }) => {
      const name = input.name.trim();
      if (!name) throw new Error("Enter a business name.");
      const user_id = await uid();
      const { data, error } = await supabase
        .from("businesses")
        .insert({
          user_id,
          name,
          slug: businessSlugFromName(name),
          status: "active",
          currency: input.currency ?? "KES",
          business_type: input.business_type ?? null,
        } as never)
        .select("id,name,status,currency,business_type")
        .single();
      if (error) throw error;
      return data as Business;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["businesses", "finance"] });
      toast.success("Business added");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useAccounts(includeArchived = false, businessId?: string | null) {
  return useQuery({
    queryKey: ["accounts", includeArchived, businessId ?? null],
    queryFn: async () => {
      let q = supabase
        .from("accounts")
        .select("*")
        .is("deleted_at", null)
        .order("sort_order")
        .order("created_at");
      if (!includeArchived) q = q.eq("status", "active");
      if (businessId) {
        q = q.eq("business_id", businessId);
      }
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Account[];
    },
  });
}

/**
 * Cache key for account balances.
 *
 * `account_balances` is a view with no `business_id` column, so a
 * business-scoped balance read is scoped by resolving the business's accounts
 * first and filtering on exact `account_id` membership. The business id is part
 * of the key so two businesses never share a cached balance set.
 */
export function accountBalancesQueryKey(businessId?: string | null) {
  return ["account_balances", businessId ?? null] as const;
}

export function useAccountBalances(businessId?: string | null) {
  return useQuery({
    queryKey: accountBalancesQueryKey(businessId),
    queryFn: async (): Promise<AccountBalance[]> => {
      let q = supabase.from("account_balances").select("*");

      if (businessId) {
        const { data: accountRows, error: accountError } = await supabase
          .from("accounts")
          .select("id")
          .eq("business_id", businessId)
          .is("deleted_at", null);
        if (accountError) throw accountError;
        const accountIds = (accountRows ?? []).map((a) => a.id);
        q = q.in("account_id", accountIds);
      }

      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as AccountBalance[];
    },
  });
}

export function useSaveAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<Account> & { id?: string }) => {
      const user_id = await uid();
      const payload = { ...input, user_id };
      const { error } = input.id
        ? await supabase
            .from("accounts")
            .update(payload as never)
            .eq("id", input.id)
        : await supabase.from("accounts").insert(payload as never);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["accounts"] });
      qc.invalidateQueries({ queryKey: ["account_balances"] });
      toast.success("Account saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useArchiveAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, archived }: { id: string; archived: boolean }) => {
      const { error } = await supabase
        .from("accounts")
        .update({ status: archived ? "archived" : "active" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["accounts"] });
      toast.success("Account updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

/* ---------------- Transactions ---------------- */
export interface TxFilter {
  type?: Transaction["type"];
  accountId?: string;
  from?: string;
  to?: string;
  toExclusive?: string;
  search?: string;
  limit?: number;
  businessId?: string | null;
}

export function useTransactions(filter: TxFilter = {}) {
  return useQuery({
    queryKey: ["transactions", filter],
    queryFn: async () => {
      let q = supabase
        .from("transactions")
        .select("*")
        .is("deleted_at", null)
        .order("occurred_at", { ascending: false });
      if (filter.type) q = q.eq("type", filter.type);
      if (filter.accountId)
        q = q.or(`account_id.eq.${filter.accountId},transfer_account_id.eq.${filter.accountId}`);
      if (filter.from) q = q.gte("occurred_at", filter.from);
      if (filter.toExclusive) q = q.lt("occurred_at", filter.toExclusive);
      else if (filter.to) q = q.lte("occurred_at", filter.to);
      if (filter.search)
        q = q.or(
          `description.ilike.%${filter.search}%,reference.ilike.%${filter.search}%,category.ilike.%${filter.search}%,source.ilike.%${filter.search}%`,
        );
      if (filter.businessId) q = q.eq("business_id", filter.businessId);
      if (filter.limit) q = q.limit(filter.limit);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Transaction[];
    },
  });
}

export function useDeliveryPrepayments(from?: string, until?: string) {
  return useQuery({
    queryKey: ["delivery-prepayments", from, until],
    queryFn: async () => {
      let query = supabase
        .from("dg_delivery_prepayments" as never)
        .select(
          "id,order_id,courier_provider,status,amount,currency,payment_reference,due_on_delivery,paid_at",
        )
        .order("paid_at", { ascending: false })
        .limit(1000);
      if (from) query = query.gte("paid_at", `${from}T00:00:00Z`);
      if (until) query = query.lte("paid_at", `${until}T23:59:59Z`);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as unknown as DeliveryPrepayment[];
    },
  });
}

export function useSaveTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<Transaction> & { id?: string }) => {
      const user_id = await uid();
      const payload = { ...input, user_id };
      if (input.id) {
        const { error } = await supabase
          .from("transactions")
          .update(payload as never)
          .eq("id", input.id);
        if (error) throw error;
        return input.id;
      }
      const { data, error } = await supabase
        .from("transactions")
        .insert(payload as never)
        .select("id")
        .single();
      if (error) throw error;
      return data.id as string;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["account_balances"] });
      qc.invalidateQueries({ queryKey: ["budgets"] });
      toast.success("Transaction saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useVoidTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("transactions")
        .update({ status: "void", deleted_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["account_balances"] });
      toast.success("Transaction voided");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

/* ---------------- Budgets ---------------- */
export function useBudgets(month: string, businessId?: string | null) {
  return useQuery({
    queryKey: ["budgets", month, businessId ?? null],
    queryFn: async () => {
      let q = supabase
        .from("budgets")
        .select("*")
        .order("month", { ascending: false })
        .order("category");
      if (businessId) q = q.eq("business_id", businessId);
      const { data, error } = await q;
      if (error) throw error;
      return carryForwardBudgets((data ?? []) as Budget[], month);
    },
  });
}

/**
 * Upsert conflict target for budgets.
 *
 * This MUST match `budgets_user_business_category_month_unique`, added by
 * 20260930090000_business_aware_budget_uniqueness.sql as
 * `unique nulls not distinct (user_id, business_id, category, month)`.
 *
 * The previous target, `user_id,category,month`, matched the original
 * three-column constraint and had no business dimension at all. Because a
 * budget is now written with a business_id, that key let a second business
 * silently overwrite the first business's row -- both its amount and its
 * business_id. Including business_id is what keeps each business's budget
 * independent; NULLS NOT DISTINCT on the database side is what keeps exactly
 * one personal budget in that same position.
 */
export const BUDGET_UPSERT_CONFLICT = "user_id,business_id,category,month";

export function useSaveBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id?: string;
      category: string;
      month: string;
      amount: number;
      business_id?: string | null;
    }) => {
      const user_id = await uid();
      if (input.id) {
        // Editing an existing budget changes only its amount. Its business
        // dimension is part of the row's identity, so it is deliberately not
        // rewritten here; moving a budget between businesses is not an edit.
        const { error } = await supabase
          .from("budgets")
          .update({ amount: input.amount })
          .eq("id", input.id);
        if (error) throw error;
      } else {
        const { business_id, financial_scope } = resolveScopedWrite(input.business_id ?? null);
        const { error } = await supabase.from("budgets").upsert(
          {
            user_id,
            category: input.category,
            month: input.month,
            amount: input.amount,
            business_id,
            financial_scope,
          },
          { onConflict: BUDGET_UPSERT_CONFLICT },
        );
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["budgets"] });
      toast.success("Budget saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useArchiveBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("budgets")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["budgets"] });
      toast.success("Budget removed");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

/* ---------------- Expected Money ---------------- */
export function useExpected(status?: Expected["status"], businessId?: string | null) {
  return useQuery({
    queryKey: ["expected", status, businessId ?? null],
    queryFn: async () => {
      let q = supabase
        .from("expected_money")
        .select("*")
        .is("deleted_at", null)
        .order("expected_date");
      if (status) q = q.eq("status", status);
      if (businessId) q = q.eq("business_id", businessId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Expected[];
    },
  });
}

export function useSaveExpected() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<Expected> & { id?: string }) => {
      const user_id = await uid();
      const payload = { ...input, user_id };
      const { error } = input.id
        ? await supabase
            .from("expected_money")
            .update(payload as never)
            .eq("id", input.id)
        : await supabase.from("expected_money").insert(payload as never);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expected"] });
      toast.success("Expected item saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useMarkExpectedReceived() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ expected, accountId }: { expected: Expected; accountId: string }) => {
      const user_id = await uid();
      const { data: tx, error: txErr } = await supabase
        .from("transactions")
        .insert(
          buildReceivedExpectedTransaction(expected, user_id, accountId, new Date().toISOString()),
        )
        .select("id")
        .single();
      if (txErr) throw txErr;
      const { error } = await supabase
        .from("expected_money")
        .update({
          status: "received",
          account_id: accountId,
          received_transaction_id: tx.id,
        })
        .eq("id", expected.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expected"] });
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["account_balances"] });
      toast.success("Marked as received");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useCancelExpected() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("expected_money")
        .update({ status: "cancelled" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expected"] });
      toast.success("Cancelled");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
