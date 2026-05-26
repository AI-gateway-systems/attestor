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
  GOLDEN_OPERATIONAL_EXECUTION_RUNTIME_SMOKE_VERSION,
  runGoldenOperationalExecutionRuntimeSmoke,
  type GoldenOperationalExecutionRuntimeSmokeResult,
} from './golden-operational-execution-runtime-smoke.js';

export const GOLDEN_OPERATIONAL_EXECUTION_PILOT_READINESS_PROBE_VERSION =
  'attestor.golden-operational-execution-pilot-readiness-probe.v1';

export type GoldenOperationalExecutionPilotReadinessVerdict =
  | 'ready-for-shadow-pilot'
  | 'not-ready';

export interface GoldenOperationalExecutionPilotReadinessProbeDecision {
  readonly verdict: GoldenOperationalExecutionPilotReadinessVerdict;
  readonly blockers: readonly string[];
}

export interface GoldenOperationalExecutionPilotReadinessProbeResult {
  readonly version: typeof GOLDEN_OPERATIONAL_EXECUTION_PILOT_READINESS_PROBE_VERSION;
  readonly step: 'O03';
  readonly generatedAt: string;
  readonly sourceRuntimeSmokeVersion: typeof GOLDEN_OPERATIONAL_EXECUTION_RUNTIME_SMOKE_VERSION;
  readonly sourceRuntimeSmokeDigest: string;
  readonly pilotReadinessPacketVersion: typeof PILOT_READINESS_PACKET_VERSION;
  readonly pilotReadinessPacketDigest: string;
  readonly pilotReadinessPacket: PilotReadinessPacket;
  readonly allowedVerdicts: readonly ['ready-for-shadow-pilot', 'not-ready'];
  readonly scopedPilotVerdictExcluded: true;
  readonly decision: GoldenOperationalExecutionPilotReadinessProbeDecision;
  readonly shadowOnly: true;
  readonly fixtureOnly: true;
  readonly previewOnly: true;
  readonly deterministicReplay: true;
  readonly noTargetSystemCall: true;
  readonly noDeployment: true;
  readonly noInfrastructureChange: true;
  readonly noSecretManagerWrite: true;
  readonly noIncidentAutomationExecution: true;
  readonly noRunbookExecution: true;
  readonly noProviderCall: true;
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
  readonly rawDeploymentManifestRead: false;
  readonly rawDeploymentManifestStored: false;
  readonly rawTerraformPlanRead: false;
  readonly rawTerraformPlanStored: false;
  readonly rawSecretMaterialRead: false;
  readonly rawSecretMaterialStored: false;
  readonly rawRunbookTextRead: false;
  readonly rawRunbookTextStored: false;
  readonly rawCustomerIdentifiersRead: false;
  readonly rawCustomerIdentifiersStored: false;
  readonly productionReady: false;
  readonly canonical: string;
  readonly digest: string;
}

export interface GoldenOperationalExecutionPilotReadinessProbeDescriptor {
  readonly version: typeof GOLDEN_OPERATIONAL_EXECUTION_PILOT_READINESS_PROBE_VERSION;
  readonly step: 'O03';
  readonly sourceRuntimeSmokeVersion: typeof GOLDEN_OPERATIONAL_EXECUTION_RUNTIME_SMOKE_VERSION;
  readonly pilotReadinessPacketVersion: typeof PILOT_READINESS_PACKET_VERSION;
  readonly allowedVerdicts: readonly ['ready-for-shadow-pilot', 'not-ready'];
  readonly scopedPilotVerdictExcluded: true;
  readonly shadowOnly: true;
  readonly fixtureOnly: true;
  readonly previewOnly: true;
  readonly noTargetSystemCall: true;
  readonly noDeployment: true;
  readonly noInfrastructureChange: true;
  readonly noSecretManagerWrite: true;
  readonly noIncidentAutomationExecution: true;
  readonly noRunbookExecution: true;
  readonly noProviderCall: true;
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
  readonly rawDeploymentManifestRead: false;
  readonly rawDeploymentManifestStored: false;
  readonly rawTerraformPlanRead: false;
  readonly rawTerraformPlanStored: false;
  readonly rawSecretMaterialRead: false;
  readonly rawSecretMaterialStored: false;
  readonly rawRunbookTextRead: false;
  readonly rawRunbookTextStored: false;
  readonly rawCustomerIdentifiersRead: false;
  readonly rawCustomerIdentifiersStored: false;
  readonly productionReady: false;
}

const GENERATED_AT = '2026-05-26T11:15:00.000Z';
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
  smoke: GoldenOperationalExecutionRuntimeSmokeResult,
): readonly string[] {
  const blockers = new Set<string>();
  if (smoke.version !== GOLDEN_OPERATIONAL_EXECUTION_RUNTIME_SMOKE_VERSION) {
    blockers.add('golden-operational-execution-runtime-smoke-version-mismatch');
  }
  if (smoke.step !== 'O03') blockers.add('golden-operational-execution-runtime-smoke-step-mismatch');
  if (smoke.scenarioCount !== 8 || smoke.scenarioResults.length !== 8) {
    blockers.add('golden-operational-execution-runtime-smoke-scenario-count-invalid');
  }
  if (smoke.allScenariosCompleted !== true) {
    blockers.add('golden-operational-execution-runtime-smoke-incomplete');
  }
  if (smoke.executionMode !== 'shadow-only') {
    blockers.add('golden-operational-execution-runtime-smoke-not-shadow-only');
  }
  if (smoke.fixtureOnly !== true) {
    blockers.add('golden-operational-execution-runtime-smoke-not-fixture-only');
  }
  if (smoke.noTargetSystemCall !== true) {
    blockers.add('golden-operational-execution-runtime-smoke-target-system-call-risk');
  }
  if (
    smoke.noDeployment !== true ||
    smoke.noInfrastructureChange !== true ||
    smoke.noSecretManagerWrite !== true ||
    smoke.noIncidentAutomationExecution !== true ||
    smoke.noRunbookExecution !== true
  ) {
    blockers.add('golden-operational-execution-runtime-smoke-operational-side-effect-risk');
  }
  if (smoke.noAuditWrite !== true) {
    blockers.add('golden-operational-execution-runtime-smoke-audit-write-risk');
  }
  if (smoke.noPolicyActivation !== true) {
    blockers.add('golden-operational-execution-runtime-smoke-policy-activation-risk');
  }
  if (smoke.noLearningActivation !== true || smoke.noTrainingActivation !== true) {
    blockers.add('golden-operational-execution-runtime-smoke-learning-activation-risk');
  }
  if (
    smoke.grantsAuthority ||
    smoke.canAdmit ||
    smoke.activatesEnforcement ||
    smoke.autoEnforce ||
    smoke.productionReady
  ) {
    blockers.add('golden-operational-execution-runtime-smoke-authority-overclaim-risk');
  }
  if (
    smoke.rawPayloadRead ||
    smoke.rawPayloadStored ||
    smoke.rawDeploymentManifestRead ||
    smoke.rawDeploymentManifestStored ||
    smoke.rawTerraformPlanRead ||
    smoke.rawTerraformPlanStored ||
    smoke.rawSecretMaterialRead ||
    smoke.rawSecretMaterialStored ||
    smoke.rawRunbookTextRead ||
    smoke.rawRunbookTextStored ||
    smoke.rawCustomerIdentifiersRead ||
    smoke.rawCustomerIdentifiersStored
  ) {
    blockers.add('golden-operational-execution-runtime-smoke-raw-operational-material-risk');
  }
  return Object.freeze([...blockers].sort());
}

function createReadinessPacket(
  smoke: GoldenOperationalExecutionRuntimeSmokeResult,
  blockers: readonly string[],
): PilotReadinessPacket {
  return createPilotReadinessPacket({
    generatedAt: GENERATED_AT,
    pilotRefDigest: digestFor('golden-operational-execution-pilot', smoke.digest),
    tenantRefDigest: digestFor('golden-operational-execution-tenant', 'fixture-only-tenant'),
    requesterRefDigest: digestFor(
      'golden-operational-execution-requester',
      'fixture-only-requester',
    ),
    targetSystemRefDigest: digestFor(
      'golden-operational-execution-target-system',
      'operations-gateway-shadow',
    ),
    integrationOwnerRefDigest: digestFor(
      'golden-operational-execution-integration-owner',
      'fixture-only-integration-owner',
    ),
    systemOfRecordOwnerRefDigest: digestFor(
      'golden-operational-execution-system-of-record-owner',
      'fixture-only-system-owner',
    ),
    targetRecipeRefs: Object.freeze([
      'golden-path:operational-execution',
      'operations-gateway-shadow',
      smoke.sourceFixtureSuiteDigest,
      smoke.sourcePolicyFoundryProjectionDigest,
      smoke.digest,
    ]),
    stage: 'shadow-entry',
    rolloutMode: 'shadow-only',
    approvalPathDigest: digestFor('golden-operational-execution-approval-path', smoke.digest),
    reviewerQueueDigest: digestFor('golden-operational-execution-reviewer-queue', smoke.digest),
    rollbackPlanDigest: digestFor('golden-operational-execution-rollback-plan', smoke.digest),
    decisionLogDigest: digestFor('golden-operational-execution-decision-log', smoke.digest),
    runbookDigest: digestFor('golden-operational-execution-runbook', smoke.digest),
    nonClaimsAccepted: blockers.length === 0,
  });
}

export function createGoldenOperationalExecutionPilotReadinessProbe(
  smoke: GoldenOperationalExecutionRuntimeSmokeResult =
    runGoldenOperationalExecutionRuntimeSmoke(),
): GoldenOperationalExecutionPilotReadinessProbeResult {
  const smokeBlockers = runtimeSmokeBlockers(smoke);
  const packet = createReadinessPacket(smoke, smokeBlockers);
  const decisionBlockers = Object.freeze([
    ...smokeBlockers,
    ...packet.decision.blockers,
  ]);
  if (packet.decision.verdict === 'ready-for-scoped-pilot') {
    throw new Error(
      'Golden operational execution pilot readiness probe cannot emit scoped pilot verdicts.',
    );
  }
  const verdict: GoldenOperationalExecutionPilotReadinessVerdict =
    decisionBlockers.length > 0 ? 'not-ready' : packet.decision.verdict;
  const payload = {
    version: GOLDEN_OPERATIONAL_EXECUTION_PILOT_READINESS_PROBE_VERSION,
    step: 'O03',
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
    noDeployment: true,
    noInfrastructureChange: true,
    noSecretManagerWrite: true,
    noIncidentAutomationExecution: true,
    noRunbookExecution: true,
    noProviderCall: true,
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
    rawDeploymentManifestRead: false,
    rawDeploymentManifestStored: false,
    rawTerraformPlanRead: false,
    rawTerraformPlanStored: false,
    rawSecretMaterialRead: false,
    rawSecretMaterialStored: false,
    rawRunbookTextRead: false,
    rawRunbookTextStored: false,
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

export function goldenOperationalExecutionPilotReadinessProbeDescriptor():
  GoldenOperationalExecutionPilotReadinessProbeDescriptor {
  return Object.freeze({
    version: GOLDEN_OPERATIONAL_EXECUTION_PILOT_READINESS_PROBE_VERSION,
    step: 'O03',
    sourceRuntimeSmokeVersion: GOLDEN_OPERATIONAL_EXECUTION_RUNTIME_SMOKE_VERSION,
    pilotReadinessPacketVersion: PILOT_READINESS_PACKET_VERSION,
    allowedVerdicts: ALLOWED_VERDICTS,
    scopedPilotVerdictExcluded: true,
    shadowOnly: true,
    fixtureOnly: true,
    previewOnly: true,
    noTargetSystemCall: true,
    noDeployment: true,
    noInfrastructureChange: true,
    noSecretManagerWrite: true,
    noIncidentAutomationExecution: true,
    noRunbookExecution: true,
    noProviderCall: true,
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
    rawDeploymentManifestRead: false,
    rawDeploymentManifestStored: false,
    rawTerraformPlanRead: false,
    rawTerraformPlanStored: false,
    rawSecretMaterialRead: false,
    rawSecretMaterialStored: false,
    rawRunbookTextRead: false,
    rawRunbookTextStored: false,
    rawCustomerIdentifiersRead: false,
    rawCustomerIdentifiersStored: false,
    productionReady: false,
  });
}
