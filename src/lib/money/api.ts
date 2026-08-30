import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { carryForwardBudgets } from "./budget-calculations";
import type { ExpenseScope } from "./constants";

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

export function useAccounts(includeArchived = false) {
  return useQuery({
    queryKey: ["accounts", includeArchived],
    queryFn: async () => {
      let q = supabase
        .from("accounts")
        .select("*")
        .is("deleted_at", null)
        .order("sort_order")
        .order("created_at");
      if (!includeArchived) q = q.eq("status", "active");
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Account[];
    },
  });
}

export function useAccountBalances() {
  return useQuery({
    queryKey: ["account_balances"],
    queryFn: async () => {
      const { data, error } = await supabase.from("account_balances").select("*");
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
      if (filter.limit) q = q.limit(filter.limit);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Transaction[];
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
export function useBudgets(month: string) {
  return useQuery({
    queryKey: ["budgets", month],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("budgets")
        .select("*")
        .order("month", { ascending: false })
        .order("category");
      if (error) throw error;
      return carryForwardBudgets((data ?? []) as Budget[], month);
    },
  });
}

export function useSaveBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id?: string; category: string; month: string; amount: number }) => {
      const user_id = await uid();
      if (input.id) {
        const { error } = await supabase
          .from("budgets")
          .update({ amount: input.amount })
          .eq("id", input.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("budgets").upsert(
          {
            user_id,
            category: input.category,
            month: input.month,
            amount: input.amount,
          },
          { onConflict: "user_id,category,month" },
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
export function useExpected(status?: Expected["status"]) {
  return useQuery({
    queryKey: ["expected", status],
    queryFn: async () => {
      let q = supabase
        .from("expected_money")
        .select("*")
        .is("deleted_at", null)
        .order("expected_date");
      if (status) q = q.eq("status", status);
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
        .insert({
          user_id,
          type: "income",
          account_id: accountId,
          amount: expected.amount,
          source: expected.source,
          description: expected.description ?? `Expected: ${expected.source}`,
          occurred_at: new Date().toISOString(),
        })
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
