import { createHash } from 'node:crypto';
import {
  canonicalizeReleaseJson,
  type CanonicalReleaseJsonValue,
} from '../release-kernel/release-canonicalization.js';
import {
  RUNTIME_SIGNAL_AUTHORITY_GUARD_VERSION,
  assertRuntimeSignalAuthorityBoundary,
} from './runtime-signal-authority-guard.js';
import {
  RUNTIME_SIGNAL_ENVELOPE_VERSION,
  type RuntimeSignalEnvelope,
} from './runtime-signal-envelope.js';

export const RUNTIME_SIGNAL_PROOF_INTAKE_VERSION =
  'attestor.runtime-signal-proof-intake.v1';

export const RUNTIME_SIGNAL_PROOF_INTAKE_KINDS = [
  'pep-verification-receipt',
  'customer-gate-receipt',
  'no-bypass-probe-result',
  'replay-ledger-consumption',
  'downstream-execution-receipt',
  'release-enforcement-receipt',
  'unknown-proof',
] as const;
export type RuntimeSignalProofIntakeKind =
  typeof RUNTIME_SIGNAL_PROOF_INTAKE_KINDS[number];

export const RUNTIME_SIGNAL_PROOF_INTAKE_REQUIRED_BINDINGS = [
  'tenantRefDigest',
  'actorRefDigest',
  'runtime-correlation',
  'actionSurface',
  'downstreamSystem',
  'operationRef',
  'inputSchemaDigest',
  'argumentOrBodyDigest',
  'proofEvidenceRefs',
] as const;
export type RuntimeSignalProofIntakeRequiredBinding =
  typeof RUNTIME_SIGNAL_PROOF_INTAKE_REQUIRED_BINDINGS[number];

export const RUNTIME_SIGNAL_PROOF_INTAKE_BLOCKERS = [
  'tenant-binding-missing',
  'actor-binding-missing',
  'runtime-correlation-missing',
  'action-surface-missing',
  'downstream-system-missing',
  'operation-ref-missing',
  'input-schema-digest-missing',
  'body-digest-binding-missing',
  'proof-evidence-ref-missing',
  'proof-kind-unclassified',
] as const;
export type RuntimeSignalProofIntakeBlocker =
  typeof RUNTIME_SIGNAL_PROOF_INTAKE_BLOCKERS[number];

export type RuntimeSignalProofIntakeStatus =
  | 'proof-packet-material-ready'
  | 'held';

export interface CreateRuntimeSignalProofIntakeInput {
  readonly envelope: RuntimeSignalEnvelope;
  readonly generatedAt?: string | null;
  readonly intakeScope?: string | null;
}

export interface RuntimeSignalProofIntakeBindingStatus {
  readonly tenantBound: boolean;
  readonly actorBound: boolean;
  readonly runtimeCorrelated: boolean;
  readonly actionSurfaceBound: boolean;
  readonly downstreamSystemBound: boolean;
  readonly operationBound: boolean;
  readonly inputSchemaBound: boolean;
  readonly bodyDigestBound: boolean;
  readonly proofEvidenceBound: boolean;
}

export interface RuntimeSignalProofIntakeCorrelation {
  readonly tenantRefDigest: string;
  readonly actorRefDigest: string;
  readonly runtimeRef: string | null;
  readonly traceId: string | null;
  readonly runId: string | null;
  readonly actionSurface: string;
  readonly downstreamSystem: string;
  readonly operationRef: string;
  readonly inputSchemaDigest: string;
  readonly argumentOrBodyDigest: string;
}

export interface RuntimeSignalProofIntake {
  readonly version: typeof RUNTIME_SIGNAL_PROOF_INTAKE_VERSION;
  readonly runtimeSignalEnvelopeVersion: typeof RUNTIME_SIGNAL_ENVELOPE_VERSION;
  readonly runtimeSignalAuthorityGuardVersion: typeof RUNTIME_SIGNAL_AUTHORITY_GUARD_VERSION;
  readonly generatedAt: string;
  readonly intakeScope: string;
  readonly sourceSignalDigest: string;
  readonly sourceSystem: string;
  readonly proofKind: RuntimeSignalProofIntakeKind;
  readonly status: RuntimeSignalProofIntakeStatus;
  readonly proofPacketMaterialReady: boolean;
  readonly proofSignalsOnly: true;
  readonly proofEvidenceRefs: readonly string[];
  readonly missingBindings: readonly RuntimeSignalProofIntakeRequiredBinding[];
  readonly blockerReasons: readonly RuntimeSignalProofIntakeBlocker[];
  readonly bindingStatus: RuntimeSignalProofIntakeBindingStatus;
  readonly correlation: RuntimeSignalProofIntakeCorrelation | null;
  readonly digestOnly: true;
  readonly telemetryAcceptedAsProof: false;
  readonly metadataAcceptedAsProof: false;
  readonly proofIntakeOnly: true;
  readonly externalVerificationClaimed: false;
  readonly grantsAuthority: false;
  readonly canGrantAuthority: false;
  readonly canAdmit: false;
  readonly activatesEnforcement: false;
  readonly autoEnforce: false;
  readonly productionReady: false;
  readonly outputIsDecisionSupportOnly: true;
  readonly canonical: string;
  readonly digest: string;
}

export interface RuntimeSignalProofIntakeDescriptor {
  readonly version: typeof RUNTIME_SIGNAL_PROOF_INTAKE_VERSION;
  readonly runtimeSignalEnvelopeVersion: typeof RUNTIME_SIGNAL_ENVELOPE_VERSION;
  readonly runtimeSignalAuthorityGuardVersion: typeof RUNTIME_SIGNAL_AUTHORITY_GUARD_VERSION;
  readonly proofKinds: typeof RUNTIME_SIGNAL_PROOF_INTAKE_KINDS;
  readonly requiredBindings: typeof RUNTIME_SIGNAL_PROOF_INTAKE_REQUIRED_BINDINGS;
  readonly blockers: typeof RUNTIME_SIGNAL_PROOF_INTAKE_BLOCKERS;
  readonly proofSignalsOnly: true;
  readonly acceptsOnlySignalKind: 'enforcement-proof';
  readonly acceptsOnlySourceTrustLevel: 'enforcement-proof';
  readonly digestOnly: true;
  readonly telemetryAcceptedAsProof: false;
  readonly metadataAcceptedAsProof: false;
  readonly proofIntakeOnly: true;
  readonly externalVerificationClaimed: false;
  readonly grantsAuthority: false;
  readonly canGrantAuthority: false;
  readonly canAdmit: false;
  readonly activatesEnforcement: false;
  readonly autoEnforce: false;
  readonly productionReady: false;
  readonly outputIsDecisionSupportOnly: true;
  readonly nonClaims: readonly string[];
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

function normalizeIsoTimestamp(
  value: string | null | undefined,
  fallback: string,
): string {
  const raw = value ?? fallback;
  const timestamp = new Date(raw);
  if (Number.isNaN(timestamp.getTime())) {
    throw new Error('Runtime signal proof intake generatedAt must be an ISO timestamp.');
  }
  return timestamp.toISOString();
}

function normalizeIntakeScope(value: string | null | undefined): string {
  const normalized = value?.trim();
  if (!normalized) return 'runtime-signal-proof-intake';
  if (!/^[a-z0-9][a-z0-9_.:-]{2,127}$/u.test(normalized)) {
    throw new Error('Runtime signal proof intake intakeScope must be a stable lowercase id.');
  }
  return normalized;
}

function hasValue(value: string | null): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

function proofSearchText(envelope: RuntimeSignalEnvelope): string {
  return [
    envelope.sourceSystem,
    envelope.runtimeRef,
    envelope.operationRef,
    ...envelope.evidenceRefs,
  ]
    .filter((value): value is string => typeof value === 'string')
    .join(' ')
    .toLowerCase();
}

function classifyProofKind(envelope: RuntimeSignalEnvelope): RuntimeSignalProofIntakeKind {
  const text = proofSearchText(envelope);
  if (/(?:no[-_.:]?bypass|direct[-_.:]?call[-_.:]?deny|bypass[-_.:]?probe)/u.test(text)) {
    return 'no-bypass-probe-result';
  }
  if (/(?:replay|ledger|consum)/u.test(text)) {
    return 'replay-ledger-consumption';
  }
  if (/(?:downstream|execution[-_.:]?receipt|external[-_.:]?receipt)/u.test(text)) {
    return 'downstream-execution-receipt';
  }
  if (/(?:release[-_.:]?enforcement|presentation|introspection)/u.test(text)) {
    return 'release-enforcement-receipt';
  }
  if (/(?:customer[-_.:]?gate|customer[-_.:]?pep|gate[-_.:]?receipt)/u.test(text)) {
    return 'customer-gate-receipt';
  }
  if (/(?:pep|ext[-_.:]?authz|authorizer|verifier|receipt)/u.test(text)) {
    return 'pep-verification-receipt';
  }
  return 'unknown-proof';
}

function isProofEvidenceRef(ref: string): boolean {
  return /(?:proof|receipt|pep|gate|probe|replay|ledger|downstream|execution|verifier|introspection|presentation|no[-_.:]?bypass)/u
    .test(ref);
}

function proofEvidenceRefs(envelope: RuntimeSignalEnvelope): readonly string[] {
  return Object.freeze(envelope.evidenceRefs.filter(isProofEvidenceRef));
}

function bindingStatusFor(
  envelope: RuntimeSignalEnvelope,
  refs: readonly string[],
): RuntimeSignalProofIntakeBindingStatus {
  return Object.freeze({
    tenantBound: hasValue(envelope.tenantRefDigest),
    actorBound: hasValue(envelope.actorRefDigest),
    runtimeCorrelated: hasValue(envelope.runtimeRef) ||
      hasValue(envelope.traceId) ||
      hasValue(envelope.runId),
    actionSurfaceBound: hasValue(envelope.actionSurface),
    downstreamSystemBound: hasValue(envelope.downstreamSystem),
    operationBound: hasValue(envelope.operationRef),
    inputSchemaBound: hasValue(envelope.inputSchemaDigest),
    bodyDigestBound: hasValue(envelope.argumentOrBodyDigest),
    proofEvidenceBound: refs.length > 0,
  });
}

function missingBindingsFor(
  bindingStatus: RuntimeSignalProofIntakeBindingStatus,
): readonly RuntimeSignalProofIntakeRequiredBinding[] {
  const missing: RuntimeSignalProofIntakeRequiredBinding[] = [];
  if (!bindingStatus.tenantBound) missing.push('tenantRefDigest');
  if (!bindingStatus.actorBound) missing.push('actorRefDigest');
  if (!bindingStatus.runtimeCorrelated) missing.push('runtime-correlation');
  if (!bindingStatus.actionSurfaceBound) missing.push('actionSurface');
  if (!bindingStatus.downstreamSystemBound) missing.push('downstreamSystem');
  if (!bindingStatus.operationBound) missing.push('operationRef');
  if (!bindingStatus.inputSchemaBound) missing.push('inputSchemaDigest');
  if (!bindingStatus.bodyDigestBound) missing.push('argumentOrBodyDigest');
  if (!bindingStatus.proofEvidenceBound) missing.push('proofEvidenceRefs');
  return Object.freeze(missing);
}

function blockersFor(input: {
  readonly missingBindings: readonly RuntimeSignalProofIntakeRequiredBinding[];
  readonly proofKind: RuntimeSignalProofIntakeKind;
}): readonly RuntimeSignalProofIntakeBlocker[] {
  const blockers = new Set<RuntimeSignalProofIntakeBlocker>();
  for (const missing of input.missingBindings) {
    switch (missing) {
      case 'tenantRefDigest':
        blockers.add('tenant-binding-missing');
        break;
      case 'actorRefDigest':
        blockers.add('actor-binding-missing');
        break;
      case 'runtime-correlation':
        blockers.add('runtime-correlation-missing');
        break;
      case 'actionSurface':
        blockers.add('action-surface-missing');
        break;
      case 'downstreamSystem':
        blockers.add('downstream-system-missing');
        break;
      case 'operationRef':
        blockers.add('operation-ref-missing');
        break;
      case 'inputSchemaDigest':
        blockers.add('input-schema-digest-missing');
        break;
      case 'argumentOrBodyDigest':
        blockers.add('body-digest-binding-missing');
        break;
      case 'proofEvidenceRefs':
        blockers.add('proof-evidence-ref-missing');
        break;
    }
  }
  if (input.proofKind === 'unknown-proof') {
    blockers.add('proof-kind-unclassified');
  }
  return Object.freeze(
    RUNTIME_SIGNAL_PROOF_INTAKE_BLOCKERS.filter((blocker) =>
      blockers.has(blocker),
    ),
  );
}

function correlationFor(
  envelope: RuntimeSignalEnvelope,
  bindingStatus: RuntimeSignalProofIntakeBindingStatus,
): RuntimeSignalProofIntakeCorrelation | null {
  if (
    !bindingStatus.tenantBound ||
    !bindingStatus.actorBound ||
    !bindingStatus.actionSurfaceBound ||
    !bindingStatus.downstreamSystemBound ||
    !bindingStatus.operationBound ||
    !bindingStatus.inputSchemaBound ||
    !bindingStatus.bodyDigestBound
  ) {
    return null;
  }
  return Object.freeze({
    tenantRefDigest: envelope.tenantRefDigest as string,
    actorRefDigest: envelope.actorRefDigest as string,
    runtimeRef: envelope.runtimeRef,
    traceId: envelope.traceId,
    runId: envelope.runId,
    actionSurface: envelope.actionSurface as string,
    downstreamSystem: envelope.downstreamSystem as string,
    operationRef: envelope.operationRef as string,
    inputSchemaDigest: envelope.inputSchemaDigest as string,
    argumentOrBodyDigest: envelope.argumentOrBodyDigest as string,
  });
}

export function createRuntimeSignalProofIntake(
  input: CreateRuntimeSignalProofIntakeInput,
): RuntimeSignalProofIntake {
  assertRuntimeSignalAuthorityBoundary({
    signalKind: input.envelope.signalKind,
    sourceTrustLevel: input.envelope.sourceTrustLevel,
    target: input.envelope,
    targetLabel: 'runtime-signal-envelope',
  });
  if (
    input.envelope.signalKind !== 'enforcement-proof' ||
    input.envelope.sourceTrustLevel !== 'enforcement-proof'
  ) {
    throw new Error('Runtime signal proof intake only accepts enforcement-proof signals with enforcement-proof trust.');
  }

  const refs = proofEvidenceRefs(input.envelope);
  const proofKind = classifyProofKind(input.envelope);
  const bindingStatus = bindingStatusFor(input.envelope, refs);
  const missingBindings = missingBindingsFor(bindingStatus);
  const blockerReasons = blockersFor({ missingBindings, proofKind });
  const proofPacketMaterialReady = blockerReasons.length === 0;
  const payload = {
    version: RUNTIME_SIGNAL_PROOF_INTAKE_VERSION,
    runtimeSignalEnvelopeVersion: RUNTIME_SIGNAL_ENVELOPE_VERSION,
    runtimeSignalAuthorityGuardVersion: RUNTIME_SIGNAL_AUTHORITY_GUARD_VERSION,
    generatedAt: normalizeIsoTimestamp(input.generatedAt, input.envelope.eventTime),
    intakeScope: normalizeIntakeScope(input.intakeScope),
    sourceSignalDigest: input.envelope.signalDigest,
    sourceSystem: input.envelope.sourceSystem,
    proofKind,
    status: proofPacketMaterialReady ? 'proof-packet-material-ready' : 'held',
    proofPacketMaterialReady,
    proofSignalsOnly: true,
    proofEvidenceRefs: refs,
    missingBindings,
    blockerReasons,
    bindingStatus,
    correlation: correlationFor(input.envelope, bindingStatus),
    digestOnly: true,
    telemetryAcceptedAsProof: false,
    metadataAcceptedAsProof: false,
    proofIntakeOnly: true,
    externalVerificationClaimed: false,
    grantsAuthority: false,
    canGrantAuthority: false,
    canAdmit: false,
    activatesEnforcement: false,
    autoEnforce: false,
    productionReady: false,
    outputIsDecisionSupportOnly: true,
  } as const;
  const canonical = canonicalObject(payload as unknown as CanonicalReleaseJsonValue);
  return Object.freeze({
    ...payload,
    canonical: canonical.canonical,
    digest: canonical.digest,
  });
}

export function runtimeSignalProofIntakeDescriptor(): RuntimeSignalProofIntakeDescriptor {
  return Object.freeze({
    version: RUNTIME_SIGNAL_PROOF_INTAKE_VERSION,
    runtimeSignalEnvelopeVersion: RUNTIME_SIGNAL_ENVELOPE_VERSION,
    runtimeSignalAuthorityGuardVersion: RUNTIME_SIGNAL_AUTHORITY_GUARD_VERSION,
    proofKinds: RUNTIME_SIGNAL_PROOF_INTAKE_KINDS,
    requiredBindings: RUNTIME_SIGNAL_PROOF_INTAKE_REQUIRED_BINDINGS,
    blockers: RUNTIME_SIGNAL_PROOF_INTAKE_BLOCKERS,
    proofSignalsOnly: true,
    acceptsOnlySignalKind: 'enforcement-proof',
    acceptsOnlySourceTrustLevel: 'enforcement-proof',
    digestOnly: true,
    telemetryAcceptedAsProof: false,
    metadataAcceptedAsProof: false,
    proofIntakeOnly: true,
    externalVerificationClaimed: false,
    grantsAuthority: false,
    canGrantAuthority: false,
    canAdmit: false,
    activatesEnforcement: false,
    autoEnforce: false,
    productionReady: false,
    outputIsDecisionSupportOnly: true,
    nonClaims: Object.freeze([
      'not-admission',
      'not-authority',
      'not-gate-deployment',
      'not-external-verification',
      'not-production-ready',
    ]),
  });
}
