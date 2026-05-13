import { createHash } from 'node:crypto';
import {
  canonicalizeReleaseJson,
  type CanonicalReleaseJsonValue,
} from '../release-kernel/release-canonicalization.js';
import {
  CONSEQUENCE_DATA_MINIMIZATION_REDACTION_POLICY_VERSION,
} from './data-minimization-redaction-policy.js';
import type {
  ActionSurfaceIntegrationArtifact,
  ActionSurfaceIntegrationArtifactBundle,
} from './action-surface-integration-artifacts.js';
import type {
  AttestorGeneratedIntegrationArtifactKind,
  AttestorIntegrationMode,
} from './integration-mode-readiness.js';
import type {
  PolicyFoundryGatePlanner,
} from './policy-foundry-gate-planner.js';

export const POLICY_FOUNDRY_REVIEW_ONLY_PATCH_PACK_VERSION =
  'attestor.policy-foundry-review-only-patch-pack.v1';

export const POLICY_FOUNDRY_REVIEW_PATCH_TARGET_KINDS = [
  'sdk',
  'gateway',
  'mcp-gateway',
  'sidecar',
  'provider-connector',
  'credential-boundary',
  'validation-fixture',
] as const;
export type PolicyFoundryReviewPatchTargetKind =
  typeof POLICY_FOUNDRY_REVIEW_PATCH_TARGET_KINDS[number];

export const POLICY_FOUNDRY_REVIEW_PATCH_CHANGE_KINDS = [
  'code-snippet-draft',
  'config-fragment-draft',
  'adapter-skeleton-draft',
  'connector-plan-draft',
  'review-checklist-draft',
] as const;
export type PolicyFoundryReviewPatchChangeKind =
  typeof POLICY_FOUNDRY_REVIEW_PATCH_CHANGE_KINDS[number];

export const POLICY_FOUNDRY_REVIEW_PATCH_PACK_STATUSES = [
  'no-artifacts',
  'requires-review',
] as const;
export type PolicyFoundryReviewOnlyPatchPackStatus =
  typeof POLICY_FOUNDRY_REVIEW_PATCH_PACK_STATUSES[number];

export interface CreatePolicyFoundryReviewOnlyPatchPackInput {
  readonly generatedAt?: string | null;
  readonly artifactBundle?: ActionSurfaceIntegrationArtifactBundle | null;
  readonly gatePlanner?: PolicyFoundryGatePlanner | null;
}

export interface PolicyFoundryReviewOnlyPatchDraft {
  readonly patchId: string;
  readonly actionSurface: string;
  readonly domain: string | null;
  readonly downstreamSystem: string | null;
  readonly mode: AttestorIntegrationMode;
  readonly artifactKind: AttestorGeneratedIntegrationArtifactKind;
  readonly targetKind: PolicyFoundryReviewPatchTargetKind;
  readonly changeKind: PolicyFoundryReviewPatchChangeKind;
  readonly sourceArtifactDigest: string;
  readonly sourceGatePlanDigest: string | null;
  readonly title: string;
  readonly targetPathHint: string;
  readonly reviewChecklist: readonly string[];
  readonly requiredReview: true;
  readonly appliesPatch: false;
  readonly deploysInfrastructure: false;
  readonly issuesCredentials: false;
  readonly activatesEnforcement: false;
  readonly productionReady: false;
  readonly nonBypassableClaimAllowed: false;
  readonly rawPayloadStored: false;
  readonly digest: string;
}

export interface PolicyFoundryReviewOnlyPatchPack {
  readonly version: typeof POLICY_FOUNDRY_REVIEW_ONLY_PATCH_PACK_VERSION;
  readonly generatedAt: string;
  readonly status: PolicyFoundryReviewOnlyPatchPackStatus;
  readonly sourceDigests: {
    readonly artifactBundleDigest: string | null;
    readonly gatePlannerDigest: string | null;
  };
  readonly patchCount: number;
  readonly targetKinds: readonly PolicyFoundryReviewPatchTargetKind[];
  readonly artifactKinds: readonly AttestorGeneratedIntegrationArtifactKind[];
  readonly patches: readonly PolicyFoundryReviewOnlyPatchDraft[];
  readonly safeAutomations: readonly string[];
  readonly approvalGatedAutomations: readonly string[];
  readonly prohibitedAutomations: readonly string[];
  readonly nextSafeStep: string;
  readonly approvalRequired: true;
  readonly autoEnforce: false;
  readonly rawPayloadStored: false;
  readonly productionReady: false;
  readonly appliesPatches: false;
  readonly deploysInfrastructure: false;
  readonly issuesCredentials: false;
  readonly activatesEnforcement: false;
  readonly nonBypassableClaimAllowed: false;
  readonly reviewMaterialOnly: true;
  readonly dataMinimizationPolicyVersion: typeof CONSEQUENCE_DATA_MINIMIZATION_REDACTION_POLICY_VERSION;
  readonly dataMinimizationSurfaceKind: 'policy-foundry-review-only-patch-pack';
  readonly limitation: string;
  readonly canonical: string;
  readonly digest: string;
}

export interface PolicyFoundryReviewOnlyPatchPackDescriptor {
  readonly version: typeof POLICY_FOUNDRY_REVIEW_ONLY_PATCH_PACK_VERSION;
  readonly targetKinds: typeof POLICY_FOUNDRY_REVIEW_PATCH_TARGET_KINDS;
  readonly changeKinds: typeof POLICY_FOUNDRY_REVIEW_PATCH_CHANGE_KINDS;
  readonly statuses: typeof POLICY_FOUNDRY_REVIEW_PATCH_PACK_STATUSES;
  readonly approvalRequired: true;
  readonly autoEnforce: false;
  readonly rawPayloadStored: false;
  readonly productionReady: false;
  readonly appliesPatches: false;
  readonly deploysInfrastructure: false;
  readonly issuesCredentials: false;
  readonly activatesEnforcement: false;
  readonly nonBypassableClaimAllowed: false;
  readonly reviewMaterialOnly: true;
  readonly dataMinimizationPolicyVersion: typeof CONSEQUENCE_DATA_MINIMIZATION_REDACTION_POLICY_VERSION;
  readonly dataMinimizationSurfaceKind: 'policy-foundry-review-only-patch-pack';
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
  fieldName: string,
): string {
  const raw = value ?? fallback;
  const timestamp = new Date(raw);
  if (Number.isNaN(timestamp.getTime())) {
    throw new Error(`Policy Foundry review-only patch pack ${fieldName} must be an ISO timestamp.`);
  }
  return timestamp.toISOString();
}

function targetKindFor(
  artifactKind: AttestorGeneratedIntegrationArtifactKind,
): PolicyFoundryReviewPatchTargetKind {
  switch (artifactKind) {
    case 'sdk-snippet':
    case 'verifier-helper-config':
    case 'protected-adapter-skeleton':
      return 'sdk';
    case 'gateway-proxy-config':
      return 'gateway';
    case 'mcp-tool-gateway-config':
      return 'mcp-gateway';
    case 'sidecar-ext-authz-config':
      return 'sidecar';
    case 'provider-native-connector-plan':
      return 'provider-connector';
    case 'credential-isolation-plan':
      return 'credential-boundary';
    case 'policy-twin-backtest':
    case 'red-team-replay-fixture':
      return 'validation-fixture';
  }
}

function changeKindFor(
  artifactKind: AttestorGeneratedIntegrationArtifactKind,
): PolicyFoundryReviewPatchChangeKind {
  switch (artifactKind) {
    case 'sdk-snippet':
    case 'verifier-helper-config':
      return 'code-snippet-draft';
    case 'protected-adapter-skeleton':
      return 'adapter-skeleton-draft';
    case 'gateway-proxy-config':
    case 'mcp-tool-gateway-config':
    case 'sidecar-ext-authz-config':
    case 'credential-isolation-plan':
      return 'config-fragment-draft';
    case 'provider-native-connector-plan':
      return 'connector-plan-draft';
    case 'policy-twin-backtest':
    case 'red-team-replay-fixture':
      return 'review-checklist-draft';
  }
}

function targetPathHint(
  artifact: ActionSurfaceIntegrationArtifact,
  targetKind: PolicyFoundryReviewPatchTargetKind,
): string {
  return `customer-review/${targetKind}/${artifact.actionSurface}/${artifact.kind}`;
}

function checklistFor(
  artifact: ActionSurfaceIntegrationArtifact,
): readonly string[] {
  const items = [
    'Review the draft in the customer-owned repository or deployment system.',
    'Confirm tenant boundary, idempotency, replay protection, and fail-closed behavior before applying.',
    'Record customer approval and red-team replay evidence before moving beyond review mode.',
  ];
  if (artifact.kind === 'credential-isolation-plan') {
    items.push('Do not issue, rotate, or move credentials from this draft pack.');
  }
  if (
    artifact.kind === 'gateway-proxy-config' ||
    artifact.kind === 'mcp-tool-gateway-config' ||
    artifact.kind === 'sidecar-ext-authz-config' ||
    artifact.kind === 'provider-native-connector-plan'
  ) {
    items.push('Do not claim non-bypassability until the downstream gate is deployed and smoke-tested.');
  }
  return Object.freeze(items.sort());
}

function gatePlanDigestFor(
  gatePlanner: PolicyFoundryGatePlanner | null,
  artifact: ActionSurfaceIntegrationArtifact,
): string | null {
  if (gatePlanner === null) return null;
  return gatePlanner.plans.some((plan) =>
    plan.actionSurface === artifact.actionSurface &&
    plan.selectedMode === artifact.mode &&
    plan.requiredArtifacts.includes(artifact.kind)
  )
    ? gatePlanner.digest
    : null;
}

function createPatchDraft(input: {
  readonly artifact: ActionSurfaceIntegrationArtifact;
  readonly gatePlanner: PolicyFoundryGatePlanner | null;
}): PolicyFoundryReviewOnlyPatchDraft {
  const targetKind = targetKindFor(input.artifact.kind);
  const changeKind = changeKindFor(input.artifact.kind);
  const sourceGatePlanDigest = gatePlanDigestFor(input.gatePlanner, input.artifact);
  const payload: Omit<PolicyFoundryReviewOnlyPatchDraft, 'patchId' | 'digest'> = {
    actionSurface: input.artifact.actionSurface,
    domain: input.artifact.domain,
    downstreamSystem: input.artifact.downstreamSystem,
    mode: input.artifact.mode,
    artifactKind: input.artifact.kind,
    targetKind,
    changeKind,
    sourceArtifactDigest: input.artifact.digest,
    sourceGatePlanDigest,
    title: `${input.artifact.kind} review draft for ${input.artifact.actionSurface}`,
    targetPathHint: targetPathHint(input.artifact, targetKind),
    reviewChecklist: checklistFor(input.artifact),
    requiredReview: true,
    appliesPatch: false,
    deploysInfrastructure: false,
    issuesCredentials: false,
    activatesEnforcement: false,
    productionReady: false,
    nonBypassableClaimAllowed: false,
    rawPayloadStored: false,
  };
  const canonical = canonicalObject(payload as unknown as CanonicalReleaseJsonValue);
  return Object.freeze({
    patchId: canonical.digest,
    ...payload,
    digest: canonical.digest,
  });
}

function nextSafeStep(status: PolicyFoundryReviewOnlyPatchPackStatus): string {
  if (status === 'no-artifacts') {
    return 'Generate reviewed integration artifacts from action surface profiles before creating a patch pack.';
  }
  return 'Review the patch pack with the customer; apply changes only outside Attestor after explicit approval and environment-specific checks.';
}

export function createPolicyFoundryReviewOnlyPatchPack(
  input: CreatePolicyFoundryReviewOnlyPatchPackInput,
): PolicyFoundryReviewOnlyPatchPack {
  const generatedAt = normalizeIsoTimestamp(
    input.generatedAt,
    new Date().toISOString(),
    'generatedAt',
  );
  const artifactBundle = input.artifactBundle ?? null;
  const gatePlanner = input.gatePlanner ?? null;
  const patches = Object.freeze(
    [...(artifactBundle?.artifacts ?? [])]
      .map((artifact) => createPatchDraft({ artifact, gatePlanner }))
      .sort((left, right) =>
        left.actionSurface.localeCompare(right.actionSurface) ||
        left.artifactKind.localeCompare(right.artifactKind)
      ),
  );
  const status: PolicyFoundryReviewOnlyPatchPackStatus =
    patches.length === 0 ? 'no-artifacts' : 'requires-review';
  const targetKinds = Object.freeze([...new Set(patches.map((patch) => patch.targetKind))].sort());
  const artifactKinds = Object.freeze([...new Set(patches.map((patch) => patch.artifactKind))].sort());
  const payload: Omit<PolicyFoundryReviewOnlyPatchPack, 'canonical' | 'digest'> = {
    version: POLICY_FOUNDRY_REVIEW_ONLY_PATCH_PACK_VERSION,
    generatedAt,
    status,
    sourceDigests: {
      artifactBundleDigest: artifactBundle?.digest ?? null,
      gatePlannerDigest: gatePlanner?.digest ?? null,
    },
    patchCount: patches.length,
    targetKinds,
    artifactKinds,
    patches,
    safeAutomations: Object.freeze([
      'render-review-drafts',
      'render-checklists',
      'bind-source-digests',
    ]),
    approvalGatedAutomations: Object.freeze([
      'apply-customer-code-change',
      'configure-gateway-or-sidecar',
      'wire-provider-connector',
      'move-or-rotate-credential',
    ]),
    prohibitedAutomations: Object.freeze([
      'auto-apply-patch',
      'auto-deploy-infrastructure',
      'issue-credential',
      'activate-enforcement',
      'claim-non-bypassable-from-draft',
    ]),
    nextSafeStep: nextSafeStep(status),
    approvalRequired: true,
    autoEnforce: false,
    rawPayloadStored: false,
    productionReady: false,
    appliesPatches: false,
    deploysInfrastructure: false,
    issuesCredentials: false,
    activatesEnforcement: false,
    nonBypassableClaimAllowed: false,
    reviewMaterialOnly: true,
    dataMinimizationPolicyVersion: CONSEQUENCE_DATA_MINIMIZATION_REDACTION_POLICY_VERSION,
    dataMinimizationSurfaceKind: 'policy-foundry-review-only-patch-pack',
    limitation:
      'Review-only patch packs are draft guidance. They do not apply code, deploy infrastructure, issue credentials, activate enforcement, or prove non-bypassability.',
  };
  const canonical = canonicalObject(payload as unknown as CanonicalReleaseJsonValue);
  return Object.freeze({
    ...payload,
    canonical: canonical.canonical,
    digest: canonical.digest,
  });
}

export function policyFoundryReviewOnlyPatchPackDescriptor(): PolicyFoundryReviewOnlyPatchPackDescriptor {
  return Object.freeze({
    version: POLICY_FOUNDRY_REVIEW_ONLY_PATCH_PACK_VERSION,
    targetKinds: POLICY_FOUNDRY_REVIEW_PATCH_TARGET_KINDS,
    changeKinds: POLICY_FOUNDRY_REVIEW_PATCH_CHANGE_KINDS,
    statuses: POLICY_FOUNDRY_REVIEW_PATCH_PACK_STATUSES,
    approvalRequired: true,
    autoEnforce: false,
    rawPayloadStored: false,
    productionReady: false,
    appliesPatches: false,
    deploysInfrastructure: false,
    issuesCredentials: false,
    activatesEnforcement: false,
    nonBypassableClaimAllowed: false,
    reviewMaterialOnly: true,
    dataMinimizationPolicyVersion: CONSEQUENCE_DATA_MINIMIZATION_REDACTION_POLICY_VERSION,
    dataMinimizationSurfaceKind: 'policy-foundry-review-only-patch-pack',
  });
}
