import { createHash } from 'node:crypto';
import {
  canonicalizeReleaseJson,
  type CanonicalReleaseJsonValue,
} from '../release-kernel/release-canonicalization.js';
import {
  createActionSurfaceIntegrationKitCustomerGateWiringPacket,
  type ActionSurfaceIntegrationKitCustomerGateWiringEvidenceField,
} from './action-surface-integration-kit-customer-gate-wiring-packet.js';
import {
  createActionSurfaceIntegrationKitNoBypassProbeBundle,
  type ActionSurfaceIntegrationKitProbeEvidenceField,
  type ActionSurfaceIntegrationKitProbeTargetBoundary,
} from './action-surface-integration-kit-no-bypass-probe-bundle.js';
import type {
  ActionSurfaceIntegrationKitPacket,
} from './action-surface-integration-kit-packet.js';
import type {
  CustomerPepAdoptionPackageEvidenceKind,
} from './customer-pep-adoption-package.js';
import type {
  CustomerPepRuntimeEvidenceKind,
} from './customer-pep-runtime-adoption.js';
import type {
  AttestorIntegrationMode,
} from './integration-mode-readiness.js';

export const ACTION_SURFACE_INTEGRATION_KIT_LIVE_PROOF_PREP_VERSION =
  'attestor.action-surface-integration-kit-live-proof-prep.v1';

export const ACTION_SURFACE_INTEGRATION_KIT_LIVE_PROOF_PREP_STATUSES = [
  'no-surfaces',
  'review-required',
] as const;
export type ActionSurfaceIntegrationKitLiveProofPrepStatus =
  typeof ACTION_SURFACE_INTEGRATION_KIT_LIVE_PROOF_PREP_STATUSES[number];

export const ACTION_SURFACE_INTEGRATION_KIT_LIVE_PROOF_CAPTURE_FIELDS = [
  'environment-name',
  'timestamp',
  'command-or-probe',
  'redacted-output-artifact',
  'responsible-operator',
  'no-raw-data-confirmation',
  'remaining-limitation',
] as const;
export type ActionSurfaceIntegrationKitLiveProofCaptureField =
  typeof ACTION_SURFACE_INTEGRATION_KIT_LIVE_PROOF_CAPTURE_FIELDS[number];

export interface CreateActionSurfaceIntegrationKitLiveProofPrepBundleInput {
  readonly kit: ActionSurfaceIntegrationKitPacket;
  readonly generatedAt?: string | null;
}

export interface ActionSurfaceIntegrationKitLiveProofPrepItem {
  readonly prepId: string;
  readonly actionSurface: string;
  readonly mode: AttestorIntegrationMode;
  readonly targetBoundary: ActionSurfaceIntegrationKitProbeTargetBoundary;
  readonly liveProofCaptureCandidate: boolean;
  readonly routeOrToolRefs: readonly string[];
  readonly sourceArtifactDigests: readonly string[];
  readonly sourceReadinessDigest: string | null;
  readonly sourceProbeIds: readonly string[];
  readonly requiredWiringEvidenceFields:
    readonly ActionSurfaceIntegrationKitCustomerGateWiringEvidenceField[];
  readonly requiredProbeEvidenceFields:
    readonly ActionSurfaceIntegrationKitProbeEvidenceField[];
  readonly requiredRuntimeEvidenceKinds:
    readonly CustomerPepRuntimeEvidenceKind[];
  readonly requiredAdoptionEvidenceKinds:
    readonly CustomerPepAdoptionPackageEvidenceKind[];
  readonly missingProofs: readonly string[];
  readonly captureRecordFields:
    typeof ACTION_SURFACE_INTEGRATION_KIT_LIVE_PROOF_CAPTURE_FIELDS;
  readonly proofCaptureSteps: readonly string[];
  readonly nextSafeStep: string;
  readonly liveProofRegisterRef: 'LP-CUSTOMER-PEP-NO-BYPASS';
  readonly liveProofGateEnv: 'ATTESTOR_CUSTOMER_PEP_NO_BYPASS_PROOF';
  readonly mustRunAtCustomerStopPoint: true;
  readonly requiresOperatorApproval: true;
  readonly safeToAutoRun: false;
  readonly executesLiveProof: false;
  readonly recordsLiveProof: false;
  readonly generatedBundleMayCloseLiveProof: false;
  readonly rawPayloadStored: false;
  readonly productionReady: false;
  readonly deploysInfrastructure: false;
  readonly issuesCredentials: false;
  readonly activatesEnforcement: false;
  readonly nonBypassableClaimAllowed: false;
  readonly authority: 'live-proof-prep-only';
}

export interface ActionSurfaceIntegrationKitLiveProofPrepBundle {
  readonly version:
    typeof ACTION_SURFACE_INTEGRATION_KIT_LIVE_PROOF_PREP_VERSION;
  readonly generatedAt: string;
  readonly status: ActionSurfaceIntegrationKitLiveProofPrepStatus;
  readonly sourceKitDigest: string;
  readonly sourcePacketDigest: string;
  readonly sourceProbePlanDigest: string;
  readonly sourceProbeBundleDigest: string;
  readonly sourceCustomerGateWiringPacketDigest: string;
  readonly liveProofRegisterRef: 'LP-CUSTOMER-PEP-NO-BYPASS';
  readonly liveProofGateEnv: 'ATTESTOR_CUSTOMER_PEP_NO_BYPASS_PROOF';
  readonly surfaceCount: number;
  readonly liveProofCandidateCount: number;
  readonly probeCaseCount: number;
  readonly modes: readonly AttestorIntegrationMode[];
  readonly prepItems: readonly ActionSurfaceIntegrationKitLiveProofPrepItem[];
  readonly captureRecordFields:
    typeof ACTION_SURFACE_INTEGRATION_KIT_LIVE_PROOF_CAPTURE_FIELDS;
  readonly reviewChecklist: readonly string[];
  readonly approvalRequired: true;
  readonly autoEnforce: false;
  readonly rawPayloadStored: false;
  readonly productionReady: false;
  readonly deploysInfrastructure: false;
  readonly issuesCredentials: false;
  readonly activatesEnforcement: false;
  readonly executesLiveProof: false;
  readonly recordsLiveProof: false;
  readonly nonBypassableClaimAllowed: false;
  readonly generatedBundleMayCloseLiveProof: false;
  readonly limitations: readonly string[];
  readonly canonical: string;
  readonly digest: string;
}

export interface ActionSurfaceIntegrationKitLiveProofPrepBundleDescriptor {
  readonly version:
    typeof ACTION_SURFACE_INTEGRATION_KIT_LIVE_PROOF_PREP_VERSION;
  readonly statuses:
    typeof ACTION_SURFACE_INTEGRATION_KIT_LIVE_PROOF_PREP_STATUSES;
  readonly captureRecordFields:
    typeof ACTION_SURFACE_INTEGRATION_KIT_LIVE_PROOF_CAPTURE_FIELDS;
  readonly approvalRequired: true;
  readonly autoEnforce: false;
  readonly rawPayloadStored: false;
  readonly productionReady: false;
  readonly deploysInfrastructure: false;
  readonly issuesCredentials: false;
  readonly activatesEnforcement: false;
  readonly executesLiveProof: false;
  readonly recordsLiveProof: false;
  readonly nonBypassableClaimAllowed: false;
  readonly generatedBundleMayCloseLiveProof: false;
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

function withCanonical<T extends object>(
  body: T,
): T & {
  readonly canonical: string;
  readonly digest: string;
} {
  const canonical = canonicalObject(body as unknown as CanonicalReleaseJsonValue);
  return Object.freeze({
    ...body,
    canonical: canonical.canonical,
    digest: canonical.digest,
  });
}

function normalizeIsoTimestamp(
  value: string | null | undefined,
  fallback: string,
  fieldName: string,
): string {
  const raw = value ?? fallback;
  const timestamp = new Date(raw);
  if (Number.isNaN(timestamp.getTime())) {
    throw new Error(
      `Action surface integration kit live proof prep ${fieldName} must be an ISO timestamp.`,
    );
  }
  return timestamp.toISOString();
}

function uniqueSorted<T extends string>(items: readonly T[]): readonly T[] {
  return Object.freeze([...new Set(items)].sort());
}

function proofCaptureSteps(input: {
  readonly liveProofCaptureCandidate: boolean;
  readonly routeOrToolRefs: readonly string[];
}): readonly string[] {
  if (!input.liveProofCaptureCandidate) {
    return Object.freeze([
      'Select a customer-owned stop point before live proof capture.',
      'Keep the surface in observe or advisory mode until the stop point is reviewed.',
      'Do not request a no-bypass claim from this prep item.',
    ]);
  }
  const target =
    input.routeOrToolRefs.length > 0
      ? input.routeOrToolRefs.join(', ')
      : 'the reviewed customer stop point';
  return Object.freeze([
    `Review customer-owned stop point placement for ${target}.`,
    'Run the direct downstream call without an Attestor presentation and record the denial digest.',
    'Run valid, replayed, narrowed, review/block, and verifier-outage probe cases from the no-bypass bundle.',
    'Bind every result to the kit digest, probe-plan digest, wiring packet digest, and artifact digests.',
    'Record operator approval, no-raw-data confirmation, and remaining limitations before linking proof evidence.',
    'Update the live proof register only after the reviewed customer or sandbox evidence exists.',
  ]);
}

function nextSafeStep(liveProofCaptureCandidate: boolean): string {
  if (!liveProofCaptureCandidate) {
    return 'Choose and review a customer-owned stop point before preparing live proof evidence.';
  }
  return 'Run customer-approved no-bypass probes separately and bind redacted results back to these digests.';
}

function createPrepItems(input: {
  readonly kit: ActionSurfaceIntegrationKitPacket;
  readonly generatedAt: string;
}): readonly ActionSurfaceIntegrationKitLiveProofPrepItem[] {
  const wiringPacket = createActionSurfaceIntegrationKitCustomerGateWiringPacket({
    kit: input.kit,
    generatedAt: input.generatedAt,
  });
  const probeBundle = createActionSurfaceIntegrationKitNoBypassProbeBundle({
    kit: input.kit,
    generatedAt: input.generatedAt,
  });

  return Object.freeze(wiringPacket.wiringPlans.map((plan) => {
    const probeCases = probeBundle.probeCases.filter((probe) =>
      probe.actionSurface === plan.actionSurface
    );
    const requiredProbeEvidenceFields = uniqueSorted(
      probeCases.flatMap((probe) => probe.requiredEvidence),
    );
    const sourceProbeIds = uniqueSorted(probeCases.map((probe) => probe.probeId));
    return Object.freeze({
      prepId: `live-proof-prep:${plan.actionSurface}`,
      actionSurface: plan.actionSurface,
      mode: plan.mode,
      targetBoundary: plan.targetBoundary,
      liveProofCaptureCandidate: plan.enforcementCandidate,
      routeOrToolRefs: plan.routeOrToolRefs,
      sourceArtifactDigests: plan.sourceArtifactDigests,
      sourceReadinessDigest: plan.sourceReadinessDigest,
      sourceProbeIds,
      requiredWiringEvidenceFields: plan.requiredEvidenceFields,
      requiredProbeEvidenceFields,
      requiredRuntimeEvidenceKinds: plan.requiredRuntimeEvidenceKinds,
      requiredAdoptionEvidenceKinds: plan.requiredAdoptionEvidenceKinds,
      missingProofs: plan.missingProofs,
      captureRecordFields:
        ACTION_SURFACE_INTEGRATION_KIT_LIVE_PROOF_CAPTURE_FIELDS,
      proofCaptureSteps: proofCaptureSteps({
        liveProofCaptureCandidate: plan.enforcementCandidate,
        routeOrToolRefs: plan.routeOrToolRefs,
      }),
      nextSafeStep: nextSafeStep(plan.enforcementCandidate),
      liveProofRegisterRef: 'LP-CUSTOMER-PEP-NO-BYPASS' as const,
      liveProofGateEnv: 'ATTESTOR_CUSTOMER_PEP_NO_BYPASS_PROOF' as const,
      mustRunAtCustomerStopPoint: true as const,
      requiresOperatorApproval: true as const,
      safeToAutoRun: false as const,
      executesLiveProof: false as const,
      recordsLiveProof: false as const,
      generatedBundleMayCloseLiveProof: false as const,
      rawPayloadStored: false as const,
      productionReady: false as const,
      deploysInfrastructure: false as const,
      issuesCredentials: false as const,
      activatesEnforcement: false as const,
      nonBypassableClaimAllowed: false as const,
      authority: 'live-proof-prep-only' as const,
    });
  }).sort((left, right) => left.actionSurface.localeCompare(right.actionSurface)));
}

function reviewChecklist(): readonly string[] {
  return Object.freeze([
    'Confirm each live-proof candidate has a reviewed customer-owned stop point.',
    'Confirm probe evidence is redacted, digest-bound, and tied to the reviewed kit.',
    'Confirm observe-only surfaces are not submitted as no-bypass evidence.',
    'Confirm the live proof register remains open until customer or sandbox probes are actually run.',
  ]);
}

export function createActionSurfaceIntegrationKitLiveProofPrepBundle(
  input: CreateActionSurfaceIntegrationKitLiveProofPrepBundleInput,
): ActionSurfaceIntegrationKitLiveProofPrepBundle {
  const generatedAt = normalizeIsoTimestamp(
    input.generatedAt,
    input.kit.generatedAt,
    'generatedAt',
  );
  const probeBundle = createActionSurfaceIntegrationKitNoBypassProbeBundle({
    kit: input.kit,
    generatedAt,
  });
  const wiringPacket = createActionSurfaceIntegrationKitCustomerGateWiringPacket({
    kit: input.kit,
    generatedAt,
  });
  const prepItems = createPrepItems({ kit: input.kit, generatedAt });
  const modes = uniqueSorted(prepItems.map((item) => item.mode));
  const body = {
    version: ACTION_SURFACE_INTEGRATION_KIT_LIVE_PROOF_PREP_VERSION,
    generatedAt,
    status: prepItems.length === 0 ? 'no-surfaces' as const : 'review-required' as const,
    sourceKitDigest: input.kit.digest,
    sourcePacketDigest: input.kit.sourcePacketDigest,
    sourceProbePlanDigest: input.kit.noBypassProbePlan.digest,
    sourceProbeBundleDigest: probeBundle.digest,
    sourceCustomerGateWiringPacketDigest: wiringPacket.digest,
    liveProofRegisterRef: 'LP-CUSTOMER-PEP-NO-BYPASS' as const,
    liveProofGateEnv: 'ATTESTOR_CUSTOMER_PEP_NO_BYPASS_PROOF' as const,
    surfaceCount: prepItems.length,
    liveProofCandidateCount:
      prepItems.filter((item) => item.liveProofCaptureCandidate).length,
    probeCaseCount: probeBundle.probeCaseCount,
    modes,
    prepItems,
    captureRecordFields:
      ACTION_SURFACE_INTEGRATION_KIT_LIVE_PROOF_CAPTURE_FIELDS,
    reviewChecklist: reviewChecklist(),
    approvalRequired: true as const,
    autoEnforce: false as const,
    rawPayloadStored: false as const,
    productionReady: false as const,
    deploysInfrastructure: false as const,
    issuesCredentials: false as const,
    activatesEnforcement: false as const,
    executesLiveProof: false as const,
    recordsLiveProof: false as const,
    nonBypassableClaimAllowed: false as const,
    generatedBundleMayCloseLiveProof: false as const,
    limitations: Object.freeze([
      'This bundle prepares live proof capture; it does not run probes.',
      'It does not deploy a PEP, issue credentials, activate enforcement, or update the live proof register.',
      'Customer PEP no-bypass remains unproven until LP-CUSTOMER-PEP-NO-BYPASS evidence is captured and linked.',
    ]),
  } as const;
  return withCanonical(body);
}

export function actionSurfaceIntegrationKitLiveProofPrepBundleDescriptor():
  ActionSurfaceIntegrationKitLiveProofPrepBundleDescriptor {
  return Object.freeze({
    version: ACTION_SURFACE_INTEGRATION_KIT_LIVE_PROOF_PREP_VERSION,
    statuses: ACTION_SURFACE_INTEGRATION_KIT_LIVE_PROOF_PREP_STATUSES,
    captureRecordFields:
      ACTION_SURFACE_INTEGRATION_KIT_LIVE_PROOF_CAPTURE_FIELDS,
    approvalRequired: true,
    autoEnforce: false,
    rawPayloadStored: false,
    productionReady: false,
    deploysInfrastructure: false,
    issuesCredentials: false,
    activatesEnforcement: false,
    executesLiveProof: false,
    recordsLiveProof: false,
    nonBypassableClaimAllowed: false,
    generatedBundleMayCloseLiveProof: false,
  });
}
