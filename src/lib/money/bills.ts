import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type BillFrequency = Database["public"]["Enums"]["bill_frequency"];
export type BillStatus = Database["public"]["Enums"]["bill_status"];
export type Bill = Database["public"]["Tables"]["bills"]["Row"];

/**
 * Convert a bill amount into its recurring monthly planning equivalent.
 * One-time bills are excluded because they are obligations for a specific due date,
 * not recurring monthly commitments.
 */
export function billMonthlyEquivalent(amount: number, frequency: BillFrequency): number {
  const normalizedAmount = Number.isFinite(amount) ? Math.max(0, amount) : 0;

  switch (frequency) {
    case "weekly":
      return (normalizedAmount * 52) / 12;
    case "quarterly":
      return normalizedAmount / 3;
    case "yearly":
      return normalizedAmount / 12;
    case "monthly":
      return normalizedAmount;
    case "one_time":
      return 0;
    default:
      return 0;
  }
}

export interface BillInput {
  id?: string;
  name: string;
  amount: number;
  category?: string | null;
  due_date: string;
  frequency: BillFrequency;
  status?: BillStatus;
  account_id?: string | null;
  notes?: string | null;
  auto_create_transaction?: boolean;
}

const BILLS_KEY = ["bills"] as const;

export function useBills() {
  return useQuery({
    queryKey: BILLS_KEY,
    queryFn: async (): Promise<Bill[]> => {
      const { data, error } = await supabase
        .from("bills")
        .select("*")
        .is("deleted_at", null)
        .order("due_date", { ascending: true });

      if (error) throw error;

      return data ?? [];
    },
  });
}

export function nextBillDueDate(dueDate: string, frequency: BillFrequency): string {
  const d = new Date(dueDate + "T00:00:00");

  switch (frequency) {
    case "weekly":
      d.setDate(d.getDate() + 7);
      break;
    case "monthly":
      d.setMonth(d.getMonth() + 1);
      break;
    case "quarterly":
      d.setMonth(d.getMonth() + 3);
      break;
    case "yearly":
      d.setFullYear(d.getFullYear() + 1);
      break;
    case "one_time":
      break;
  }

  return d.toISOString().slice(0, 10);
}

export function useSaveBill() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: BillInput): Promise<Bill> => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("Not authenticated");
      }

      const payload = {
        user_id: user.id,
        name: input.name,
        amount: input.amount,
        category: input.category ?? null,
        due_date: input.due_date,
        frequency: input.frequency,
        status: (input.status ?? "pending") as BillStatus,
        account_id: input.account_id ?? null,
        notes: input.notes ?? null,
        auto_create_transaction: input.auto_create_transaction ?? false,
      };

      if (input.id) {
        const { data, error } = await supabase
          .from("bills")
          .update(payload)
          .eq("id", input.id)
          .select()
          .single();

        if (error) throw error;

        return data;
      }

      const { data, error } = await supabase.from("bills").insert(payload).select().single();

      if (error) throw error;

      return data;
    },

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: BILLS_KEY });
    },
  });
}

export function useDeleteBill() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("bills")
        .update({
          deleted_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;
    },

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: BILLS_KEY });
    },
  });
}

export function useMarkBillPaid() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (bill: Bill) => {
      const now = new Date().toISOString();

      if (bill.auto_create_transaction && bill.account_id) {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          await supabase.from("transactions").insert({
            user_id: user.id,
            type: "expense",
            account_id: bill.account_id,
            amount: bill.amount,
            category: bill.category,
            description: `Bill: ${bill.name}`,
            occurred_at: now,
          });
        }
      }

      if (bill.frequency !== "one_time") {
        const { error } = await supabase
          .from("bills")
          .update({
            status: "pending",
            last_paid_at: now,
            due_date: bill.due_date ? nextBillDueDate(bill.due_date, bill.frequency) : null,
          })
          .eq("id", bill.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("bills")
          .update({
            status: "paid",
            last_paid_at: now,
          })
          .eq("id", bill.id);

        if (error) throw error;
      }
    },

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: BILLS_KEY });
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["balances"] });
    },
  });
}
