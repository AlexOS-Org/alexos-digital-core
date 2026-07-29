import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Debt {
  id: string;
  user_id: string;
  name: string;
  category: string | null;
  principal: number;
  interest_rate: number;
  minimum_payment: number;
  amount_paid: number;
  due_date: string | null;
  priority: "low" | "medium" | "high";
  status: "active" | "paid" | "defaulted" | "archived";
  notes: string | null;
  sort_order: number;
  deleted_at: string | null;
  created_at: string;
}

async function uid() {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Not authenticated");
  return data.user.id;
}

export function useDebts(includeArchived = false) {
  return useQuery({
    queryKey: ["debts", includeArchived],
    queryFn: async () => {
      let q = supabase
        .from("debts")
        .select("*")
        .is("deleted_at", null)
        .order("priority", { ascending: false })
        .order("due_date", { nullsFirst: false })
        .order("created_at");

      if (!includeArchived) q = q.neq("status", "archived");

      const { data, error } = await q;
      if (error) throw error;

      return (data ?? []) as Debt[];
    },
  });
}

export function useSaveDebt() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: Partial<Debt> & { id?: string }) => {
      const user_id = await uid();
      const payload = { ...input, user_id };

      const { error } = input.id
        ? await supabase
            .from("debts")
            .update(payload as never)
            .eq("id", input.id)
        : await supabase.from("debts").insert(payload as never);

      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["debts"] });
      toast.success("Debt saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useRecordDebtPayment() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      debt,
      amount,
      accountId,
      paymentDate,
      description,
    }: {
      debt: Debt;
      amount: number;
      accountId: string;
      paymentDate: string;
      description?: string;
    }) => {
      const user_id = await uid();
      const newPaid = Number(debt.amount_paid) + amount;
      const remaining = Number(debt.principal) - newPaid;
      const status = remaining <= 0 ? "paid" : debt.status;

      const { error: debtError } = await supabase
        .from("debts")
        .update({ amount_paid: newPaid, status })
        .eq("id", debt.id);

      if (debtError) throw debtError;

      const { error: txError } = await supabase.from("transactions").insert({
        user_id,
        occurred_at: paymentDate,
        type: "expense",
        account_id: accountId,
        amount,
        category: "Debt Payment",
        description: description || `Payment - ${debt.name}`,
        status: "posted",
      });

      if (txError) throw txError;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["debts"] });
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["account_balances"] });
      qc.invalidateQueries({ queryKey: ["budgets"] });
      toast.success("Debt payment recorded");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useArchiveDebt() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("debts")
        .update({ status: "archived" })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["debts"] });
      toast.success("Debt archived");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteDebt() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("debts")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["debts"] });
      toast.success("Debt removed");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function debtRemaining(d: Debt) {
  return Math.max(0, Number(d.principal) - Number(d.amount_paid));
}

export function debtProgress(d: Debt) {
  const principal = Number(d.principal);
  if (principal <= 0) return 0;
  return Math.min(100, (Number(d.amount_paid) / principal) * 100);
}
