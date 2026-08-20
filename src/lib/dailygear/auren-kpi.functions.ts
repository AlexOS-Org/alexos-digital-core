import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  getDailyGearAurenKpiSummary,
  validateAurenKpiRequest,
  type AurenKpiRequest,
} from "./auren-kpi.server";

export const getAurenKpiSummary = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown): AurenKpiRequest => validateAurenKpiRequest(data))
  .handler(async ({ data, context }) =>
    getDailyGearAurenKpiSummary(data, {
      supabase: context.supabase,
      userId: context.userId,
    }),
  );
