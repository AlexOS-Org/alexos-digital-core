import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  calculateDailyGearProfitCashFlowForUser,
  validateDailyGearProfitCashFlowRequest,
  type DailyGearProfitCashFlowRequest,
} from "./profit-cash-flow.server";

export const getDailyGearProfitCashFlow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown): DailyGearProfitCashFlowRequest =>
    validateDailyGearProfitCashFlowRequest(data),
  )
  .handler(async ({ data, context }) =>
    calculateDailyGearProfitCashFlowForUser(data, {
      supabase: context.supabase,
      userId: context.userId,
    }),
  );
