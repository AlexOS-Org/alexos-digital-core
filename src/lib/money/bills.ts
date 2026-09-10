import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { expenseTypeForCategory } from "./constants";

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

export type BillDueKind = "no_date" | "due_today" | "upcoming" | "overdue" | "paid";

export type BillDueState = {
  kind: BillDueKind;
  /** Calendar days until due (negative = overdue). Null when no due date. */
  days: number | null;
  label: string;
};

function calendarDayUtc(isoDate: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(isoDate);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (!y || !mo || !d) return null;
  return Date.UTC(y, mo - 1, d);
}

/**
 * Relative due state for bill cards.
 * Uses UTC calendar days so local timezone does not shift the due boundary.
 */
export function getBillDueState(
  dueDate: string | null | undefined,
  status: BillStatus,
  today = new Date(),
): BillDueState {
  if (status === "paid") {
    return { kind: "paid", days: null, label: "Paid" };
  }
  if (!dueDate) {
    return { kind: "no_date", days: null, label: "No due date" };
  }

  const dueMs = calendarDayUtc(dueDate);
  if (dueMs === null) {
    return { kind: "no_date", days: null, label: "No due date" };
  }

  const todayMs = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const days = Math.round((dueMs - todayMs) / 86_400_000);

  if (days === 0) {
    return { kind: "due_today", days: 0, label: "Due today" };
  }
  if (days > 0) {
    return {
      kind: "upcoming",
      days,
      label: days === 1 ? "Due in 1 day" : `Due in ${days} days`,
    };
  }
  const overdue = Math.abs(days);
  return {
    kind: "overdue",
    days,
    label: overdue === 1 ? "Overdue by 1 day" : `Overdue by ${overdue} days`,
  };
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
        auto_create_transaction: input.auto_create_transaction ?? true,
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

export type MarkBillPaidInput = {
  bill: Bill;
  /** Required: cash leaves this account. */
  accountId: string;
  /** personal | business — defaults to personal when omitted. */
  expenseScope?: "personal" | "business";
  businessId?: string | null;
};

/**
 * Mark a bill paid:
 * 1) Post one expense on the selected account (ledger).
 * 2) Record last_paid_at + account_id on the bill.
 * 3) Recurring → advance due_date, keep pending; one-time → status paid.
 */
export function useMarkBillPaid() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ bill, accountId, expenseScope = "personal", businessId }: MarkBillPaidInput) => {
      if (!accountId) {
        throw new Error("Choose the account this bill was paid from.");
      }

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("Not authenticated");
      }

      const now = new Date().toISOString();
      const category = bill.category ?? "Other";

      const { error: txError } = await supabase.from("transactions").insert({
        user_id: user.id,
        type: "expense",
        status: "posted",
        account_id: accountId,
        amount: Number(bill.amount ?? 0),
        category,
        expense_type: expenseTypeForCategory(category),
        expense_scope: expenseScope,
        business_id: expenseScope === "business" ? (businessId ?? null) : null,
        description: `Bill: ${bill.name}`,
        reference: `bill:${bill.id}`,
        occurred_at: now,
      });

      if (txError) throw txError;

      if (bill.frequency !== "one_time") {
        const { error } = await supabase
          .from("bills")
          .update({
            status: "pending",
            last_paid_at: now,
            account_id: accountId,
            auto_create_transaction: true,
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
            account_id: accountId,
            auto_create_transaction: true,
          })
          .eq("id", bill.id);

        if (error) throw error;
      }
    },

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: BILLS_KEY });
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["account_balances"] });
      qc.invalidateQueries({ queryKey: ["balances"] });
    },
  });
}
