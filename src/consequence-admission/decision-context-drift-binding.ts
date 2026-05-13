import { createHash } from 'node:crypto';
import {
  canonicalizeReleaseJson,
  type CanonicalReleaseJsonValue,
} from '../release-kernel/release-canonicalization.js';
import {
  CONSEQUENCE_FAILURE_CONTROL_BINDINGS,
  type ConsequenceFailureControlBinding,
} from './failure-mode-control-bindings.js';

export const CONSEQUENCE_DECISION_CONTEXT_DRIFT_BINDING_VERSION =
  'attestor.consequence-decision-context-drift-binding.v1';

export const CONSEQUENCE_DECISION_CONTEXT_DRIFT_OUTCOMES = [
  'pass',
  'review',
  'block',
] as const;
export type ConsequenceDecisionContextDriftOutcome =
  typeof CONSEQUENCE_DECISION_CONTEXT_DRIFT_OUTCOMES[number];

export const CONSEQUENCE_DECISION_CONTEXT_DRIFT_DIMENSIONS = [
  'model',
  'tool-schema',
  'tool-manifest',
  'policy-version',
  'policy-digest',
  'config',
  'prompt',
  'verifier',
  'simulation',
] as const;
export type ConsequenceDecisionContextDriftDimension =
  typeof CONSEQUENCE_DECISION_CONTEXT_DRIFT_DIMENSIONS[number];

export const CONSEQUENCE_DECISION_CONTEXT_DRIFT_REASON_CODES = [
  'bound-context-missing',
  'current-context-missing',
  'model-version-missing',
  'current-model-version-missing',
  'model-version-drift',
  'tool-schema-digest-missing',
  'current-tool-schema-digest-missing',
  'tool-schema-digest-drift',
  'tool-manifest-digest-drift',
  'policy-version-missing',
  'current-policy-version-missing',
  'policy-version-drift',
  'policy-digest-drift',
  'config-digest-missing',
  'current-config-digest-missing',
  'config-digest-drift',
  'prompt-digest-drift',
  'verifier-digest-drift',
  'simulation-digest-missing',
  'simulation-refresh-required',
  'decision-context-expired',
  'decision-context-age-exceeded',
  'decision-context-pass',
  'decision-context-review',
  'decision-context-block',
] as const;
export type ConsequenceDecisionContextDriftReasonCode =
  typeof CONSEQUENCE_DECISION_CONTEXT_DRIFT_REASON_CODES[number];

export interface ConsequenceDecisionContextBindingContext {
  readonly modelVersion?: string | null;
  readonly toolSchemaDigest?: string | null;
  readonly toolManifestDigest?: string | null;
  readonly policyVersion?: string | null;
  readonly policyDigest?: string | null;
  readonly configDigest?: string | null;
  readonly promptDigest?: string | null;
  readonly verifierDigest?: string | null;
  readonly simulationDigest?: string | null;
  readonly evaluatedAt?: string | null;
  readonly expiresAt?: string | null;
}

export interface EvaluateConsequenceDecisionContextDriftInput {
  readonly generatedAt?: string | null;
  readonly actionSurface?: string | null;
  readonly action?: string | null;
  readonly boundContext?: ConsequenceDecisionContextBindingContext | null;
  readonly currentContext?: ConsequenceDecisionContextBindingContext | null;
  readonly requireSimulationRefresh?: boolean | null;
  readonly maxContextAgeHours?: number | null;
}

export interface ConsequenceDecisionContextDriftDecision {
  readonly version: typeof CONSEQUENCE_DECISION_CONTEXT_DRIFT_BINDING_VERSION;
  readonly generatedAt: string;
  readonly actionSurface?: string;
  readonly action?: string;
  readonly outcome: ConsequenceDecisionContextDriftOutcome;
  readonly allowed: boolean;
  readonly failClosed: boolean;
  readonly reasonCodes: readonly ConsequenceDecisionContextDriftReasonCode[];
  readonly failureModeId: 'model-tool-config-drift';
  readonly invariantIds: readonly [
    'decision-context-version-must-be-bound',
    'trusted-evidence-required',
    'review-or-block-cannot-auto-promote',
  ];
  readonly protectedPrinciples: readonly [
    'runtime readiness',
    'proof integrity',
    'auditability',
  ];
  readonly requiredControls: readonly string[];
  readonly requiredEvidence: readonly string[];
  readonly requiredAuthoritySources: readonly string[];
  readonly requiredAuditRecords: readonly string[];
  readonly observed: {
    readonly boundContextDigest: string | null;
    readonly currentContextDigest: string | null;
    readonly driftDimensions: readonly ConsequenceDecisionContextDriftDimension[];
    readonly missingDimensions: readonly ConsequenceDecisionContextDriftDimension[];
    readonly evaluatedAt: string | null;
    readonly expiresAt: string | null;
    readonly contextAgeHours: number | null;
    readonly maxContextAgeHours: number;
    readonly requireSimulationRefresh: boolean;
  };
  readonly counts: {
    readonly driftDimensionCount: number;
    readonly missingDimensionCount: number;
    readonly blockReasonCount: number;
    readonly reviewReasonCount: number;
  };
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

export interface ConsequenceDecisionContextDriftBindingDescriptor {
  readonly version: typeof CONSEQUENCE_DECISION_CONTEXT_DRIFT_BINDING_VERSION;
  readonly failureModeId: 'model-tool-config-drift';
  readonly outcomes: typeof CONSEQUENCE_DECISION_CONTEXT_DRIFT_OUTCOMES;
  readonly dimensions: typeof CONSEQUENCE_DECISION_CONTEXT_DRIFT_DIMENSIONS;
  readonly reasonCodes: typeof CONSEQUENCE_DECISION_CONTEXT_DRIFT_REASON_CODES;
  readonly requiresModelVersion: true;
  readonly requiresToolSchemaDigest: true;
  readonly requiresPolicyVersion: true;
  readonly requiresConfigDigest: true;
  readonly comparesCurrentContext: true;
  readonly requiresNewSimulationOnDrift: true;
  readonly isModelEvaluation: false;
  readonly storesRawContextValues: false;
  readonly digestOnly: true;
  readonly approvalRequired: true;
  readonly autoEnforce: false;
  readonly productionReady: false;
  readonly activatesEnforcement: false;
}

const DEFAULT_MAX_CONTEXT_AGE_HOURS = 24;

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

function normalizeOptionalString(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : undefined;
}

function normalizeDigest(value: string | null | undefined): string | undefined {
  const normalized = normalizeOptionalString(value);
  return normalized && normalized.startsWith('sha256:') ? normalized : undefined;
}

function normalizeTimestamp(value: string | null | undefined): string | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function normalizePositiveNumber(value: number | null | undefined, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) return fallback;
  return value;
}

function hoursBetween(later: string, earlier: string): number {
  return (new Date(later).getTime() - new Date(earlier).getTime()) / (60 * 60 * 1000);
}

function uniqueSorted<T extends string>(values: readonly T[]): readonly T[] {
  return Object.freeze([...new Set(values)].sort() as T[]);
}

function contextDigest(
  context: ConsequenceDecisionContextBindingContext | null,
): string | null {
  if (!context) return null;
  return canonicalObject({
    modelVersion: normalizeOptionalString(context.modelVersion) ? digestText(normalizeOptionalString(context.modelVersion) as string) : null,
    toolSchemaDigest: normalizeDigest(context.toolSchemaDigest) ?? null,
    toolManifestDigest: normalizeDigest(context.toolManifestDigest) ?? null,
    policyVersion: normalizeOptionalString(context.policyVersion) ? digestText(normalizeOptionalString(context.policyVersion) as string) : null,
    policyDigest: normalizeDigest(context.policyDigest) ?? null,
    configDigest: normalizeDigest(context.configDigest) ?? null,
    promptDigest: normalizeDigest(context.promptDigest) ?? null,
    verifierDigest: normalizeDigest(context.verifierDigest) ?? null,
    simulationDigest: normalizeDigest(context.simulationDigest) ?? null,
    evaluatedAt: normalizeTimestamp(context.evaluatedAt),
    expiresAt: normalizeTimestamp(context.expiresAt),
  }).digest;
}

function sameOptionalDigest(
  left: string | null | undefined,
  right: string | null | undefined,
): boolean {
  const normalizedLeft = normalizeDigest(left);
  const normalizedRight = normalizeDigest(right);
  if (!normalizedLeft && !normalizedRight) return true;
  return normalizedLeft === normalizedRight;
}

function sameOptionalString(
  left: string | null | undefined,
  right: string | null | undefined,
): boolean {
  const normalizedLeft = normalizeOptionalString(left);
  const normalizedRight = normalizeOptionalString(right);
  if (!normalizedLeft && !normalizedRight) return true;
  return normalizedLeft === normalizedRight;
}

function modelToolConfigBinding(): ConsequenceFailureControlBinding {
  const found = CONSEQUENCE_FAILURE_CONTROL_BINDINGS.find((item) =>
    item.failureModeId === 'model-tool-config-drift'
  );
  if (!found) {
    throw new Error('Missing failure control binding for model-tool-config-drift.');
  }
  return found;
}

function requiredMissingDimensions(
  context: ConsequenceDecisionContextBindingContext | null,
  current: boolean,
): readonly ConsequenceDecisionContextDriftReasonCode[] {
  if (!context) {
    return [current ? 'current-context-missing' : 'bound-context-missing'];
  }
  const reasons: ConsequenceDecisionContextDriftReasonCode[] = [];
  if (!normalizeOptionalString(context.modelVersion)) {
    reasons.push(current ? 'current-model-version-missing' : 'model-version-missing');
  }
  if (!normalizeDigest(context.toolSchemaDigest)) {
    reasons.push(current ? 'current-tool-schema-digest-missing' : 'tool-schema-digest-missing');
  }
  if (!normalizeOptionalString(context.policyVersion)) {
    reasons.push(current ? 'current-policy-version-missing' : 'policy-version-missing');
  }
  if (!normalizeDigest(context.configDigest)) {
    reasons.push(current ? 'current-config-digest-missing' : 'config-digest-missing');
  }
  return reasons;
}

function missingDimensionsFromReasons(
  reasons: readonly ConsequenceDecisionContextDriftReasonCode[],
): readonly ConsequenceDecisionContextDriftDimension[] {
  const dimensions: ConsequenceDecisionContextDriftDimension[] = [];
  if (reasons.some((reason) => reason.includes('model-version'))) dimensions.push('model');
  if (reasons.some((reason) => reason.includes('tool-schema'))) dimensions.push('tool-schema');
  if (reasons.some((reason) => reason.includes('policy-version'))) dimensions.push('policy-version');
  if (reasons.some((reason) => reason.includes('config-digest'))) dimensions.push('config');
  return uniqueSorted(dimensions);
}

export function evaluateConsequenceDecisionContextDrift(
  input: EvaluateConsequenceDecisionContextDriftInput,
): ConsequenceDecisionContextDriftDecision {
  const generatedAt = normalizeOptionalString(input.generatedAt) ?? new Date(0).toISOString();
  const actionSurface = normalizeOptionalString(input.actionSurface);
  const action = normalizeOptionalString(input.action);
  const bound = input.boundContext ?? null;
  const current = input.currentContext ?? null;
  const maxContextAgeHours = normalizePositiveNumber(
    input.maxContextAgeHours,
    DEFAULT_MAX_CONTEXT_AGE_HOURS,
  );
  const requireSimulationRefresh = input.requireSimulationRefresh === true;

  const blockReasons: ConsequenceDecisionContextDriftReasonCode[] = [];
  const reviewReasons: ConsequenceDecisionContextDriftReasonCode[] = [];

  blockReasons.push(...requiredMissingDimensions(bound, false));
  blockReasons.push(...requiredMissingDimensions(current, true));

  const driftDimensions: ConsequenceDecisionContextDriftDimension[] = [];

  if (bound && current) {
    if (!sameOptionalString(bound.modelVersion, current.modelVersion)) {
      reviewReasons.push('model-version-drift');
      driftDimensions.push('model');
    }
    if (!sameOptionalDigest(bound.toolSchemaDigest, current.toolSchemaDigest)) {
      reviewReasons.push('tool-schema-digest-drift');
      driftDimensions.push('tool-schema');
    }
    if (!sameOptionalDigest(bound.toolManifestDigest, current.toolManifestDigest)) {
      reviewReasons.push('tool-manifest-digest-drift');
      driftDimensions.push('tool-manifest');
    }
    if (!sameOptionalString(bound.policyVersion, current.policyVersion)) {
      reviewReasons.push('policy-version-drift');
      driftDimensions.push('policy-version');
    }
    if (!sameOptionalDigest(bound.policyDigest, current.policyDigest)) {
      reviewReasons.push('policy-digest-drift');
      driftDimensions.push('policy-digest');
    }
    if (!sameOptionalDigest(bound.configDigest, current.configDigest)) {
      reviewReasons.push('config-digest-drift');
      driftDimensions.push('config');
    }
    if (!sameOptionalDigest(bound.promptDigest, current.promptDigest)) {
      reviewReasons.push('prompt-digest-drift');
      driftDimensions.push('prompt');
    }
    if (!sameOptionalDigest(bound.verifierDigest, current.verifierDigest)) {
      reviewReasons.push('verifier-digest-drift');
      driftDimensions.push('verifier');
    }
    if (!sameOptionalDigest(bound.simulationDigest, current.simulationDigest)) {
      reviewReasons.push('simulation-refresh-required');
      driftDimensions.push('simulation');
    }
  }

  const evaluatedAt = normalizeTimestamp(bound?.evaluatedAt);
  const expiresAt = normalizeTimestamp(bound?.expiresAt);
  const contextAgeHours =
    evaluatedAt ? Number(hoursBetween(generatedAt, evaluatedAt).toFixed(4)) : null;

  if (requireSimulationRefresh && !normalizeDigest(bound?.simulationDigest)) {
    reviewReasons.push('simulation-digest-missing');
    driftDimensions.push('simulation');
  }
  if (expiresAt && new Date(expiresAt).getTime() < new Date(generatedAt).getTime()) {
    reviewReasons.push('decision-context-expired');
  }
  if (contextAgeHours !== null && contextAgeHours > maxContextAgeHours) {
    reviewReasons.push('decision-context-age-exceeded');
  }

  const missingDimensions = missingDimensionsFromReasons(blockReasons);
  const uniqueDriftDimensions = uniqueSorted(driftDimensions);
  const outcome: ConsequenceDecisionContextDriftOutcome =
    blockReasons.length > 0 ? 'block' : reviewReasons.length > 0 ? 'review' : 'pass';
  const reasonCodes = uniqueSorted([
    ...blockReasons,
    ...reviewReasons,
    outcome === 'block'
      ? 'decision-context-block'
      : outcome === 'review'
        ? 'decision-context-review'
        : 'decision-context-pass',
  ]);
  const binding = modelToolConfigBinding();
  const observed = Object.freeze({
    boundContextDigest: contextDigest(bound),
    currentContextDigest: contextDigest(current),
    driftDimensions: uniqueDriftDimensions,
    missingDimensions,
    evaluatedAt,
    expiresAt,
    contextAgeHours,
    maxContextAgeHours,
    requireSimulationRefresh,
  });
  const canonical = canonicalObject({
    version: CONSEQUENCE_DECISION_CONTEXT_DRIFT_BINDING_VERSION,
    generatedAt,
    ...(actionSurface ? { actionSurface } : {}),
    ...(action ? { action } : {}),
    outcome,
    reasonCodes,
    observed,
  });

  return Object.freeze({
    version: CONSEQUENCE_DECISION_CONTEXT_DRIFT_BINDING_VERSION,
    generatedAt,
    ...(actionSurface ? { actionSurface } : {}),
    ...(action ? { action } : {}),
    outcome,
    allowed: outcome === 'pass',
    failClosed: outcome !== 'pass',
    reasonCodes,
    failureModeId: 'model-tool-config-drift',
    invariantIds: [
      'decision-context-version-must-be-bound',
      'trusted-evidence-required',
      'review-or-block-cannot-auto-promote',
    ] as const,
    protectedPrinciples: [
      'runtime readiness',
      'proof integrity',
      'auditability',
    ] as const,
    requiredControls: binding.controlIds,
    requiredEvidence: binding.requiredEvidence,
    requiredAuthoritySources: binding.requiredAuthority,
    requiredAuditRecords: binding.requiredAuditRecords,
    observed,
    counts: {
      driftDimensionCount: observed.driftDimensions.length,
      missingDimensionCount: observed.missingDimensions.length,
      blockReasonCount: blockReasons.length,
      reviewReasonCount: reviewReasons.length,
    },
    approvalRequired: true,
    autoEnforce: false,
    rawPayloadStored: false,
    productionReady: false,
    activatesEnforcement: false,
    digestOnly: true,
    limitation:
      'This binding checks whether a decision proof still matches supplied model, tool, policy, config, prompt, verifier, and simulation context. It is not a model evaluation and does not independently scan customer runtimes.',
    canonical: canonical.canonical,
    digest: canonical.digest,
  });
}

export function consequenceDecisionContextDriftBindingDescriptor():
ConsequenceDecisionContextDriftBindingDescriptor {
  return Object.freeze({
    version: CONSEQUENCE_DECISION_CONTEXT_DRIFT_BINDING_VERSION,
    failureModeId: 'model-tool-config-drift',
    outcomes: CONSEQUENCE_DECISION_CONTEXT_DRIFT_OUTCOMES,
    dimensions: CONSEQUENCE_DECISION_CONTEXT_DRIFT_DIMENSIONS,
    reasonCodes: CONSEQUENCE_DECISION_CONTEXT_DRIFT_REASON_CODES,
    requiresModelVersion: true,
    requiresToolSchemaDigest: true,
    requiresPolicyVersion: true,
    requiresConfigDigest: true,
    comparesCurrentContext: true,
    requiresNewSimulationOnDrift: true,
    isModelEvaluation: false,
    storesRawContextValues: false,
    digestOnly: true,
    approvalRequired: true,
    autoEnforce: false,
    productionReady: false,
    activatesEnforcement: false,
  });
}
