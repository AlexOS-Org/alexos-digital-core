import {
  canPublishToCatalogue,
  cataloguePublicationBlockers,
  type CataloguePublishInput,
} from "./catalogue-publish";

export interface BulkPublishCandidate {
  id: string;
  input: CataloguePublishInput;
}

export interface BulkPublishSkipped {
  id: string;
  blockers: string[];
}

export interface BulkPublishPlan {
  eligible: BulkPublishCandidate[];
  skipped: BulkPublishSkipped[];
}

/**
 * Prepares a guarded bulk publish. Only candidates that satisfy catalogue
 * readiness are eligible; every ineligible candidate is listed with its
 * blockers so the owner can see why it was skipped. A missing/incomplete price
 * is intentionally NOT a catalogue blocker (zero-price catalogue preparation
 * is allowed), but the caller must still keep checkout blocked when price <= 0.
 */
export function planBulkPublish(candidates: BulkPublishCandidate[]): BulkPublishPlan {
  const eligible: BulkPublishCandidate[] = [];
  const skipped: BulkPublishSkipped[] = [];

  for (const candidate of candidates) {
    if (canPublishToCatalogue(candidate.input)) {
      eligible.push(candidate);
    } else {
      skipped.push({ id: candidate.id, blockers: cataloguePublicationBlockers(candidate.input) });
    }
  }

  return { eligible, skipped };
}
