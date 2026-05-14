import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  CONSEQUENCE_ADMISSION_CONSTRAINT_KINDS,
  consequenceAdmissionDescriptor,
  consequenceAdmissionDownstreamContractDescriptor,
  createConsequenceAdmissionDownstreamContract,
  createConsequenceAdmissionRequest,
  createConsequenceAdmissionResponse,
  evaluateConsequenceAdmissionDownstreamContract,
} from '../src/consequence-admission/index.js';

let passed = 0;

function ok(condition: unknown, message: string): void {
  assert.ok(condition, message);
  passed += 1;
}

function equal<T>(actual: T, expected: T, message: string): void {
  assert.equal(actual, expected, message);
  passed += 1;
}

function includes(value: string, expected: string, message: string): void {
  assert.ok(value.includes(expected), `${message}\nExpected to include: ${expected}`);
  passed += 1;
}

function excludes(value: string, unexpected: string, message: string): void {
  assert.ok(!value.includes(unexpected), `${message}\nUnexpected content: ${unexpected}`);
  passed += 1;
}

function throws(fn: () => unknown, pattern: RegExp, message: string): void {
  assert.throws(fn, pattern, message);
  passed += 1;
}

function readProjectFile(...segments: string[]): string {
  return readFileSync(join(process.cwd(), ...segments), 'utf8');
}

function sha256(value: string): string {
  return `sha256:${createHash('sha256').update(value).digest('hex')}`;
}

function requestFixture() {
  return createConsequenceAdmissionRequest({
    requestedAt: '2026-05-10T10:00:00.000Z',
    packFamily: 'general',
    entryPoint: {
      kind: 'internal-service',
      id: 'refund-gate',
      route: null,
      packageSubpath: null,
      sourceRef: 'customer/refund-adapter',
    },
    proposedConsequence: {
      actor: 'support-agent',
      action: 'issue refund',
      downstreamSystem: 'refund-service',
      consequenceKind: 'agent-payment',
      riskClass: 'R3',
      summary: 'Support agent requests a bounded refund.',
    },
    policyScope: {
      policyRef: 'policy:refunds:v1',
      tenantId: 'tenant_refunds',
      environment: 'production',
      dimensions: {
        domain: 'refund',
      },
    },
    authority: {
      actorRef: 'actor:support-agent',
      reviewerRef: 'reviewer:finance-ops',
      authorityMode: 'named-reviewer',
    },
    evidence: [
      {
        id: 'evidence:order',
        kind: 'order-record',
        digest: sha256('order-123'),
        uri: null,
      },
    ],
  });
}

function testRegistryIsExposed(): void {
  const descriptor = consequenceAdmissionDescriptor();
  const downstreamDescriptor = consequenceAdmissionDownstreamContractDescriptor();

  for (const kind of [
    'max-amount',
    'recipient-allowlist',
    'customer-approved-scope',
    'custom',
  ] as const) {
    ok(
      CONSEQUENCE_ADMISSION_CONSTRAINT_KINDS.includes(kind),
      `Constraint registry: ${kind} is canonical`,
    );
    ok(
      descriptor.constraintKinds.includes(kind),
      `Admission descriptor: ${kind} is exposed`,
    );
    ok(
      downstreamDescriptor.constraintKinds.includes(kind),
      `Downstream descriptor: ${kind} is exposed`,
    );
  }
}

function testLegacyShapeNormalizesToMachineReadableKind(): void {
  const admission = createConsequenceAdmissionResponse({
    request: requestFixture(),
    decidedAt: '2026-05-10T10:00:01.000Z',
    decision: 'narrow',
    reason: 'Refund may proceed below the maximum amount.',
    reasonCodes: ['refund-narrowed'],
    constraints: [
      {
        id: 'constraint:max-amount',
        summary: 'private-policy-threshold: refund must not exceed 40 USD.',
        enforcedBy: 'refund-service',
      },
    ],
    proof: [
      {
        kind: 'release-token',
        id: 'rt_refund_001',
        digest: sha256('rt_refund_001'),
        uri: null,
        verifyHint: 'Verify the release token before issuing the refund.',
      },
    ],
  });

  equal(admission.constraints[0]?.kind, 'max-amount', 'Constraint registry: legacy max amount id infers kind');
  equal(admission.constraints[0]?.parameterDigest, null, 'Constraint registry: absent parameter digest normalizes to null');
}

function testExplicitKindAndParameterDigestFlowToDownstreamRefs(): void {
  const parameterDigest = sha256('recipient-allowlist:refund-service:tenant_refunds');
  const rawConstraintSummary = 'private-recipient-set: only customer payment instrument may receive funds.';
  const rawConstraintId = 'constraint:recipient:refund-service';
  const admission = createConsequenceAdmissionResponse({
    request: requestFixture(),
    decidedAt: '2026-05-10T10:00:02.000Z',
    decision: 'narrow',
    reason: 'Refund may proceed only to an allowed recipient.',
    reasonCodes: ['refund-recipient-narrowed'],
    constraints: [
      {
        id: rawConstraintId,
        kind: 'recipient-allowlist',
        summary: rawConstraintSummary,
        enforcedBy: 'refund-service',
        parameterDigest,
      },
    ],
    proof: [
      {
        kind: 'release-token',
        id: 'rt_refund_002',
        digest: sha256('rt_refund_002'),
        uri: null,
        verifyHint: 'Verify the release token before issuing the refund.',
      },
    ],
  });
  const contract = createConsequenceAdmissionDownstreamContract({
    enforcementPointId: 'payment-adapter:refund-service',
    boundaryKind: 'payment-adapter',
    consequenceDomain: 'money-movement',
    downstreamSystems: ['refund-service'],
    acceptedConsequenceKinds: ['agent-payment'],
    acceptedRiskClasses: ['R3'],
    policyRefs: ['policy:refunds:v1'],
  });
  const decision = evaluateConsequenceAdmissionDownstreamContract({
    admission,
    contract,
    observation: {
      idempotencyKey: 'idem:refund:001',
      acceptedConstraintIds: [rawConstraintId],
    },
  });
  const serialized = JSON.stringify(decision);

  equal(decision.outcome, 'allow', 'Constraint registry: acknowledged narrow constraint allows downstream action');
  equal(decision.constraintRefs[0]?.kind, 'recipient-allowlist', 'Downstream ref: carries machine-readable kind');
  equal(decision.constraintRefs[0]?.parameterDigest, parameterDigest, 'Downstream ref: carries parameter digest');
  ok(
    decision.constraintRefs[0]?.constraintDigest.startsWith('sha256:'),
    'Downstream ref: carries canonical constraint digest',
  );
  excludes(serialized, rawConstraintSummary, 'Downstream ref: omits raw constraint summary');
  excludes(serialized, rawConstraintId, 'Downstream ref: omits raw constraint id');
}

function testInvalidParameterDigestFailsClosed(): void {
  throws(
    () =>
      createConsequenceAdmissionResponse({
        request: requestFixture(),
        decidedAt: '2026-05-10T10:00:03.000Z',
        decision: 'narrow',
        reason: 'Refund may proceed only to an allowed recipient.',
        reasonCodes: ['refund-recipient-narrowed'],
        constraints: [
          {
            id: 'constraint:recipient:refund-service',
            kind: 'recipient-allowlist',
            summary: 'Proceed only to a verified recipient.',
            enforcedBy: 'refund-service',
            parameterDigest: 'sha256:not-a-real-digest',
          },
        ],
        proof: [
          {
            kind: 'release-token',
            id: 'rt_refund_003',
            digest: sha256('rt_refund_003'),
            uri: null,
            verifyHint: 'Verify the release token before issuing the refund.',
          },
        ],
      }),
    /parameterDigest must be a sha256 digest/u,
    'Constraint registry: invalid parameter digest fails closed',
  );
}

function testDocsTrackerAndPackageAreAligned(): void {
  const validationDoc = readProjectFile('docs', 'audit', 'f2-constraint-kind-registry-validation.md');
  const tracker = readProjectFile('docs', 'audit', 'attestor-audit-remediation-tracker.md');
  const packageJson = readProjectFile('package.json');

  includes(validationDoc, 'Status: repository-side `fixed`', 'Validation doc: fixed status is explicit');
  includes(validationDoc, 'CONSEQUENCE_ADMISSION_CONSTRAINT_KINDS', 'Validation doc: registry is named');
  includes(validationDoc, 'This is not a production downstream-enforcement guarantee.', 'Validation doc: no production overclaim');
  includes(tracker, 'F2-AG-9 free-text narrow constraints | `fixed`', 'Tracker: F2-AG-9 is fixed');
  includes(tracker, 'test:f2-constraint-kind-registry-validation', 'Tracker: focused test is referenced');
  includes(packageJson, '"test:f2-constraint-kind-registry-validation"', 'Package: focused test script is exposed');
}

try {
  testRegistryIsExposed();
  testLegacyShapeNormalizesToMachineReadableKind();
  testExplicitKindAndParameterDigestFlowToDownstreamRefs();
  testInvalidParameterDigestFailsClosed();
  testDocsTrackerAndPackageAreAligned();
  console.log(`F2 constraint kind registry validation tests: ${passed} passed, 0 failed`);
} catch (error) {
  console.error('F2 constraint kind registry validation tests failed:', error);
  process.exitCode = 1;
}
