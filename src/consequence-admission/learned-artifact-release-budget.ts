import { createHash } from 'node:crypto';
import {
  canonicalizeReleaseJson,
  type CanonicalReleaseJsonValue,
} from '../release-kernel/release-canonicalization.js';
import {
  ASSURANCE_CASE_CONTRACT_VERSION,
} from './assurance-case-contract.js';

export const LEARNED_ARTIFACT_RELEASE_BUDGET_VERSION =
  'attestor.learned-artifact-release-budget.v1';

export const LEARNED_ARTIFACT_RELEASE_BUDGET_SOURCE_ANCHORS = [
  'nist-sp-800-226-dp-hazards',
  'opendp-context-composition',
  'census-reconstruction-attack',
  'google-differential-privacy-accounting',
  'assurance-case-undermining-defeater',
] as const;
export type LearnedArtifactReleaseBudgetSourceAnchor =
  typeof LEARNED_ARTIFACT_RELEASE_BUDGET_SOURCE_ANCHORS[number];

export const LEARNED_ARTIFACT_KINDS = [
  'baseline-cohort-summary',
  'candidate-invariant',
  'counterexample-witness',
  'calibration-summary',
  'promotion-packet',
  'assurance-case-node',
  'reviewer-open-defeater-view',
] as const;
export type LearnedArtifactKind = typeof LEARNED_ARTIFACT_KINDS[number];

export const LEARNED_ARTIFACT_RELEASE_MODES = [
  'assurance-review',
  'operator-dashboard',
  'cross-tenant-redacted-signal',
  'public-release',
] as const;
export type LearnedArtifactReleaseMode =
  typeof LEARNED_ARTIFACT_RELEASE_MODES[number];

export const LEARNED_ARTIFACT_ACCOUNTING_MODES = [
  'release-budget-only',
  'external-dp-proof-bound',
] as const;
export type LearnedArtifactAccountingMode =
  typeof LEARNED_ARTIFACT_ACCOUNTING_MODES[number];

export const LEARNED_ARTIFACT_RECONSTRUCTION_RISK_LEVELS = [
  'low',
  'moderate',
  'high',
  'unknown',
] as const;
export type LearnedArtifactReconstructionRiskLevel =
  typeof LEARNED_ARTIFACT_RECONSTRUCTION_RISK_LEVELS[number];

export const LEARNED_ARTIFACT_RELEASE_BUDGET_OUTCOMES = [
  'release-ready-for-assurance-review',
  'held-for-budget',
  'held-for-cohort-floor',
  'held-for-reviewer',
  'held-for-dp-proof-review',
  'held-for-reconstruction-risk',
  'rejected-raw-material',
  'rejected-cross-tenant-release',
  'rejected-public-release',
] as const;
export type LearnedArtifactReleaseBudgetOutcome =
  typeof LEARNED_ARTIFACT_RELEASE_BUDGET_OUTCOMES[number];

export const LEARNED_ARTIFACT_RELEASE_BUDGET_DANGER_FLAGS = [
  'budget-exceeded',
  'insufficient-cohort-size',
  'missing-reviewer',
  'differential-privacy-claim-without-proof',
  'external-dp-proof-evidence-only',
  'raw-material-requested',
  'cross-tenant-release-requested',
  'public-release-requested',
  'reconstruction-risk-high',
  'reconstruction-risk-unknown',
  'high-resolution-pattern',
  'unique-subject-risk',
  'frequent-pattern-release',
  'assurance-case-unbound',
] as const;
export type LearnedArtifactReleaseBudgetDangerFlag =
  typeof LEARNED_ARTIFACT_RELEASE_BUDGET_DANGER_FLAGS[number];

export const LEARNED_ARTIFACT_RELEASE_BUDGET_DEFAULT_MIN_COHORT_EVENTS = 30;

export interface LearnedArtifactPrivacyBudget {
  readonly budgetId: string;
  readonly budgetRefDigest: string;
  readonly tenantRefDigest: string;
  readonly cohortRefDigest: string;
  readonly totalBudgetUnits: number;
  readonly spentBudgetUnits: number;
  readonly requestedBudgetUnits: number;
  readonly expiresAt: string;
  readonly accountingMode: LearnedArtifactAccountingMode;
  readonly externalDpProofRefDigest: string | null;
}

export interface LearnedArtifactReconstructionRisk {
  readonly riskLevel: LearnedArtifactReconstructionRiskLevel;
  readonly reconstructionAttackConsidered: boolean;
  readonly highResolutionPattern: boolean;
  readonly uniqueSubjectRisk: boolean;
  readonly frequentPatternCandidate: boolean;
  readonly mitigationRefDigest: string | null;
}

export interface CreateLearnedArtifactReleaseBudgetInput {
  readonly artifactId: string;
  readonly artifactKind: LearnedArtifactKind;
  readonly artifactRefDigest: string;
  readonly tenantRefDigest: string;
  readonly cohortRefDigest: string;
  readonly generatedAt: string;
  readonly requestedReleaseMode: LearnedArtifactReleaseMode;
  readonly sourceEventCount: number;
  readonly privacyBudget: LearnedArtifactPrivacyBudget;
  readonly reconstructionRisk: LearnedArtifactReconstructionRisk;
  readonly assuranceCaseRefDigest?: string | null;
  readonly reviewerRefDigest?: string | null;
  readonly minimumCohortEventCount?: number | null;
  readonly rawMaterialRequested?: boolean | null;
  readonly crossTenantReleaseRequested?: boolean | null;
  readonly publicReleaseRequested?: boolean | null;
  readonly differentialPrivacyGuaranteeClaimed?: boolean | null;
  readonly declaredDangerFlags?:
    readonly LearnedArtifactReleaseBudgetDangerFlag[] | null;
}

export interface LearnedArtifactReleaseBudgetRecord {
  readonly version: typeof LEARNED_ARTIFACT_RELEASE_BUDGET_VERSION;
  readonly assuranceCaseContractVersion: typeof ASSURANCE_CASE_CONTRACT_VERSION;
  readonly artifactId: string;
  readonly artifactKind: LearnedArtifactKind;
  readonly artifactRefDigest: string;
  readonly tenantRefDigest: string;
  readonly cohortRefDigest: string;
  readonly generatedAt: string;
  readonly requestedReleaseMode: LearnedArtifactReleaseMode;
  readonly sourceEventCount: number;
  readonly minimumCohortEventCount: number;
  readonly privacyBudget: LearnedArtifactPrivacyBudget;
  readonly remainingBudgetUnitsBefore: number;
  readonly remainingBudgetUnitsAfter: number;
  readonly reconstructionRisk: LearnedArtifactReconstructionRisk;
  readonly assuranceCaseRefDigest: string | null;
  readonly reviewerRefDigest: string | null;
  readonly outcome: LearnedArtifactReleaseBudgetOutcome;
  readonly releaseReadyForAssuranceReview: boolean;
  readonly budgetAvailable: boolean;
  readonly failClosed: boolean;
  readonly dangerFlags: readonly LearnedArtifactReleaseBudgetDangerFlag[];
  readonly reasonCodes: readonly string[];
  readonly assuranceCaseContextRequired: true;
  readonly underminingDefeaterRequired: boolean;
  readonly underminingDefeaterReasonCodes: readonly string[];
  readonly differentialPrivacyGuaranteeProvided: false;
  readonly externalDpProofIsEvidenceOnly: true;
  readonly noRawMaterial: true;
  readonly noCrossTenantRelease: true;
  readonly noPublicRelease: true;
  readonly noAutoPromotion: true;
  readonly learnsFromTraffic: false;
  readonly trainingEnabled: false;
  readonly grantsAuthority: false;
  readonly canAdmit: false;
  readonly activatesEnforcement: false;
  readonly productionReady: false;
  readonly canonical: string;
  readonly digest: string;
}

export interface LearnedArtifactReleaseBudgetEvaluation {
  readonly version: typeof LEARNED_ARTIFACT_RELEASE_BUDGET_VERSION;
  readonly artifactId: string;
  readonly artifactRefDigest: string;
  readonly outcome: LearnedArtifactReleaseBudgetOutcome;
  readonly releaseReadyForAssuranceReview: boolean;
  readonly budgetAvailable: boolean;
  readonly failClosed: boolean;
  readonly remainingBudgetUnitsAfter: number;
  readonly dangerFlags: readonly LearnedArtifactReleaseBudgetDangerFlag[];
  readonly reasonCodes: readonly string[];
  readonly underminingDefeaterRequired: boolean;
  readonly differentialPrivacyGuaranteeProvided: false;
  readonly canAdmit: false;
  readonly activatesEnforcement: false;
  readonly productionReady: false;
  readonly canonical: string;
  readonly digest: string;
}

export interface LearnedArtifactReleaseBudgetDescriptor {
  readonly version: typeof LEARNED_ARTIFACT_RELEASE_BUDGET_VERSION;
  readonly assuranceCaseContractVersion: typeof ASSURANCE_CASE_CONTRACT_VERSION;
  readonly sourceAnchors: readonly LearnedArtifactReleaseBudgetSourceAnchor[];
  readonly artifactKinds: readonly LearnedArtifactKind[];
  readonly releaseModes: readonly LearnedArtifactReleaseMode[];
  readonly accountingModes: readonly LearnedArtifactAccountingMode[];
  readonly reconstructionRiskLevels:
    readonly LearnedArtifactReconstructionRiskLevel[];
  readonly outcomes: readonly LearnedArtifactReleaseBudgetOutcome[];
  readonly dangerFlags: readonly LearnedArtifactReleaseBudgetDangerFlag[];
  readonly defaultMinimumCohortEventCount:
    typeof LEARNED_ARTIFACT_RELEASE_BUDGET_DEFAULT_MIN_COHORT_EVENTS;
  readonly budgetRequiredBeforeRelease: true;
  readonly assuranceCaseContextRequired: true;
  readonly underminingDefeaterOnRisk: true;
  readonly differentialPrivacyEngine: false;
  readonly externalDpProofAcceptedAsEvidenceOnly: true;
  readonly noRawMaterial: true;
  readonly noCrossTenantRelease: true;
  readonly noPublicRelease: true;
  readonly noAutoPromotion: true;
  readonly learnsFromTraffic: false;
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

function normalizeIdentifier(
  value: string | null | undefined,
  fieldName: string,
): string {
  if (typeof value !== 'string') {
    throw new Error(`Learned artifact release budget ${fieldName} requires a string.`);
  }
  const normalized = value.trim();
  if (
    normalized.length === 0 ||
    normalized.length > 1024 ||
    /[\u0000-\u001f\u007f]/u.test(normalized)
  ) {
    throw new Error(
      `Learned artifact release budget ${fieldName} must be non-empty, bounded, and control-free.`,
    );
  }
  return normalized;
}

function normalizeDigest(value: string | null | undefined, fieldName: string): string {
  const normalized = normalizeIdentifier(value, fieldName);
  if (!SHA256_DIGEST_PATTERN.test(normalized)) {
    throw new Error(
      `Learned artifact release budget ${fieldName} must be a sha256 digest.`,
    );
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
    throw new Error(
      `Learned artifact release budget ${fieldName} must be an ISO timestamp.`,
    );
  }
  return timestamp.toISOString();
}

function normalizeEnum<const Values extends readonly string[]>(
  value: string | null | undefined,
  values: Values,
  fieldName: string,
): Values[number] {
  const normalized = normalizeIdentifier(value, fieldName);
  if (!values.includes(normalized)) {
    throw new Error(`Learned artifact release budget ${fieldName} is not supported.`);
  }
  return normalized as Values[number];
}

function normalizeNonNegativeInteger(
  value: number | null | undefined,
  fieldName: string,
): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
    throw new Error(
      `Learned artifact release budget ${fieldName} must be a non-negative integer.`,
    );
  }
  return value;
}

function normalizePositiveInteger(
  value: number | null | undefined,
  fieldName: string,
): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) {
    throw new Error(
      `Learned artifact release budget ${fieldName} must be a positive integer.`,
    );
  }
  return value;
}

function normalizeDangerFlags(
  flags: readonly LearnedArtifactReleaseBudgetDangerFlag[] | null | undefined,
): readonly LearnedArtifactReleaseBudgetDangerFlag[] {
  const normalized = (flags ?? []).map((flag) =>
    normalizeEnum(
      flag,
      LEARNED_ARTIFACT_RELEASE_BUDGET_DANGER_FLAGS,
      'danger flag',
    ));
  return Object.freeze([...new Set(normalized)].sort());
}

function normalizePrivacyBudget(
  budget: LearnedArtifactPrivacyBudget,
): LearnedArtifactPrivacyBudget {
  const totalBudgetUnits = normalizePositiveInteger(
    budget.totalBudgetUnits,
    'privacyBudget.totalBudgetUnits',
  );
  const spentBudgetUnits = normalizeNonNegativeInteger(
    budget.spentBudgetUnits,
    'privacyBudget.spentBudgetUnits',
  );
  if (spentBudgetUnits > totalBudgetUnits) {
    throw new Error(
      'Learned artifact release budget privacyBudget.spentBudgetUnits must not exceed totalBudgetUnits.',
    );
  }
  return Object.freeze({
    budgetId: normalizeIdentifier(budget.budgetId, 'privacyBudget.budgetId'),
    budgetRefDigest: normalizeDigest(
      budget.budgetRefDigest,
      'privacyBudget.budgetRefDigest',
    ),
    tenantRefDigest: normalizeDigest(
      budget.tenantRefDigest,
      'privacyBudget.tenantRefDigest',
    ),
    cohortRefDigest: normalizeDigest(
      budget.cohortRefDigest,
      'privacyBudget.cohortRefDigest',
    ),
    totalBudgetUnits,
    spentBudgetUnits,
    requestedBudgetUnits: normalizePositiveInteger(
      budget.requestedBudgetUnits,
      'privacyBudget.requestedBudgetUnits',
    ),
    expiresAt: normalizeIsoTimestamp(budget.expiresAt, 'privacyBudget.expiresAt'),
    accountingMode: normalizeEnum(
      budget.accountingMode,
      LEARNED_ARTIFACT_ACCOUNTING_MODES,
      'privacyBudget.accountingMode',
    ),
    externalDpProofRefDigest: normalizeOptionalDigest(
      budget.externalDpProofRefDigest,
      'privacyBudget.externalDpProofRefDigest',
    ),
  });
}

function normalizeReconstructionRisk(
  risk: LearnedArtifactReconstructionRisk,
): LearnedArtifactReconstructionRisk {
  return Object.freeze({
    riskLevel: normalizeEnum(
      risk.riskLevel,
      LEARNED_ARTIFACT_RECONSTRUCTION_RISK_LEVELS,
      'reconstructionRisk.riskLevel',
    ),
    reconstructionAttackConsidered: risk.reconstructionAttackConsidered === true,
    highResolutionPattern: risk.highResolutionPattern === true,
    uniqueSubjectRisk: risk.uniqueSubjectRisk === true,
    frequentPatternCandidate: risk.frequentPatternCandidate === true,
    mitigationRefDigest: normalizeOptionalDigest(
      risk.mitigationRefDigest,
      'reconstructionRisk.mitigationRefDigest',
    ),
  });
}

function sortedFlags(
  flags: Iterable<LearnedArtifactReleaseBudgetDangerFlag>,
): readonly LearnedArtifactReleaseBudgetDangerFlag[] {
  return Object.freeze([...new Set(flags)].sort());
}

function addRiskFlags(
  flags: Set<LearnedArtifactReleaseBudgetDangerFlag>,
  risk: LearnedArtifactReconstructionRisk,
): void {
  if (risk.riskLevel === 'high') flags.add('reconstruction-risk-high');
  if (risk.riskLevel === 'unknown') flags.add('reconstruction-risk-unknown');
  if (risk.highResolutionPattern) flags.add('high-resolution-pattern');
  if (risk.uniqueSubjectRisk) flags.add('unique-subject-risk');
  if (risk.frequentPatternCandidate) flags.add('frequent-pattern-release');
}

function outcomeFromFlags(
  flags: ReadonlySet<LearnedArtifactReleaseBudgetDangerFlag>,
): LearnedArtifactReleaseBudgetOutcome {
  if (flags.has('raw-material-requested')) return 'rejected-raw-material';
  if (flags.has('cross-tenant-release-requested')) return 'rejected-cross-tenant-release';
  if (flags.has('public-release-requested')) return 'rejected-public-release';
  if (flags.has('budget-exceeded')) return 'held-for-budget';
  if (flags.has('insufficient-cohort-size')) return 'held-for-cohort-floor';
  if (flags.has('differential-privacy-claim-without-proof')) {
    return 'held-for-dp-proof-review';
  }
  if (
    flags.has('reconstruction-risk-high') ||
    flags.has('reconstruction-risk-unknown') ||
    flags.has('high-resolution-pattern') ||
    flags.has('unique-subject-risk') ||
    flags.has('frequent-pattern-release')
  ) {
    return 'held-for-reconstruction-risk';
  }
  if (flags.has('missing-reviewer')) return 'held-for-reviewer';
  if (flags.has('assurance-case-unbound')) return 'held-for-reviewer';
  return 'release-ready-for-assurance-review';
}

function reasonCodesFromFlags(
  flags: readonly LearnedArtifactReleaseBudgetDangerFlag[],
  outcome: LearnedArtifactReleaseBudgetOutcome,
): readonly string[] {
  const reasons = new Set<string>([
    `outcome:${outcome}`,
    ...flags.map((flag) => `flag:${flag}`),
  ]);
  if (flags.length === 0) reasons.add('budgeted-learned-artifact-review-ready');
  return Object.freeze([...reasons].sort());
}

export function createLearnedArtifactReleaseBudget(
  input: CreateLearnedArtifactReleaseBudgetInput,
): LearnedArtifactReleaseBudgetRecord {
  const tenantRefDigest = normalizeDigest(input.tenantRefDigest, 'tenantRefDigest');
  const cohortRefDigest = normalizeDigest(input.cohortRefDigest, 'cohortRefDigest');
  const privacyBudget = normalizePrivacyBudget(input.privacyBudget);
  const reconstructionRisk = normalizeReconstructionRisk(input.reconstructionRisk);
  if (privacyBudget.tenantRefDigest !== tenantRefDigest) {
    throw new Error('Learned artifact release budget tenantRefDigest mismatch.');
  }
  if (privacyBudget.cohortRefDigest !== cohortRefDigest) {
    throw new Error('Learned artifact release budget cohortRefDigest mismatch.');
  }

  const minimumCohortEventCount = normalizePositiveInteger(
    input.minimumCohortEventCount ??
      LEARNED_ARTIFACT_RELEASE_BUDGET_DEFAULT_MIN_COHORT_EVENTS,
    'minimumCohortEventCount',
  );
  const sourceEventCount = normalizeNonNegativeInteger(
    input.sourceEventCount,
    'sourceEventCount',
  );
  const requestedReleaseMode = normalizeEnum(
    input.requestedReleaseMode,
    LEARNED_ARTIFACT_RELEASE_MODES,
    'requestedReleaseMode',
  );
  const artifactKind = normalizeEnum(
    input.artifactKind,
    LEARNED_ARTIFACT_KINDS,
    'artifactKind',
  );
  const reviewerRefDigest = normalizeOptionalDigest(
    input.reviewerRefDigest,
    'reviewerRefDigest',
  );
  const assuranceCaseRefDigest = normalizeOptionalDigest(
    input.assuranceCaseRefDigest,
    'assuranceCaseRefDigest',
  );
  const remainingBudgetUnitsBefore =
    privacyBudget.totalBudgetUnits - privacyBudget.spentBudgetUnits;
  const remainingBudgetUnitsAfter =
    remainingBudgetUnitsBefore - privacyBudget.requestedBudgetUnits;

  const flags = new Set<LearnedArtifactReleaseBudgetDangerFlag>(
    normalizeDangerFlags(input.declaredDangerFlags),
  );
  if (input.rawMaterialRequested === true) flags.add('raw-material-requested');
  if (
    input.crossTenantReleaseRequested === true ||
    requestedReleaseMode === 'cross-tenant-redacted-signal'
  ) {
    flags.add('cross-tenant-release-requested');
  }
  if (
    input.publicReleaseRequested === true ||
    requestedReleaseMode === 'public-release'
  ) {
    flags.add('public-release-requested');
  }
  if (remainingBudgetUnitsAfter < 0) flags.add('budget-exceeded');
  if (sourceEventCount < minimumCohortEventCount) {
    flags.add('insufficient-cohort-size');
  }
  if (reviewerRefDigest === null) flags.add('missing-reviewer');
  if (assuranceCaseRefDigest === null) flags.add('assurance-case-unbound');
  if (
    input.differentialPrivacyGuaranteeClaimed === true &&
    privacyBudget.externalDpProofRefDigest === null
  ) {
    flags.add('differential-privacy-claim-without-proof');
  }
  if (
    input.differentialPrivacyGuaranteeClaimed === true &&
    privacyBudget.externalDpProofRefDigest !== null
  ) {
    flags.add('external-dp-proof-evidence-only');
  }
  addRiskFlags(flags, reconstructionRisk);

  const dangerFlags = sortedFlags(flags);
  const outcome = outcomeFromFlags(flags);
  const releaseReadyForAssuranceReview =
    outcome === 'release-ready-for-assurance-review';
  const underminingDefeaterReasonCodes = Object.freeze(
    dangerFlags.map((flag) => `privacy-undermining:${flag}`),
  );
  const core: Omit<LearnedArtifactReleaseBudgetRecord, 'canonical' | 'digest'> = {
    version: LEARNED_ARTIFACT_RELEASE_BUDGET_VERSION,
    assuranceCaseContractVersion: ASSURANCE_CASE_CONTRACT_VERSION,
    artifactId: normalizeIdentifier(input.artifactId, 'artifactId'),
    artifactKind,
    artifactRefDigest: normalizeDigest(input.artifactRefDigest, 'artifactRefDigest'),
    tenantRefDigest,
    cohortRefDigest,
    generatedAt: normalizeIsoTimestamp(input.generatedAt, 'generatedAt'),
    requestedReleaseMode,
    sourceEventCount,
    minimumCohortEventCount,
    privacyBudget,
    remainingBudgetUnitsBefore,
    remainingBudgetUnitsAfter,
    reconstructionRisk,
    assuranceCaseRefDigest,
    reviewerRefDigest,
    outcome,
    releaseReadyForAssuranceReview,
    budgetAvailable: remainingBudgetUnitsAfter >= 0,
    failClosed: !releaseReadyForAssuranceReview,
    dangerFlags,
    reasonCodes: reasonCodesFromFlags(dangerFlags, outcome),
    assuranceCaseContextRequired: true,
    underminingDefeaterRequired: dangerFlags.length > 0,
    underminingDefeaterReasonCodes,
    differentialPrivacyGuaranteeProvided: false,
    externalDpProofIsEvidenceOnly: true,
    noRawMaterial: true,
    noCrossTenantRelease: true,
    noPublicRelease: true,
    noAutoPromotion: true,
    learnsFromTraffic: false,
    trainingEnabled: false,
    grantsAuthority: false,
    canAdmit: false,
    activatesEnforcement: false,
    productionReady: false,
  };
  const canonical = canonicalObject(core as unknown as CanonicalReleaseJsonValue);
  return Object.freeze({ ...core, ...canonical });
}

export function evaluateLearnedArtifactReleaseBudget(
  record: LearnedArtifactReleaseBudgetRecord,
): LearnedArtifactReleaseBudgetEvaluation {
  const core: Omit<LearnedArtifactReleaseBudgetEvaluation, 'canonical' | 'digest'> = {
    version: LEARNED_ARTIFACT_RELEASE_BUDGET_VERSION,
    artifactId: record.artifactId,
    artifactRefDigest: record.artifactRefDigest,
    outcome: record.outcome,
    releaseReadyForAssuranceReview: record.releaseReadyForAssuranceReview,
    budgetAvailable: record.budgetAvailable,
    failClosed: record.failClosed,
    remainingBudgetUnitsAfter: record.remainingBudgetUnitsAfter,
    dangerFlags: record.dangerFlags,
    reasonCodes: record.reasonCodes,
    underminingDefeaterRequired: record.underminingDefeaterRequired,
    differentialPrivacyGuaranteeProvided: false,
    canAdmit: false,
    activatesEnforcement: false,
    productionReady: false,
  };
  const canonical = canonicalObject(core as unknown as CanonicalReleaseJsonValue);
  return Object.freeze({ ...core, ...canonical });
}

export function learnedArtifactReleaseBudgetDescriptor():
  LearnedArtifactReleaseBudgetDescriptor {
  return Object.freeze({
    version: LEARNED_ARTIFACT_RELEASE_BUDGET_VERSION,
    assuranceCaseContractVersion: ASSURANCE_CASE_CONTRACT_VERSION,
    sourceAnchors: LEARNED_ARTIFACT_RELEASE_BUDGET_SOURCE_ANCHORS,
    artifactKinds: LEARNED_ARTIFACT_KINDS,
    releaseModes: LEARNED_ARTIFACT_RELEASE_MODES,
    accountingModes: LEARNED_ARTIFACT_ACCOUNTING_MODES,
    reconstructionRiskLevels: LEARNED_ARTIFACT_RECONSTRUCTION_RISK_LEVELS,
    outcomes: LEARNED_ARTIFACT_RELEASE_BUDGET_OUTCOMES,
    dangerFlags: LEARNED_ARTIFACT_RELEASE_BUDGET_DANGER_FLAGS,
    defaultMinimumCohortEventCount:
      LEARNED_ARTIFACT_RELEASE_BUDGET_DEFAULT_MIN_COHORT_EVENTS,
    budgetRequiredBeforeRelease: true,
    assuranceCaseContextRequired: true,
    underminingDefeaterOnRisk: true,
    differentialPrivacyEngine: false,
    externalDpProofAcceptedAsEvidenceOnly: true,
    noRawMaterial: true,
    noCrossTenantRelease: true,
    noPublicRelease: true,
    noAutoPromotion: true,
    learnsFromTraffic: false,
    grantsAuthority: false,
    canAdmit: false,
    activatesEnforcement: false,
    productionReady: false,
    nonClaims: Object.freeze([
      'not-differential-privacy-engine',
      'not-dp-guarantee',
      'not-learned-artifact-release',
      'not-cross-tenant-aggregation',
      'not-public-release',
      'not-runtime-budget-store',
      'not-model-training',
      'not-policy-activation',
      'not-production-ready',
    ]),
  });
}
