import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type FinancialScope = "personal" | "business";

export interface Debt {
  id: string;
  user_id: string;
  name: string;
  category: string | null;
  principal: number;
  interest_rate: number;
  minimum_payment: number;
  amount_paid: number;
  interest_paid: number;
  due_date: string | null;
  priority: "low" | "medium" | "high";
  status: "active" | "paid" | "defaulted" | "archived";
  notes: string | null;
  sort_order: number;
  deleted_at: string | null;
  created_at: string;
  financial_scope: FinancialScope;
  business_name: string | null;
  disbursement_account_id: string | null;
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
    mutationFn: async (
      input: Partial<Debt> & {
        id?: string;
        disbursementAccountId?: string | null;
      },
    ) => {
      const user_id = await uid();
      const { disbursementAccountId, ...debtInput } = input;
      const payload = {
        ...debtInput,
        user_id,
        financial_scope: debtInput.financial_scope ?? "personal",
        business_name: debtInput.business_name || null,
        disbursement_account_id: disbursementAccountId ?? debtInput.disbursement_account_id ?? null,
      };

      if (input.id) {
        const { error } = await supabase
          .from("debts")
          .update(payload as never)
          .eq("id", input.id);
        if (error) throw error;
        return input.id;
      }

      const { data, error } = await supabase
        .from("debts")
        .insert(payload as never)
        .select("id")
        .single();
      if (error) throw error;

      const debtId = data.id as string;
      const principal = Number(input.principal) || 0;
      const accountId = disbursementAccountId ?? input.disbursement_account_id ?? null;

      // Loan proceeds are cash received, but never operating income.
      if (accountId && principal > 0) {
        const { error: txError } = await supabase.from("transactions").insert({
          user_id,
          occurred_at: new Date().toISOString(),
          type: "adjustment",
          account_id: accountId,
          amount: principal,
          category: "Loan Received",
          source: input.name || "Loan",
          description: `Loan proceeds received - ${input.name || "Loan"}`,
          status: "posted",
          debt_id: debtId,
          flow_type: "loan_received",
          financial_scope: input.financial_scope ?? "personal",
          business_name: input.business_name || null,
        } as never);

        if (txError) throw txError;
      }

      return debtId;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["debts"] });
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["account_balances"] });
      qc.invalidateQueries({ queryKey: ["budgets"] });
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
      interestAmount = 0,
      accountId,
      paymentDate,
      description,
    }: {
      debt: Debt;
      amount: number;
      interestAmount?: number;
      accountId: string;
      paymentDate: string;
      description?: string;
    }) => {
      const user_id = await uid();
      const total = Number(amount);
      const interest = Math.max(0, Number(interestAmount) || 0);
      const principal = total - interest;
      const remainingPrincipal = debtRemaining(debt);

      if (!Number.isFinite(total) || total <= 0) throw new Error("Enter a valid payment amount");
      if (interest > total) throw new Error("Interest cannot exceed the total payment");
      if (principal > remainingPrincipal) {
        throw new Error(
          `Principal payment cannot exceed the remaining ${remainingPrincipal.toLocaleString()} principal`,
        );
      }

      const newPaid = Number(debt.amount_paid) + principal;
      const newInterestPaid = Number(debt.interest_paid || 0) + interest;
      const remaining = Number(debt.principal) - newPaid;
      const status = remaining <= 0 ? "paid" : debt.status;
      const scope = debt.financial_scope ?? "personal";

      const { error: debtError } = await supabase
        .from("debts")
        .update({ amount_paid: newPaid, interest_paid: newInterestPaid, status })
        .eq("id", debt.id);

      if (debtError) throw debtError;

      if (principal > 0) {
        const { error: principalError } = await supabase.from("transactions").insert({
          user_id,
          occurred_at: paymentDate,
          type: "adjustment",
          account_id: accountId,
          amount: principal,
          category: "Debt Principal",
          description: description || `Principal payment - ${debt.name}`,
          status: "posted",
          debt_id: debt.id,
          flow_type: "debt_payment",
          principal_amount: principal,
          interest_amount: 0,
          financial_scope: scope,
          business_name: debt.business_name,
        } as never);

        if (principalError) throw principalError;
      }

      if (interest > 0) {
        const { error: interestError } = await supabase.from("transactions").insert({
          user_id,
          occurred_at: paymentDate,
          type: "expense",
          account_id: accountId,
          amount: interest,
          category: "Debt Interest",
          description: description || `Interest payment - ${debt.name}`,
          status: "posted",
          debt_id: debt.id,
          flow_type: "debt_interest",
          principal_amount: 0,
          interest_amount: interest,
          financial_scope: scope,
          business_name: debt.business_name,
        } as never);

        if (interestError) throw interestError;
      }
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
      const { error } = await supabase.from("debts").update({ status: "archived" }).eq("id", id);

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
