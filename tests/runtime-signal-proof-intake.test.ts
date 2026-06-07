import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  RUNTIME_SIGNAL_PROOF_INTAKE_VERSION,
  createRuntimeSignalEnvelope,
  createRuntimeSignalProofIntake,
  runtimeSignalProofIntakeDescriptor,
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

function includes<T>(values: readonly T[] | string, expected: T | string, message: string): void {
  if (typeof values === 'string' && typeof expected === 'string') {
    assert.ok(values.includes(expected), `${message}\nExpected to find: ${expected}`);
  } else {
    assert.ok(
      (values as readonly T[]).includes(expected as T),
      `${message}\nExpected to find: ${String(expected)}`,
    );
  }
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
const eventTime = '2026-05-18T09:30:00Z';
const traceId = '4bf92f3577b34da6a3ce929d0e0e4736';

function proofEnvelope(overrides: Partial<Parameters<typeof createRuntimeSignalEnvelope>[0]> = {}) {
  return createRuntimeSignalEnvelope({
    signalKind: 'enforcement-proof',
    sourceTrustLevel: 'enforcement-proof',
    sourceSystem: 'pep.customer-gate',
    tenantRefDigest: digestA,
    actorRefDigest: digestB,
    runtimeRef: 'pep:data-export',
    traceId,
    runId: 'run-proof-001',
    eventTime,
    actionSurface: 'data-export',
    downstreamSystem: 'export-service',
    operationRef: 'pep.receipt:data-export',
    inputSchemaDigest: digestC,
    argumentOrBodyDigest: digestD,
    policyRefs: ['policy:data-export.v1'],
    evidenceRefs: ['proof:pep-receipt.v1', 'receipt:downstream-execution.v1'],
    approvalRefs: ['approval:manager.v1'],
    ...overrides,
  });
}

function testDescriptorPreservesProofBoundary(): void {
  const descriptor = runtimeSignalProofIntakeDescriptor();

  equal(descriptor.version, RUNTIME_SIGNAL_PROOF_INTAKE_VERSION, 'Runtime signal proof intake: descriptor version is explicit');
  equal(descriptor.proofSignalsOnly, true, 'Runtime signal proof intake: descriptor accepts only proof signals');
  equal(descriptor.acceptsOnlySignalKind, 'enforcement-proof', 'Runtime signal proof intake: descriptor names proof signal kind');
  equal(descriptor.acceptsOnlySourceTrustLevel, 'enforcement-proof', 'Runtime signal proof intake: descriptor names proof trust level');
  equal(descriptor.telemetryAcceptedAsProof, false, 'Runtime signal proof intake: telemetry is not accepted as proof');
  equal(descriptor.metadataAcceptedAsProof, false, 'Runtime signal proof intake: metadata is not accepted as proof');
  equal(descriptor.canAdmit, false, 'Runtime signal proof intake: descriptor cannot admit');
  equal(descriptor.activatesEnforcement, false, 'Runtime signal proof intake: descriptor cannot activate enforcement');
  equal(descriptor.productionReady, false, 'Runtime signal proof intake: descriptor is not production readiness');
  includes(descriptor.proofKinds, 'customer-gate-receipt', 'Runtime signal proof intake: customer gate proof kind is registered');
  includes(descriptor.proofKinds, 'no-bypass-probe-result', 'Runtime signal proof intake: no-bypass proof kind is registered');
  includes(descriptor.requiredBindings, 'argumentOrBodyDigest', 'Runtime signal proof intake: body digest binding is required');
}

function testPepReceiptCanBecomeProofPacketMaterialOnly(): void {
  const intake = createRuntimeSignalProofIntake({
    envelope: proofEnvelope(),
    generatedAt: eventTime,
    intakeScope: 'rs10-proof-intake',
  });

  equal(intake.proofKind, 'downstream-execution-receipt', 'Runtime signal proof intake: downstream receipt is classified');
  equal(intake.status, 'proof-packet-material-ready', 'Runtime signal proof intake: complete receipt is packet material ready');
  equal(intake.proofPacketMaterialReady, true, 'Runtime signal proof intake: complete receipt can feed proof packet material');
  equal(intake.correlation?.tenantRefDigest, digestA, 'Runtime signal proof intake: tenant digest stays bound');
  equal(intake.correlation?.argumentOrBodyDigest, digestD, 'Runtime signal proof intake: body digest stays bound');
  equal(intake.canAdmit, false, 'Runtime signal proof intake: ready proof material still cannot admit');
  equal(intake.activatesEnforcement, false, 'Runtime signal proof intake: ready proof material still cannot activate enforcement');
  equal(intake.externalVerificationClaimed, false, 'Runtime signal proof intake: intake does not claim external verification');
  ok(intake.digest.startsWith('sha256:'), 'Runtime signal proof intake: digest is present');
}

function testNoBypassProbeAndReplayKindsStaySeparated(): void {
  const noBypass = createRuntimeSignalProofIntake({
    envelope: proofEnvelope({
      sourceSystem: 'probe.no-bypass',
      operationRef: 'probe:no-bypass:data-export',
      evidenceRefs: ['proof:no-bypass-probe.v1'],
    }),
  });
  const replay = createRuntimeSignalProofIntake({
    envelope: proofEnvelope({
      sourceSystem: 'ledger.replay',
      operationRef: 'replay.ledger:consume',
      evidenceRefs: ['receipt:replay-ledger-consumed.v1'],
    }),
  });

  equal(noBypass.proofKind, 'no-bypass-probe-result', 'Runtime signal proof intake: no-bypass probe kind is distinct');
  equal(replay.proofKind, 'replay-ledger-consumption', 'Runtime signal proof intake: replay ledger kind is distinct');
  equal(noBypass.proofPacketMaterialReady, true, 'Runtime signal proof intake: no-bypass proof can be packet material when bound');
  equal(replay.proofPacketMaterialReady, true, 'Runtime signal proof intake: replay proof can be packet material when bound');
}

function testNonProofSignalsFailClosed(): void {
  const observation = createRuntimeSignalEnvelope({
    signalKind: 'observation',
    sourceTrustLevel: 'observed',
    sourceSystem: 'otel.collector',
    tenantRefDigest: digestA,
    actorRefDigest: digestB,
    runtimeRef: 'workflow:export-runner',
    traceId,
    runId: 'run-observed-001',
    eventTime,
    actionSurface: 'data-export',
    downstreamSystem: 'export-service',
    operationRef: 'POST /api/v1/exports#createExport',
    inputSchemaDigest: digestC,
    argumentOrBodyDigest: digestD,
    evidenceRefs: ['evidence:span.v1'],
  });

  throws(
    () => createRuntimeSignalProofIntake({ envelope: observation }),
    /only accepts enforcement-proof signals/u,
    'Runtime signal proof intake: observation signals fail closed',
  );
}

function testMissingBindingsHoldProofMaterial(): void {
  const missingBody = createRuntimeSignalProofIntake({
    envelope: proofEnvelope({ argumentOrBodyDigest: null }),
  });
  const missingTenant = createRuntimeSignalProofIntake({
    envelope: proofEnvelope({ tenantRefDigest: null }),
  });
  const metadataOnly = createRuntimeSignalProofIntake({
    envelope: proofEnvelope({
      sourceSystem: 'metadata.catalog',
      runtimeRef: 'metadata:catalog',
      operationRef: 'metadata:catalog',
      evidenceRefs: ['evidence:export-schema.v1'],
    }),
  });

  equal(missingBody.proofPacketMaterialReady, false, 'Runtime signal proof intake: missing body digest is held');
  includes(missingBody.blockerReasons, 'body-digest-binding-missing', 'Runtime signal proof intake: missing body digest reason is explicit');
  equal(missingTenant.proofPacketMaterialReady, false, 'Runtime signal proof intake: missing tenant is held');
  includes(missingTenant.blockerReasons, 'tenant-binding-missing', 'Runtime signal proof intake: missing tenant reason is explicit');
  equal(metadataOnly.proofPacketMaterialReady, false, 'Runtime signal proof intake: metadata-only evidence is held');
  includes(metadataOnly.blockerReasons, 'proof-evidence-ref-missing', 'Runtime signal proof intake: proof evidence ref is required');
  includes(metadataOnly.blockerReasons, 'proof-kind-unclassified', 'Runtime signal proof intake: unknown proof kind is held');
}

function testDocsPackageAndProbeStayAligned(): void {
  const doc = readProjectFile(
    'docs',
    '02-architecture',
    'runtime-signal-handling.md',
  );
  const packageJson = JSON.parse(readProjectFile('package.json')) as {
    readonly scripts: Readonly<Record<string, string>>;
  };
  const packageProbe = readProjectFile(
    'scripts',
    'probe',
    'probe-consequence-admission-package-surface.mjs',
  );

  includes(doc, 'RS10 Proof Intake', 'Runtime signal proof intake: architecture note names RS10');
  includes(doc, 'attestor.runtime-signal-proof-intake.v1', 'Runtime signal proof intake: architecture note records version');
  equal(
    packageJson.scripts['test:runtime-signal-proof-intake'],
    'tsx tests/runtime-signal-proof-intake.test.ts',
    'Runtime signal proof intake: package script is registered',
  );
  includes(
    packageProbe,
    'RUNTIME_SIGNAL_PROOF_INTAKE_VERSION',
    'Runtime signal proof intake: package surface probe covers version export',
  );
  includes(
    packageProbe,
    'createRuntimeSignalProofIntake',
    'Runtime signal proof intake: package surface probe covers intake export',
  );
}

testDescriptorPreservesProofBoundary();
testPepReceiptCanBecomeProofPacketMaterialOnly();
testNoBypassProbeAndReplayKindsStaySeparated();
testNonProofSignalsFailClosed();
testMissingBindingsHoldProofMaterial();
testDocsPackageAndProbeStayAligned();

console.log(`Runtime signal proof intake tests: ${passed} passed, 0 failed`);
