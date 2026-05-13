import { createHash } from 'node:crypto';
import {
  canonicalizeReleaseJson,
  type CanonicalReleaseJsonValue,
} from '../release-kernel/release-canonicalization.js';
import {
  CONSEQUENCE_FAILURE_CONTROL_BINDINGS,
} from './failure-mode-control-bindings.js';
import {
  CONSEQUENCE_FAILURE_MODE_REGISTRY_ENTRIES,
  CONSEQUENCE_FAILURE_MODE_REGISTRY_VERSION,
  type ConsequenceFailureModeId,
} from './failure-mode-registry.js';
import {
  CONSEQUENCE_FAILURE_REPLAY_FIXTURE_MATRIX_VERSION,
  CONSEQUENCE_FAILURE_REPLAY_FIXTURES,
} from './failure-mode-replay-fixtures.js';
import type {
  PolicyFoundryCoverageScore,
} from './policy-foundry-coverage-score.js';
import type {
  PolicyFoundryReadinessEvaluation,
} from './policy-foundry-readiness.js';

export const POLICY_FOUNDRY_FAILURE_GAP_MAP_VERSION =
  'attestor.policy-foundry-failure-gap-map.v1';

export const POLICY_FOUNDRY_FAILURE_GAP_STATUSES = [
  'covered',
  'partial',
  'missing',
] as const;
export type PolicyFoundryFailureGapStatus =
  typeof POLICY_FOUNDRY_FAILURE_GAP_STATUSES[number];

export const POLICY_FOUNDRY_FAILURE_GAP_REASONS = [
  'control-missing',
  'evidence-missing',
  'authority-missing',
  'audit-record-missing',
  'replay-not-passed',
  'coverage-score-blocked',
  'readiness-no-go',
  'failure-mode-covered',
] as const;
export type PolicyFoundryFailureGapReason =
  typeof POLICY_FOUNDRY_FAILURE_GAP_REASONS[number];

export interface CreatePolicyFoundryFailureGapMapInput {
  readonly generatedAt?: string | null;
  readonly actionSurface?: string | null;
  readonly coverage?: PolicyFoundryCoverageScore | null;
  readonly readiness?: PolicyFoundryReadinessEvaluation | null;
  readonly coveredControls?: readonly string[] | null;
  readonly presentEvidence?: readonly string[] | null;
  readonly presentAuthority?: readonly string[] | null;
  readonly presentAuditRecords?: readonly string[] | null;
  readonly passedReplayFailureModeIds?: readonly ConsequenceFailureModeId[] | null;
}

export interface PolicyFoundryFailureGapEntry {
  readonly failureModeId: ConsequenceFailureModeId;
  readonly severity: string;
  readonly defaultDecision: string;
  readonly protectedPrinciples: readonly string[];
  readonly status: PolicyFoundryFailureGapStatus;
  readonly reasonCodes: readonly PolicyFoundryFailureGapReason[];
  readonly missingControls: readonly string[];
  readonly missingEvidence: readonly string[];
  readonly missingAuthority: readonly string[];
  readonly missingAuditRecords: readonly string[];
  readonly replayRequired: boolean;
  readonly replayPassed: boolean;
  readonly nextSafeStep: string;
}

export interface PolicyFoundryFailureGapMap {
  readonly version: typeof POLICY_FOUNDRY_FAILURE_GAP_MAP_VERSION;
  readonly generatedAt: string;
  readonly registryVersion: typeof CONSEQUENCE_FAILURE_MODE_REGISTRY_VERSION;
  readonly replayFixtureMatrixVersion: typeof CONSEQUENCE_FAILURE_REPLAY_FIXTURE_MATRIX_VERSION;
  readonly actionSurfaceDigest: string | null;
  readonly sourceDigests: {
    readonly coverageDigest: string | null;
    readonly readinessDigest: string | null;
  };
  readonly failureModeCount: number;
  readonly coveredCount: number;
  readonly partialCount: number;
  readonly missingCount: number;
  readonly blockerGapCount: number;
  readonly entries: readonly PolicyFoundryFailureGapEntry[];
  readonly nextSafeStep: string;
  readonly approvalRequired: true;
  readonly autoEnforce: false;
  readonly rawPayloadStored: false;
  readonly productionReady: false;
  readonly activatesEnforcement: false;
  readonly reviewMaterialOnly: true;
  readonly dataMinimizationSurfaceKind: 'policy-foundry-failure-gap-map';
  readonly limitation: string;
  readonly canonical: string;
  readonly digest: string;
}

export interface PolicyFoundryFailureGapMapDescriptor {
  readonly version: typeof POLICY_FOUNDRY_FAILURE_GAP_MAP_VERSION;
  readonly statuses: typeof POLICY_FOUNDRY_FAILURE_GAP_STATUSES;
  readonly reasonCodes: typeof POLICY_FOUNDRY_FAILURE_GAP_REASONS;
  readonly registryVersion: typeof CONSEQUENCE_FAILURE_MODE_REGISTRY_VERSION;
  readonly replayFixtureMatrixVersion: typeof CONSEQUENCE_FAILURE_REPLAY_FIXTURE_MATRIX_VERSION;
  readonly mapsFailureModesToControls: true;
  readonly mapsMissingEvidence: true;
  readonly mapsMissingReplay: true;
  readonly approvalRequired: true;
  readonly autoEnforce: false;
  readonly rawPayloadStored: false;
  readonly productionReady: false;
  readonly activatesEnforcement: false;
  readonly reviewMaterialOnly: true;
  readonly dataMinimizationSurfaceKind: 'policy-foundry-failure-gap-map';
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

function normalizeIsoTimestamp(value: string | null | undefined): string {
  const parsed = new Date(value ?? new Date(0).toISOString());
  if (Number.isNaN(parsed.getTime())) {
    throw new Error('Policy Foundry failure gap map generatedAt must be an ISO timestamp.');
  }
  return parsed.toISOString();
}

function normalizeOptionalString(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : null;
}

function digestText(value: string): string {
  return `sha256:${createHash('sha256').update(value).digest('hex')}`;
}

function uniqueSorted(values: readonly string[]): readonly string[] {
  return Object.freeze([...new Set(values.filter((value) => value.length > 0))].sort());
}

function hasAll(required: readonly string[], present: ReadonlySet<string>): readonly string[] {
  return uniqueSorted(required.filter((item) => !present.has(item)));
}

function replayExistsFor(failureModeId: ConsequenceFailureModeId): boolean {
  return CONSEQUENCE_FAILURE_REPLAY_FIXTURES.some((fixture) =>
    fixture.failureModeId === failureModeId
  );
}

function nextSafeStepFor(input: {
  readonly missingControls: readonly string[];
  readonly missingEvidence: readonly string[];
  readonly missingAuthority: readonly string[];
  readonly missingAuditRecords: readonly string[];
  readonly replayRequired: boolean;
  readonly replayPassed: boolean;
  readonly coverageBlocked: boolean;
  readonly readinessBlocked: boolean;
}): string {
  if (input.coverageBlocked) return 'Close blocked Policy Foundry coverage dimensions before rollout review.';
  if (input.readinessBlocked) return 'Resolve Policy Foundry readiness no-go reasons before promotion.';
  if (input.missingControls.length > 0) return `Implement or bind control: ${input.missingControls[0]}.`;
  if (input.missingEvidence.length > 0) return `Provide evidence: ${input.missingEvidence[0]}.`;
  if (input.missingAuthority.length > 0) return `Bind authority source: ${input.missingAuthority[0]}.`;
  if (input.missingAuditRecords.length > 0) return `Add audit record: ${input.missingAuditRecords[0]}.`;
  if (input.replayRequired && !input.replayPassed) return 'Run and pass the mapped replay fixture.';
  return 'No gap detected for this failure mode.';
}

export function createPolicyFoundryFailureGapMap(
  input: CreatePolicyFoundryFailureGapMapInput,
): PolicyFoundryFailureGapMap {
  const generatedAt = normalizeIsoTimestamp(input.generatedAt);
  const actionSurface = normalizeOptionalString(input.actionSurface);
  const coveredControls = new Set(input.coveredControls ?? []);
  const presentEvidence = new Set(input.presentEvidence ?? []);
  const presentAuthority = new Set(input.presentAuthority ?? []);
  const presentAuditRecords = new Set(input.presentAuditRecords ?? []);
  const passedReplayFailureModeIds = new Set(input.passedReplayFailureModeIds ?? []);
  const coverageBlocked = (input.coverage?.blockedDimensions.length ?? 0) > 0;
  const readinessBlocked = (input.readiness?.noGoReasons.length ?? 0) > 0;

  const entries = Object.freeze(CONSEQUENCE_FAILURE_MODE_REGISTRY_ENTRIES.map((failureMode) => {
    const binding = CONSEQUENCE_FAILURE_CONTROL_BINDINGS.find((item) =>
      item.failureModeId === failureMode.id
    );
    if (!binding) {
      throw new Error(`Missing control binding for failure mode: ${failureMode.id}`);
    }
    const missingControls = hasAll(binding.controlIds, coveredControls);
    const missingEvidence = hasAll(binding.requiredEvidence, presentEvidence);
    const missingAuthority = hasAll(binding.requiredAuthority, presentAuthority);
    const missingAuditRecords = hasAll(binding.requiredAuditRecords, presentAuditRecords);
    const replayRequired = binding.replayRequired && replayExistsFor(failureMode.id);
    const replayPassed = !replayRequired || passedReplayFailureModeIds.has(failureMode.id);
    const reasonCodes: PolicyFoundryFailureGapReason[] = [];

    if (missingControls.length > 0) reasonCodes.push('control-missing');
    if (missingEvidence.length > 0) reasonCodes.push('evidence-missing');
    if (missingAuthority.length > 0) reasonCodes.push('authority-missing');
    if (missingAuditRecords.length > 0) reasonCodes.push('audit-record-missing');
    if (!replayPassed) reasonCodes.push('replay-not-passed');
    if (coverageBlocked) reasonCodes.push('coverage-score-blocked');
    if (readinessBlocked) reasonCodes.push('readiness-no-go');

    const status: PolicyFoundryFailureGapStatus =
      reasonCodes.length === 0
        ? 'covered'
        : (
            missingControls.length === binding.controlIds.length ||
            missingEvidence.length === binding.requiredEvidence.length ||
            missingAuthority.length === binding.requiredAuthority.length
          )
          ? 'missing'
          : 'partial';

    return Object.freeze({
      failureModeId: failureMode.id,
      severity: failureMode.severity,
      defaultDecision: failureMode.defaultDecision,
      protectedPrinciples: failureMode.protectedPrinciples,
      status,
      reasonCodes: uniqueSorted(
        reasonCodes.length > 0 ? reasonCodes : ['failure-mode-covered'],
      ) as readonly PolicyFoundryFailureGapReason[],
      missingControls,
      missingEvidence,
      missingAuthority,
      missingAuditRecords,
      replayRequired,
      replayPassed,
      nextSafeStep: nextSafeStepFor({
        missingControls,
        missingEvidence,
        missingAuthority,
        missingAuditRecords,
        replayRequired,
        replayPassed,
        coverageBlocked,
        readinessBlocked,
      }),
    });
  }));

  const coveredCount = entries.filter((entry) => entry.status === 'covered').length;
  const partialCount = entries.filter((entry) => entry.status === 'partial').length;
  const missingCount = entries.filter((entry) => entry.status === 'missing').length;
  const blockerGapCount = entries.filter((entry) =>
    entry.severity === 'blocker' && entry.status !== 'covered'
  ).length;
  const nextSafeStep =
    missingCount > 0
      ? 'Close missing failure-mode controls before rollout.'
      : partialCount > 0
        ? 'Close partial failure-mode gaps before enforce mode.'
        : 'Failure-mode gap map has no detected gaps; keep replay evidence current.';
  const payload = {
    version: POLICY_FOUNDRY_FAILURE_GAP_MAP_VERSION,
    generatedAt,
    registryVersion: CONSEQUENCE_FAILURE_MODE_REGISTRY_VERSION,
    replayFixtureMatrixVersion: CONSEQUENCE_FAILURE_REPLAY_FIXTURE_MATRIX_VERSION,
    actionSurfaceDigest: actionSurface ? digestText(actionSurface) : null,
    sourceDigests: {
      coverageDigest: input.coverage?.digest ?? null,
      readinessDigest: input.readiness?.digest ?? null,
    },
    failureModeCount: entries.length,
    coveredCount,
    partialCount,
    missingCount,
    blockerGapCount,
    entries,
    nextSafeStep,
    approvalRequired: true,
    autoEnforce: false,
    rawPayloadStored: false,
    productionReady: false,
    activatesEnforcement: false,
    reviewMaterialOnly: true,
    dataMinimizationSurfaceKind: 'policy-foundry-failure-gap-map',
    limitation:
      'This map normalizes supplied Policy Foundry control, evidence, authority, audit, and replay coverage. It does not prove live customer workflow integration or production readiness.',
  } as const;
  const { canonical, digest } = canonicalObject(payload as unknown as CanonicalReleaseJsonValue);

  return Object.freeze({
    ...payload,
    canonical,
    digest,
  });
}

export function policyFoundryFailureGapMapDescriptor():
PolicyFoundryFailureGapMapDescriptor {
  return Object.freeze({
    version: POLICY_FOUNDRY_FAILURE_GAP_MAP_VERSION,
    statuses: POLICY_FOUNDRY_FAILURE_GAP_STATUSES,
    reasonCodes: POLICY_FOUNDRY_FAILURE_GAP_REASONS,
    registryVersion: CONSEQUENCE_FAILURE_MODE_REGISTRY_VERSION,
    replayFixtureMatrixVersion: CONSEQUENCE_FAILURE_REPLAY_FIXTURE_MATRIX_VERSION,
    mapsFailureModesToControls: true,
    mapsMissingEvidence: true,
    mapsMissingReplay: true,
    approvalRequired: true,
    autoEnforce: false,
    rawPayloadStored: false,
    productionReady: false,
    activatesEnforcement: false,
    reviewMaterialOnly: true,
    dataMinimizationSurfaceKind: 'policy-foundry-failure-gap-map',
  });
}
