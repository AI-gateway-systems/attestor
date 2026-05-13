import { createHash } from 'node:crypto';
import {
  canonicalizeReleaseJson,
  type CanonicalReleaseJsonValue,
} from '../release-kernel/release-canonicalization.js';
import {
  CONSEQUENCE_FAILURE_CONTROL_BINDINGS,
  type ConsequenceFailureControlBinding,
} from './failure-mode-control-bindings.js';

export const CONSEQUENCE_SCOPE_EXPLOSION_GUARD_VERSION =
  'attestor.consequence-scope-explosion-guard.v1';

export const CONSEQUENCE_SCOPE_EXPLOSION_OUTCOMES = [
  'pass',
  'narrow',
  'review',
  'block',
] as const;
export type ConsequenceScopeExplosionOutcome =
  typeof CONSEQUENCE_SCOPE_EXPLOSION_OUTCOMES[number];

export const CONSEQUENCE_SCOPE_EXPLOSION_DIMENSIONS = [
  'amount',
  'record-count',
  'operation',
  'recipient',
  'tenant',
  'environment',
  'downstream-system',
  'data-class',
  'reversibility',
] as const;
export type ConsequenceScopeExplosionDimension =
  typeof CONSEQUENCE_SCOPE_EXPLOSION_DIMENSIONS[number];

export const CONSEQUENCE_SCOPE_EXPLOSION_OPERATION_TYPES = [
  'read',
  'write',
  'send',
  'refund',
  'pay',
  'delete',
  'deploy',
  'admin',
  'unknown',
] as const;
export type ConsequenceScopeExplosionOperationType =
  typeof CONSEQUENCE_SCOPE_EXPLOSION_OPERATION_TYPES[number];

export const CONSEQUENCE_SCOPE_EXPLOSION_DATA_CLASSES = [
  'public',
  'customer-visible',
  'internal',
  'confidential',
  'regulated',
  'credential',
  'unknown',
] as const;
export type ConsequenceScopeExplosionDataClass =
  typeof CONSEQUENCE_SCOPE_EXPLOSION_DATA_CLASSES[number];

export const CONSEQUENCE_SCOPE_EXPLOSION_REVERSIBILITY_CLASSES = [
  'reversible',
  'compensating-action-available',
  'partially-reversible',
  'irreversible',
  'unknown',
] as const;
export type ConsequenceScopeExplosionReversibilityClass =
  typeof CONSEQUENCE_SCOPE_EXPLOSION_REVERSIBILITY_CLASSES[number];

export const CONSEQUENCE_SCOPE_EXPLOSION_REASON_CODES = [
  'requested-scope-missing',
  'approved-scope-missing',
  'scope-owner-policy-missing',
  'amount-exceeds-approved-scope',
  'record-count-exceeds-approved-scope',
  'operation-out-of-scope',
  'recipient-out-of-scope',
  'tenant-out-of-scope',
  'environment-out-of-scope',
  'downstream-system-out-of-scope',
  'data-class-out-of-scope',
  'irreversible-action-not-approved',
  'scope-narrowing-required',
  'scope-review-required',
  'scope-blocked',
  'scope-pass',
] as const;
export type ConsequenceScopeExplosionReasonCode =
  typeof CONSEQUENCE_SCOPE_EXPLOSION_REASON_CODES[number];

export interface ConsequenceScopeExplosionScopeInput {
  readonly amountMinorUnits?: number | null;
  readonly maxAmountMinorUnits?: number | null;
  readonly currency?: string | null;
  readonly recordCount?: number | null;
  readonly maxRecordCount?: number | null;
  readonly operationType?: ConsequenceScopeExplosionOperationType | null;
  readonly operationTypes?: readonly ConsequenceScopeExplosionOperationType[] | null;
  readonly recipientId?: string | null;
  readonly recipientIds?: readonly string[] | null;
  readonly tenantId?: string | null;
  readonly environment?: string | null;
  readonly environments?: readonly string[] | null;
  readonly downstreamSystem?: string | null;
  readonly downstreamSystems?: readonly string[] | null;
  readonly dataClass?: ConsequenceScopeExplosionDataClass | null;
  readonly dataClasses?: readonly ConsequenceScopeExplosionDataClass[] | null;
  readonly reversibilityClass?: ConsequenceScopeExplosionReversibilityClass | null;
  readonly reversibilityClasses?:
    readonly ConsequenceScopeExplosionReversibilityClass[] | null;
}

export interface EvaluateConsequenceScopeExplosionInput {
  readonly generatedAt?: string | null;
  readonly actionSurface?: string | null;
  readonly action?: string | null;
  readonly scopeOwnerPolicyRef?: string | null;
  readonly requestedScope?: ConsequenceScopeExplosionScopeInput | null;
  readonly approvedScope?: ConsequenceScopeExplosionScopeInput | null;
}

export interface ConsequenceScopeExplosionConstraint {
  readonly dimension: ConsequenceScopeExplosionDimension;
  readonly reasonCode: ConsequenceScopeExplosionReasonCode;
  readonly constraintDigest: string;
  readonly safeSummary: string;
}

export interface ConsequenceScopeExplosionDecision {
  readonly version: typeof CONSEQUENCE_SCOPE_EXPLOSION_GUARD_VERSION;
  readonly generatedAt: string;
  readonly actionSurface?: string;
  readonly action?: string;
  readonly outcome: ConsequenceScopeExplosionOutcome;
  readonly allowed: boolean;
  readonly failClosed: boolean;
  readonly reasonCodes: readonly ConsequenceScopeExplosionReasonCode[];
  readonly failureModeId: 'scope-explosion';
  readonly invariantIds: readonly [
    'scope-cannot-exceed-approved-boundary',
    'downstream-side-effects-must-be-declared',
    'review-or-block-cannot-auto-promote',
  ];
  readonly protectedPrinciples: readonly [
    'customer authority',
    'fail-closed boundary',
    'operational boundedness',
  ];
  readonly requiredControls: readonly string[];
  readonly requiredEvidence: readonly string[];
  readonly requiredAuthoritySources: readonly string[];
  readonly requiredAuditRecords: readonly string[];
  readonly observed: {
    readonly requestedScopeDigest: string | null;
    readonly approvedScopeDigest: string | null;
    readonly scopeOwnerPolicyDigest: string | null;
    readonly exceededDimensions: readonly ConsequenceScopeExplosionDimension[];
    readonly narrowingDimensions: readonly ConsequenceScopeExplosionDimension[];
    readonly blockingDimensions: readonly ConsequenceScopeExplosionDimension[];
    readonly reviewDimensions: readonly ConsequenceScopeExplosionDimension[];
    readonly currency: string | null;
  };
  readonly constraints: readonly ConsequenceScopeExplosionConstraint[];
  readonly approvalRequired: true;
  readonly autoEnforce: false;
  readonly rawPayloadStored: false;
  readonly productionReady: false;
  readonly activatesEnforcement: false;
  readonly digestOnly: true;
  readonly limitation: string;
  readonly canonical: string;
  readonly digest: string;
}

export interface ConsequenceScopeExplosionGuardDescriptor {
  readonly version: typeof CONSEQUENCE_SCOPE_EXPLOSION_GUARD_VERSION;
  readonly failureModeId: 'scope-explosion';
  readonly outcomes: typeof CONSEQUENCE_SCOPE_EXPLOSION_OUTCOMES;
  readonly dimensions: typeof CONSEQUENCE_SCOPE_EXPLOSION_DIMENSIONS;
  readonly operationTypes: typeof CONSEQUENCE_SCOPE_EXPLOSION_OPERATION_TYPES;
  readonly dataClasses: typeof CONSEQUENCE_SCOPE_EXPLOSION_DATA_CLASSES;
  readonly reversibilityClasses: typeof CONSEQUENCE_SCOPE_EXPLOSION_REVERSIBILITY_CLASSES;
  readonly comparesRequestedVsApprovedScope: true;
  readonly emitsNarrowingConstraints: true;
  readonly storesRawScopeValues: false;
  readonly digestOnly: true;
  readonly approvalRequired: true;
  readonly autoEnforce: false;
  readonly productionReady: false;
  readonly activatesEnforcement: false;
}

const NARROW_REASON_BY_DIMENSION: Readonly<
  Partial<Record<ConsequenceScopeExplosionDimension, ConsequenceScopeExplosionReasonCode>>
> = Object.freeze({
  amount: 'amount-exceeds-approved-scope',
  'record-count': 'record-count-exceeds-approved-scope',
  recipient: 'recipient-out-of-scope',
  environment: 'environment-out-of-scope',
  'downstream-system': 'downstream-system-out-of-scope',
});

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

function digestText(value: string): string {
  return `sha256:${createHash('sha256').update(value).digest('hex')}`;
}

function digestObject(value: CanonicalReleaseJsonValue): string {
  return canonicalObject(value).digest;
}

function readonlyCopy<T>(items: readonly T[]): readonly T[] {
  return Object.freeze([...items]);
}

function uniqueSorted<T extends string>(items: readonly T[]): readonly T[] {
  return Object.freeze([...new Set(items)].sort());
}

function normalizeTimestamp(value: string | null | undefined, fallback: string): string {
  const timestamp = new Date(value ?? fallback);
  if (Number.isNaN(timestamp.getTime())) {
    throw new Error('Scope explosion guard generatedAt must be an ISO timestamp.');
  }
  return timestamp.toISOString();
}

function normalizeString(value: string | null | undefined): string | null {
  const normalized = value?.trim();
  return normalized && normalized.length > 0 ? normalized : null;
}

function normalizeStringList(values: readonly string[] | null | undefined): readonly string[] {
  return uniqueSorted((values ?? []).map((value) => value.trim()).filter((value) => value.length > 0));
}

function normalizeNumber(value: number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  if (!Number.isFinite(value) || value < 0) return null;
  return Math.floor(value);
}

function normalizeScope(
  scope: ConsequenceScopeExplosionScopeInput | null | undefined,
): ConsequenceScopeExplosionScopeInput | null {
  if (!scope) return null;
  return Object.freeze({
    amountMinorUnits: normalizeNumber(scope.amountMinorUnits),
    maxAmountMinorUnits: normalizeNumber(scope.maxAmountMinorUnits),
    currency: normalizeString(scope.currency)?.toLowerCase() ?? null,
    recordCount: normalizeNumber(scope.recordCount),
    maxRecordCount: normalizeNumber(scope.maxRecordCount),
    operationType: scope.operationType ?? null,
    operationTypes: uniqueSorted(scope.operationTypes ?? []),
    recipientId: normalizeString(scope.recipientId),
    recipientIds: normalizeStringList(scope.recipientIds),
    tenantId: normalizeString(scope.tenantId),
    environment: normalizeString(scope.environment)?.toLowerCase() ?? null,
    environments: normalizeStringList(scope.environments).map((value) => value.toLowerCase()),
    downstreamSystem: normalizeString(scope.downstreamSystem),
    downstreamSystems: normalizeStringList(scope.downstreamSystems),
    dataClass: scope.dataClass ?? null,
    dataClasses: uniqueSorted(scope.dataClasses ?? []),
    reversibilityClass: scope.reversibilityClass ?? null,
    reversibilityClasses: uniqueSorted(scope.reversibilityClasses ?? []),
  });
}

function binding(): ConsequenceFailureControlBinding {
  const found = CONSEQUENCE_FAILURE_CONTROL_BINDINGS.find((item) =>
    item.failureModeId === 'scope-explosion'
  );
  if (!found) {
    throw new Error('Missing control binding for scope-explosion.');
  }
  return found;
}

function includesValue<T extends string>(values: readonly T[] | undefined | null, value: T | null | undefined): boolean {
  return value !== null && value !== undefined && (values ?? []).includes(value);
}

function evaluateScopeDiff(input: {
  readonly requested: ConsequenceScopeExplosionScopeInput | null;
  readonly approved: ConsequenceScopeExplosionScopeInput | null;
}): {
  readonly narrowingDimensions: readonly ConsequenceScopeExplosionDimension[];
  readonly blockingDimensions: readonly ConsequenceScopeExplosionDimension[];
  readonly reviewDimensions: readonly ConsequenceScopeExplosionDimension[];
  readonly reasonCodes: readonly ConsequenceScopeExplosionReasonCode[];
} {
  const narrowingDimensions: ConsequenceScopeExplosionDimension[] = [];
  const blockingDimensions: ConsequenceScopeExplosionDimension[] = [];
  const reviewDimensions: ConsequenceScopeExplosionDimension[] = [];
  const reasonCodes: ConsequenceScopeExplosionReasonCode[] = [];
  const { requested, approved } = input;

  if (!requested) {
    reasonCodes.push('requested-scope-missing');
    reviewDimensions.push('operation');
  }
  if (!approved) {
    reasonCodes.push('approved-scope-missing');
    reviewDimensions.push('operation');
  }
  if (!requested || !approved) {
    return {
      narrowingDimensions,
      blockingDimensions,
      reviewDimensions,
      reasonCodes,
    };
  }

  if (
    requested.amountMinorUnits !== null &&
    requested.amountMinorUnits !== undefined &&
    approved.maxAmountMinorUnits !== null &&
    approved.maxAmountMinorUnits !== undefined &&
    requested.amountMinorUnits > approved.maxAmountMinorUnits
  ) {
    narrowingDimensions.push('amount');
    reasonCodes.push('amount-exceeds-approved-scope');
  }
  if (
    requested.recordCount !== null &&
    requested.recordCount !== undefined &&
    approved.maxRecordCount !== null &&
    approved.maxRecordCount !== undefined &&
    requested.recordCount > approved.maxRecordCount
  ) {
    narrowingDimensions.push('record-count');
    reasonCodes.push('record-count-exceeds-approved-scope');
  }
  if (requested.operationType && approved.operationTypes?.length && !includesValue(approved.operationTypes, requested.operationType)) {
    blockingDimensions.push('operation');
    reasonCodes.push('operation-out-of-scope');
  }
  if (requested.recipientId && approved.recipientIds?.length && !approved.recipientIds.includes(requested.recipientId)) {
    narrowingDimensions.push('recipient');
    reasonCodes.push('recipient-out-of-scope');
  }
  if (requested.tenantId && approved.tenantId && requested.tenantId !== approved.tenantId) {
    blockingDimensions.push('tenant');
    reasonCodes.push('tenant-out-of-scope');
  }
  if (requested.environment && approved.environments?.length && !approved.environments.includes(requested.environment)) {
    narrowingDimensions.push('environment');
    reasonCodes.push('environment-out-of-scope');
  }
  if (requested.downstreamSystem && approved.downstreamSystems?.length && !approved.downstreamSystems.includes(requested.downstreamSystem)) {
    narrowingDimensions.push('downstream-system');
    reasonCodes.push('downstream-system-out-of-scope');
  }
  if (requested.dataClass && approved.dataClasses?.length && !includesValue(approved.dataClasses, requested.dataClass)) {
    blockingDimensions.push('data-class');
    reasonCodes.push('data-class-out-of-scope');
  }
  if (
    requested.reversibilityClass === 'irreversible' &&
    !includesValue(approved.reversibilityClasses, 'irreversible')
  ) {
    blockingDimensions.push('reversibility');
    reasonCodes.push('irreversible-action-not-approved');
  }

  return {
    narrowingDimensions,
    blockingDimensions,
    reviewDimensions,
    reasonCodes,
  };
}

function constraintFor(
  dimension: ConsequenceScopeExplosionDimension,
): ConsequenceScopeExplosionConstraint {
  const reasonCode = NARROW_REASON_BY_DIMENSION[dimension] ?? 'scope-narrowing-required';
  const payload = {
    dimension,
    reasonCode,
    version: CONSEQUENCE_SCOPE_EXPLOSION_GUARD_VERSION,
  } as const;
  return Object.freeze({
    dimension,
    reasonCode,
    constraintDigest: digestObject(payload),
    safeSummary: `Proceed only within the approved ${dimension} scope.`,
  });
}

export function evaluateConsequenceScopeExplosion(
  input: EvaluateConsequenceScopeExplosionInput,
): ConsequenceScopeExplosionDecision {
  const generatedAt = normalizeTimestamp(input.generatedAt, new Date(0).toISOString());
  const requestedScope = normalizeScope(input.requestedScope);
  const approvedScope = normalizeScope(input.approvedScope);
  const scopeOwnerPolicyRef = normalizeString(input.scopeOwnerPolicyRef);
  const diff = evaluateScopeDiff({ requested: requestedScope, approved: approvedScope });
  const reasonCodes: ConsequenceScopeExplosionReasonCode[] = [...diff.reasonCodes];

  if (!scopeOwnerPolicyRef) reasonCodes.push('scope-owner-policy-missing');

  const blockingDimensions = uniqueSorted(diff.blockingDimensions);
  const narrowingDimensions = uniqueSorted(diff.narrowingDimensions);
  const reviewDimensions = uniqueSorted(diff.reviewDimensions);
  const hasBlock = blockingDimensions.length > 0;
  const hasNarrow = narrowingDimensions.length > 0;
  const hasReview = reviewDimensions.length > 0 || reasonCodes.includes('scope-owner-policy-missing');
  const outcome: ConsequenceScopeExplosionOutcome = hasBlock
    ? 'block'
    : hasReview
      ? 'review'
      : hasNarrow
        ? 'narrow'
        : 'pass';
  const finalReasonCodes = uniqueSorted([
    ...reasonCodes,
    ...(outcome === 'block' ? ['scope-blocked' as const] : []),
    ...(outcome === 'review' ? ['scope-review-required' as const] : []),
    ...(outcome === 'narrow' ? ['scope-narrowing-required' as const] : []),
    ...(outcome === 'pass' ? ['scope-pass' as const] : []),
  ]);
  const controlBinding = binding();
  const constraints = outcome === 'narrow'
    ? readonlyCopy(narrowingDimensions.map((dimension) => constraintFor(dimension)))
    : Object.freeze([]);
  const payload = {
    version: CONSEQUENCE_SCOPE_EXPLOSION_GUARD_VERSION,
    generatedAt,
    ...(input.actionSurface ? { actionSurface: input.actionSurface } : {}),
    ...(input.action ? { action: input.action } : {}),
    outcome,
    allowed: outcome === 'pass' || outcome === 'narrow',
    failClosed: outcome === 'review' || outcome === 'block',
    reasonCodes: finalReasonCodes,
    failureModeId: 'scope-explosion',
    invariantIds: [
      'scope-cannot-exceed-approved-boundary',
      'downstream-side-effects-must-be-declared',
      'review-or-block-cannot-auto-promote',
    ] as const,
    protectedPrinciples: [
      'customer authority',
      'fail-closed boundary',
      'operational boundedness',
    ] as const,
    requiredControls: controlBinding.controlIds,
    requiredEvidence: controlBinding.requiredEvidence,
    requiredAuthoritySources: controlBinding.requiredAuthority,
    requiredAuditRecords: controlBinding.requiredAuditRecords,
    observed: {
      requestedScopeDigest: requestedScope
        ? digestObject(requestedScope as unknown as CanonicalReleaseJsonValue)
        : null,
      approvedScopeDigest: approvedScope
        ? digestObject(approvedScope as unknown as CanonicalReleaseJsonValue)
        : null,
      scopeOwnerPolicyDigest: scopeOwnerPolicyRef ? digestText(scopeOwnerPolicyRef) : null,
      exceededDimensions: uniqueSorted([...narrowingDimensions, ...blockingDimensions]),
      narrowingDimensions,
      blockingDimensions,
      reviewDimensions,
      currency: requestedScope?.currency ?? approvedScope?.currency ?? null,
    },
    constraints,
    approvalRequired: true,
    autoEnforce: false,
    rawPayloadStored: false,
    productionReady: false,
    activatesEnforcement: false,
    digestOnly: true,
    limitation:
      'This guard compares supplied requested and approved scope metadata. It does not prove every customer policy, downstream verifier, or domain pack enforces the returned constraints.',
  } as const;
  const { canonical, digest } = canonicalObject(payload as unknown as CanonicalReleaseJsonValue);
  return Object.freeze({
    ...payload,
    canonical,
    digest,
  });
}

export function consequenceScopeExplosionGuardDescriptor(): ConsequenceScopeExplosionGuardDescriptor {
  return Object.freeze({
    version: CONSEQUENCE_SCOPE_EXPLOSION_GUARD_VERSION,
    failureModeId: 'scope-explosion',
    outcomes: CONSEQUENCE_SCOPE_EXPLOSION_OUTCOMES,
    dimensions: CONSEQUENCE_SCOPE_EXPLOSION_DIMENSIONS,
    operationTypes: CONSEQUENCE_SCOPE_EXPLOSION_OPERATION_TYPES,
    dataClasses: CONSEQUENCE_SCOPE_EXPLOSION_DATA_CLASSES,
    reversibilityClasses: CONSEQUENCE_SCOPE_EXPLOSION_REVERSIBILITY_CLASSES,
    comparesRequestedVsApprovedScope: true,
    emitsNarrowingConstraints: true,
    storesRawScopeValues: false,
    digestOnly: true,
    approvalRequired: true,
    autoEnforce: false,
    productionReady: false,
    activatesEnforcement: false,
  });
}
