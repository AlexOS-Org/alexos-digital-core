/**
 * Auren capability gateway — the explicit server-side boundary between the
 * intelligence layer and the connectors it may read from.
 *
 * This is intentionally small and additive. It does NOT fetch data, store
 * credentials, or mutate anything. It only:
 *
 * 1. declares the capabilities Auren is allowed to use;
 * 2. enforces per-workspace scope for read-only access;
 * 3. refuses any mutation until an explicit approval gate is wired in;
 * 4. records whether a capability is connected or only a contract.
 *
 * Connector adapters can be registered here later, but each one must still
 * pass through `authorizeCapability` before it is allowed to run.
 */

export type CapabilityId =
  | "analytics:read"
  | "content-gap:read"
  | "daily-briefing:read"
  | "dailygear:read"
  | "debugging:read"
  | "financial-analysis:read"
  | "seo-competitor:read"
  | "similarweb:read"
  | "supabase:read";

export type CapabilityAuthorization = "read_only";
export type CapabilityAvailability = "connected" | "contract_only";

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
  /** Whether a server-side adapter is connected or only its safe contract exists. */
  availability: CapabilityAvailability;
  /** Optional skill identifier that maps to the corresponding analysis workflow. */
  skillId: string | null;
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
    availability: "contract_only",
    skillId: null,
  },
  {
    id: "content-gap:read",
    label: "Content gap analysis",
    description:
      "Compare verified search-demand and competitor coverage data without publishing content.",
    source: "external_analytics",
    authorization: "read_only",
    mutationApprovalRequired: true,
    freshnessLabel: "source-dated SEO evidence",
    availability: "contract_only",
    skillId: "content-gap-analysis",
  },
  {
    id: "daily-briefing:read",
    label: "Daily briefing",
    description:
      "Prioritize verified meetings, pipeline, tasks, and account signals when connected.",
    source: "knowledge",
    authorization: "read_only",
    mutationApprovalRequired: true,
    freshnessLabel: "live owner-scoped CRM and task data",
    availability: "connected",
    skillId: "daily-briefing",
  },
  {
    id: "dailygear:read",
    label: "DailyGear catalogue and commerce",
    description: "Storefront products, variants, orders and inventory evidence.",
    source: "storefront",
    authorization: "read_only",
    mutationApprovalRequired: true,
    freshnessLabel: "synchronized storefront data",
    availability: "connected",
    skillId: null,
  },
  {
    id: "debugging:read",
    label: "Debugging and error recovery",
    description:
      "Classify reproducible application failures and preserve evidence without changing production systems.",
    source: "knowledge",
    authorization: "read_only",
    mutationApprovalRequired: true,
    freshnessLabel: "diagnostic evidence",
    availability: "contract_only",
    skillId: "debugging-and-error-recovery",
  },
  {
    id: "financial-analysis:read",
    label: "Structured financial analysis",
    description:
      "Analyze approved market and company-financial data through structured, source-attributed providers.",
    source: "external_analytics",
    authorization: "read_only",
    mutationApprovalRequired: true,
    freshnessLabel: "provider-dated financial data",
    availability: "contract_only",
    skillId: "financial-analysis",
  },
  {
    id: "seo-competitor:read",
    label: "SEO competitor analysis",
    description:
      "Analyze organic visibility, page types, countries, and backlink evidence without changing the target site.",
    source: "external_analytics",
    authorization: "read_only",
    mutationApprovalRequired: true,
    freshnessLabel: "source-dated competitor evidence",
    availability: "contract_only",
    skillId: "seo-competitor-analysis",
  },
  {
    id: "similarweb:read",
    label: "SimilarWeb analytics",
    description:
      "Read traffic, engagement, source, ranking, and geography signals from an approved SimilarWeb provider.",
    source: "external_analytics",
    authorization: "read_only",
    mutationApprovalRequired: true,
    freshnessLabel: "monthly provider snapshot",
    availability: "contract_only",
    skillId: "similarweb-analytics",
  },
  {
    id: "supabase:read",
    label: "First-party Supabase records",
    description: "Owner-scoped financial, CRM, inventory and order records.",
    source: "first_party_supabase",
    authorization: "read_only",
    mutationApprovalRequired: true,
    freshnessLabel: "live first-party data",
    availability: "connected",
    skillId: null,
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

// Keep the registry deterministic so UIs and audit snapshots remain stable.
if (
  readOnlyCapabilityRegistry.some(
    (capability, index, all) => index > 0 && all[index - 1].id > capability.id,
  )
) {
  throw new Error("Auren read-only capability registry must remain sorted by id.");
}

// `requestedBusinessId` is intentionally carried by the request contract even
// though user-to-business membership is enforced by the caller's data layer.
// The gateway must not infer membership from an untrusted business id alone.
