import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getAurenDailyBriefing } from "./daily-briefing.functions";

export const aurenDailyBriefingKey = ["auren", "daily-briefing"] as const;
export const dailyBriefingQueryKey = (userId: string) =>
  [...aurenDailyBriefingKey, userId] as const;

export function useAurenDailyBriefing() {
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState<string | null | undefined>(undefined);
  const [authError, setAuthError] = useState<Error | null>(null);

  useEffect(() => {
    let active = true;
    void supabase.auth.getUser().then(({ data, error }) => {
      if (!active) return;
      if (error) {
        setAuthError(error);
        setUserId(null);
        return;
      }
      setUserId(data.user?.id ?? null);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      queryClient.removeQueries({ queryKey: aurenDailyBriefingKey });
      setAuthError(null);
      setUserId(session?.user?.id ?? null);
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, [queryClient]);

  const briefingQuery = useQuery({
    queryKey: dailyBriefingQueryKey(userId ?? "anonymous"),
    enabled: userId !== undefined && userId !== null,
    queryFn: () => getAurenDailyBriefing(),
    staleTime: 5 * 60 * 1000,
  });

  return {
    ...briefingQuery,
    isLoading: userId === undefined || briefingQuery.isLoading,
    isError: authError !== null || briefingQuery.isError,
    error: authError ?? briefingQuery.error,
  };
}
