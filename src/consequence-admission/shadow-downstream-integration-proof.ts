import { createHash } from 'node:crypto';
import {
  canonicalizeReleaseJson,
  type CanonicalReleaseJsonValue,
} from '../release-kernel/release-canonicalization.js';
import {
  CONSEQUENCE_ADMISSION_DOWNSTREAM_BOUNDARY_KINDS,
  type ConsequenceAdmissionDownstreamBoundaryKind,
} from './downstream-enforcement-contract.js';
import type {
  ShadowDownstreamVerificationBinding,
  ShadowDownstreamVerificationCheckKind,
} from './shadow-downstream-verification-binding.js';
import type {
  ShadowPolicyBundlePublication,
} from './shadow-policy-bundle-publication.js';

export const SHADOW_DOWNSTREAM_INTEGRATION_PROOF_VERSION =
  'attestor.shadow-downstream-integration-proof.v1';

export const SHADOW_DOWNSTREAM_INTEGRATION_EVIDENCE_KINDS = [
  'ext-authz-config',
  'adapter-test',
  'verifier-receipt',
  'deployment-manifest',
  'policy-bundle-reference',
  'manual-review',
  'custom',
] as const;
export type ShadowDownstreamIntegrationEvidenceKind =
  typeof SHADOW_DOWNSTREAM_INTEGRATION_EVIDENCE_KINDS[number];

export interface ShadowDownstreamIntegrationEvidenceRef {
  readonly id: string;
  readonly kind: ShadowDownstreamIntegrationEvidenceKind;
  readonly digest: string;
  readonly uri: string | null;
}

export interface ShadowDownstreamIntegrationProof {
  readonly version: typeof SHADOW_DOWNSTREAM_INTEGRATION_PROOF_VERSION;
  readonly proofId: string;
  readonly generatedAt: string;
  readonly tenantId: string;
  readonly enforcementPointId: string;
  readonly boundaryKind: ConsequenceAdmissionDownstreamBoundaryKind;
  readonly verifierRef: string;
  readonly sourcePublicationId: string;
  readonly sourcePublicationDigest: string;
  readonly sourceBindingId: string;
  readonly sourceBindingDigest: string;
  readonly sourceSimulationDigest: string;
  readonly sourcePacketDigest: string;
  readonly sourceBundleDraftDigest: string;
  readonly sourceChainMatches: boolean;
  readonly requiredCheckCount: number;
  readonly observedCheckCount: number;
  readonly observedVerificationChecks: readonly ShadowDownstreamVerificationCheckKind[];
  readonly missingVerificationChecks: readonly ShadowDownstreamVerificationCheckKind[];
  readonly evidenceRefs: readonly ShadowDownstreamIntegrationEvidenceRef[];
  readonly evidenceDigest: string;
  readonly integrationProofReady: boolean;
  readonly activationReady: false;
  readonly remainingActivationBlockers: readonly string[];
  readonly approvalRequired: true;
  readonly autoEnforce: false;
  readonly rawPayloadStored: false;
  readonly productionReady: false;
  readonly canonical: string;
  readonly digest: string;
}

export interface CreateShadowDownstreamIntegrationProofInput {
  readonly publication: ShadowPolicyBundlePublication;
  readonly binding: ShadowDownstreamVerificationBinding;
  readonly enforcementPointId: string;
  readonly boundaryKind: ConsequenceAdmissionDownstreamBoundaryKind;
  readonly verifierRef: string;
  readonly observedVerificationChecks?: readonly ShadowDownstreamVerificationCheckKind[];
  readonly evidenceRefs?: readonly ShadowDownstreamIntegrationEvidenceRef[];
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
    throw new Error(`Shadow downstream integration proof ${fieldName} must be an ISO timestamp.`);
  }
  return timestamp.toISOString();
}

function normalizeIdentifier(value: string | null | undefined, fieldName: string): string {
  if (typeof value !== 'string') {
    throw new Error(`Shadow downstream integration proof ${fieldName} requires a string.`);
  }
  const normalized = value.trim();
  if (!normalized) {
    throw new Error(`Shadow downstream integration proof ${fieldName} requires a non-empty value.`);
  }
  return normalized;
}

function normalizeOptionalIdentifier(
  value: string | null | undefined,
  fieldName: string,
): string | null {
  if (value === undefined || value === null) return null;
  return normalizeIdentifier(value, fieldName);
}

function normalizeDigest(value: string, fieldName: string): string {
  const normalized = normalizeIdentifier(value, fieldName);
  if (!/^sha256:[0-9a-f]{64}$/u.test(normalized)) {
    throw new Error(
      `Shadow downstream integration proof ${fieldName} must be a sha256 digest.`,
    );
  }
  return normalized;
}

function normalizeBoundaryKind(
  value: ConsequenceAdmissionDownstreamBoundaryKind,
): ConsequenceAdmissionDownstreamBoundaryKind {
  if (!CONSEQUENCE_ADMISSION_DOWNSTREAM_BOUNDARY_KINDS.includes(value)) {
    throw new Error(
      `Shadow downstream integration proof boundaryKind must be one of: ${CONSEQUENCE_ADMISSION_DOWNSTREAM_BOUNDARY_KINDS.join(', ')}.`,
    );
  }
  return value;
}

function normalizeEvidenceKind(
  value: ShadowDownstreamIntegrationEvidenceKind,
): ShadowDownstreamIntegrationEvidenceKind {
  if (!SHADOW_DOWNSTREAM_INTEGRATION_EVIDENCE_KINDS.includes(value)) {
    throw new Error(
      `Shadow downstream integration proof evidence kind must be one of: ${SHADOW_DOWNSTREAM_INTEGRATION_EVIDENCE_KINDS.join(', ')}.`,
    );
  }
  return value;
}

function normalizeEvidenceRef(
  evidence: ShadowDownstreamIntegrationEvidenceRef,
): ShadowDownstreamIntegrationEvidenceRef {
  return Object.freeze({
    id: normalizeIdentifier(evidence.id, 'evidenceRefs[].id'),
    kind: normalizeEvidenceKind(evidence.kind),
    digest: normalizeDigest(evidence.digest, 'evidenceRefs[].digest'),
    uri: normalizeOptionalIdentifier(evidence.uri, 'evidenceRefs[].uri'),
  });
}

function normalizeEvidenceRefs(
  values: readonly ShadowDownstreamIntegrationEvidenceRef[] | null | undefined,
): readonly ShadowDownstreamIntegrationEvidenceRef[] {
  return Object.freeze(
    [...(values ?? [])]
      .map(normalizeEvidenceRef)
      .sort((left, right) => left.id.localeCompare(right.id)),
  );
}

function normalizeObservedChecks(
  input: {
    readonly binding: ShadowDownstreamVerificationBinding;
    readonly observedChecks: readonly ShadowDownstreamVerificationCheckKind[] | null | undefined;
  },
): readonly ShadowDownstreamVerificationCheckKind[] {
  const requiredChecks = new Set(input.binding.requiredVerificationChecks.map((check) => check.check));
  const observed = new Set<ShadowDownstreamVerificationCheckKind>();
  for (const check of input.observedChecks ?? []) {
    if (!requiredChecks.has(check)) {
      throw new Error(
        `Shadow downstream integration proof observedVerificationChecks contains an unsupported check: ${check}.`,
      );
    }
    observed.add(check);
  }
  return Object.freeze(
    input.binding.requiredVerificationChecks
      .map((check) => check.check)
      .filter((check) => observed.has(check)),
  );
}

function missingChecks(input: {
  readonly binding: ShadowDownstreamVerificationBinding;
  readonly observedChecks: readonly ShadowDownstreamVerificationCheckKind[];
}): readonly ShadowDownstreamVerificationCheckKind[] {
  const observed = new Set(input.observedChecks);
  return Object.freeze(
    input.binding.requiredVerificationChecks
      .map((check) => check.check)
      .filter((check) => !observed.has(check)),
  );
}

function sourceChainMatches(input: {
  readonly publication: ShadowPolicyBundlePublication;
  readonly binding: ShadowDownstreamVerificationBinding;
}): boolean {
  return input.publication.tenantId === input.binding.tenantId &&
    input.publication.sourceSimulationDigest === input.binding.sourceSimulationDigest &&
    input.publication.sourcePacketDigest === input.binding.sourcePacketDigest &&
    input.publication.sourceBundleDraftDigest === input.binding.sourceBundleDraftDigest;
}

function evidenceDigestFor(
  evidenceRefs: readonly ShadowDownstreamIntegrationEvidenceRef[],
): string {
  return hashCanonical({
    evidenceRefs,
  } as unknown as CanonicalReleaseJsonValue);
}

function proofIdFor(input: {
  readonly tenantId: string;
  readonly enforcementPointId: string;
  readonly boundaryKind: ConsequenceAdmissionDownstreamBoundaryKind;
  readonly verifierRef: string;
  readonly sourcePublicationDigest: string;
  readonly sourceBindingDigest: string;
  readonly evidenceDigest: string;
  readonly observedVerificationChecks: readonly ShadowDownstreamVerificationCheckKind[];
}): string {
  return `downstream-integration-proof:${hashCanonical(input as unknown as CanonicalReleaseJsonValue)}`;
}

function remainingActivationBlockers(input: {
  readonly publication: ShadowPolicyBundlePublication;
  readonly binding: ShadowDownstreamVerificationBinding;
  readonly sourceChainMatches: boolean;
  readonly evidenceRefs: readonly ShadowDownstreamIntegrationEvidenceRef[];
  readonly missingChecks: readonly ShadowDownstreamVerificationCheckKind[];
  readonly integrationProofReady: boolean;
}): readonly string[] {
  const blockers = new Set([
    ...input.publication.remainingActivationBlockers,
    ...input.binding.remainingActivationBlockers,
  ]);

  if (!input.publication.publicationReady) {
    blockers.add('policy-bundle-publication-required');
  } else {
    blockers.delete('bundle-signature-required');
  }
  if (!input.binding.downstreamVerificationDraftReady) {
    blockers.add('downstream-verification-required');
  } else {
    blockers.delete('downstream-verification-required');
  }
  if (!input.sourceChainMatches) {
    blockers.add('source-artifact-chain-mismatch');
  }
  if (input.evidenceRefs.length === 0) {
    blockers.add('downstream-integration-evidence-required');
  }
  if (input.missingChecks.length > 0) {
    blockers.add('downstream-integration-checks-incomplete');
  }

  if (input.integrationProofReady) {
    blockers.delete('downstream-integration-proof-required');
    blockers.delete('downstream-integration-evidence-required');
    blockers.delete('downstream-integration-checks-incomplete');
  } else {
    blockers.add('downstream-integration-proof-required');
  }

  return Object.freeze([...blockers].sort());
}

export function createShadowDownstreamIntegrationProof(
  input: CreateShadowDownstreamIntegrationProofInput,
): ShadowDownstreamIntegrationProof {
  const generatedAt = normalizeIsoTimestamp(
    input.generatedAt,
    new Date().toISOString(),
    'generatedAt',
  );
  const enforcementPointId = normalizeIdentifier(input.enforcementPointId, 'enforcementPointId');
  const boundaryKind = normalizeBoundaryKind(input.boundaryKind);
  const verifierRef = normalizeIdentifier(input.verifierRef, 'verifierRef');
  const evidenceRefs = normalizeEvidenceRefs(input.evidenceRefs);
  const evidenceDigest = evidenceDigestFor(evidenceRefs);
  const observedVerificationChecks = normalizeObservedChecks({
    binding: input.binding,
    observedChecks: input.observedVerificationChecks,
  });
  const missingVerificationChecks = missingChecks({
    binding: input.binding,
    observedChecks: observedVerificationChecks,
  });
  const chainMatches = sourceChainMatches(input);
  const integrationProofReady =
    input.publication.publicationReady &&
    input.binding.downstreamVerificationDraftReady &&
    chainMatches &&
    evidenceRefs.length > 0 &&
    missingVerificationChecks.length === 0;
  const blockers = remainingActivationBlockers({
    publication: input.publication,
    binding: input.binding,
    sourceChainMatches: chainMatches,
    evidenceRefs,
    missingChecks: missingVerificationChecks,
    integrationProofReady,
  });
  const payload = {
    version: SHADOW_DOWNSTREAM_INTEGRATION_PROOF_VERSION,
    proofId: proofIdFor({
      tenantId: input.binding.tenantId,
      enforcementPointId,
      boundaryKind,
      verifierRef,
      sourcePublicationDigest: input.publication.digest,
      sourceBindingDigest: input.binding.digest,
      evidenceDigest,
      observedVerificationChecks,
    }),
    generatedAt,
    tenantId: input.binding.tenantId,
    enforcementPointId,
    boundaryKind,
    verifierRef,
    sourcePublicationId: input.publication.publicationId,
    sourcePublicationDigest: input.publication.digest,
    sourceBindingId: input.binding.bindingId,
    sourceBindingDigest: input.binding.digest,
    sourceSimulationDigest: input.binding.sourceSimulationDigest,
    sourcePacketDigest: input.binding.sourcePacketDigest,
    sourceBundleDraftDigest: input.binding.sourceBundleDraftDigest,
    sourceChainMatches: chainMatches,
    requiredCheckCount: input.binding.requiredVerificationChecks.length,
    observedCheckCount: observedVerificationChecks.length,
    observedVerificationChecks,
    missingVerificationChecks,
    evidenceRefs,
    evidenceDigest,
    integrationProofReady,
    activationReady: false,
    remainingActivationBlockers: blockers,
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
