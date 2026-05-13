import { createHash } from 'node:crypto';
import {
  canonicalizeReleaseJson,
  type CanonicalReleaseJsonValue,
} from '../release-kernel/release-canonicalization.js';
import {
  createActionSurfaceOnboardingPacket,
  type ActionSurfaceOnboardingManifestInput,
  type ActionSurfaceOnboardingPacket,
  type ActionSurfaceOnboardingReadinessOverride,
} from './action-surface-onboarding-packet.js';
import type {
  ActionSurfaceDeclaration,
} from './action-surface-profiler.js';
import {
  createActionSurfaceOnboardingRedTeamFixtureBundle,
  type ActionSurfaceOnboardingRedTeamFixtureBundle,
} from './action-surface-onboarding-red-team-fixtures.js';
import {
  createActionSurfaceOnboardingReviewHandoff,
  type ActionSurfaceOnboardingReviewHandoff,
} from './action-surface-onboarding-review-handoff.js';
import {
  CONSEQUENCE_DATA_MINIMIZATION_REDACTION_POLICY_VERSION,
} from './data-minimization-redaction-policy.js';
import type {
  ShadowAdmissionEvent,
} from './shadow-events.js';
import {
  createPolicyFoundryCoverageScore,
  type PolicyFoundryCoverageScore,
} from './policy-foundry-coverage-score.js';
import {
  createPolicyFoundryGatePlanner,
  type PolicyFoundryGatePlanner,
} from './policy-foundry-gate-planner.js';
import {
  createPolicyFoundryOnboardingSession,
  type PolicyFoundryOnboardingSession,
} from './policy-foundry-onboarding-session.js';
import {
  createPolicyFoundryReviewOnlyPatchPack,
  type PolicyFoundryReviewOnlyPatchPack,
} from './policy-foundry-review-only-patch-pack.js';

export const POLICY_FOUNDRY_SELF_ONBOARDING_CLI_VERSION =
  'attestor.policy-foundry-self-onboarding-cli.v1';

export const POLICY_FOUNDRY_SELF_ONBOARDING_CLI_STATUSES = [
  'no-input',
  'blocked',
  'review-material-ready',
] as const;
export type PolicyFoundrySelfOnboardingCliStatus =
  typeof POLICY_FOUNDRY_SELF_ONBOARDING_CLI_STATUSES[number];

export interface CreatePolicyFoundrySelfOnboardingCliPacketInput {
  readonly generatedAt?: string | null;
  readonly sessionId?: string | null;
  readonly tenantId?: string | null;
  readonly reviewerRef?: string | null;
  readonly attestorBaseUrl?: string | null;
  readonly manifests?: readonly ActionSurfaceOnboardingManifestInput[] | null;
  readonly declarations?: readonly ActionSurfaceDeclaration[] | null;
  readonly events?: readonly ShadowAdmissionEvent[] | null;
  readonly readinessOverrides?: readonly ActionSurfaceOnboardingReadinessOverride[] | null;
}

export interface PolicyFoundrySelfOnboardingCliPacketSourceDigests {
  readonly onboardingPacketDigest: string;
  readonly onboardingSessionDigest: string;
  readonly coverageScoreDigest: string;
  readonly gatePlannerDigest: string;
  readonly reviewHandoffDigest: string;
  readonly redTeamFixtureDigest: string;
  readonly reviewOnlyPatchPackDigest: string;
}

export interface PolicyFoundrySelfOnboardingCliPacket {
  readonly version: typeof POLICY_FOUNDRY_SELF_ONBOARDING_CLI_VERSION;
  readonly generatedAt: string;
  readonly status: PolicyFoundrySelfOnboardingCliStatus;
  readonly sourceDigests: PolicyFoundrySelfOnboardingCliPacketSourceDigests;
  readonly surfaceCount: number;
  readonly shadowEventCount: number;
  readonly coverageScore: number;
  readonly gatePlanStatus: PolicyFoundryGatePlanner['status'];
  readonly patchCount: number;
  readonly redTeamCaseCount: number;
  readonly blockerCount: number;
  readonly blockers: readonly string[];
  readonly nextSafeStep: string;
  readonly onboardingPacket: ActionSurfaceOnboardingPacket;
  readonly onboardingSession: PolicyFoundryOnboardingSession;
  readonly coverage: PolicyFoundryCoverageScore;
  readonly gatePlanner: PolicyFoundryGatePlanner;
  readonly reviewHandoff: ActionSurfaceOnboardingReviewHandoff;
  readonly redTeamFixtures: ActionSurfaceOnboardingRedTeamFixtureBundle;
  readonly reviewOnlyPatchPack: PolicyFoundryReviewOnlyPatchPack;
  readonly approvalRequired: true;
  readonly autoEnforce: false;
  readonly rawPayloadStored: false;
  readonly productionReady: false;
  readonly executionPlanOnly: true;
  readonly appliesPatches: false;
  readonly deploysInfrastructure: false;
  readonly issuesCredentials: false;
  readonly activatesEnforcement: false;
  readonly nonBypassableClaimAllowed: false;
  readonly reviewMaterialOnly: true;
  readonly dataMinimizationPolicyVersion: typeof CONSEQUENCE_DATA_MINIMIZATION_REDACTION_POLICY_VERSION;
  readonly dataMinimizationSurfaceKind: 'policy-foundry-self-onboarding-cli';
  readonly limitations: readonly string[];
  readonly canonical: string;
  readonly digest: string;
}

export interface PolicyFoundrySelfOnboardingCliDescriptor {
  readonly version: typeof POLICY_FOUNDRY_SELF_ONBOARDING_CLI_VERSION;
  readonly statuses: typeof POLICY_FOUNDRY_SELF_ONBOARDING_CLI_STATUSES;
  readonly approvalRequired: true;
  readonly autoEnforce: false;
  readonly rawPayloadStored: false;
  readonly productionReady: false;
  readonly executionPlanOnly: true;
  readonly appliesPatches: false;
  readonly deploysInfrastructure: false;
  readonly issuesCredentials: false;
  readonly activatesEnforcement: false;
  readonly nonBypassableClaimAllowed: false;
  readonly reviewMaterialOnly: true;
  readonly dataMinimizationPolicyVersion: typeof CONSEQUENCE_DATA_MINIMIZATION_REDACTION_POLICY_VERSION;
  readonly dataMinimizationSurfaceKind: 'policy-foundry-self-onboarding-cli';
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
    throw new Error(`Policy Foundry self-onboarding CLI ${fieldName} must be an ISO timestamp.`);
  }
  return timestamp.toISOString();
}

function collectBlockers(input: {
  readonly packet: ActionSurfaceOnboardingPacket;
  readonly session: PolicyFoundryOnboardingSession;
  readonly coverage: PolicyFoundryCoverageScore;
  readonly gatePlanner: PolicyFoundryGatePlanner;
  readonly handoff: ActionSurfaceOnboardingReviewHandoff;
  readonly patchPack: PolicyFoundryReviewOnlyPatchPack;
}): readonly string[] {
  const blockers = new Set<string>();
  if (input.packet.profileCount === 0) blockers.add('packet:no-action-surfaces-discovered');
  for (const requirement of input.session.currentlyDue) blockers.add(`session:${requirement}`);
  for (const dimension of input.coverage.blockedDimensions) blockers.add(`coverage:${dimension}`);
  for (const plan of input.gatePlanner.plans) {
    for (const work of plan.requiredCustomerWork) {
      blockers.add(`gate:${plan.actionSurface ?? 'session'}:${work}`);
    }
  }
  for (const blocker of input.handoff.remainingBlockers) blockers.add(`handoff:${blocker}`);
  if (input.patchPack.status === 'no-artifacts') blockers.add('patch-pack:no-artifacts');
  return Object.freeze([...blockers].sort());
}

function packetStatus(input: {
  readonly packet: ActionSurfaceOnboardingPacket;
  readonly blockers: readonly string[];
}): PolicyFoundrySelfOnboardingCliStatus {
  if (input.packet.profileCount === 0) return 'no-input';
  return input.blockers.length > 0 ? 'blocked' : 'review-material-ready';
}

function nextSafeStep(input: {
  readonly status: PolicyFoundrySelfOnboardingCliStatus;
  readonly session: PolicyFoundryOnboardingSession;
  readonly coverage: PolicyFoundryCoverageScore;
  readonly gatePlanner: PolicyFoundryGatePlanner;
  readonly handoff: ActionSurfaceOnboardingReviewHandoff;
  readonly patchPack: PolicyFoundryReviewOnlyPatchPack;
}): string {
  if (input.status === 'no-input') {
    return 'Provide at least one customer-owned manifest, declaration, or shadow event file.';
  }
  if (input.session.currentlyDueCount > 0) return input.session.nextSafeStep;
  if (input.coverage.blockedDimensions.length > 0) return input.coverage.nextCoverageStep;
  if (input.handoff.remainingBlockers.length > 0) return input.handoff.nextReviewSteps[0] ?? input.handoff.limitations[0]!;
  if (input.patchPack.status === 'no-artifacts') return input.patchPack.nextSafeStep;
  return input.gatePlanner.nextSafeStep;
}

export function createPolicyFoundrySelfOnboardingCliPacket(
  input: CreatePolicyFoundrySelfOnboardingCliPacketInput,
): PolicyFoundrySelfOnboardingCliPacket {
  const generatedAt = normalizeIsoTimestamp(
    input.generatedAt,
    new Date().toISOString(),
    'generatedAt',
  );
  const onboardingPacket = createActionSurfaceOnboardingPacket({
    generatedAt,
    attestorBaseUrl: input.attestorBaseUrl,
    manifests: input.manifests,
    declarations: input.declarations,
    events: input.events,
    readinessOverrides: input.readinessOverrides,
  });
  const onboardingSession = createPolicyFoundryOnboardingSession({
    generatedAt,
    sessionId: input.sessionId,
    tenantId: input.tenantId,
    onboardingPacket,
    integrationReadiness: onboardingPacket.readinessResults,
  });
  const coverage = createPolicyFoundryCoverageScore({
    generatedAt,
    session: onboardingSession,
    onboardingPacket,
    integrationReadiness: onboardingPacket.readinessResults,
  });
  const gatePlanner = createPolicyFoundryGatePlanner({
    generatedAt,
    coverage,
    onboardingPacket,
    integrationReadiness: onboardingPacket.readinessResults,
  });
  const reviewHandoff = createActionSurfaceOnboardingReviewHandoff({
    generatedAt,
    reviewerRef: input.reviewerRef,
    packet: onboardingPacket,
  });
  const redTeamFixtures = createActionSurfaceOnboardingRedTeamFixtureBundle({
    generatedAt,
    packet: onboardingPacket,
  });
  const reviewOnlyPatchPack = createPolicyFoundryReviewOnlyPatchPack({
    generatedAt,
    artifactBundle: onboardingPacket.artifactBundle,
    gatePlanner,
  });
  const blockers = collectBlockers({
    packet: onboardingPacket,
    session: onboardingSession,
    coverage,
    gatePlanner,
    handoff: reviewHandoff,
    patchPack: reviewOnlyPatchPack,
  });
  const status = packetStatus({ packet: onboardingPacket, blockers });
  const body = {
    version: POLICY_FOUNDRY_SELF_ONBOARDING_CLI_VERSION,
    generatedAt,
    status,
    sourceDigests: {
      onboardingPacketDigest: onboardingPacket.digest,
      onboardingSessionDigest: onboardingSession.digest,
      coverageScoreDigest: coverage.digest,
      gatePlannerDigest: gatePlanner.digest,
      reviewHandoffDigest: reviewHandoff.digest,
      redTeamFixtureDigest: redTeamFixtures.digest,
      reviewOnlyPatchPackDigest: reviewOnlyPatchPack.digest,
    },
    surfaceCount: onboardingPacket.profileCount,
    shadowEventCount: onboardingPacket.eventCount,
    coverageScore: coverage.score,
    gatePlanStatus: gatePlanner.status,
    patchCount: reviewOnlyPatchPack.patchCount,
    redTeamCaseCount: redTeamFixtures.caseCount,
    blockerCount: blockers.length,
    blockers,
    nextSafeStep: nextSafeStep({
      status,
      session: onboardingSession,
      coverage,
      gatePlanner,
      handoff: reviewHandoff,
      patchPack: reviewOnlyPatchPack,
    }),
    onboardingPacket,
    onboardingSession,
    coverage,
    gatePlanner,
    reviewHandoff,
    redTeamFixtures,
    reviewOnlyPatchPack,
    approvalRequired: true,
    autoEnforce: false,
    rawPayloadStored: false,
    productionReady: false,
    executionPlanOnly: true,
    appliesPatches: false,
    deploysInfrastructure: false,
    issuesCredentials: false,
    activatesEnforcement: false,
    nonBypassableClaimAllowed: false,
    reviewMaterialOnly: true,
    dataMinimizationPolicyVersion: CONSEQUENCE_DATA_MINIMIZATION_REDACTION_POLICY_VERSION,
    dataMinimizationSurfaceKind: 'policy-foundry-self-onboarding-cli',
    limitations: Object.freeze([
      'This one-command packet renders review material from customer-owned inputs only.',
      'It does not apply patches, deploy infrastructure, issue credentials, activate enforcement, or prove production readiness.',
      'Non-bypassable claims require separate downstream deployment evidence, smoke tests, and customer approval.',
    ]),
  } as const;
  const canonical = canonicalObject(body as unknown as CanonicalReleaseJsonValue);
  return Object.freeze({
    ...body,
    canonical: canonical.canonical,
    digest: canonical.digest,
  });
}

export function policyFoundrySelfOnboardingCliDescriptor(): PolicyFoundrySelfOnboardingCliDescriptor {
  return Object.freeze({
    version: POLICY_FOUNDRY_SELF_ONBOARDING_CLI_VERSION,
    statuses: POLICY_FOUNDRY_SELF_ONBOARDING_CLI_STATUSES,
    approvalRequired: true,
    autoEnforce: false,
    rawPayloadStored: false,
    productionReady: false,
    executionPlanOnly: true,
    appliesPatches: false,
    deploysInfrastructure: false,
    issuesCredentials: false,
    activatesEnforcement: false,
    nonBypassableClaimAllowed: false,
    reviewMaterialOnly: true,
    dataMinimizationPolicyVersion: CONSEQUENCE_DATA_MINIMIZATION_REDACTION_POLICY_VERSION,
    dataMinimizationSurfaceKind: 'policy-foundry-self-onboarding-cli',
  });
}
