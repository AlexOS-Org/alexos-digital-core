import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  recordStockMovementImpl,
  validateStockMovementRequest,
  type StockMovementInput,
} from "./inventory.server";

export const recordStockMovement = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown): StockMovementInput => validateStockMovementRequest(data))
  .handler(async ({ data, context }) =>
    recordStockMovementImpl(data, {
      supabase: context.supabase,
      userId: context.userId,
    }),
  );
