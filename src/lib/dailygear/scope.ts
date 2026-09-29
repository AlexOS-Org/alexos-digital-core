import { useBusinessContextOptional } from "@/lib/businesses/context";

/**
 * DailyGear (e-commerce) business scope.
 *
 * DailyGear is a business-scoped module: on dailygear.co.ke the hostname
 * resolves to the "dailygear" business via BusinessContextProvider, so the
 * active business is available to every E-Commerce route without any
 * additional UI. This hook is the single read for that scope.
 *
 * Returns businessId = business?.id ?? null so that, in the default (no
 * provider / portfolio) case, resource hooks fall through to unscoped queries
 * and existing behaviour is preserved.
 */
export function useDailyGearScope() {
  const ctx = useBusinessContextOptional();
  const businessId = ctx?.business?.id ?? null;
  return { businessId };
}
