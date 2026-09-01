import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  getAurenDailyBriefingForUser,
  type AurenDailyBriefingResponse,
} from "./daily-briefing.server";

export const getAurenDailyBriefing = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AurenDailyBriefingResponse> =>
    getAurenDailyBriefingForUser({
      supabase: context.supabase,
      userId: context.userId,
    }),
  );
