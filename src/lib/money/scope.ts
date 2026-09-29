/**
 * Money Center scope resolution.
 *
 * The Money Center index is a portfolio view by design: it aggregates
 * personal + business money and stays unscoped. The detail sub-routes
 * (accounts, transactions, budgets, bills, expected money, ...) narrow
 * to the active business when one is selected.
 *
 * This hook is the single point of resolution so every route agrees on
 * what "active business" means. It mirrors the contract already proven by
 * `MoneySnapshot`:
 *
 *   businessId = businessContext.business?.id ?? null
 *
 * - `null` → portfolio view (no business filter)
 * - a business id → only that business's records, exact equality match
 *
 * It deliberately does NOT invent a business selector UI. Business
 * context is owned globally by `BusinessContextProvider` (set via the
 * sidebar or hostname) and read here.
 */

import { useBusinessContextOptional } from "@/lib/businesses/context";
import type { Business } from "@/lib/businesses/types";

export type MoneyCenterScope = {
  /** Resolved business id, or null for the portfolio view. */
  businessId: string | null;
  /** True when a specific business is active. */
  isBusinessScoped: boolean;
  /** The active business record, or null in portfolio view. */
  business: Business | null;
};

/** Pure resolution logic — testable without React. */
export function resolveMoneyCenterScope(business: Business | null): MoneyCenterScope {
  const businessId = business?.id ?? null;
  return {
    businessId,
    isBusinessScoped: businessId !== null,
    business,
  };
}

/**
 * Resolve the active Money Center scope from the global business context.
 *
 * Safe to call anywhere: returns a portfolio scope when no provider is
 * present, rather than throwing.
 */
export function useMoneyCenterScope(): MoneyCenterScope {
  const businessContext = useBusinessContextOptional();
  return resolveMoneyCenterScope(businessContext?.business ?? null);
}
