import { createHash } from 'node:crypto';
import {
  canonicalizeReleaseJson,
  type CanonicalReleaseJsonValue,
} from '../release-kernel/release-canonicalization.js';
import {
  CANDIDATE_INVARIANTS_CATALOG_VERSION,
  type CandidateInvariant,
} from './candidate-invariants-catalog.js';

export const INVARIANT_CALIBRATION_CONTRACT_VERSION =
  'attestor.invariant-calibration-contract.v1';

export const INVARIANT_CALIBRATION_MIN_SAMPLE_COUNT = 30;
export const INVARIANT_CALIBRATION_ISOTONIC_MIN_SAMPLE_COUNT = 1000;
export const INVARIANT_CALIBRATION_CONFIDENCE_CAP = 0.84;
export const INVARIANT_CALIBRATION_MAX_EXPECTED_CALIBRATION_ERROR = 0.1;
export const INVARIANT_CALIBRATION_MAX_BRIER_SCORE = 0.25;

export const INVARIANT_CALIBRATION_METHODS = [
  'platt-sigmoid',
  'isotonic-regression',
  'temperature-scaling',
] as const;
export type InvariantCalibrationMethod =
  typeof INVARIANT_CALIBRATION_METHODS[number];

export const INVARIANT_CALIBRATION_METRIC_KINDS = [
  'expected-calibration-error',
  'brier-score',
  'negative-log-likelihood',
  'reliability-bin-count',
  'holdout-sample-count',
] as const;
export type InvariantCalibrationMetricKind =
  typeof INVARIANT_CALIBRATION_METRIC_KINDS[number];

export const INVARIANT_CALIBRATION_OUTCOMES = [
  'calibration-ready-for-promotion-review',
  'held-for-candidate-review',
  'held-for-sample-floor',
  'held-for-method-sample-floor',
  'held-for-class-coverage',
  'held-for-calibration-evidence',
  'held-for-metric-threshold',
  'held-for-review',
  'rejected-authority-score',
] as const;
export type InvariantCalibrationOutcome =
  typeof INVARIANT_CALIBRATION_OUTCOMES[number];

export const INVARIANT_CALIBRATION_DANGER_FLAGS = [
  'raw-classifier-score-authority',
  'uncalibrated-score-authority',
  'missing-calibration-set',
  'missing-holdout-set',
  'insufficient-sample',
  'isotonic-under-sampled',
  'missing-class-coverage',
  'metric-threshold-breach',
  'candidate-not-review-ready',
  'missing-calibration-reviewer',
  'confidence-cap-applied',
] as const;
export type InvariantCalibrationDangerFlag =
  typeof INVARIANT_CALIBRATION_DANGER_FLAGS[number];

export interface InvariantCalibrationMetrics {
  readonly expectedCalibrationError: number;
  readonly brierScore: number;
  readonly negativeLogLikelihood: number | null;
  readonly reliabilityBinCount: number;
}

export interface CreateInvariantCalibrationInput {
  readonly candidate: CandidateInvariant;
  readonly calibratedAt: string;
  readonly method: InvariantCalibrationMethod;
  readonly calibrationSetRefDigest?: string | null;
  readonly holdoutSetRefDigest?: string | null;
  readonly sampleCount: number;
  readonly positiveLabelCount: number;
  readonly negativeLabelCount: number;
  readonly metrics: InvariantCalibrationMetrics;
  readonly calibratedConfidence: number;
  readonly reviewerRefDigest?: string | null;
  readonly rawClassifierScoreRefDigest?: string | null;
  readonly rawClassifierScoreAuthorityRequested?: boolean | null;
  readonly declaredDangerFlags?: readonly InvariantCalibrationDangerFlag[] | null;
}

export interface InvariantCalibrationRecord {
  readonly version: typeof INVARIANT_CALIBRATION_CONTRACT_VERSION;
  readonly candidateInvariantsCatalogVersion:
    typeof CANDIDATE_INVARIANTS_CATALOG_VERSION;
  readonly calibrationRefDigest: string;
  readonly candidateInvariantRefDigest: string;
  readonly candidateInvariantDigest: string;
  readonly candidateReviewOutcome: CandidateInvariant['reviewOutcome'];
  readonly calibratedAt: string;
  readonly method: InvariantCalibrationMethod;
  readonly calibrationSetRefDigest: string | null;
  readonly holdoutSetRefDigest: string | null;
  readonly sampleCount: number;
  readonly positiveLabelCount: number;
  readonly negativeLabelCount: number;
  readonly metrics: InvariantCalibrationMetrics;
  readonly calibratedConfidence: number;
  readonly cappedCalibratedConfidence: number;
  readonly confidenceCap: typeof INVARIANT_CALIBRATION_CONFIDENCE_CAP;
  readonly reviewerRefDigest: string | null;
  readonly rawClassifierScoreRefDigest: string | null;
  readonly rawClassifierScoreStored: false;
  readonly rawClassifierScoreAuthorityRequested: boolean;
  readonly rawClassifierScoreAuthorityAllowed: false;
  readonly calibratedConfidenceAuthorityAllowed: false;
  readonly outcome: InvariantCalibrationOutcome;
  readonly readyForPromotionGate: boolean;
  readonly failClosed: boolean;
  readonly dangerFlags: readonly InvariantCalibrationDangerFlag[];
  readonly reasonCodes: readonly string[];
  readonly autoPromote: false;
  readonly learnsFromTraffic: false;
  readonly trainingEnabled: false;
  readonly canAdmit: false;
  readonly activatesEnforcement: false;
  readonly productionReady: false;
  readonly canonical: string;
  readonly digest: string;
}

export interface InvariantCalibrationEvaluation {
  readonly version: typeof INVARIANT_CALIBRATION_CONTRACT_VERSION;
  readonly calibrationRefDigest: string;
  readonly outcome: InvariantCalibrationOutcome;
  readonly readyForPromotionGate: boolean;
  readonly failClosed: boolean;
  readonly cappedCalibratedConfidence: number;
  readonly dangerFlags: readonly InvariantCalibrationDangerFlag[];
  readonly reasonCodes: readonly string[];
  readonly rawClassifierScoreAuthorityAllowed: false;
  readonly calibratedConfidenceAuthorityAllowed: false;
  readonly autoPromote: false;
  readonly canAdmit: false;
  readonly activatesEnforcement: false;
  readonly productionReady: false;
  readonly canonical: string;
  readonly digest: string;
}

export interface InvariantCalibrationContractDescriptor {
  readonly version: typeof INVARIANT_CALIBRATION_CONTRACT_VERSION;
  readonly candidateInvariantsCatalogVersion:
    typeof CANDIDATE_INVARIANTS_CATALOG_VERSION;
  readonly methods: readonly InvariantCalibrationMethod[];
  readonly metricKinds: readonly InvariantCalibrationMetricKind[];
  readonly outcomes: readonly InvariantCalibrationOutcome[];
  readonly dangerFlags: readonly InvariantCalibrationDangerFlag[];
  readonly minimumSampleCount: typeof INVARIANT_CALIBRATION_MIN_SAMPLE_COUNT;
  readonly isotonicMinimumSampleCount:
    typeof INVARIANT_CALIBRATION_ISOTONIC_MIN_SAMPLE_COUNT;
  readonly confidenceCap: typeof INVARIANT_CALIBRATION_CONFIDENCE_CAP;
  readonly maxExpectedCalibrationError:
    typeof INVARIANT_CALIBRATION_MAX_EXPECTED_CALIBRATION_ERROR;
  readonly maxBrierScore: typeof INVARIANT_CALIBRATION_MAX_BRIER_SCORE;
  readonly confidenceCapBelowSingleSignalBlock: true;
  readonly calibrationSetRequired: true;
  readonly holdoutSetRequired: true;
  readonly reviewerRequired: true;
  readonly rawClassifierScoreAuthorityAllowed: false;
  readonly calibratedConfidenceAuthorityAllowed: false;
  readonly noAutoPromotion: true;
  readonly learnsFromTraffic: false;
  readonly grantsAuthority: false;
  readonly canAdmit: false;
  readonly activatesEnforcement: false;
  readonly productionReady: false;
  readonly nonClaims: readonly string[];
}

const SHA256_DIGEST_PATTERN = /^sha256:[a-f0-9]{64}$/u;
const SINGLE_SIGNAL_BLOCK_HAZARD_REFERENCE = 0.85;

const REJECTING_DANGER_FLAGS = new Set<InvariantCalibrationDangerFlag>([
  'raw-classifier-score-authority',
  'uncalibrated-score-authority',
]);

if (INVARIANT_CALIBRATION_CONFIDENCE_CAP >= SINGLE_SIGNAL_BLOCK_HAZARD_REFERENCE) {
  throw new Error(
    'Invariant calibration confidence cap must stay below single-signal block reference.',
  );
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

function digestValue(kind: string, value: CanonicalReleaseJsonValue): string {
  return canonicalObject({ kind, value }).digest;
}

function normalizeIdentifier(
  value: string | null | undefined,
  fieldName: string,
): string {
  if (typeof value !== 'string') {
    throw new Error(`Invariant calibration ${fieldName} requires a string.`);
  }
  const normalized = value.trim();
  if (
    normalized.length === 0 ||
    normalized.length > 1024 ||
    /[\u0000-\u001f\u007f]/u.test(normalized)
  ) {
    throw new Error(
      `Invariant calibration ${fieldName} must be non-empty, bounded, and control-free.`,
    );
  }
  return normalized;
}

function normalizeDigest(value: string | null | undefined, fieldName: string): string {
  const normalized = normalizeIdentifier(value, fieldName);
  if (!SHA256_DIGEST_PATTERN.test(normalized)) {
    throw new Error(`Invariant calibration ${fieldName} must be a sha256 digest.`);
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
    throw new Error(`Invariant calibration ${fieldName} must be an ISO timestamp.`);
  }
  return timestamp.toISOString();
}

function normalizeEnumValue<const Values extends readonly string[]>(
  value: string | null | undefined,
  values: Values,
  fieldName: string,
): Values[number] {
  const normalized = normalizeIdentifier(value, fieldName);
  if (!values.includes(normalized)) {
    throw new Error(`Invariant calibration ${fieldName} is not supported.`);
  }
  return normalized as Values[number];
}

function normalizeCount(value: number, fieldName: string): number {
  if (!Number.isInteger(value) || value < 0 || value > 10_000_000) {
    throw new Error(
      `Invariant calibration ${fieldName} must be a bounded non-negative integer.`,
    );
  }
  return value;
}

function normalizeUnitInterval(value: number, fieldName: string): number {
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new Error(
      `Invariant calibration ${fieldName} must be in the [0, 1] interval.`,
    );
  }
  return Number(value.toFixed(6));
}

function normalizeNonNegativeMetric(value: number | null, fieldName: string): number | null {
  if (value === null) return null;
  if (!Number.isFinite(value) || value < 0 || value > 100) {
    throw new Error(
      `Invariant calibration ${fieldName} must be a bounded non-negative number.`,
    );
  }
  return Number(value.toFixed(6));
}

function normalizeMetrics(
  metrics: InvariantCalibrationMetrics,
): InvariantCalibrationMetrics {
  const reliabilityBinCount = normalizeCount(
    metrics.reliabilityBinCount,
    'metrics.reliabilityBinCount',
  );
  if (reliabilityBinCount < 2 || reliabilityBinCount > 100) {
    throw new Error(
      'Invariant calibration metrics.reliabilityBinCount must be between 2 and 100.',
    );
  }
  return Object.freeze({
    expectedCalibrationError: normalizeUnitInterval(
      metrics.expectedCalibrationError,
      'metrics.expectedCalibrationError',
    ),
    brierScore: normalizeUnitInterval(metrics.brierScore, 'metrics.brierScore'),
    negativeLogLikelihood: normalizeNonNegativeMetric(
      metrics.negativeLogLikelihood,
      'metrics.negativeLogLikelihood',
    ),
    reliabilityBinCount,
  });
}

function normalizeDangerFlags(
  values: readonly InvariantCalibrationDangerFlag[] | null | undefined,
): readonly InvariantCalibrationDangerFlag[] {
  return Object.freeze([...new Set((values ?? []).map((value) =>
    normalizeEnumValue(
      value,
      INVARIANT_CALIBRATION_DANGER_FLAGS,
      'dangerFlags[]',
    ) as InvariantCalibrationDangerFlag,
  ))].sort());
}

function derivedDangerFlags(input: {
  readonly candidate: CandidateInvariant;
  readonly method: InvariantCalibrationMethod;
  readonly calibrationSetRefDigest: string | null;
  readonly holdoutSetRefDigest: string | null;
  readonly sampleCount: number;
  readonly positiveLabelCount: number;
  readonly negativeLabelCount: number;
  readonly metrics: InvariantCalibrationMetrics;
  readonly calibratedConfidence: number;
  readonly reviewerRefDigest: string | null;
  readonly rawClassifierScoreAuthorityRequested: boolean;
  readonly declaredDangerFlags: readonly InvariantCalibrationDangerFlag[];
}): readonly InvariantCalibrationDangerFlag[] {
  const flags = new Set<InvariantCalibrationDangerFlag>(input.declaredDangerFlags);
  if (input.rawClassifierScoreAuthorityRequested) {
    flags.add('raw-classifier-score-authority');
  }
  if (input.candidate.reviewOutcome !== 'review-ready') {
    flags.add('candidate-not-review-ready');
  }
  if (!input.calibrationSetRefDigest) {
    flags.add('missing-calibration-set');
  }
  if (!input.holdoutSetRefDigest) {
    flags.add('missing-holdout-set');
  }
  if (input.sampleCount < INVARIANT_CALIBRATION_MIN_SAMPLE_COUNT) {
    flags.add('insufficient-sample');
  }
  if (
    input.method === 'isotonic-regression' &&
    input.sampleCount < INVARIANT_CALIBRATION_ISOTONIC_MIN_SAMPLE_COUNT
  ) {
    flags.add('isotonic-under-sampled');
  }
  if (input.positiveLabelCount === 0 || input.negativeLabelCount === 0) {
    flags.add('missing-class-coverage');
  }
  if (
    input.metrics.expectedCalibrationError >
      INVARIANT_CALIBRATION_MAX_EXPECTED_CALIBRATION_ERROR ||
    input.metrics.brierScore > INVARIANT_CALIBRATION_MAX_BRIER_SCORE
  ) {
    flags.add('metric-threshold-breach');
  }
  if (!input.reviewerRefDigest) {
    flags.add('missing-calibration-reviewer');
  }
  if (input.calibratedConfidence > INVARIANT_CALIBRATION_CONFIDENCE_CAP) {
    flags.add('confidence-cap-applied');
  }
  return normalizeDangerFlags([...flags]);
}

function outcomeFor(input: {
  readonly dangerFlags: readonly InvariantCalibrationDangerFlag[];
}): InvariantCalibrationOutcome {
  if (input.dangerFlags.some((flag) => REJECTING_DANGER_FLAGS.has(flag))) {
    return 'rejected-authority-score';
  }
  if (input.dangerFlags.includes('candidate-not-review-ready')) {
    return 'held-for-candidate-review';
  }
  if (input.dangerFlags.includes('insufficient-sample')) {
    return 'held-for-sample-floor';
  }
  if (input.dangerFlags.includes('isotonic-under-sampled')) {
    return 'held-for-method-sample-floor';
  }
  if (input.dangerFlags.includes('missing-class-coverage')) {
    return 'held-for-class-coverage';
  }
  if (
    input.dangerFlags.includes('missing-calibration-set') ||
    input.dangerFlags.includes('missing-holdout-set')
  ) {
    return 'held-for-calibration-evidence';
  }
  if (input.dangerFlags.includes('metric-threshold-breach')) {
    return 'held-for-metric-threshold';
  }
  if (input.dangerFlags.includes('missing-calibration-reviewer')) {
    return 'held-for-review';
  }
  return 'calibration-ready-for-promotion-review';
}

function reasonCodesFor(input: {
  readonly outcome: InvariantCalibrationOutcome;
  readonly dangerFlags: readonly InvariantCalibrationDangerFlag[];
  readonly method: InvariantCalibrationMethod;
}): readonly string[] {
  const reasonCodes = new Set<string>([
    `invariant-calibration-${input.outcome}`,
    `invariant-calibration-method-${input.method}`,
    ...input.dangerFlags.map((flag) => `invariant-calibration-${flag}`),
  ]);
  if (input.dangerFlags.length === 0) {
    reasonCodes.add('invariant-calibration-no-danger-flags');
  }
  return Object.freeze([...reasonCodes].sort());
}

export function invariantCalibrationContractDescriptor():
InvariantCalibrationContractDescriptor {
  return Object.freeze({
    version: INVARIANT_CALIBRATION_CONTRACT_VERSION,
    candidateInvariantsCatalogVersion: CANDIDATE_INVARIANTS_CATALOG_VERSION,
    methods: INVARIANT_CALIBRATION_METHODS,
    metricKinds: INVARIANT_CALIBRATION_METRIC_KINDS,
    outcomes: INVARIANT_CALIBRATION_OUTCOMES,
    dangerFlags: INVARIANT_CALIBRATION_DANGER_FLAGS,
    minimumSampleCount: INVARIANT_CALIBRATION_MIN_SAMPLE_COUNT,
    isotonicMinimumSampleCount: INVARIANT_CALIBRATION_ISOTONIC_MIN_SAMPLE_COUNT,
    confidenceCap: INVARIANT_CALIBRATION_CONFIDENCE_CAP,
    maxExpectedCalibrationError: INVARIANT_CALIBRATION_MAX_EXPECTED_CALIBRATION_ERROR,
    maxBrierScore: INVARIANT_CALIBRATION_MAX_BRIER_SCORE,
    confidenceCapBelowSingleSignalBlock: true,
    calibrationSetRequired: true,
    holdoutSetRequired: true,
    reviewerRequired: true,
    rawClassifierScoreAuthorityAllowed: false,
    calibratedConfidenceAuthorityAllowed: false,
    noAutoPromotion: true,
    learnsFromTraffic: false,
    grantsAuthority: false,
    canAdmit: false,
    activatesEnforcement: false,
    productionReady: false,
    nonClaims: Object.freeze([
      'not-calibration-training-engine',
      'not-invariant-promotion-gate',
      'not-live-enforcement',
      'not-raw-score-authority',
      'not-model-training',
      'not-production-readiness',
    ]),
  });
}

export function createInvariantCalibrationRecord(
  input: CreateInvariantCalibrationInput,
): InvariantCalibrationRecord {
  const calibratedAt = normalizeIsoTimestamp(input.calibratedAt, 'calibratedAt');
  const method = normalizeEnumValue(
    input.method,
    INVARIANT_CALIBRATION_METHODS,
    'method',
  ) as InvariantCalibrationMethod;
  const calibrationSetRefDigest = normalizeOptionalDigest(
    input.calibrationSetRefDigest,
    'calibrationSetRefDigest',
  );
  const holdoutSetRefDigest = normalizeOptionalDigest(
    input.holdoutSetRefDigest,
    'holdoutSetRefDigest',
  );
  const sampleCount = normalizeCount(input.sampleCount, 'sampleCount');
  const positiveLabelCount = normalizeCount(
    input.positiveLabelCount,
    'positiveLabelCount',
  );
  const negativeLabelCount = normalizeCount(
    input.negativeLabelCount,
    'negativeLabelCount',
  );
  if (positiveLabelCount + negativeLabelCount !== sampleCount) {
    throw new Error(
      'Invariant calibration positiveLabelCount + negativeLabelCount must equal sampleCount.',
    );
  }
  const metrics = normalizeMetrics(input.metrics);
  const calibratedConfidence = normalizeUnitInterval(
    input.calibratedConfidence,
    'calibratedConfidence',
  );
  const cappedCalibratedConfidence = Math.min(
    calibratedConfidence,
    INVARIANT_CALIBRATION_CONFIDENCE_CAP,
  );
  const reviewerRefDigest = normalizeOptionalDigest(
    input.reviewerRefDigest,
    'reviewerRefDigest',
  );
  const rawClassifierScoreRefDigest = normalizeOptionalDigest(
    input.rawClassifierScoreRefDigest,
    'rawClassifierScoreRefDigest',
  );
  const rawClassifierScoreAuthorityRequested =
    input.rawClassifierScoreAuthorityRequested === true;
  const dangerFlags = derivedDangerFlags({
    candidate: input.candidate,
    method,
    calibrationSetRefDigest,
    holdoutSetRefDigest,
    sampleCount,
    positiveLabelCount,
    negativeLabelCount,
    metrics,
    calibratedConfidence,
    reviewerRefDigest,
    rawClassifierScoreAuthorityRequested,
    declaredDangerFlags: normalizeDangerFlags(input.declaredDangerFlags),
  });
  const outcome = outcomeFor({ dangerFlags });
  const readyForPromotionGate =
    outcome === 'calibration-ready-for-promotion-review';
  const failClosed = !readyForPromotionGate;
  const reasonCodes = reasonCodesFor({ outcome, dangerFlags, method });
  const calibrationRefDigest = digestValue('invariant-calibration-ref', {
    version: INVARIANT_CALIBRATION_CONTRACT_VERSION,
    candidateInvariantRefDigest: input.candidate.invariantRefDigest,
    method,
    calibrationSetRefDigest,
    holdoutSetRefDigest,
  } as CanonicalReleaseJsonValue);
  const payload = {
    version: INVARIANT_CALIBRATION_CONTRACT_VERSION,
    candidateInvariantsCatalogVersion: CANDIDATE_INVARIANTS_CATALOG_VERSION,
    calibrationRefDigest,
    candidateInvariantRefDigest: input.candidate.invariantRefDigest,
    candidateInvariantDigest: input.candidate.digest,
    candidateReviewOutcome: input.candidate.reviewOutcome,
    calibratedAt,
    method,
    calibrationSetRefDigest,
    holdoutSetRefDigest,
    sampleCount,
    positiveLabelCount,
    negativeLabelCount,
    metrics,
    calibratedConfidence,
    cappedCalibratedConfidence,
    confidenceCap: INVARIANT_CALIBRATION_CONFIDENCE_CAP,
    reviewerRefDigest,
    rawClassifierScoreRefDigest,
    rawClassifierScoreStored: false,
    rawClassifierScoreAuthorityRequested,
    rawClassifierScoreAuthorityAllowed: false,
    calibratedConfidenceAuthorityAllowed: false,
    outcome,
    readyForPromotionGate,
    failClosed,
    dangerFlags,
    reasonCodes,
    autoPromote: false,
    learnsFromTraffic: false,
    trainingEnabled: false,
    canAdmit: false,
    activatesEnforcement: false,
    productionReady: false,
  } as const;
  const canonical = canonicalObject(payload as unknown as CanonicalReleaseJsonValue);
  return Object.freeze({
    ...payload,
    canonical: canonical.canonical,
    digest: canonical.digest,
  });
}

export function evaluateInvariantCalibrationReadiness(
  record: InvariantCalibrationRecord,
): InvariantCalibrationEvaluation {
  const payload = {
    version: INVARIANT_CALIBRATION_CONTRACT_VERSION,
    calibrationRefDigest: record.calibrationRefDigest,
    outcome: record.outcome,
    readyForPromotionGate: record.readyForPromotionGate,
    failClosed: record.failClosed,
    cappedCalibratedConfidence: record.cappedCalibratedConfidence,
    dangerFlags: record.dangerFlags,
    reasonCodes: record.reasonCodes,
    rawClassifierScoreAuthorityAllowed: false,
    calibratedConfidenceAuthorityAllowed: false,
    autoPromote: false,
    canAdmit: false,
    activatesEnforcement: false,
    productionReady: false,
  } as const;
  const canonical = canonicalObject(payload as unknown as CanonicalReleaseJsonValue);
  return Object.freeze({
    ...payload,
    canonical: canonical.canonical,
    digest: canonical.digest,
  });
}
