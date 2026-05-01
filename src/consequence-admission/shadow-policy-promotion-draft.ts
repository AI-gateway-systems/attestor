import { createHash } from 'node:crypto';
import {
  canonicalizeReleaseJson,
  type CanonicalReleaseJsonValue,
} from '../release-kernel/release-canonicalization.js';
import type { GenericAdmissionMode } from './index.js';
import type {
  PolicyDiscoveryCandidateAction,
  PolicyDiscoveryControlClosure,
  ShadowPolicyDiscoveryCandidate,
} from './policy-discovery-candidates.js';
import type {
  ShadowPolicyRecommendationKind,
  ShadowPolicyRecommendationSeverity,
} from './shadow-simulation.js';

export const SHADOW_POLICY_PROMOTION_DRAFT_VERSION =
  'attestor.shadow-policy-promotion-draft.v1';

export const SHADOW_POLICY_PROMOTION_SOURCE_STATUSES = [
  'approved',
  'activated',
] as const;
export type ShadowPolicyPromotionSourceStatus =
  typeof SHADOW_POLICY_PROMOTION_SOURCE_STATUSES[number];

export interface ShadowPolicyPromotionStatusChange {
  readonly status: string;
  readonly changedAt: string;
  readonly actorRef: string;
  readonly reason: string;
}

export interface ShadowPolicyPromotionCandidateRecord {
  readonly tenantId: string;
  readonly candidateId: string;
  readonly candidateDigest: string;
  readonly candidate: ShadowPolicyDiscoveryCandidate;
  readonly sourceReportId: string | null;
  readonly sourceReportDigest: string | null;
  readonly status: string;
  readonly statusHistory: readonly ShadowPolicyPromotionStatusChange[];
  readonly approvalRequired: true;
  readonly autoEnforce: false;
  readonly rawPayloadStored: false;
}

export interface ShadowPolicyPromotionDraftEntry {
  readonly entryId: string;
  readonly candidateId: string;
  readonly candidateDigest: string;
  readonly sourceReportId: string | null;
  readonly sourceReportDigest: string | null;
  readonly actionSurface: string | null;
  readonly domain: string | null;
  readonly action: PolicyDiscoveryCandidateAction;
  readonly proposedMode: GenericAdmissionMode;
  readonly requiredControls: readonly PolicyDiscoveryControlClosure[];
  readonly sourceRecommendationKinds: readonly ShadowPolicyRecommendationKind[];
  readonly highestSeverity: ShadowPolicyRecommendationSeverity;
  readonly affectedEvents: number;
  readonly confidence: number;
  readonly reasonCodes: readonly string[];
  readonly summary: string;
  readonly approvalStatus: ShadowPolicyPromotionSourceStatus;
  readonly approverRefs: readonly string[];
  readonly approvalTrailDigest: string;
  readonly enforcementState: 'draft-only';
}

export interface ShadowPolicyPromotionDraft {
  readonly version: typeof SHADOW_POLICY_PROMOTION_DRAFT_VERSION;
  readonly tenantId: string;
  readonly generatedAt: string;
  readonly sourceStatus: ShadowPolicyPromotionSourceStatus;
  readonly candidateCount: number;
  readonly entryCount: number;
  readonly candidateDigests: readonly string[];
  readonly sourceReportIds: readonly string[];
  readonly sourceReportDigests: readonly string[];
  readonly entries: readonly ShadowPolicyPromotionDraftEntry[];
  readonly blockers: readonly string[];
  readonly promotionReady: boolean;
  readonly approvalRequired: true;
  readonly autoEnforce: false;
  readonly rawPayloadStored: false;
  readonly productionReady: false;
  readonly canonical: string;
  readonly digest: string;
}

export interface CreateShadowPolicyPromotionDraftInput {
  readonly tenantId: string;
  readonly records: readonly ShadowPolicyPromotionCandidateRecord[];
  readonly sourceStatus?: ShadowPolicyPromotionSourceStatus | null;
  readonly generatedAt?: string | null;
}

function canonicalObject(value: CanonicalReleaseJsonValue): {
  readonly canonical: string;
  readonly digest: string;
} {
  const canonical = canonicalizeReleaseJson(value);
  return Object.freeze({
    canonical,
    digest: `sha256:${createHash('sha256').update(canonical).digest('hex')}`,
  });
}

function hashCanonical(value: CanonicalReleaseJsonValue): string {
  return canonicalObject(value).digest;
}

function normalizeIsoTimestamp(
  value: string | null | undefined,
  fallback: string,
  fieldName: string,
): string {
  const raw = value ?? fallback;
  const timestamp = new Date(raw);
  if (Number.isNaN(timestamp.getTime())) {
    throw new Error(`Shadow policy promotion draft ${fieldName} must be an ISO timestamp.`);
  }
  return timestamp.toISOString();
}

function normalizeTenantId(value: string): string {
  const normalized = value.trim();
  if (!normalized) {
    throw new Error('Shadow policy promotion draft tenantId is required.');
  }
  return normalized;
}

function uniqueSorted(values: readonly (string | null)[]): readonly string[] {
  return Object.freeze([...new Set(values.filter((value): value is string => Boolean(value)))].sort());
}

function isPromotionSourceStatus(value: string): value is ShadowPolicyPromotionSourceStatus {
  return SHADOW_POLICY_PROMOTION_SOURCE_STATUSES.includes(value as ShadowPolicyPromotionSourceStatus);
}

function approvalActors(
  history: readonly ShadowPolicyPromotionStatusChange[],
  sourceStatus: ShadowPolicyPromotionSourceStatus,
): readonly string[] {
  return uniqueSorted(history
    .filter((entry) => entry.status === sourceStatus || entry.status === 'approved')
    .map((entry) => entry.actorRef));
}

function entryIdFor(input: {
  readonly candidateId: string;
  readonly candidateDigest: string;
  readonly sourceReportDigest: string | null;
}): string {
  return `promotion-entry:${hashCanonical(input as unknown as CanonicalReleaseJsonValue)}`;
}

function createEntry(
  record: ShadowPolicyPromotionCandidateRecord,
  sourceStatus: ShadowPolicyPromotionSourceStatus,
): ShadowPolicyPromotionDraftEntry {
  const candidate = record.candidate;
  return Object.freeze({
    entryId: entryIdFor({
      candidateId: record.candidateId,
      candidateDigest: record.candidateDigest,
      sourceReportDigest: record.sourceReportDigest,
    }),
    candidateId: record.candidateId,
    candidateDigest: record.candidateDigest,
    sourceReportId: record.sourceReportId,
    sourceReportDigest: record.sourceReportDigest,
    actionSurface: candidate.actionSurface,
    domain: candidate.domain,
    action: candidate.action,
    proposedMode: candidate.proposedMode,
    requiredControls: candidate.requiredControls,
    sourceRecommendationKinds: candidate.sourceRecommendationKinds,
    highestSeverity: candidate.highestSeverity,
    affectedEvents: candidate.affectedEvents,
    confidence: candidate.confidence,
    reasonCodes: candidate.reasonCodes,
    summary: candidate.summary,
    approvalStatus: sourceStatus,
    approverRefs: approvalActors(record.statusHistory, sourceStatus),
    approvalTrailDigest: hashCanonical(record.statusHistory as unknown as CanonicalReleaseJsonValue),
    enforcementState: 'draft-only',
  });
}

function promotionBlockers(
  records: readonly ShadowPolicyPromotionCandidateRecord[],
  entries: readonly ShadowPolicyPromotionDraftEntry[],
): readonly string[] {
  const blockers = new Set<string>();
  if (entries.length === 0) blockers.add('no-approved-candidates');
  for (const record of records) {
    if (record.approvalRequired !== true || record.autoEnforce !== false || record.rawPayloadStored !== false) {
      blockers.add('candidate-boundary-invalid');
    }
  }
  for (const entry of entries) {
    if (!entry.sourceReportId || !entry.sourceReportDigest) {
      blockers.add('source-simulation-binding-missing');
    }
    if (entry.approverRefs.length === 0) {
      blockers.add('approval-trail-missing');
    }
  }
  return Object.freeze([...blockers].sort());
}

export function createShadowPolicyPromotionDraft(
  input: CreateShadowPolicyPromotionDraftInput,
): ShadowPolicyPromotionDraft {
  const tenantId = normalizeTenantId(input.tenantId);
  const generatedAt = normalizeIsoTimestamp(
    input.generatedAt,
    new Date().toISOString(),
    'generatedAt',
  );
  const sourceStatus = input.sourceStatus ?? 'approved';
  const records = input.records
    .filter((record) => record.tenantId === tenantId)
    .filter((record) => record.status === sourceStatus);
  if (!isPromotionSourceStatus(sourceStatus)) {
    throw new Error('Shadow policy promotion draft sourceStatus must be approved or activated.');
  }
  const entries = Object.freeze(
    records
      .map((record) => createEntry(record, sourceStatus))
      .sort((left, right) => left.entryId.localeCompare(right.entryId)),
  );
  const blockers = promotionBlockers(records, entries);
  const payload = {
    version: SHADOW_POLICY_PROMOTION_DRAFT_VERSION,
    tenantId,
    generatedAt,
    sourceStatus,
    candidateCount: records.length,
    entryCount: entries.length,
    candidateDigests: uniqueSorted(records.map((record) => record.candidateDigest)),
    sourceReportIds: uniqueSorted(records.map((record) => record.sourceReportId)),
    sourceReportDigests: uniqueSorted(records.map((record) => record.sourceReportDigest)),
    entries,
    blockers,
    promotionReady: blockers.length === 0,
    approvalRequired: true,
    autoEnforce: false,
    rawPayloadStored: false,
    productionReady: false,
  } as const;
  const canonical = canonicalObject(payload as unknown as CanonicalReleaseJsonValue);
  return Object.freeze({
    ...payload,
    canonical: canonical.canonical,
    digest: canonical.digest,
  });
}
