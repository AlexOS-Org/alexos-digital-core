import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Goal {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  category: string | null;
  target_amount: number;
  target_date: string | null;
  status: "active" | "achieved" | "paused" | "archived";
  notes: string | null;
  /** Primary Money Center account where contributions for this goal are saved. */
  account_id: string | null;
  sort_order: number;
  deleted_at: string | null;
  created_at: string;
}

export interface GoalProgress {
  goal_id: string;
  user_id: string;
  current_amount: number;
}

export interface GoalContribution {
  id: string;
  user_id: string;
  goal_id: string;
  account_id: string | null;
  amount: number;
  occurred_at: string;
  note: string | null;
  deleted_at: string | null;
  created_at: string;
}

async function uid() {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Not authenticated");
  return data.user.id;
}

export function useGoals(includeArchived = false) {
  return useQuery({
    queryKey: ["goals", includeArchived],
    queryFn: async () => {
      let q = supabase
        .from("goals")
        .select("*")
        .is("deleted_at", null)
        .order("sort_order")
        .order("created_at");
      if (!includeArchived) q = q.neq("status", "archived");
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as Goal[];
    },
  });
}

export function useGoalProgress() {
  return useQuery({
    queryKey: ["goal_progress"],
    queryFn: async () => {
      const { data, error } = await supabase.from("goal_progress").select("*");
      if (error) throw error;
      return (data ?? []) as GoalProgress[];
    },
  });
}

export function useGoalContributions(goalId?: string) {
  return useQuery({
    queryKey: ["goal_contributions", goalId],
    enabled: !!goalId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("goal_contributions")
        .select("*")
        .eq("goal_id", goalId!)
        .is("deleted_at", null)
        .order("occurred_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as GoalContribution[];
    },
  });
}

export function useSaveGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<Goal> & { id?: string; account_id?: string | null }) => {
      const user_id = await uid();
      const payload = { ...input, user_id };
      const { error } = input.id
        ? await supabase
            .from("goals")
            .update(payload as never)
            .eq("id", input.id)
        : await supabase.from("goals").insert(payload as never);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["goals"] });
      toast.success("Goal saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useContribute() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      goal_id: string;
      amount: number;
      account_id?: string | null;
      note?: string | null;
      occurred_at?: string;
    }) => {
      const user_id = await uid();
      const { error } = await supabase.from("goal_contributions").insert({
        user_id,
        goal_id: input.goal_id,
        amount: input.amount,
        account_id: input.account_id ?? null,
        note: input.note ?? null,
        occurred_at: input.occurred_at ?? new Date().toISOString(),
      } as never);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["goal_progress"] });
      qc.invalidateQueries({ queryKey: ["goal_contributions"] });
      toast.success("Contribution recorded");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useArchiveGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("goals").update({ status: "archived" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["goals"] });
      toast.success("Goal archived");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
