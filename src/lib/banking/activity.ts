import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type BankingActivityType =
  | "call"
  | "visit"
  | "meeting"
  | "follow_up"
  | "lead_contacted"
  | "customer_conversation"
  | "application"
  | "referral"
  | "product_discussion"
  | "document_collection";
export type BankingActivityStatus = "planned" | "completed" | "cancelled";
export type BankingActivity = {
  id: string;
  user_id: string;
  business_id: string | null;
  prospect_id: string | null;
  activity_type: BankingActivityType;
  status: BankingActivityStatus;
  activity_date: string;
  subject: string;
  outcome: string | null;
  notes: string | null;
  follow_up_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

// These tables are delivered by the migration in this branch before generated types are refreshed.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;
export const bankingActivitiesKey = ["banking-personal", "activities"] as const;

export function useBankingActivities() {
  return useQuery({
    queryKey: bankingActivitiesKey,
    queryFn: async (): Promise<BankingActivity[]> => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return [];
      const { data, error } = await db
        .from("banking_activity_log")
        .select("*")
        .eq("user_id", auth.user.id)
        .order("activity_date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(250);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCreateBankingActivity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      input: Omit<BankingActivity, "id" | "user_id" | "created_at" | "updated_at" | "completed_at">,
    ) => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("Not authenticated");
      const { data, error } = await db
        .from("banking_activity_log")
        .insert({ ...input, user_id: auth.user.id })
        .select()
        .single();
      if (error) throw error;
      return data as BankingActivity;
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: bankingActivitiesKey }),
  });
}

export type BankingActivityMetrics = {
  today: number;
  thisWeek: number;
  thisMonth: number;
  completedToday: number;
  followUpsDue: number;
  prospectsContacted: number;
};

function startOfWeek(date: Date) {
  const result = new Date(date);
  const day = result.getDay();
  result.setDate(result.getDate() - (day === 0 ? 6 : day - 1));
  result.setHours(0, 0, 0, 0);
  return result;
}

export function calculateActivityMetrics(
  activities: BankingActivity[],
  now = new Date(),
): BankingActivityMetrics {
  const todayKey = now.toISOString().slice(0, 10);
  const monthKey = todayKey.slice(0, 7);
  const weekStart = startOfWeek(now).toISOString().slice(0, 10);
  const contactTypes = new Set<BankingActivityType>([
    "call",
    "visit",
    "meeting",
    "lead_contacted",
    "customer_conversation",
  ]);
  return activities.reduce(
    (metrics, activity) => {
      if (activity.status === "cancelled") return metrics;
      if (activity.activity_date === todayKey) {
        metrics.today += 1;
        if (activity.status === "completed") metrics.completedToday += 1;
      }
      if (activity.activity_date >= weekStart) metrics.thisWeek += 1;
      if (activity.activity_date.startsWith(monthKey)) metrics.thisMonth += 1;
      if (
        activity.follow_up_at &&
        new Date(activity.follow_up_at) <= now &&
        activity.status !== "completed"
      ) {
        metrics.followUpsDue += 1;
      }
      if (contactTypes.has(activity.activity_type) && activity.prospect_id) {
        metrics.prospectsContacted += 1;
      }
      return metrics;
    },
    {
      today: 0,
      thisWeek: 0,
      thisMonth: 0,
      completedToday: 0,
      followUpsDue: 0,
      prospectsContacted: 0,
    },
  );
}
