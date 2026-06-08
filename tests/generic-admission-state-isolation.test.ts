import {
  assert,
  baseMoneyAdmission,
  createGenericAdmissionEnvelope,
  equal,
  getPassedCount,
  markPassed,
  ok,
} from './generic-admission-mode-ladder/helpers.js';
import type { GenericAdmissionEnvelope } from '../src/consequence-admission/index.js';

const cleanRequest = {
  ...baseMoneyAdmission('enforce'),
  requestedAt: '2026-05-01T18:00:00.000Z',
  decidedAt: '2026-05-01T18:00:01.000Z',
  requestId: 'state-isolation:clean-refund',
};

function excludes<T>(values: readonly T[], value: T, message: string): void {
  assert.ok(!values.includes(value), message);
  markPassed();
}

function decisionProjection(envelope: GenericAdmissionEnvelope): Record<string, unknown> {
  return {
    mode: envelope.mode,
    shadowDecision: envelope.shadowDecision,
    downstreamPosture: envelope.downstreamPosture,
    enforcementActive: envelope.enforcementActive,
    admissionId: envelope.admission.admissionId,
    admissionDigest: envelope.admission.digest,
    requestId: envelope.admission.request.requestId,
    decision: envelope.admission.decision,
    allowed: envelope.admission.allowed,
    failClosed: envelope.admission.failClosed,
    reasonCodes: envelope.admission.reasonCodes,
    proofDigests: envelope.admission.proof.map((proof) => proof.digest),
    proofKinds: envelope.admission.proof.map((proof) => proof.kind),
    checkOutcomes: envelope.admission.checks.map((check) => [
      check.kind,
      check.outcome,
      check.reasonCodes,
    ]),
    retry: envelope.admission.retry,
    operationalContext: envelope.admission.operationalContext,
  };
}

function noisyReviewRequest(): GenericAdmissionEnvelope {
  return createGenericAdmissionEnvelope({
    ...baseMoneyAdmission('review'),
    requestedAt: '2026-05-01T18:01:00.000Z',
    decidedAt: '2026-05-01T18:01:01.000Z',
    requestId: 'state-isolation:noisy-review',
    policyRef: null,
    evidenceRefs: [],
    authoritySources: [],
    approvals: [],
    observedFeatures: {
      blocked: true,
      policyBlocked: true,
      unsafe: true,
    },
  });
}

function observeRequest(): GenericAdmissionEnvelope {
  return createGenericAdmissionEnvelope({
    ...baseMoneyAdmission('observe'),
    requestedAt: '2026-05-01T18:02:00.000Z',
    decidedAt: '2026-05-01T18:02:01.000Z',
    requestId: 'state-isolation:observe-refund',
  });
}

function testCleanAdmissionIsStableAfterNoisyAdmission(): void {
  const before = createGenericAdmissionEnvelope(cleanRequest);
  const noisy = noisyReviewRequest();
  const after = createGenericAdmissionEnvelope(cleanRequest);

  equal(noisy.admission.decision, 'review', 'Generic admission state isolation: noisy request is held');
  ok(
    noisy.admission.reasonCodes.includes('policy-ref-missing'),
    'Generic admission state isolation: noisy request records policy gap',
  );
  ok(
    noisy.admission.reasonCodes.includes('authority-source-missing'),
    'Generic admission state isolation: noisy request records authority-source gap',
  );
  ok(
    noisy.admission.reasonCodes.includes('feature-blocked'),
    'Generic admission state isolation: noisy request records blocked feature signal',
  );

  assert.deepEqual(
    decisionProjection(after),
    decisionProjection(before),
    'Generic admission state isolation: fixed clean input remains deterministic after noisy input',
  );
  markPassed();
  excludes(
    after.admission.reasonCodes,
    'policy-ref-missing',
    'Generic admission state isolation: policy gap does not leak into clean request',
  );
  excludes(
    after.admission.reasonCodes,
    'authority-source-missing',
    'Generic admission state isolation: authority gap does not leak into clean request',
  );
  excludes(
    after.admission.reasonCodes,
    'feature-blocked',
    'Generic admission state isolation: feature block does not leak into clean request',
  );
  excludes(
    after.admission.reasonCodes,
    'feature-unsafe',
    'Generic admission state isolation: unsafe feature signal does not leak into clean request',
  );
}

function testObserveModeDoesNotLeakIntoEnforceMode(): void {
  const observed = observeRequest();
  const enforced = createGenericAdmissionEnvelope(cleanRequest);

  equal(
    observed.admission.operationalContext.nonEnforcingMode,
    true,
    'Generic admission state isolation: observe request marks non-enforcing mode',
  );
  ok(
    observed.admission.reasonCodes.includes('non-enforcing-mode'),
    'Generic admission state isolation: observe request records non-enforcing reason',
  );
  equal(
    enforced.admission.operationalContext.nonEnforcingMode,
    false,
    'Generic admission state isolation: enforce request is not marked non-enforcing',
  );
  equal(
    enforced.downstreamPosture,
    'enforce-decision',
    'Generic admission state isolation: enforce request keeps enforcing posture',
  );
  excludes(
    enforced.admission.reasonCodes,
    'non-enforcing-mode',
    'Generic admission state isolation: observe reason does not leak into enforce request',
  );
}

const start = getPassedCount();

testCleanAdmissionIsStableAfterNoisyAdmission();
testObserveModeDoesNotLeakIntoEnforceMode();

console.log(`Generic admission state isolation tests: ${getPassedCount() - start} passed, 0 failed`);
