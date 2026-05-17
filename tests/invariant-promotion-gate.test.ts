import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  CANDIDATE_INVARIANTS_CATALOG_VERSION,
  INVARIANT_CALIBRATION_CONTRACT_VERSION,
  INVARIANT_PROMOTION_GATE_VERSION,
  createBaselineCohortCandidate,
  createCandidateInvariantFromBaseline,
  createInvariantCalibrationRecord,
  createInvariantPromotionGateDecision,
  evaluateBaselineCohortPromotion,
  evaluateInvariantPromotionGate,
  invariantPromotionGateDescriptor,
  type BaselineCohortCandidate,
  type BaselineCohortSourceEvent,
  type CandidateInvariant,
  type InvariantCalibrationRecord,
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
const digest0 = `sha256:${'0'.repeat(64)}`;
const digest1 = `sha256:${'1'.repeat(64)}`;
const digest2 = `sha256:${'2'.repeat(64)}`;
const digest3 = `sha256:${'3'.repeat(64)}`;
const digest4 = `sha256:${'4'.repeat(64)}`;
const digest5 = `sha256:${'5'.repeat(64)}`;
const digest6 = `sha256:${'6'.repeat(64)}`;

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

function baseline(): BaselineCohortCandidate {
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
  });
}

function candidate(overrides?: {
  readonly effect?: 'strengthen-only' | 'review-only' | 'measure-only' | 'relaxation-requested';
  readonly reviewerRefDigest?: string | null;
}): CandidateInvariant {
  const baselineCohort = baseline();
  return createCandidateInvariantFromBaseline({
    candidateId: 'candidate:refund-authority-evidence',
    generatedAt: '2026-05-18T08:02:00.000Z',
    kind: 'authority-evidence-required',
    effect: overrides?.effect ?? 'strengthen-only',
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
    counterexampleReplayRefDigest: digestE,
    reviewerRefDigest: overrides?.reviewerRefDigest === undefined
      ? digestF
      : overrides.reviewerRefDigest,
  });
}

function calibration(overrides?: {
  readonly invariant?: CandidateInvariant;
  readonly sampleCount?: number;
  readonly positiveLabelCount?: number;
  readonly negativeLabelCount?: number;
  readonly expectedCalibrationError?: number;
}): InvariantCalibrationRecord {
  const invariant = overrides?.invariant ?? candidate();
  return createInvariantCalibrationRecord({
    candidate: invariant,
    calibratedAt: '2026-05-18T08:03:00.000Z',
    method: 'platt-sigmoid',
    calibrationSetRefDigest: digestB,
    holdoutSetRefDigest: digestC,
    sampleCount: overrides?.sampleCount ?? 120,
    positiveLabelCount: overrides?.positiveLabelCount ?? 72,
    negativeLabelCount: overrides?.negativeLabelCount ?? 48,
    metrics: {
      expectedCalibrationError: overrides?.expectedCalibrationError ?? 0.04,
      brierScore: 0.12,
      negativeLogLikelihood: 0.31,
      reliabilityBinCount: 10,
    },
    calibratedConfidence: 0.72,
    reviewerRefDigest: digestF,
    rawClassifierScoreRefDigest: digestD,
    rawClassifierScoreAuthorityRequested: false,
  });
}

function promotion(overrides?: {
  readonly invariant?: CandidateInvariant;
  readonly calibrated?: InvariantCalibrationRecord;
  readonly requestedAction?: 'create-review-only-strengthening-patch' | 'activate-live-enforcement' | 'auto-promote' | 'relax-control';
  readonly mutationMode?: 'strengthen-only' | 'relaxation-requested';
  readonly reviewerRefDigest?: string | null;
  readonly approvalRefDigest?: string | null;
  readonly approvedAt?: string | null;
  readonly reviewerIndependence?: 'independent' | 'same-as-candidate-reviewer' | 'same-as-calibration-reviewer' | 'unknown';
  readonly policyPatchRefDigest?: string | null;
  readonly rolloutPlanRefDigest?: string | null;
  readonly rollbackPlanRefDigest?: string | null;
  readonly autoPromotionRequested?: boolean;
  readonly enforcementActivationRequested?: boolean;
}) {
  const invariant = overrides?.invariant ?? candidate();
  const calibrated = overrides?.calibrated ?? calibration({ invariant });
  return createInvariantPromotionGateDecision({
    candidate: invariant,
    calibration: calibrated,
    evaluatedAt: '2026-05-18T08:04:00.000Z',
    requestedAction: overrides?.requestedAction ?? 'create-review-only-strengthening-patch',
    mutationMode: overrides?.mutationMode ?? 'strengthen-only',
    approval: {
      approvalKind: 'code-owner-review',
      reviewerRefDigest: overrides?.reviewerRefDigest === undefined
        ? digest0
        : overrides.reviewerRefDigest,
      approvalRefDigest: overrides?.approvalRefDigest === undefined
        ? digest4
        : overrides.approvalRefDigest,
      approvedAt: overrides?.approvedAt === undefined
        ? '2026-05-18T08:04:30.000Z'
        : overrides.approvedAt,
      reviewerIndependence: overrides?.reviewerIndependence ?? 'independent',
    },
    policyPatchRefDigest: overrides?.policyPatchRefDigest === undefined
      ? digest5
      : overrides.policyPatchRefDigest,
    rolloutPlanRefDigest: overrides?.rolloutPlanRefDigest === undefined
      ? digest6
      : overrides.rolloutPlanRefDigest,
    rollbackPlanRefDigest: overrides?.rollbackPlanRefDigest === undefined
      ? digestD
      : overrides.rollbackPlanRefDigest,
    autoPromotionRequested: overrides?.autoPromotionRequested ?? false,
    enforcementActivationRequested: overrides?.enforcementActivationRequested ?? false,
  });
}

function testDescriptorRecordsGateBoundary(): void {
  const descriptor = invariantPromotionGateDescriptor();

  equal(descriptor.version, INVARIANT_PROMOTION_GATE_VERSION, 'Invariant promotion: version is explicit');
  equal(descriptor.candidateInvariantsCatalogVersion, CANDIDATE_INVARIANTS_CATALOG_VERSION, 'Invariant promotion: binds candidate catalog');
  equal(descriptor.invariantCalibrationContractVersion, INVARIANT_CALIBRATION_CONTRACT_VERSION, 'Invariant promotion: binds calibration contract');
  ok(descriptor.requestedActions.includes('create-review-only-strengthening-patch'), 'Invariant promotion: review-only action exists');
  ok(descriptor.requestedActions.includes('activate-live-enforcement'), 'Invariant promotion: live enforcement request is representable for rejection');
  equal(descriptor.reviewerSignoffRequired, true, 'Invariant promotion: reviewer signoff required');
  equal(descriptor.independentReviewerRequired, true, 'Invariant promotion: independent reviewer required');
  equal(descriptor.calibrationReadyRequired, true, 'Invariant promotion: calibration required');
  equal(descriptor.policyPatchDigestRequired, true, 'Invariant promotion: patch digest required');
  equal(descriptor.rolloutPlanDigestRequired, true, 'Invariant promotion: rollout digest required');
  equal(descriptor.rollbackPlanDigestRequired, true, 'Invariant promotion: rollback digest required');
  equal(descriptor.noRelaxation, true, 'Invariant promotion: relaxation forbidden');
  equal(descriptor.noAutoPromotion, true, 'Invariant promotion: auto promotion forbidden');
  equal(descriptor.reviewOnlyPatchOnly, true, 'Invariant promotion: review-only patch only');
  equal(descriptor.grantsAuthority, false, 'Invariant promotion: descriptor grants no authority');
  equal(descriptor.canAdmit, false, 'Invariant promotion: descriptor cannot admit');
  equal(descriptor.activatesEnforcement, false, 'Invariant promotion: descriptor cannot enforce');
  equal(descriptor.productionReady, false, 'Invariant promotion: descriptor is not production readiness');
  ok(descriptor.nonClaims.includes('not-live-enforcement'), 'Invariant promotion: live enforcement is a non-claim');
}

function testReadyPromotionAllowsOnlyReviewPatch(): void {
  const decision = promotion();
  const evaluation = evaluateInvariantPromotionGate(decision);

  equal(decision.version, INVARIANT_PROMOTION_GATE_VERSION, 'Invariant promotion: decision version is explicit');
  equal(decision.outcome, 'promotion-ready-for-review-only-patch', 'Invariant promotion: clean request is ready for review-only patch');
  equal(decision.promotionAllowed, true, 'Invariant promotion: clean request can continue to review-only patch');
  equal(decision.reviewOnlyPatchAllowed, true, 'Invariant promotion: review-only patch is allowed');
  equal(decision.failClosed, false, 'Invariant promotion: clean request does not fail closed');
  equal(decision.strengtheningOnly, true, 'Invariant promotion: strengthening-only invariant preserved');
  equal(decision.autoPromote, false, 'Invariant promotion: no auto promotion');
  equal(decision.policyMutationAllowed, false, 'Invariant promotion: does not mutate policy');
  equal(decision.activatesEnforcement, false, 'Invariant promotion: does not activate enforcement');
  equal(decision.canAdmit, false, 'Invariant promotion: cannot admit');
  equal(decision.productionReady, false, 'Invariant promotion: not production readiness');
  equal(evaluation.promotionAllowed, true, 'Invariant promotion: evaluation preserves promotion readiness');
  equal(evaluation.policyMutationAllowed, false, 'Invariant promotion: evaluation cannot mutate policy');
  ok(decision.digest.startsWith('sha256:'), 'Invariant promotion: decision has digest');
  ok(evaluation.digest.startsWith('sha256:'), 'Invariant promotion: evaluation has digest');
}

function testReviewerPatchAndRolloutHolds(): void {
  const missingReviewer = promotion({
    reviewerRefDigest: null,
  });
  const notIndependent = promotion({
    reviewerIndependence: 'same-as-candidate-reviewer',
  });
  const missingPatch = promotion({
    policyPatchRefDigest: null,
  });
  const missingRollout = promotion({
    rolloutPlanRefDigest: null,
  });
  const missingRollback = promotion({
    rollbackPlanRefDigest: null,
  });

  equal(missingReviewer.outcome, 'held-for-reviewer-signoff', 'Invariant promotion: missing reviewer holds');
  ok(missingReviewer.dangerFlags.includes('missing-promotion-reviewer'), 'Invariant promotion: missing reviewer flag is explicit');
  equal(notIndependent.outcome, 'held-for-reviewer-signoff', 'Invariant promotion: non-independent reviewer holds');
  ok(notIndependent.dangerFlags.includes('reviewer-not-independent'), 'Invariant promotion: reviewer independence flag is explicit');
  equal(missingPatch.outcome, 'held-for-patch-evidence', 'Invariant promotion: missing patch holds');
  ok(missingPatch.dangerFlags.includes('missing-policy-patch-ref'), 'Invariant promotion: missing patch flag is explicit');
  equal(missingRollout.outcome, 'held-for-rollout-plan', 'Invariant promotion: missing rollout holds');
  ok(missingRollout.dangerFlags.includes('missing-rollout-plan'), 'Invariant promotion: missing rollout flag is explicit');
  equal(missingRollback.outcome, 'held-for-rollout-plan', 'Invariant promotion: missing rollback holds');
  ok(missingRollback.dangerFlags.includes('missing-rollback-plan'), 'Invariant promotion: missing rollback flag is explicit');
}

function testCandidateCalibrationAndRelaxationBoundaries(): void {
  const heldCandidate = candidate({
    reviewerRefDigest: null,
  });
  const candidateHold = promotion({
    invariant: heldCandidate,
    calibrated: calibration({ invariant: heldCandidate }),
  });
  const weakCalibrationInvariant = candidate();
  const calibrationHold = promotion({
    invariant: weakCalibrationInvariant,
    calibrated: calibration({
      invariant: weakCalibrationInvariant,
      sampleCount: 10,
      positiveLabelCount: 6,
      negativeLabelCount: 4,
    }),
  });
  const nonStrengthening = candidate({
    effect: 'measure-only',
  });
  const nonStrengtheningHold = promotion({
    invariant: nonStrengthening,
    calibrated: calibration({ invariant: nonStrengthening }),
  });
  const relaxation = promotion({
    requestedAction: 'relax-control',
    mutationMode: 'relaxation-requested',
  });

  equal(candidateHold.outcome, 'held-for-candidate-review', 'Invariant promotion: candidate not review-ready holds');
  ok(candidateHold.dangerFlags.includes('candidate-not-review-ready'), 'Invariant promotion: candidate hold flag is explicit');
  equal(calibrationHold.outcome, 'held-for-calibration', 'Invariant promotion: calibration not ready holds');
  ok(calibrationHold.dangerFlags.includes('calibration-not-ready'), 'Invariant promotion: calibration hold flag is explicit');
  equal(nonStrengtheningHold.outcome, 'held-for-candidate-review', 'Invariant promotion: non-strengthening candidate holds');
  ok(nonStrengtheningHold.dangerFlags.includes('non-strengthening-candidate-effect'), 'Invariant promotion: non-strengthening flag is explicit');
  equal(relaxation.outcome, 'rejected-relaxation', 'Invariant promotion: relaxation is rejected');
  ok(relaxation.dangerFlags.includes('relaxes-existing-control'), 'Invariant promotion: relaxation flag is explicit');
}

function testAutoAndLiveEnforcementRequestsReject(): void {
  const auto = promotion({
    requestedAction: 'auto-promote',
    autoPromotionRequested: true,
  });
  const live = promotion({
    requestedAction: 'activate-live-enforcement',
    enforcementActivationRequested: true,
  });

  equal(auto.outcome, 'rejected-auto-promotion', 'Invariant promotion: auto promotion is rejected');
  ok(auto.dangerFlags.includes('auto-promotion-requested'), 'Invariant promotion: auto promotion flag is explicit');
  equal(auto.promotionAllowed, false, 'Invariant promotion: auto promotion is not allowed');
  equal(live.outcome, 'rejected-live-enforcement', 'Invariant promotion: live enforcement is rejected');
  ok(live.dangerFlags.includes('live-enforcement-requested'), 'Invariant promotion: live enforcement flag is explicit');
  equal(live.activatesEnforcement, false, 'Invariant promotion: live request still cannot enforce');
}

function testCandidateCalibrationMismatchThrows(): void {
  const first = candidate();
  const second = candidate({
    reviewerRefDigest: digest0,
  });
  const calibrated = calibration({ invariant: second });

  throws(
    () => promotion({
      invariant: first,
      calibrated,
    }),
    /candidate and calibration record must bind the same invariant/u,
    'Invariant promotion: mismatched candidate/calibration pair is rejected',
  );
}

function testDocsAndOverviewRecordW12Scope(): void {
  const doc = readProjectFile(
    'docs',
    '02-architecture',
    'invariant-promotion-gate.md',
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
    '# Invariant Promotion Gate',
    'review-only strengthening patch',
    'no live enforcement',
    'no auto-promotion',
    'no relaxation',
    'independent reviewer',
    'rollout plan',
    'rollback plan',
    'not production readiness',
  ]) {
    includes(doc, expected, `Invariant promotion docs: records ${expected}`);
  }

  includes(overview, '| W12 | complete | Invariant Promotion Gate |', 'Overview: W12 is complete');
  includes(
    overview,
    'src/consequence-admission/invariant-promotion-gate.ts',
    'Overview: W12 implementation path is recorded',
  );
  assert.equal(
    packageJson.scripts['test:invariant-promotion-gate'],
    'tsx tests/invariant-promotion-gate.test.ts',
    'Invariant promotion: package script is registered',
  );
  passed += 1;
}

testDescriptorRecordsGateBoundary();
testReadyPromotionAllowsOnlyReviewPatch();
testReviewerPatchAndRolloutHolds();
testCandidateCalibrationAndRelaxationBoundaries();
testAutoAndLiveEnforcementRequestsReject();
testCandidateCalibrationMismatchThrows();
testDocsAndOverviewRecordW12Scope();

console.log(`Invariant promotion gate tests: ${passed} passed, 0 failed`);
