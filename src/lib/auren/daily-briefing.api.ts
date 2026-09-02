import { useQuery } from "@tanstack/react-query";
import { getAurenDailyBriefing } from "./daily-briefing.functions";

export const aurenDailyBriefingKey = ["auren", "daily-briefing"] as const;

export function useAurenDailyBriefing() {
  return useQuery({
    queryKey: aurenDailyBriefingKey,
    queryFn: () => getAurenDailyBriefing(),
    staleTime: 5 * 60 * 1000,
  });
}
