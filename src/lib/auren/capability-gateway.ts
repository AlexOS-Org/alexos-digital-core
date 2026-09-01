/**
 * Auren capability gateway — the explicit server-side boundary between the
 * intelligence layer and the connectors it may read from.
 *
 * This is intentionally small and additive. It does NOT fetch data, store
 * credentials, or mutate anything. It only:
 *
 * 1. declares the capabilities Auren is allowed to use;
 * 2. enforces per-workspace scope for read-only access;
 * 3. refuses any mutation until an explicit approval gate is wired in.
 *
 * Connector adapters can be registered here later, but each one must still
 * pass through `authorizeCapability` before it is allowed to run.
 */

export type CapabilityId = "supabase:read" | "dailygear:read" | "analytics:read";

export type CapabilityAuthorization = "read_only";

export interface AurenCapability {
  id: CapabilityId;
  label: string;
  description: string;
  /** Source of truth: first-party hosted data, external analytics, or catalogue. */
  source: "first_party_supabase" | "external_analytics" | "storefront" | "knowledge";
  authorization: CapabilityAuthorization;
  /** Mutation capability ids that are recognised but not yet approved. */
  mutationApprovalRequired: boolean;
  /** Human-visible capability name so the UI can label the connector honestly. */
  freshnessLabel: string;
}

export interface CapabilityAccessRequest {
  capabilityId: CapabilityId | "finance:write";
  userId: string | null;
  requestedUserId: string | null;
  requestedBusinessId: string | null;
}

export interface CapabilityAccessResult {
  allowed: boolean;
  /** Deterministic reason key; null when allowed. */
  reason: "workspace_scope_mismatch" | "mutation_not_approved" | "unknown_capability" | null;
}

export const readOnlyCapabilityRegistry: readonly AurenCapability[] = [
  {
    id: "analytics:read",
    label: "Approved external analytics",
    description: "Aggregate campaign and traffic signals from connected providers.",
    source: "external_analytics",
    authorization: "read_only",
    mutationApprovalRequired: true,
    freshnessLabel: "external context",
  },
  {
    id: "dailygear:read",
    label: "DailyGear catalogue and commerce",
    description: "Storefront products, variants, orders and inventory evidence.",
    source: "storefront",
    authorization: "read_only",
    mutationApprovalRequired: true,
    freshnessLabel: "synchronized storefront data",
  },
  {
    id: "supabase:read",
    label: "First-party Supabase records",
    description: "Owner-scoped financial, CRM, inventory and order records.",
    source: "first_party_supabase",
    authorization: "read_only",
    mutationApprovalRequired: true,
    freshnessLabel: "live first-party data",
  },
];

const CAPABILITY_INDEX = new Map<CapabilityId, AurenCapability>(
  readOnlyCapabilityRegistry.map((capability) => [capability.id, capability]),
);

export function listReadOnlyCapabilities(): AurenCapability[] {
  return [...readOnlyCapabilityRegistry];
}

export function getCapability(id: CapabilityId): AurenCapability | null {
  return CAPABILITY_INDEX.get(id) ?? null;
}

export function authorizeCapability(request: CapabilityAccessRequest): CapabilityAccessResult {
  const requested = request.capabilityId;

  // Mutations are not part of the registry. Refuse until an explicit approval
  // gate is implemented and the capability id is registered as write-capable.
  if (requested === "finance:write") {
    return { allowed: false, reason: "mutation_not_approved" };
  }

  const capability = getCapability(requested);
  if (!capability) {
    return { allowed: false, reason: "unknown_capability" };
  }

  // Per-user authorization: a read connector may only be used for the
  // authenticated workspace's own data. A business id alone is not enough to
  // bridge users — the requested user must be the same workspace owner. This
  // keeps a null/unknown owner from gaining access to another user's records.
  const sameWorkspace = request.userId !== null && request.userId === request.requestedUserId;

  if (!sameWorkspace) {
    return { allowed: false, reason: "workspace_scope_mismatch" };
  }

  return { allowed: true, reason: null };
}
