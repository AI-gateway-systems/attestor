import { createHash } from 'node:crypto';
import {
  canonicalizeReleaseJson,
  type CanonicalReleaseJsonValue,
} from '../release-kernel/release-canonicalization.js';
import type {
  ShadowDownstreamIntegrationProof,
} from './shadow-downstream-integration-proof.js';
import type {
  ShadowDownstreamVerificationBinding,
} from './shadow-downstream-verification-binding.js';
import type {
  ShadowPolicyBundlePublication,
} from './shadow-policy-bundle-publication.js';
import type {
  ShadowPolicyPromotionSourceStatus,
} from './shadow-policy-promotion-draft.js';

export const SHADOW_ACTIVATION_READINESS_GATE_VERSION =
  'attestor.shadow-activation-readiness-gate.v1';

export const SHADOW_ACTIVATION_GATE_COMPONENTS = [
  'promotion-source',
  'policy-simulation',
  'bundle-publication',
  'downstream-verification-binding',
  'downstream-integration-proof',
  'production-signing-boundary',
  'operator-activation',
] as const;
export type ShadowActivationGateComponentKind =
  typeof SHADOW_ACTIVATION_GATE_COMPONENTS[number];

export type ShadowActivationGateComponentStatus = 'pass' | 'block';
export type ShadowActivationReadinessState =
  | 'blocked'
  | 'customer-controlled-activation-eligible';

export interface ShadowActivationGateComponent {
  readonly component: ShadowActivationGateComponentKind;
  readonly status: ShadowActivationGateComponentStatus;
  readonly digest: string | null;
  readonly blockers: readonly string[];
  readonly summary: string;
}

export interface ShadowActivationReadinessGate {
  readonly version: typeof SHADOW_ACTIVATION_READINESS_GATE_VERSION;
  readonly gateId: string;
  readonly generatedAt: string;
  readonly tenantId: string;
  readonly sourceStatus: ShadowPolicyPromotionSourceStatus;
  readonly sourcePublicationDigest: string;
  readonly sourceBindingDigest: string;
  readonly sourceIntegrationProofDigest: string;
  readonly sourceSimulationDigest: string;
  readonly sourcePacketDigest: string;
  readonly sourceBundleDraftDigest: string;
  readonly sourceChainMatches: boolean;
  readonly signatureStatus: ShadowPolicyBundlePublication['signatureStatus'];
  readonly componentStatuses: readonly ShadowActivationGateComponent[];
  readonly remainingActivationBlockers: readonly string[];
  readonly readinessState: ShadowActivationReadinessState;
  readonly activationReady: boolean;
  readonly activationInstruction: string;
  readonly approvalRequired: true;
  readonly autoEnforce: false;
  readonly rawPayloadStored: false;
  readonly productionReady: false;
  readonly canonical: string;
  readonly digest: string;
}

export interface CreateShadowActivationReadinessGateInput {
  readonly sourceStatus: ShadowPolicyPromotionSourceStatus;
  readonly publication: ShadowPolicyBundlePublication;
  readonly binding: ShadowDownstreamVerificationBinding;
  readonly integrationProof: ShadowDownstreamIntegrationProof;
  readonly generatedAt?: string | null;
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

function hashCanonical(value: CanonicalReleaseJsonValue): string {
  return canonicalObject(value).digest;
}

function normalizeIsoTimestamp(
  value: string | null | undefined,
  fallback: string,
  fieldName: string,
): string {
  const raw = value ?? fallback;
  const timestamp = new Date(raw);
  if (Number.isNaN(timestamp.getTime())) {
    throw new Error(`Shadow activation readiness gate ${fieldName} must be an ISO timestamp.`);
  }
  return timestamp.toISOString();
}

function sourceChainMatches(input: {
  readonly publication: ShadowPolicyBundlePublication;
  readonly binding: ShadowDownstreamVerificationBinding;
  readonly integrationProof: ShadowDownstreamIntegrationProof;
}): boolean {
  return input.publication.tenantId === input.binding.tenantId &&
    input.binding.tenantId === input.integrationProof.tenantId &&
    input.publication.digest === input.integrationProof.sourcePublicationDigest &&
    input.binding.digest === input.integrationProof.sourceBindingDigest &&
    input.publication.sourceSimulationDigest === input.binding.sourceSimulationDigest &&
    input.binding.sourceSimulationDigest === input.integrationProof.sourceSimulationDigest &&
    input.publication.sourcePacketDigest === input.binding.sourcePacketDigest &&
    input.binding.sourcePacketDigest === input.integrationProof.sourcePacketDigest &&
    input.publication.sourceBundleDraftDigest === input.binding.sourceBundleDraftDigest &&
    input.binding.sourceBundleDraftDigest === input.integrationProof.sourceBundleDraftDigest;
}

function componentStatus(input: {
  readonly component: ShadowActivationGateComponentKind;
  readonly pass: boolean;
  readonly digest: string | null;
  readonly blockers: readonly string[];
  readonly passSummary: string;
  readonly blockSummary: string;
}): ShadowActivationGateComponent {
  return Object.freeze({
    component: input.component,
    status: input.pass ? 'pass' : 'block',
    digest: input.digest,
    blockers: Object.freeze([...input.blockers].sort()),
    summary: input.pass ? input.passSummary : input.blockSummary,
  });
}

function blockerSubset(
  blockers: readonly string[],
  matches: readonly string[],
): readonly string[] {
  return Object.freeze(blockers.filter((blocker) => matches.includes(blocker)).sort());
}

function remainingActivationBlockers(input: {
  readonly sourceStatus: ShadowPolicyPromotionSourceStatus;
  readonly publication: ShadowPolicyBundlePublication;
  readonly binding: ShadowDownstreamVerificationBinding;
  readonly integrationProof: ShadowDownstreamIntegrationProof;
  readonly sourceChainMatches: boolean;
}): readonly string[] {
  const blockers = new Set(input.integrationProof.remainingActivationBlockers);
  if (!input.publication.publicationReady) {
    blockers.add('policy-bundle-publication-required');
  }
  if (!input.binding.downstreamVerificationDraftReady) {
    blockers.add('downstream-verification-required');
  }
  if (!input.integrationProof.integrationProofReady) {
    blockers.add('downstream-integration-proof-required');
  }
  if (input.publication.signatureStatus !== 'signed-production') {
    blockers.add('production-signing-provider-required');
  }
  if (input.sourceStatus !== 'activated') {
    blockers.add('operator-activation-required');
  }
  if (!input.sourceChainMatches) {
    blockers.add('source-artifact-chain-mismatch');
  }
  if (input.sourceChainMatches) {
    blockers.delete('source-artifact-chain-mismatch');
  }
  return Object.freeze([...blockers].sort());
}

function createComponentStatuses(input: {
  readonly sourceStatus: ShadowPolicyPromotionSourceStatus;
  readonly publication: ShadowPolicyBundlePublication;
  readonly binding: ShadowDownstreamVerificationBinding;
  readonly integrationProof: ShadowDownstreamIntegrationProof;
  readonly sourceChainMatches: boolean;
  readonly remainingBlockers: readonly string[];
}): readonly ShadowActivationGateComponent[] {
  return Object.freeze([
    componentStatus({
      component: 'promotion-source',
      pass: input.sourceStatus === 'activated',
      digest: input.integrationProof.sourceBundleDraftDigest,
      blockers: input.sourceStatus === 'activated' ? [] : ['operator-activation-required'],
      passSummary: 'Policy candidates have been explicitly moved to activated source status.',
      blockSummary: 'Policy candidates are not in activated source status.',
    }),
    componentStatus({
      component: 'policy-simulation',
      pass: !input.remainingBlockers.includes('policy-simulation-required') &&
        !input.remainingBlockers.includes('policy-simulation-no-rules') &&
        !input.remainingBlockers.includes('policy-simulation-unmatched-rules'),
      digest: input.integrationProof.sourceSimulationDigest,
      blockers: blockerSubset(input.remainingBlockers, [
        'policy-simulation-required',
        'policy-simulation-no-rules',
        'policy-simulation-unmatched-rules',
      ]),
      passSummary: 'Promotion simulation is present and carried through the source chain.',
      blockSummary: 'Promotion simulation is missing or incomplete.',
    }),
    componentStatus({
      component: 'bundle-publication',
      pass: input.publication.publicationReady,
      digest: input.publication.digest,
      blockers: input.publication.publicationReady
        ? []
        : blockerSubset(input.remainingBlockers, [
          'bundle-signature-required',
          'policy-bundle-publication-required',
        ]),
      passSummary: 'Policy bundle publication is signed and publication-ready.',
      blockSummary: 'Policy bundle publication is unsigned or not publication-ready.',
    }),
    componentStatus({
      component: 'downstream-verification-binding',
      pass: input.binding.downstreamVerificationDraftReady,
      digest: input.binding.digest,
      blockers: input.binding.downstreamVerificationDraftReady
        ? []
        : blockerSubset(input.remainingBlockers, ['downstream-verification-required']),
      passSummary: 'Downstream verification binding is present.',
      blockSummary: 'Downstream verification binding is missing or not ready.',
    }),
    componentStatus({
      component: 'downstream-integration-proof',
      pass: input.integrationProof.integrationProofReady,
      digest: input.integrationProof.digest,
      blockers: input.integrationProof.integrationProofReady
        ? []
        : blockerSubset(input.remainingBlockers, [
          'downstream-integration-proof-required',
          'downstream-integration-evidence-required',
          'downstream-integration-checks-incomplete',
        ]),
      passSummary: 'Downstream integration proof closes the required verifier checks.',
      blockSummary: 'Downstream integration proof is missing evidence or required verifier checks.',
    }),
    componentStatus({
      component: 'production-signing-boundary',
      pass: input.publication.signatureStatus === 'signed-production',
      digest: input.publication.signature ? input.publication.signingPayload.digest : null,
      blockers: input.publication.signatureStatus === 'signed-production'
        ? []
        : ['production-signing-provider-required'],
      passSummary: 'Publication is signed by a production signing boundary.',
      blockSummary: 'Publication is not signed by a production signing boundary.',
    }),
    componentStatus({
      component: 'operator-activation',
      pass: input.sourceStatus === 'activated' && input.sourceChainMatches,
      digest: input.integrationProof.digest,
      blockers: input.sourceStatus === 'activated'
        ? blockerSubset(input.remainingBlockers, ['source-artifact-chain-mismatch'])
        : ['operator-activation-required'],
      passSummary: 'Operator activation source status and artifact chain match.',
      blockSummary: 'Operator activation remains required or the artifact chain does not match.',
    }),
  ]);
}

function gateIdFor(input: {
  readonly tenantId: string;
  readonly sourceStatus: ShadowPolicyPromotionSourceStatus;
  readonly sourcePublicationDigest: string;
  readonly sourceBindingDigest: string;
  readonly sourceIntegrationProofDigest: string;
  readonly remainingActivationBlockers: readonly string[];
}): string {
  return `activation-readiness-gate:${hashCanonical(input as unknown as CanonicalReleaseJsonValue)}`;
}

function activationInstruction(activationReady: boolean): string {
  return activationReady
    ? 'Eligible for customer-controlled activation review. This route does not auto-enforce.'
    : 'Do not activate enforcement. Resolve the remaining activation blockers first.';
}

export function createShadowActivationReadinessGate(
  input: CreateShadowActivationReadinessGateInput,
): ShadowActivationReadinessGate {
  const generatedAt = normalizeIsoTimestamp(
    input.generatedAt,
    new Date().toISOString(),
    'generatedAt',
  );
  const chainMatches = sourceChainMatches(input);
  const blockers = remainingActivationBlockers({
    sourceStatus: input.sourceStatus,
    publication: input.publication,
    binding: input.binding,
    integrationProof: input.integrationProof,
    sourceChainMatches: chainMatches,
  });
  const componentStatuses = createComponentStatuses({
    sourceStatus: input.sourceStatus,
    publication: input.publication,
    binding: input.binding,
    integrationProof: input.integrationProof,
    sourceChainMatches: chainMatches,
    remainingBlockers: blockers,
  });
  const activationReady = blockers.length === 0;
  const payload = {
    version: SHADOW_ACTIVATION_READINESS_GATE_VERSION,
    gateId: gateIdFor({
      tenantId: input.integrationProof.tenantId,
      sourceStatus: input.sourceStatus,
      sourcePublicationDigest: input.publication.digest,
      sourceBindingDigest: input.binding.digest,
      sourceIntegrationProofDigest: input.integrationProof.digest,
      remainingActivationBlockers: blockers,
    }),
    generatedAt,
    tenantId: input.integrationProof.tenantId,
    sourceStatus: input.sourceStatus,
    sourcePublicationDigest: input.publication.digest,
    sourceBindingDigest: input.binding.digest,
    sourceIntegrationProofDigest: input.integrationProof.digest,
    sourceSimulationDigest: input.integrationProof.sourceSimulationDigest,
    sourcePacketDigest: input.integrationProof.sourcePacketDigest,
    sourceBundleDraftDigest: input.integrationProof.sourceBundleDraftDigest,
    sourceChainMatches: chainMatches,
    signatureStatus: input.publication.signatureStatus,
    componentStatuses,
    remainingActivationBlockers: blockers,
    readinessState: activationReady ? 'customer-controlled-activation-eligible' : 'blocked',
    activationReady,
    activationInstruction: activationInstruction(activationReady),
    approvalRequired: true,
    autoEnforce: false,
    rawPayloadStored: false,
    productionReady: false,
  } as const;
  const canonical = canonicalObject(payload as unknown as CanonicalReleaseJsonValue);
  return Object.freeze({
    ...payload,
    canonical: canonical.canonical,
    digest: canonical.digest,
  });
}
