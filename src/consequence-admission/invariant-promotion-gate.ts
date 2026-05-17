import { createHash } from 'node:crypto';
import {
  canonicalizeReleaseJson,
  type CanonicalReleaseJsonValue,
} from '../release-kernel/release-canonicalization.js';
import {
  CANDIDATE_INVARIANTS_CATALOG_VERSION,
  type CandidateInvariant,
} from './candidate-invariants-catalog.js';
import {
  INVARIANT_CALIBRATION_CONTRACT_VERSION,
  type InvariantCalibrationRecord,
} from './invariant-calibration-contract.js';

export const INVARIANT_PROMOTION_GATE_VERSION =
  'attestor.invariant-promotion-gate.v1';

export const INVARIANT_PROMOTION_REQUESTED_ACTIONS = [
  'create-review-only-strengthening-patch',
  'activate-live-enforcement',
  'auto-promote',
  'relax-control',
] as const;
export type InvariantPromotionRequestedAction =
  typeof INVARIANT_PROMOTION_REQUESTED_ACTIONS[number];

export const INVARIANT_PROMOTION_MUTATION_MODES = [
  'strengthen-only',
  'relaxation-requested',
] as const;
export type InvariantPromotionMutationMode =
  typeof INVARIANT_PROMOTION_MUTATION_MODES[number];

export const INVARIANT_PROMOTION_REVIEWER_INDEPENDENCE = [
  'independent',
  'same-as-candidate-reviewer',
  'same-as-calibration-reviewer',
  'unknown',
] as const;
export type InvariantPromotionReviewerIndependence =
  typeof INVARIANT_PROMOTION_REVIEWER_INDEPENDENCE[number];

export const INVARIANT_PROMOTION_APPROVAL_KINDS = [
  'human-review',
  'code-owner-review',
  'change-advisory-review',
] as const;
export type InvariantPromotionApprovalKind =
  typeof INVARIANT_PROMOTION_APPROVAL_KINDS[number];

export const INVARIANT_PROMOTION_OUTCOMES = [
  'promotion-ready-for-review-only-patch',
  'held-for-candidate-review',
  'held-for-calibration',
  'held-for-reviewer-signoff',
  'held-for-patch-evidence',
  'held-for-rollout-plan',
  'rejected-relaxation',
  'rejected-auto-promotion',
  'rejected-live-enforcement',
] as const;
export type InvariantPromotionOutcome =
  typeof INVARIANT_PROMOTION_OUTCOMES[number];

export const INVARIANT_PROMOTION_DANGER_FLAGS = [
  'candidate-not-review-ready',
  'calibration-not-ready',
  'candidate-calibration-mismatch',
  'non-strengthening-candidate-effect',
  'relaxes-existing-control',
  'auto-promotion-requested',
  'live-enforcement-requested',
  'missing-promotion-reviewer',
  'missing-approval-ref',
  'reviewer-not-independent',
  'missing-policy-patch-ref',
  'missing-rollout-plan',
  'missing-rollback-plan',
  'raw-score-authority-carryover',
] as const;
export type InvariantPromotionDangerFlag =
  typeof INVARIANT_PROMOTION_DANGER_FLAGS[number];

export interface InvariantPromotionApproval {
  readonly approvalKind: InvariantPromotionApprovalKind;
  readonly reviewerRefDigest: string | null;
  readonly approvalRefDigest: string | null;
  readonly approvedAt: string | null;
  readonly reviewerIndependence: InvariantPromotionReviewerIndependence;
}

export interface CreateInvariantPromotionGateInput {
  readonly candidate: CandidateInvariant;
  readonly calibration: InvariantCalibrationRecord;
  readonly evaluatedAt: string;
  readonly requestedAction: InvariantPromotionRequestedAction;
  readonly mutationMode: InvariantPromotionMutationMode;
  readonly approval: InvariantPromotionApproval;
  readonly policyPatchRefDigest?: string | null;
  readonly rolloutPlanRefDigest?: string | null;
  readonly rollbackPlanRefDigest?: string | null;
  readonly autoPromotionRequested?: boolean | null;
  readonly enforcementActivationRequested?: boolean | null;
  readonly declaredDangerFlags?: readonly InvariantPromotionDangerFlag[] | null;
}

export interface InvariantPromotionGateDecision {
  readonly version: typeof INVARIANT_PROMOTION_GATE_VERSION;
  readonly candidateInvariantsCatalogVersion:
    typeof CANDIDATE_INVARIANTS_CATALOG_VERSION;
  readonly invariantCalibrationContractVersion:
    typeof INVARIANT_CALIBRATION_CONTRACT_VERSION;
  readonly promotionRefDigest: string;
  readonly candidateInvariantRefDigest: string;
  readonly candidateInvariantDigest: string;
  readonly calibrationRefDigest: string;
  readonly calibrationDigest: string;
  readonly evaluatedAt: string;
  readonly requestedAction: InvariantPromotionRequestedAction;
  readonly mutationMode: InvariantPromotionMutationMode;
  readonly approval: InvariantPromotionApproval;
  readonly policyPatchRefDigest: string | null;
  readonly rolloutPlanRefDigest: string | null;
  readonly rollbackPlanRefDigest: string | null;
  readonly outcome: InvariantPromotionOutcome;
  readonly promotionAllowed: boolean;
  readonly reviewOnlyPatchAllowed: boolean;
  readonly failClosed: boolean;
  readonly dangerFlags: readonly InvariantPromotionDangerFlag[];
  readonly reasonCodes: readonly string[];
  readonly strengtheningOnly: true;
  readonly reviewerSignoffRequired: true;
  readonly calibrationRequired: true;
  readonly rollbackPlanRequired: true;
  readonly rolloutPlanRequired: true;
  readonly autoPromote: false;
  readonly policyMutationAllowed: false;
  readonly activatesEnforcement: false;
  readonly canAdmit: false;
  readonly productionReady: false;
  readonly canonical: string;
  readonly digest: string;
}

export interface InvariantPromotionGateEvaluation {
  readonly version: typeof INVARIANT_PROMOTION_GATE_VERSION;
  readonly promotionRefDigest: string;
  readonly outcome: InvariantPromotionOutcome;
  readonly promotionAllowed: boolean;
  readonly reviewOnlyPatchAllowed: boolean;
  readonly failClosed: boolean;
  readonly dangerFlags: readonly InvariantPromotionDangerFlag[];
  readonly reasonCodes: readonly string[];
  readonly autoPromote: false;
  readonly policyMutationAllowed: false;
  readonly activatesEnforcement: false;
  readonly canAdmit: false;
  readonly productionReady: false;
  readonly canonical: string;
  readonly digest: string;
}

export interface InvariantPromotionGateDescriptor {
  readonly version: typeof INVARIANT_PROMOTION_GATE_VERSION;
  readonly candidateInvariantsCatalogVersion:
    typeof CANDIDATE_INVARIANTS_CATALOG_VERSION;
  readonly invariantCalibrationContractVersion:
    typeof INVARIANT_CALIBRATION_CONTRACT_VERSION;
  readonly requestedActions: readonly InvariantPromotionRequestedAction[];
  readonly mutationModes: readonly InvariantPromotionMutationMode[];
  readonly approvalKinds: readonly InvariantPromotionApprovalKind[];
  readonly reviewerIndependenceModes:
    readonly InvariantPromotionReviewerIndependence[];
  readonly outcomes: readonly InvariantPromotionOutcome[];
  readonly dangerFlags: readonly InvariantPromotionDangerFlag[];
  readonly reviewerSignoffRequired: true;
  readonly independentReviewerRequired: true;
  readonly calibrationReadyRequired: true;
  readonly policyPatchDigestRequired: true;
  readonly rolloutPlanDigestRequired: true;
  readonly rollbackPlanDigestRequired: true;
  readonly noRelaxation: true;
  readonly noAutoPromotion: true;
  readonly reviewOnlyPatchOnly: true;
  readonly grantsAuthority: false;
  readonly canAdmit: false;
  readonly activatesEnforcement: false;
  readonly productionReady: false;
  readonly nonClaims: readonly string[];
}

const SHA256_DIGEST_PATTERN = /^sha256:[a-f0-9]{64}$/u;

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

function digestValue(kind: string, value: CanonicalReleaseJsonValue): string {
  return canonicalObject({ kind, value }).digest;
}

function normalizeIdentifier(
  value: string | null | undefined,
  fieldName: string,
): string {
  if (typeof value !== 'string') {
    throw new Error(`Invariant promotion ${fieldName} requires a string.`);
  }
  const normalized = value.trim();
  if (
    normalized.length === 0 ||
    normalized.length > 1024 ||
    /[\u0000-\u001f\u007f]/u.test(normalized)
  ) {
    throw new Error(
      `Invariant promotion ${fieldName} must be non-empty, bounded, and control-free.`,
    );
  }
  return normalized;
}

function normalizeDigest(value: string | null | undefined, fieldName: string): string {
  const normalized = normalizeIdentifier(value, fieldName);
  if (!SHA256_DIGEST_PATTERN.test(normalized)) {
    throw new Error(`Invariant promotion ${fieldName} must be a sha256 digest.`);
  }
  return normalized;
}

function normalizeOptionalDigest(
  value: string | null | undefined,
  fieldName: string,
): string | null {
  if (value === null || value === undefined) return null;
  return normalizeDigest(value, fieldName);
}

function normalizeIsoTimestamp(value: string | null | undefined, fieldName: string): string {
  const timestamp = new Date(value ?? '');
  if (Number.isNaN(timestamp.getTime())) {
    throw new Error(`Invariant promotion ${fieldName} must be an ISO timestamp.`);
  }
  return timestamp.toISOString();
}

function normalizeOptionalIsoTimestamp(
  value: string | null | undefined,
  fieldName: string,
): string | null {
  if (value === null || value === undefined) return null;
  return normalizeIsoTimestamp(value, fieldName);
}

function normalizeEnumValue<const Values extends readonly string[]>(
  value: string | null | undefined,
  values: Values,
  fieldName: string,
): Values[number] {
  const normalized = normalizeIdentifier(value, fieldName);
  if (!values.includes(normalized)) {
    throw new Error(`Invariant promotion ${fieldName} is not supported.`);
  }
  return normalized as Values[number];
}

function normalizeDangerFlags(
  values: readonly InvariantPromotionDangerFlag[] | null | undefined,
): readonly InvariantPromotionDangerFlag[] {
  return Object.freeze([...new Set((values ?? []).map((value) =>
    normalizeEnumValue(
      value,
      INVARIANT_PROMOTION_DANGER_FLAGS,
      'dangerFlags[]',
    ) as InvariantPromotionDangerFlag,
  ))].sort());
}

function normalizeApproval(
  approval: InvariantPromotionApproval,
): InvariantPromotionApproval {
  return Object.freeze({
    approvalKind: normalizeEnumValue(
      approval.approvalKind,
      INVARIANT_PROMOTION_APPROVAL_KINDS,
      'approval.approvalKind',
    ) as InvariantPromotionApprovalKind,
    reviewerRefDigest: normalizeOptionalDigest(
      approval.reviewerRefDigest,
      'approval.reviewerRefDigest',
    ),
    approvalRefDigest: normalizeOptionalDigest(
      approval.approvalRefDigest,
      'approval.approvalRefDigest',
    ),
    approvedAt: normalizeOptionalIsoTimestamp(approval.approvedAt, 'approval.approvedAt'),
    reviewerIndependence: normalizeEnumValue(
      approval.reviewerIndependence,
      INVARIANT_PROMOTION_REVIEWER_INDEPENDENCE,
      'approval.reviewerIndependence',
    ) as InvariantPromotionReviewerIndependence,
  });
}

function validateCandidateCalibrationPair(
  candidate: CandidateInvariant,
  calibration: InvariantCalibrationRecord,
): void {
  if (
    calibration.candidateInvariantRefDigest !== candidate.invariantRefDigest ||
    calibration.candidateInvariantDigest !== candidate.digest
  ) {
    throw new Error(
      'Invariant promotion candidate and calibration record must bind the same invariant.',
    );
  }
}

function derivedDangerFlags(input: {
  readonly candidate: CandidateInvariant;
  readonly calibration: InvariantCalibrationRecord;
  readonly requestedAction: InvariantPromotionRequestedAction;
  readonly mutationMode: InvariantPromotionMutationMode;
  readonly approval: InvariantPromotionApproval;
  readonly policyPatchRefDigest: string | null;
  readonly rolloutPlanRefDigest: string | null;
  readonly rollbackPlanRefDigest: string | null;
  readonly autoPromotionRequested: boolean;
  readonly enforcementActivationRequested: boolean;
  readonly declaredDangerFlags: readonly InvariantPromotionDangerFlag[];
}): readonly InvariantPromotionDangerFlag[] {
  const flags = new Set<InvariantPromotionDangerFlag>(input.declaredDangerFlags);
  if (input.candidate.reviewOutcome !== 'review-ready') {
    flags.add('candidate-not-review-ready');
  }
  if (input.calibration.outcome !== 'calibration-ready-for-promotion-review') {
    flags.add('calibration-not-ready');
  }
  if (input.candidate.effect !== 'strengthen-only') {
    flags.add('non-strengthening-candidate-effect');
  }
  if (
    input.mutationMode === 'relaxation-requested' ||
    input.requestedAction === 'relax-control'
  ) {
    flags.add('relaxes-existing-control');
  }
  if (
    input.autoPromotionRequested ||
    input.requestedAction === 'auto-promote'
  ) {
    flags.add('auto-promotion-requested');
  }
  if (
    input.enforcementActivationRequested ||
    input.requestedAction === 'activate-live-enforcement'
  ) {
    flags.add('live-enforcement-requested');
  }
  if (
    input.calibration.rawClassifierScoreAuthorityRequested ||
    input.calibration.rawClassifierScoreAuthorityAllowed ||
    input.calibration.calibratedConfidenceAuthorityAllowed
  ) {
    flags.add('raw-score-authority-carryover');
  }
  if (!input.approval.reviewerRefDigest) {
    flags.add('missing-promotion-reviewer');
  }
  if (!input.approval.approvalRefDigest || !input.approval.approvedAt) {
    flags.add('missing-approval-ref');
  }
  if (input.approval.reviewerIndependence !== 'independent') {
    flags.add('reviewer-not-independent');
  }
  if (!input.policyPatchRefDigest) {
    flags.add('missing-policy-patch-ref');
  }
  if (!input.rolloutPlanRefDigest) {
    flags.add('missing-rollout-plan');
  }
  if (!input.rollbackPlanRefDigest) {
    flags.add('missing-rollback-plan');
  }
  return normalizeDangerFlags([...flags]);
}

function outcomeFor(input: {
  readonly dangerFlags: readonly InvariantPromotionDangerFlag[];
}): InvariantPromotionOutcome {
  if (input.dangerFlags.includes('relaxes-existing-control')) {
    return 'rejected-relaxation';
  }
  if (input.dangerFlags.includes('auto-promotion-requested')) {
    return 'rejected-auto-promotion';
  }
  if (
    input.dangerFlags.includes('live-enforcement-requested') ||
    input.dangerFlags.includes('raw-score-authority-carryover')
  ) {
    return 'rejected-live-enforcement';
  }
  if (
    input.dangerFlags.includes('candidate-not-review-ready') ||
    input.dangerFlags.includes('non-strengthening-candidate-effect')
  ) {
    return 'held-for-candidate-review';
  }
  if (input.dangerFlags.includes('calibration-not-ready')) {
    return 'held-for-calibration';
  }
  if (
    input.dangerFlags.includes('missing-promotion-reviewer') ||
    input.dangerFlags.includes('missing-approval-ref') ||
    input.dangerFlags.includes('reviewer-not-independent')
  ) {
    return 'held-for-reviewer-signoff';
  }
  if (input.dangerFlags.includes('missing-policy-patch-ref')) {
    return 'held-for-patch-evidence';
  }
  if (
    input.dangerFlags.includes('missing-rollout-plan') ||
    input.dangerFlags.includes('missing-rollback-plan')
  ) {
    return 'held-for-rollout-plan';
  }
  return 'promotion-ready-for-review-only-patch';
}

function reasonCodesFor(input: {
  readonly outcome: InvariantPromotionOutcome;
  readonly dangerFlags: readonly InvariantPromotionDangerFlag[];
  readonly requestedAction: InvariantPromotionRequestedAction;
}): readonly string[] {
  const reasonCodes = new Set<string>([
    `invariant-promotion-${input.outcome}`,
    `invariant-promotion-requested-action-${input.requestedAction}`,
    ...input.dangerFlags.map((flag) => `invariant-promotion-${flag}`),
  ]);
  if (input.dangerFlags.length === 0) {
    reasonCodes.add('invariant-promotion-no-danger-flags');
  }
  return Object.freeze([...reasonCodes].sort());
}

export function invariantPromotionGateDescriptor():
InvariantPromotionGateDescriptor {
  return Object.freeze({
    version: INVARIANT_PROMOTION_GATE_VERSION,
    candidateInvariantsCatalogVersion: CANDIDATE_INVARIANTS_CATALOG_VERSION,
    invariantCalibrationContractVersion: INVARIANT_CALIBRATION_CONTRACT_VERSION,
    requestedActions: INVARIANT_PROMOTION_REQUESTED_ACTIONS,
    mutationModes: INVARIANT_PROMOTION_MUTATION_MODES,
    approvalKinds: INVARIANT_PROMOTION_APPROVAL_KINDS,
    reviewerIndependenceModes: INVARIANT_PROMOTION_REVIEWER_INDEPENDENCE,
    outcomes: INVARIANT_PROMOTION_OUTCOMES,
    dangerFlags: INVARIANT_PROMOTION_DANGER_FLAGS,
    reviewerSignoffRequired: true,
    independentReviewerRequired: true,
    calibrationReadyRequired: true,
    policyPatchDigestRequired: true,
    rolloutPlanDigestRequired: true,
    rollbackPlanDigestRequired: true,
    noRelaxation: true,
    noAutoPromotion: true,
    reviewOnlyPatchOnly: true,
    grantsAuthority: false,
    canAdmit: false,
    activatesEnforcement: false,
    productionReady: false,
    nonClaims: Object.freeze([
      'not-live-enforcement',
      'not-auto-promotion',
      'not-policy-relaxation',
      'not-policy-mutation',
      'not-model-training',
      'not-production-readiness',
    ]),
  });
}

export function createInvariantPromotionGateDecision(
  input: CreateInvariantPromotionGateInput,
): InvariantPromotionGateDecision {
  validateCandidateCalibrationPair(input.candidate, input.calibration);
  const evaluatedAt = normalizeIsoTimestamp(input.evaluatedAt, 'evaluatedAt');
  const requestedAction = normalizeEnumValue(
    input.requestedAction,
    INVARIANT_PROMOTION_REQUESTED_ACTIONS,
    'requestedAction',
  ) as InvariantPromotionRequestedAction;
  const mutationMode = normalizeEnumValue(
    input.mutationMode,
    INVARIANT_PROMOTION_MUTATION_MODES,
    'mutationMode',
  ) as InvariantPromotionMutationMode;
  const approval = normalizeApproval(input.approval);
  const policyPatchRefDigest = normalizeOptionalDigest(
    input.policyPatchRefDigest,
    'policyPatchRefDigest',
  );
  const rolloutPlanRefDigest = normalizeOptionalDigest(
    input.rolloutPlanRefDigest,
    'rolloutPlanRefDigest',
  );
  const rollbackPlanRefDigest = normalizeOptionalDigest(
    input.rollbackPlanRefDigest,
    'rollbackPlanRefDigest',
  );
  const autoPromotionRequested = input.autoPromotionRequested === true;
  const enforcementActivationRequested =
    input.enforcementActivationRequested === true;
  const dangerFlags = derivedDangerFlags({
    candidate: input.candidate,
    calibration: input.calibration,
    requestedAction,
    mutationMode,
    approval,
    policyPatchRefDigest,
    rolloutPlanRefDigest,
    rollbackPlanRefDigest,
    autoPromotionRequested,
    enforcementActivationRequested,
    declaredDangerFlags: normalizeDangerFlags(input.declaredDangerFlags),
  });
  const outcome = outcomeFor({ dangerFlags });
  const promotionAllowed = outcome === 'promotion-ready-for-review-only-patch';
  const reasonCodes = reasonCodesFor({ outcome, dangerFlags, requestedAction });
  const promotionRefDigest = digestValue('invariant-promotion-ref', {
    version: INVARIANT_PROMOTION_GATE_VERSION,
    candidateInvariantRefDigest: input.candidate.invariantRefDigest,
    calibrationRefDigest: input.calibration.calibrationRefDigest,
    policyPatchRefDigest,
    requestedAction,
    mutationMode,
  } as CanonicalReleaseJsonValue);
  const payload = {
    version: INVARIANT_PROMOTION_GATE_VERSION,
    candidateInvariantsCatalogVersion: CANDIDATE_INVARIANTS_CATALOG_VERSION,
    invariantCalibrationContractVersion: INVARIANT_CALIBRATION_CONTRACT_VERSION,
    promotionRefDigest,
    candidateInvariantRefDigest: input.candidate.invariantRefDigest,
    candidateInvariantDigest: input.candidate.digest,
    calibrationRefDigest: input.calibration.calibrationRefDigest,
    calibrationDigest: input.calibration.digest,
    evaluatedAt,
    requestedAction,
    mutationMode,
    approval,
    policyPatchRefDigest,
    rolloutPlanRefDigest,
    rollbackPlanRefDigest,
    outcome,
    promotionAllowed,
    reviewOnlyPatchAllowed: promotionAllowed,
    failClosed: !promotionAllowed,
    dangerFlags,
    reasonCodes,
    strengtheningOnly: true,
    reviewerSignoffRequired: true,
    calibrationRequired: true,
    rollbackPlanRequired: true,
    rolloutPlanRequired: true,
    autoPromote: false,
    policyMutationAllowed: false,
    activatesEnforcement: false,
    canAdmit: false,
    productionReady: false,
  } as const;
  const canonical = canonicalObject(payload as unknown as CanonicalReleaseJsonValue);
  return Object.freeze({
    ...payload,
    canonical: canonical.canonical,
    digest: canonical.digest,
  });
}

export function evaluateInvariantPromotionGate(
  decision: InvariantPromotionGateDecision,
): InvariantPromotionGateEvaluation {
  const payload = {
    version: INVARIANT_PROMOTION_GATE_VERSION,
    promotionRefDigest: decision.promotionRefDigest,
    outcome: decision.outcome,
    promotionAllowed: decision.promotionAllowed,
    reviewOnlyPatchAllowed: decision.reviewOnlyPatchAllowed,
    failClosed: decision.failClosed,
    dangerFlags: decision.dangerFlags,
    reasonCodes: decision.reasonCodes,
    autoPromote: false,
    policyMutationAllowed: false,
    activatesEnforcement: false,
    canAdmit: false,
    productionReady: false,
  } as const;
  const canonical = canonicalObject(payload as unknown as CanonicalReleaseJsonValue);
  return Object.freeze({
    ...payload,
    canonical: canonical.canonical,
    digest: canonical.digest,
  });
}
