import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  getAurenAdvisoryForUser,
  validateAurenAdvisorRequest,
  type AurenAdvisoryResponse,
  type AurenAdvisorRequest,
} from "./advisor.server";

export const getAurenAdvisory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown): AurenAdvisorRequest => validateAurenAdvisorRequest(data))
  .handler(async ({ data, context }): Promise<AurenAdvisoryResponse> =>
    getAurenAdvisoryForUser(data, { supabase: context.supabase, userId: context.userId }),
  );
