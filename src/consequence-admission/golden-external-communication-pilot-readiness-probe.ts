import { createHash } from 'node:crypto';
import {
  canonicalizeReleaseJson,
  type CanonicalReleaseJsonValue,
} from '../release-kernel/release-canonicalization.js';
import {
  createPilotReadinessPacket,
  PILOT_READINESS_PACKET_VERSION,
  type PilotReadinessPacket,
} from './pilot-readiness-packet.js';
import {
  GOLDEN_EXTERNAL_COMMUNICATION_RUNTIME_SMOKE_VERSION,
  runGoldenExternalCommunicationRuntimeSmoke,
  type GoldenExternalCommunicationRuntimeSmokeResult,
} from './golden-external-communication-runtime-smoke.js';

export const GOLDEN_EXTERNAL_COMMUNICATION_PILOT_READINESS_PROBE_VERSION =
  'attestor.golden-external-communication-pilot-readiness-probe.v1';

export type GoldenExternalCommunicationPilotReadinessVerdict =
  | 'ready-for-shadow-pilot'
  | 'not-ready';

export interface GoldenExternalCommunicationPilotReadinessProbeDecision {
  readonly verdict: GoldenExternalCommunicationPilotReadinessVerdict;
  readonly blockers: readonly string[];
}

export interface GoldenExternalCommunicationPilotReadinessProbeResult {
  readonly version: typeof GOLDEN_EXTERNAL_COMMUNICATION_PILOT_READINESS_PROBE_VERSION;
  readonly step: 'E03';
  readonly generatedAt: string;
  readonly sourceRuntimeSmokeVersion: typeof GOLDEN_EXTERNAL_COMMUNICATION_RUNTIME_SMOKE_VERSION;
  readonly sourceRuntimeSmokeDigest: string;
  readonly pilotReadinessPacketVersion: typeof PILOT_READINESS_PACKET_VERSION;
  readonly pilotReadinessPacketDigest: string;
  readonly pilotReadinessPacket: PilotReadinessPacket;
  readonly allowedVerdicts: readonly ['ready-for-shadow-pilot', 'not-ready'];
  readonly scopedPilotVerdictExcluded: true;
  readonly decision: GoldenExternalCommunicationPilotReadinessProbeDecision;
  readonly shadowOnly: true;
  readonly fixtureOnly: true;
  readonly previewOnly: true;
  readonly deterministicReplay: true;
  readonly noTargetSystemCall: true;
  readonly noMessageDelivery: true;
  readonly noProviderCall: true;
  readonly noCrmOrTicketingCall: true;
  readonly noAuditWrite: true;
  readonly noExternalEventBus: true;
  readonly noExternalTraceExport: true;
  readonly noExternalLineageExport: true;
  readonly noPolicyActivation: true;
  readonly noLearningActivation: true;
  readonly noTrainingActivation: true;
  readonly grantsAuthority: false;
  readonly canAdmit: false;
  readonly activatesEnforcement: false;
  readonly autoEnforce: false;
  readonly rawPayloadRead: false;
  readonly rawPayloadStored: false;
  readonly rawMessageBodyRead: false;
  readonly rawMessageBodyStored: false;
  readonly rawRecipientIdentifiersRead: false;
  readonly rawRecipientIdentifiersStored: false;
  readonly rawCustomerIdentifiersRead: false;
  readonly rawCustomerIdentifiersStored: false;
  readonly productionReady: false;
  readonly canonical: string;
  readonly digest: string;
}

export interface GoldenExternalCommunicationPilotReadinessProbeDescriptor {
  readonly version: typeof GOLDEN_EXTERNAL_COMMUNICATION_PILOT_READINESS_PROBE_VERSION;
  readonly step: 'E03';
  readonly sourceRuntimeSmokeVersion: typeof GOLDEN_EXTERNAL_COMMUNICATION_RUNTIME_SMOKE_VERSION;
  readonly pilotReadinessPacketVersion: typeof PILOT_READINESS_PACKET_VERSION;
  readonly allowedVerdicts: readonly ['ready-for-shadow-pilot', 'not-ready'];
  readonly scopedPilotVerdictExcluded: true;
  readonly shadowOnly: true;
  readonly fixtureOnly: true;
  readonly previewOnly: true;
  readonly noTargetSystemCall: true;
  readonly noMessageDelivery: true;
  readonly noProviderCall: true;
  readonly noCrmOrTicketingCall: true;
  readonly noAuditWrite: true;
  readonly noPolicyActivation: true;
  readonly noLearningActivation: true;
  readonly noTrainingActivation: true;
  readonly grantsAuthority: false;
  readonly canAdmit: false;
  readonly activatesEnforcement: false;
  readonly autoEnforce: false;
  readonly rawPayloadRead: false;
  readonly rawPayloadStored: false;
  readonly rawMessageBodyRead: false;
  readonly rawMessageBodyStored: false;
  readonly rawRecipientIdentifiersRead: false;
  readonly rawRecipientIdentifiersStored: false;
  readonly rawCustomerIdentifiersRead: false;
  readonly rawCustomerIdentifiersStored: false;
  readonly productionReady: false;
}

const GENERATED_AT = '2026-05-26T10:45:00.000Z';
const ALLOWED_VERDICTS = Object.freeze([
  'ready-for-shadow-pilot',
  'not-ready',
] as const);

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

function digestFor(kind: string, value: CanonicalReleaseJsonValue): string {
  return canonicalObject({ kind, value }).digest;
}

function runtimeSmokeBlockers(
  smoke: GoldenExternalCommunicationRuntimeSmokeResult,
): readonly string[] {
  const blockers = new Set<string>();
  if (smoke.version !== GOLDEN_EXTERNAL_COMMUNICATION_RUNTIME_SMOKE_VERSION) {
    blockers.add('golden-external-communication-runtime-smoke-version-mismatch');
  }
  if (smoke.step !== 'E03') blockers.add('golden-external-communication-runtime-smoke-step-mismatch');
  if (smoke.scenarioCount !== 8 || smoke.scenarioResults.length !== 8) {
    blockers.add('golden-external-communication-runtime-smoke-scenario-count-invalid');
  }
  if (smoke.allScenariosCompleted !== true) {
    blockers.add('golden-external-communication-runtime-smoke-incomplete');
  }
  if (smoke.executionMode !== 'shadow-only') {
    blockers.add('golden-external-communication-runtime-smoke-not-shadow-only');
  }
  if (smoke.fixtureOnly !== true) {
    blockers.add('golden-external-communication-runtime-smoke-not-fixture-only');
  }
  if (smoke.noTargetSystemCall !== true) {
    blockers.add('golden-external-communication-runtime-smoke-target-system-call-risk');
  }
  if (
    smoke.noMessageDelivery !== true ||
    smoke.noProviderCall !== true ||
    smoke.noCrmOrTicketingCall !== true
  ) {
    blockers.add('golden-external-communication-runtime-smoke-message-delivery-risk');
  }
  if (smoke.noAuditWrite !== true) {
    blockers.add('golden-external-communication-runtime-smoke-audit-write-risk');
  }
  if (smoke.noPolicyActivation !== true) {
    blockers.add('golden-external-communication-runtime-smoke-policy-activation-risk');
  }
  if (smoke.noLearningActivation !== true || smoke.noTrainingActivation !== true) {
    blockers.add('golden-external-communication-runtime-smoke-learning-activation-risk');
  }
  if (
    smoke.grantsAuthority ||
    smoke.canAdmit ||
    smoke.activatesEnforcement ||
    smoke.autoEnforce ||
    smoke.productionReady
  ) {
    blockers.add('golden-external-communication-runtime-smoke-authority-overclaim-risk');
  }
  if (
    smoke.rawPayloadRead ||
    smoke.rawPayloadStored ||
    smoke.rawMessageBodyRead ||
    smoke.rawMessageBodyStored ||
    smoke.rawRecipientIdentifiersRead ||
    smoke.rawRecipientIdentifiersStored ||
    smoke.rawCustomerIdentifiersRead ||
    smoke.rawCustomerIdentifiersStored
  ) {
    blockers.add('golden-external-communication-runtime-smoke-raw-communication-material-risk');
  }
  return Object.freeze([...blockers].sort());
}

function createReadinessPacket(
  smoke: GoldenExternalCommunicationRuntimeSmokeResult,
  blockers: readonly string[],
): PilotReadinessPacket {
  return createPilotReadinessPacket({
    generatedAt: GENERATED_AT,
    pilotRefDigest: digestFor('golden-external-communication-pilot', smoke.digest),
    tenantRefDigest: digestFor('golden-external-communication-tenant', 'fixture-only-tenant'),
    requesterRefDigest: digestFor(
      'golden-external-communication-requester',
      'fixture-only-requester',
    ),
    targetSystemRefDigest: digestFor(
      'golden-external-communication-target-system',
      'message-gateway-shadow',
    ),
    integrationOwnerRefDigest: digestFor(
      'golden-external-communication-integration-owner',
      'fixture-only-integration-owner',
    ),
    systemOfRecordOwnerRefDigest: digestFor(
      'golden-external-communication-system-of-record-owner',
      'fixture-only-system-owner',
    ),
    targetRecipeRefs: Object.freeze([
      'golden-path:external-communication',
      'message-gateway-shadow',
      smoke.sourceFixtureSuiteDigest,
      smoke.sourcePolicyFoundryProjectionDigest,
      smoke.digest,
    ]),
    stage: 'shadow-entry',
    rolloutMode: 'shadow-only',
    approvalPathDigest: digestFor('golden-external-communication-approval-path', smoke.digest),
    reviewerQueueDigest: digestFor('golden-external-communication-reviewer-queue', smoke.digest),
    rollbackPlanDigest: digestFor('golden-external-communication-rollback-plan', smoke.digest),
    decisionLogDigest: digestFor('golden-external-communication-decision-log', smoke.digest),
    runbookDigest: digestFor('golden-external-communication-runbook', smoke.digest),
    nonClaimsAccepted: blockers.length === 0,
  });
}

export function createGoldenExternalCommunicationPilotReadinessProbe(
  smoke: GoldenExternalCommunicationRuntimeSmokeResult =
    runGoldenExternalCommunicationRuntimeSmoke(),
): GoldenExternalCommunicationPilotReadinessProbeResult {
  const smokeBlockers = runtimeSmokeBlockers(smoke);
  const packet = createReadinessPacket(smoke, smokeBlockers);
  const decisionBlockers = Object.freeze([
    ...smokeBlockers,
    ...packet.decision.blockers,
  ]);
  if (packet.decision.verdict === 'ready-for-scoped-pilot') {
    throw new Error(
      'Golden external communication pilot readiness probe cannot emit scoped pilot verdicts.',
    );
  }
  const verdict: GoldenExternalCommunicationPilotReadinessVerdict =
    decisionBlockers.length > 0 ? 'not-ready' : packet.decision.verdict;
  const payload = {
    version: GOLDEN_EXTERNAL_COMMUNICATION_PILOT_READINESS_PROBE_VERSION,
    step: 'E03',
    generatedAt: GENERATED_AT,
    sourceRuntimeSmokeVersion: smoke.version,
    sourceRuntimeSmokeDigest: smoke.digest,
    pilotReadinessPacketVersion: packet.version,
    pilotReadinessPacketDigest: packet.digest,
    allowedVerdicts: ALLOWED_VERDICTS,
    scopedPilotVerdictExcluded: true,
    decision: {
      verdict,
      blockers: decisionBlockers,
    },
    shadowOnly: true,
    fixtureOnly: true,
    previewOnly: true,
    deterministicReplay: true,
    noTargetSystemCall: true,
    noMessageDelivery: true,
    noProviderCall: true,
    noCrmOrTicketingCall: true,
    noAuditWrite: true,
    noExternalEventBus: true,
    noExternalTraceExport: true,
    noExternalLineageExport: true,
    noPolicyActivation: true,
    noLearningActivation: true,
    noTrainingActivation: true,
    grantsAuthority: false,
    canAdmit: false,
    activatesEnforcement: false,
    autoEnforce: false,
    rawPayloadRead: false,
    rawPayloadStored: false,
    rawMessageBodyRead: false,
    rawMessageBodyStored: false,
    rawRecipientIdentifiersRead: false,
    rawRecipientIdentifiersStored: false,
    rawCustomerIdentifiersRead: false,
    rawCustomerIdentifiersStored: false,
    productionReady: false,
  } as const;
  const canonical = canonicalObject(payload as unknown as CanonicalReleaseJsonValue);
  return Object.freeze({
    ...payload,
    pilotReadinessPacket: packet,
    canonical: canonical.canonical,
    digest: canonical.digest,
  });
}

export function goldenExternalCommunicationPilotReadinessProbeDescriptor():
  GoldenExternalCommunicationPilotReadinessProbeDescriptor {
  return Object.freeze({
    version: GOLDEN_EXTERNAL_COMMUNICATION_PILOT_READINESS_PROBE_VERSION,
    step: 'E03',
    sourceRuntimeSmokeVersion: GOLDEN_EXTERNAL_COMMUNICATION_RUNTIME_SMOKE_VERSION,
    pilotReadinessPacketVersion: PILOT_READINESS_PACKET_VERSION,
    allowedVerdicts: ALLOWED_VERDICTS,
    scopedPilotVerdictExcluded: true,
    shadowOnly: true,
    fixtureOnly: true,
    previewOnly: true,
    noTargetSystemCall: true,
    noMessageDelivery: true,
    noProviderCall: true,
    noCrmOrTicketingCall: true,
    noAuditWrite: true,
    noPolicyActivation: true,
    noLearningActivation: true,
    noTrainingActivation: true,
    grantsAuthority: false,
    canAdmit: false,
    activatesEnforcement: false,
    autoEnforce: false,
    rawPayloadRead: false,
    rawPayloadStored: false,
    rawMessageBodyRead: false,
    rawMessageBodyStored: false,
    rawRecipientIdentifiersRead: false,
    rawRecipientIdentifiersStored: false,
    rawCustomerIdentifiersRead: false,
    rawCustomerIdentifiersStored: false,
    productionReady: false,
  });
}
