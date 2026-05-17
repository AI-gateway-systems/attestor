import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  BASELINE_COHORT_CONTRACT_VERSION,
  CANDIDATE_INVARIANTS_CATALOG_VERSION,
  INVARIANT_CALIBRATION_CONFIDENCE_CAP,
  INVARIANT_CALIBRATION_CONTRACT_VERSION,
  INVARIANT_CALIBRATION_ISOTONIC_MIN_SAMPLE_COUNT,
  INVARIANT_CALIBRATION_MIN_SAMPLE_COUNT,
  createBaselineCohortCandidate,
  createCandidateInvariantFromBaseline,
  createInvariantCalibrationRecord,
  evaluateBaselineCohortPromotion,
  evaluateInvariantCalibrationReadiness,
  invariantCalibrationContractDescriptor,
  type BaselineCohortCandidate,
  type BaselineCohortSourceEvent,
  type CandidateInvariant,
} from '../src/consequence-admission/index.js';

let passed = 0;

function readProjectFile(...segments: string[]): string {
  return readFileSync(join(process.cwd(), ...segments), 'utf8');
}

function equal<T>(actual: T, expected: T, message: string): void {
  assert.equal(actual, expected, message);
  passed += 1;
}

function ok(condition: unknown, message: string): void {
  assert.ok(condition, message);
  passed += 1;
}

function includes(content: string, expected: string, message: string): void {
  assert.ok(
    content.includes(expected),
    `${message}\nExpected to find: ${expected}`,
  );
  passed += 1;
}

function throws(fn: () => unknown, pattern: RegExp, message: string): void {
  assert.throws(fn, pattern, message);
  passed += 1;
}

const digestA = `sha256:${'a'.repeat(64)}`;
const digestB = `sha256:${'b'.repeat(64)}`;
const digestC = `sha256:${'c'.repeat(64)}`;
const digestD = `sha256:${'d'.repeat(64)}`;
const digestE = `sha256:${'e'.repeat(64)}`;
const digestF = `sha256:${'f'.repeat(64)}`;
const digest1 = `sha256:${'1'.repeat(64)}`;
const digest2 = `sha256:${'2'.repeat(64)}`;
const digest3 = `sha256:${'3'.repeat(64)}`;

function sourceEvent(digest: string): BaselineCohortSourceEvent {
  return {
    sourceOrigin: 'canonical-shadow-event',
    sourceEventDigest: digest,
    tenantRefDigest: digestA,
    envelopeRefDigest: digestB,
    traceRefDigest: digestC,
    observedAt: '2026-05-18T08:00:00.000Z',
    decision: 'admit',
    evidenceRefDigests: [digestD, digestE],
    rawPayloadStored: false,
    rawPromptStored: false,
    rawProviderBodyStored: false,
  };
}

function baseline(overrides?: {
  readonly minimumSourceEventCountForPromotion?: number;
}): BaselineCohortCandidate {
  return createBaselineCohortCandidate({
    cohortId: 'cohort:refunds:r1',
    tenantRefDigest: digestA,
    generatedAt: '2026-05-18T08:01:00.000Z',
    sourceEvents: [
      sourceEvent(digest1),
      sourceEvent(digest2),
      sourceEvent(digest3),
    ],
    reviewerAffirmed: true,
    reviewerRefDigest: digestF,
    minimumSourceEventCountForPromotion:
      overrides?.minimumSourceEventCountForPromotion,
  });
}

function candidate(overrides?: {
  readonly baselineCohort?: BaselineCohortCandidate;
  readonly counterexampleReplayRefDigest?: string | null;
  readonly reviewerRefDigest?: string | null;
}): CandidateInvariant {
  const baselineCohort = overrides?.baselineCohort ?? baseline();
  return createCandidateInvariantFromBaseline({
    candidateId: 'candidate:refund-authority-evidence',
    generatedAt: '2026-05-18T08:02:00.000Z',
    kind: 'authority-evidence-required',
    effect: 'strengthen-only',
    pattern: {
      templateKind: 'always',
      naturalLanguage: 'Refund create requests must include an authority evidence digest.',
      formalShape: 'G(refund.create -> authorityEvidenceDigest.present)',
      parameters: {
        actionType: 'refund.create',
        evidenceKind: 'authority',
      },
    },
    scope: {
      tenantRefDigest: digestA,
      baselineCohortRefDigest: baselineCohort.cohortRefDigest,
      consequenceClass: 'financial',
      actionType: 'refund.create',
      appliesToPackFamilies: ['finance', 'general'],
    },
    baselineCohort,
    baselinePromotion: evaluateBaselineCohortPromotion({ candidate: baselineCohort }),
    evidenceBases: [
      'baseline-cohort',
      'counterexample-replay',
      'operator-review',
    ],
    evidenceRefDigests: [digestF],
    counterexampleReplayRefDigest: overrides?.counterexampleReplayRefDigest === undefined
      ? digestE
      : overrides.counterexampleReplayRefDigest,
    reviewerRefDigest: overrides?.reviewerRefDigest === undefined
      ? digestF
      : overrides.reviewerRefDigest,
  });
}

function calibration(overrides?: {
  readonly invariant?: CandidateInvariant;
  readonly method?: 'platt-sigmoid' | 'isotonic-regression' | 'temperature-scaling';
  readonly calibrationSetRefDigest?: string | null;
  readonly holdoutSetRefDigest?: string | null;
  readonly sampleCount?: number;
  readonly positiveLabelCount?: number;
  readonly negativeLabelCount?: number;
  readonly expectedCalibrationError?: number;
  readonly brierScore?: number;
  readonly calibratedConfidence?: number;
  readonly reviewerRefDigest?: string | null;
  readonly rawClassifierScoreAuthorityRequested?: boolean;
}) {
  const invariant = overrides?.invariant ?? candidate();
  return createInvariantCalibrationRecord({
    candidate: invariant,
    calibratedAt: '2026-05-18T08:03:00.000Z',
    method: overrides?.method ?? 'platt-sigmoid',
    calibrationSetRefDigest: overrides?.calibrationSetRefDigest === undefined
      ? digestB
      : overrides.calibrationSetRefDigest,
    holdoutSetRefDigest: overrides?.holdoutSetRefDigest === undefined
      ? digestC
      : overrides.holdoutSetRefDigest,
    sampleCount: overrides?.sampleCount ?? 120,
    positiveLabelCount: overrides?.positiveLabelCount ?? 72,
    negativeLabelCount: overrides?.negativeLabelCount ?? 48,
    metrics: {
      expectedCalibrationError: overrides?.expectedCalibrationError ?? 0.04,
      brierScore: overrides?.brierScore ?? 0.12,
      negativeLogLikelihood: 0.31,
      reliabilityBinCount: 10,
    },
    calibratedConfidence: overrides?.calibratedConfidence ?? 0.72,
    reviewerRefDigest: overrides?.reviewerRefDigest === undefined
      ? digestF
      : overrides.reviewerRefDigest,
    rawClassifierScoreRefDigest: digestD,
    rawClassifierScoreAuthorityRequested:
      overrides?.rawClassifierScoreAuthorityRequested ?? false,
  });
}

function testDescriptorRecordsNonAuthorityCalibrationContract(): void {
  const descriptor = invariantCalibrationContractDescriptor();

  equal(descriptor.version, INVARIANT_CALIBRATION_CONTRACT_VERSION, 'Invariant calibration: version is explicit');
  equal(descriptor.candidateInvariantsCatalogVersion, CANDIDATE_INVARIANTS_CATALOG_VERSION, 'Invariant calibration: binds candidate invariant catalog');
  ok(descriptor.methods.includes('platt-sigmoid'), 'Invariant calibration: Platt/sigmoid method is recorded');
  ok(descriptor.methods.includes('isotonic-regression'), 'Invariant calibration: isotonic method is recorded');
  ok(descriptor.methods.includes('temperature-scaling'), 'Invariant calibration: temperature method is recorded');
  ok(descriptor.metricKinds.includes('expected-calibration-error'), 'Invariant calibration: ECE metric is recorded');
  equal(descriptor.minimumSampleCount, INVARIANT_CALIBRATION_MIN_SAMPLE_COUNT, 'Invariant calibration: minimum sample count is explicit');
  equal(descriptor.isotonicMinimumSampleCount, INVARIANT_CALIBRATION_ISOTONIC_MIN_SAMPLE_COUNT, 'Invariant calibration: isotonic sample floor is explicit');
  equal(descriptor.confidenceCap, INVARIANT_CALIBRATION_CONFIDENCE_CAP, 'Invariant calibration: confidence cap is explicit');
  equal(descriptor.confidenceCapBelowSingleSignalBlock, true, 'Invariant calibration: cap stays below single-signal block reference');
  equal(descriptor.rawClassifierScoreAuthorityAllowed, false, 'Invariant calibration: raw score authority is forbidden');
  equal(descriptor.calibratedConfidenceAuthorityAllowed, false, 'Invariant calibration: confidence authority is forbidden');
  equal(descriptor.noAutoPromotion, true, 'Invariant calibration: auto promotion is forbidden');
  equal(descriptor.learnsFromTraffic, false, 'Invariant calibration: descriptor does not learn');
  equal(descriptor.canAdmit, false, 'Invariant calibration: descriptor cannot admit');
  equal(descriptor.activatesEnforcement, false, 'Invariant calibration: descriptor cannot enforce');
  equal(descriptor.productionReady, false, 'Invariant calibration: descriptor is not production readiness');
  ok(
    descriptor.nonClaims.includes('not-calibration-training-engine'),
    'Invariant calibration: training engine is a non-claim',
  );
}

function testReadyPlattCalibrationStaysAdvisory(): void {
  const record = calibration();
  const evaluation = evaluateInvariantCalibrationReadiness(record);

  equal(record.version, INVARIANT_CALIBRATION_CONTRACT_VERSION, 'Invariant calibration: record version is explicit');
  equal(record.candidateInvariantsCatalogVersion, CANDIDATE_INVARIANTS_CATALOG_VERSION, 'Invariant calibration: record binds catalog');
  equal(record.outcome, 'calibration-ready-for-promotion-review', 'Invariant calibration: clean Platt record is ready for promotion review');
  equal(record.readyForPromotionGate, true, 'Invariant calibration: clean record can move to promotion gate');
  equal(record.failClosed, false, 'Invariant calibration: clean record does not fail closed');
  equal(record.rawClassifierScoreStored, false, 'Invariant calibration: raw score is not stored');
  equal(record.rawClassifierScoreAuthorityAllowed, false, 'Invariant calibration: raw score cannot be authority');
  equal(record.calibratedConfidenceAuthorityAllowed, false, 'Invariant calibration: calibrated confidence cannot be authority');
  equal(record.autoPromote, false, 'Invariant calibration: record cannot auto-promote');
  equal(record.learnsFromTraffic, false, 'Invariant calibration: record does not learn from traffic');
  equal(record.trainingEnabled, false, 'Invariant calibration: training remains disabled');
  equal(record.canAdmit, false, 'Invariant calibration: record cannot admit');
  equal(record.activatesEnforcement, false, 'Invariant calibration: record cannot enforce');
  equal(record.productionReady, false, 'Invariant calibration: record is not production readiness');
  equal(evaluation.readyForPromotionGate, true, 'Invariant calibration: evaluation preserves promotion-gate readiness');
  equal(evaluation.rawClassifierScoreAuthorityAllowed, false, 'Invariant calibration: evaluation forbids raw score authority');
  ok(record.digest.startsWith('sha256:'), 'Invariant calibration: record has digest');
  ok(evaluation.digest.startsWith('sha256:'), 'Invariant calibration: evaluation has digest');
}

function testIsotonicRequiresLargeCalibrationSet(): void {
  const underSampled = calibration({
    method: 'isotonic-regression',
    sampleCount: 120,
    positiveLabelCount: 72,
    negativeLabelCount: 48,
  });
  const enoughData = calibration({
    method: 'isotonic-regression',
    sampleCount: 1200,
    positiveLabelCount: 720,
    negativeLabelCount: 480,
  });

  equal(underSampled.outcome, 'held-for-method-sample-floor', 'Invariant calibration: isotonic under 1000 samples is held');
  ok(
    underSampled.dangerFlags.includes('isotonic-under-sampled'),
    'Invariant calibration: isotonic under-sampling flag is explicit',
  );
  equal(enoughData.outcome, 'calibration-ready-for-promotion-review', 'Invariant calibration: isotonic with enough data can be ready');
}

function testCalibrationEvidenceAndMetricHolds(): void {
  const missingHoldout = calibration({
    holdoutSetRefDigest: null,
  });
  const missingClass = calibration({
    sampleCount: 120,
    positiveLabelCount: 120,
    negativeLabelCount: 0,
  });
  const weakMetrics = calibration({
    expectedCalibrationError: 0.2,
  });
  const missingReviewer = calibration({
    reviewerRefDigest: null,
  });

  equal(missingHoldout.outcome, 'held-for-calibration-evidence', 'Invariant calibration: missing holdout is held');
  ok(missingHoldout.dangerFlags.includes('missing-holdout-set'), 'Invariant calibration: missing holdout flag is explicit');
  equal(missingClass.outcome, 'held-for-class-coverage', 'Invariant calibration: missing class coverage is held');
  ok(missingClass.dangerFlags.includes('missing-class-coverage'), 'Invariant calibration: class coverage flag is explicit');
  equal(weakMetrics.outcome, 'held-for-metric-threshold', 'Invariant calibration: weak metrics are held');
  ok(weakMetrics.dangerFlags.includes('metric-threshold-breach'), 'Invariant calibration: metric threshold flag is explicit');
  equal(missingReviewer.outcome, 'held-for-review', 'Invariant calibration: missing reviewer is held');
  ok(missingReviewer.dangerFlags.includes('missing-calibration-reviewer'), 'Invariant calibration: missing reviewer flag is explicit');
}

function testCandidateAndRawScoreAuthorityAreFailClosed(): void {
  const candidateHeldForReview = candidate({
    reviewerRefDigest: null,
  });
  const heldCandidate = calibration({
    invariant: candidateHeldForReview,
  });
  const rawScoreAuthority = calibration({
    rawClassifierScoreAuthorityRequested: true,
  });

  equal(heldCandidate.outcome, 'held-for-candidate-review', 'Invariant calibration: candidate not review-ready is held');
  ok(
    heldCandidate.dangerFlags.includes('candidate-not-review-ready'),
    'Invariant calibration: candidate-not-review-ready flag is explicit',
  );
  equal(rawScoreAuthority.outcome, 'rejected-authority-score', 'Invariant calibration: raw score authority request is rejected');
  ok(
    rawScoreAuthority.dangerFlags.includes('raw-classifier-score-authority'),
    'Invariant calibration: raw authority flag is explicit',
  );
  equal(
    evaluateInvariantCalibrationReadiness(rawScoreAuthority).failClosed,
    true,
    'Invariant calibration: raw authority rejection fails closed',
  );
}

function testConfidenceIsCappedBelowBlockReference(): void {
  const record = calibration({
    calibratedConfidence: 0.99,
  });

  equal(record.cappedCalibratedConfidence, INVARIANT_CALIBRATION_CONFIDENCE_CAP, 'Invariant calibration: confidence is capped');
  ok(
    record.dangerFlags.includes('confidence-cap-applied'),
    'Invariant calibration: confidence cap flag is explicit',
  );
  ok(
    record.cappedCalibratedConfidence < 0.85,
    'Invariant calibration: capped confidence stays below single-signal block reference',
  );
  equal(record.canAdmit, false, 'Invariant calibration: capped confidence still cannot admit');
}

function testValidationRejectsBrokenShapes(): void {
  throws(
    () => calibration({
      calibrationSetRefDigest: 'not-a-digest',
    }),
    /calibrationSetRefDigest must be a sha256 digest/u,
    'Invariant calibration: invalid calibration digest is rejected',
  );
  throws(
    () => calibration({
      sampleCount: 10,
      positiveLabelCount: 6,
      negativeLabelCount: 3,
    }),
    /positiveLabelCount \+ negativeLabelCount must equal sampleCount/u,
    'Invariant calibration: class counts must equal sample count',
  );
  throws(
    () => calibration({
      expectedCalibrationError: 2,
    }),
    /expectedCalibrationError must be in the \[0, 1\] interval/u,
    'Invariant calibration: ECE must be bounded',
  );
}

function testDocsAndOverviewRecordW11Scope(): void {
  const doc = readProjectFile(
    'docs',
    '02-architecture',
    'invariant-calibration-contract.md',
  );
  const overview = readProjectFile(
    'docs',
    '02-architecture',
    'consequence-runtime-assurance-overview.md',
  );
  const packageJson = JSON.parse(readProjectFile('package.json')) as {
    readonly scripts: Readonly<Record<string, string>>;
  };

  for (const expected of [
    '# Invariant Calibration Contract',
    'not a calibration training engine',
    'raw classifier score',
    'Platt',
    'isotonic',
    'temperature scaling',
    'expected calibration error',
    'Brier score',
    'not production readiness',
  ]) {
    includes(doc, expected, `Invariant calibration docs: records ${expected}`);
  }

  includes(overview, '| W11 | complete | Invariant Calibration Contract |', 'Overview: W11 is complete');
  includes(
    overview,
    'src/consequence-admission/invariant-calibration-contract.ts',
    'Overview: W11 implementation path is recorded',
  );
  assert.equal(
    packageJson.scripts['test:invariant-calibration-contract'],
    'tsx tests/invariant-calibration-contract.test.ts',
    'Invariant calibration: package script is registered',
  );
  passed += 1;
}

testDescriptorRecordsNonAuthorityCalibrationContract();
testReadyPlattCalibrationStaysAdvisory();
testIsotonicRequiresLargeCalibrationSet();
testCalibrationEvidenceAndMetricHolds();
testCandidateAndRawScoreAuthorityAreFailClosed();
testConfidenceIsCappedBelowBlockReference();
testValidationRejectsBrokenShapes();
testDocsAndOverviewRecordW11Scope();

console.log(`Invariant calibration contract tests: ${passed} passed, 0 failed`);
