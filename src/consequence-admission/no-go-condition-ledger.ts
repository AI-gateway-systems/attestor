import { createHash } from 'node:crypto';
import {
  canonicalizeReleaseJson,
  type CanonicalReleaseJsonValue,
} from '../release-kernel/release-canonicalization.js';
import {
  CONSEQUENCE_FAILURE_CONTROL_BINDINGS,
  type ConsequenceFailureControlBinding,
} from './failure-mode-control-bindings.js';

export const CONSEQUENCE_NO_GO_CONDITION_LEDGER_VERSION =
  'attestor.consequence-no-go-condition-ledger.v1';

export const CONSEQUENCE_NO_GO_CONDITION_OUTCOMES = [
  'pass',
  'review',
  'block',
] as const;
export type ConsequenceNoGoConditionOutcome =
  typeof CONSEQUENCE_NO_GO_CONDITION_OUTCOMES[number];

export const CONSEQUENCE_NO_GO_CONDITION_KINDS = [
  'fraud-hold',
  'legal-hold',
  'compliance-hold',
  'security-hold',
  'privacy-hold',
  'risk-hold',
  'production-freeze',
  'customer-defined-hold',
] as const;
export type ConsequenceNoGoConditionKind =
  typeof CONSEQUENCE_NO_GO_CONDITION_KINDS[number];

export const CONSEQUENCE_NO_GO_CONDITION_STATES = [
  'active',
  'pending-review',
  'released',
  'expired',
] as const;
export type ConsequenceNoGoConditionState =
  typeof CONSEQUENCE_NO_GO_CONDITION_STATES[number];

export const CONSEQUENCE_NO_GO_CONDITION_SOURCE_KINDS = [
  'policy-control-plane',
  'fraud-system',
  'legal-system',
  'compliance-system',
  'security-system',
  'privacy-system',
  'risk-owner',
  'customer-admin',
  'chat-message',
  'customer-email',
  'llm-summary',
  'tool-output',
] as const;
export type ConsequenceNoGoConditionSourceKind =
  typeof CONSEQUENCE_NO_GO_CONDITION_SOURCE_KINDS[number];

export const CONSEQUENCE_NO_GO_CONDITION_REASON_CODES = [
  'hold-ledger-missing',
  'active-no-go-condition-present',
  'pending-hold-review-required',
  'hold-owner-missing',
  'hold-authority-missing',
  'hold-validity-missing',
  'hold-issued-at-invalid',
  'hold-expires-at-invalid',
  'untrusted-hold-source',
  'natural-language-bypass-attempted',
  'natural-language-bypass-inferred',
  'released-hold-recorded',
  'expired-hold-recorded',
  'no-go-condition-pass',
  'no-go-condition-review',
  'no-go-condition-block',
] as const;
export type ConsequenceNoGoConditionReasonCode =
  typeof CONSEQUENCE_NO_GO_CONDITION_REASON_CODES[number];

export interface ConsequenceNoGoConditionRecord {
  readonly conditionRef: string;
  readonly kind: ConsequenceNoGoConditionKind;
  readonly state: ConsequenceNoGoConditionState;
  readonly sourceKind: ConsequenceNoGoConditionSourceKind;
  readonly sourceRef?: string | null;
  readonly ownerRef?: string | null;
  readonly ownerAuthorityDigest?: string | null;
  readonly scopeDigest?: string | null;
  readonly issuedAt?: string | null;
  readonly expiresAt?: string | null;
  readonly releaseDigest?: string | null;
}

export interface EvaluateConsequenceNoGoConditionLedgerInput {
  readonly generatedAt?: string | null;
  readonly actionSurface?: string | null;
  readonly action?: string | null;
  readonly ledgerRef?: string | null;
  readonly conditions?: readonly ConsequenceNoGoConditionRecord[] | null;
  readonly naturalLanguageBypassAttempted?: boolean | null;
  readonly naturalLanguageSignals?: readonly string[] | null;
  readonly bypassAttemptRef?: string | null;
}

export interface ConsequenceNoGoConditionObservedRecord {
  readonly conditionRefDigest: string;
  readonly kind: ConsequenceNoGoConditionKind;
  readonly state: ConsequenceNoGoConditionState;
  readonly sourceKind: ConsequenceNoGoConditionSourceKind;
  readonly sourceRefDigest?: string;
  readonly ownerRefDigest?: string;
  readonly ownerAuthorityDigest?: string;
  readonly scopeDigest?: string;
  readonly issuedAt?: string;
  readonly expiresAt?: string;
  readonly releaseDigest?: string;
  readonly reasonCodes: readonly ConsequenceNoGoConditionReasonCode[];
}

export interface ConsequenceNoGoConditionLedgerDecision {
  readonly version: typeof CONSEQUENCE_NO_GO_CONDITION_LEDGER_VERSION;
  readonly generatedAt: string;
  readonly actionSurface?: string;
  readonly action?: string;
  readonly outcome: ConsequenceNoGoConditionOutcome;
  readonly allowed: boolean;
  readonly failClosed: boolean;
  readonly reasonCodes: readonly ConsequenceNoGoConditionReasonCode[];
  readonly failureModeId: 'no-go-hold-bypass';
  readonly invariantIds: readonly [
    'no-go-hold-overrides-natural-language',
    'review-or-block-cannot-auto-promote',
    'human-review-packet-must-highlight-risk',
  ];
  readonly protectedPrinciples: readonly [
    'fail-closed boundary',
    'customer authority',
    'auditability',
  ];
  readonly requiredControls: readonly string[];
  readonly requiredEvidence: readonly string[];
  readonly requiredAuthoritySources: readonly string[];
  readonly requiredAuditRecords: readonly string[];
  readonly observed: {
    readonly ledgerRefDigest: string | null;
    readonly bypassAttemptRefDigest: string | null;
    readonly conditionCount: number;
    readonly activeCount: number;
    readonly pendingReviewCount: number;
    readonly releasedCount: number;
    readonly expiredCount: number;
    readonly untrustedSourceCount: number;
    readonly missingOwnerCount: number;
    readonly missingAuthorityCount: number;
    readonly naturalLanguageBypassAttempted: boolean;
    readonly naturalLanguageBypassInferred: boolean;
    readonly naturalLanguageBypassSignalCount: number;
    readonly naturalLanguageBypassSignalDigests: readonly string[];
  };
  readonly observedConditions: readonly ConsequenceNoGoConditionObservedRecord[];
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

export interface ConsequenceNoGoConditionLedgerDescriptor {
  readonly version: typeof CONSEQUENCE_NO_GO_CONDITION_LEDGER_VERSION;
  readonly failureModeId: 'no-go-hold-bypass';
  readonly outcomes: typeof CONSEQUENCE_NO_GO_CONDITION_OUTCOMES;
  readonly conditionKinds: typeof CONSEQUENCE_NO_GO_CONDITION_KINDS;
  readonly states: typeof CONSEQUENCE_NO_GO_CONDITION_STATES;
  readonly sourceKinds: typeof CONSEQUENCE_NO_GO_CONDITION_SOURCE_KINDS;
  readonly reasonCodes: typeof CONSEQUENCE_NO_GO_CONDITION_REASON_CODES;
  readonly activeConditionBlocks: true;
  readonly naturalLanguageBypassBlocks: true;
  readonly requiresHoldOwner: true;
  readonly requiresHoldAuthority: true;
  readonly storesRawHoldRefs: false;
  readonly digestOnly: true;
  readonly approvalRequired: true;
  readonly autoEnforce: false;
  readonly productionReady: false;
  readonly activatesEnforcement: false;
}

export interface ConsequenceNoGoNaturalLanguageBypassDetection {
  readonly attempted: boolean;
  readonly signalCount: number;
  readonly signalDigests: readonly string[];
}

const TRUSTED_SOURCES = new Set<ConsequenceNoGoConditionSourceKind>([
  'policy-control-plane',
  'fraud-system',
  'legal-system',
  'compliance-system',
  'security-system',
  'privacy-system',
  'risk-owner',
  'customer-admin',
]);

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

const NATURAL_LANGUAGE_BYPASS_PATTERNS = Object.freeze([
  /\b(ignore|override|bypass|skip)\b.{0,80}\b(no-go|hold|legal hold|fraud hold|compliance hold|security hold|policy hold)\b/iu,
  /\b(no-go|hold|legal hold|fraud hold|compliance hold|security hold|policy hold)\b.{0,80}\b(ignore|override|bypass|skip)\b/iu,
  /\b(do not|don't)\s+(tell|mention|surface|report|record)\b.{0,80}\b(hold|review|approval|policy|compliance)\b/iu,
  /\b(despite|regardless of)\b.{0,80}\b(hold|review|approval|policy|compliance|legal)\b/iu,
  /\bpretend\b.{0,80}\b(approved|authorized|cleared|released)\b/iu,
] as const);

export function detectConsequenceNoGoNaturalLanguageBypass(
  signals: readonly string[] | null | undefined,
): ConsequenceNoGoNaturalLanguageBypassDetection {
  const digests: string[] = [];
  for (const signal of signals ?? []) {
    const normalized = signal.trim();
    if (!normalized) continue;
    if (NATURAL_LANGUAGE_BYPASS_PATTERNS.some((pattern) => pattern.test(normalized))) {
      digests.push(digestText(normalized));
    }
  }
  const uniqueDigests = Object.freeze([...new Set(digests)]);
  return Object.freeze({
    attempted: uniqueDigests.length > 0,
    signalCount: uniqueDigests.length,
    signalDigests: uniqueDigests,
  });
}

function normalizeTimestamp(value: string | null | undefined): string | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function uniqueReasonCodes(
  reasonCodes: readonly ConsequenceNoGoConditionReasonCode[],
): readonly ConsequenceNoGoConditionReasonCode[] {
  return Object.freeze([...new Set(reasonCodes)]);
}

function noGoBinding(): ConsequenceFailureControlBinding {
  const found = CONSEQUENCE_FAILURE_CONTROL_BINDINGS.find((item) =>
    item.failureModeId === 'no-go-hold-bypass'
  );
  if (!found) {
    throw new Error('Missing failure control binding for no-go-hold-bypass.');
  }
  return found;
}

function evaluateRecord(
  record: ConsequenceNoGoConditionRecord,
  generatedAt: string,
): ConsequenceNoGoConditionObservedRecord {
  const reasonCodes: ConsequenceNoGoConditionReasonCode[] = [];
  const issuedAt = normalizeTimestamp(record.issuedAt);
  const expiresAt = normalizeTimestamp(record.expiresAt);
  const ownerRef = normalizeOptionalString(record.ownerRef);
  const ownerAuthorityDigest = normalizeDigest(record.ownerAuthorityDigest);

  if (record.state === 'active') reasonCodes.push('active-no-go-condition-present');
  if (record.state === 'pending-review') reasonCodes.push('pending-hold-review-required');
  if (record.state === 'released') reasonCodes.push('released-hold-recorded');
  if (record.state === 'expired') reasonCodes.push('expired-hold-recorded');
  if (!TRUSTED_SOURCES.has(record.sourceKind)) reasonCodes.push('untrusted-hold-source');
  if (!ownerRef) reasonCodes.push('hold-owner-missing');
  if (!ownerAuthorityDigest) reasonCodes.push('hold-authority-missing');
  if (!record.issuedAt || !record.expiresAt) reasonCodes.push('hold-validity-missing');
  if (record.issuedAt && !issuedAt) reasonCodes.push('hold-issued-at-invalid');
  if (record.expiresAt && !expiresAt) reasonCodes.push('hold-expires-at-invalid');
  if (
    expiresAt &&
    new Date(expiresAt).getTime() < new Date(generatedAt).getTime() &&
    record.state === 'active'
  ) {
    reasonCodes.push('expired-hold-recorded');
  }

  return Object.freeze({
    conditionRefDigest: digestText(record.conditionRef),
    kind: record.kind,
    state: record.state,
    sourceKind: record.sourceKind,
    ...(record.sourceRef ? { sourceRefDigest: digestText(record.sourceRef) } : {}),
    ...(ownerRef ? { ownerRefDigest: digestText(ownerRef) } : {}),
    ...(ownerAuthorityDigest ? { ownerAuthorityDigest } : {}),
    ...(normalizeDigest(record.scopeDigest) ? { scopeDigest: normalizeDigest(record.scopeDigest) as string } : {}),
    ...(issuedAt ? { issuedAt } : {}),
    ...(expiresAt ? { expiresAt } : {}),
    ...(normalizeDigest(record.releaseDigest) ? { releaseDigest: normalizeDigest(record.releaseDigest) as string } : {}),
    reasonCodes: uniqueReasonCodes(reasonCodes),
  });
}

export function evaluateConsequenceNoGoConditionLedger(
  input: EvaluateConsequenceNoGoConditionLedgerInput,
): ConsequenceNoGoConditionLedgerDecision {
  const generatedAt = normalizeTimestamp(input.generatedAt ?? null) ?? new Date(0).toISOString();
  const actionSurface = normalizeOptionalString(input.actionSurface);
  const action = normalizeOptionalString(input.action);
  const conditions = input.conditions ?? null;
  const naturalLanguageBypassDetection = detectConsequenceNoGoNaturalLanguageBypass(
    input.naturalLanguageSignals,
  );
  const naturalLanguageBypassInferred = naturalLanguageBypassDetection.attempted;
  const naturalLanguageBypassAttempted =
    input.naturalLanguageBypassAttempted === true || naturalLanguageBypassInferred;
  const observedConditions = Object.freeze(
    (conditions ?? []).map((record) => evaluateRecord(record, generatedAt)),
  );

  const reasonCodes: ConsequenceNoGoConditionReasonCode[] = [];
  if (!conditions) reasonCodes.push('hold-ledger-missing');
  if (naturalLanguageBypassAttempted) reasonCodes.push('natural-language-bypass-attempted');
  if (naturalLanguageBypassInferred) reasonCodes.push('natural-language-bypass-inferred');
  for (const condition of observedConditions) {
    reasonCodes.push(...condition.reasonCodes);
  }

  const activeCount = observedConditions.filter((record) => record.state === 'active').length;
  const pendingReviewCount = observedConditions.filter((record) => record.state === 'pending-review').length;
  const releasedCount = observedConditions.filter((record) => record.state === 'released').length;
  const expiredCount = observedConditions.filter((record) => record.state === 'expired').length;
  const untrustedSourceCount = observedConditions.filter((record) =>
    record.reasonCodes.includes('untrusted-hold-source')
  ).length;
  const missingOwnerCount = observedConditions.filter((record) =>
    record.reasonCodes.includes('hold-owner-missing')
  ).length;
  const missingAuthorityCount = observedConditions.filter((record) =>
    record.reasonCodes.includes('hold-authority-missing')
  ).length;

  const hasBlock =
    reasonCodes.includes('hold-ledger-missing') ||
    reasonCodes.includes('active-no-go-condition-present') ||
    reasonCodes.includes('natural-language-bypass-attempted');
  const hasReview =
    reasonCodes.includes('pending-hold-review-required') ||
    reasonCodes.includes('untrusted-hold-source') ||
    reasonCodes.includes('hold-owner-missing') ||
    reasonCodes.includes('hold-authority-missing') ||
    reasonCodes.includes('hold-validity-missing') ||
    reasonCodes.includes('hold-issued-at-invalid') ||
    reasonCodes.includes('hold-expires-at-invalid');
  const outcome: ConsequenceNoGoConditionOutcome = hasBlock
    ? 'block'
    : hasReview
      ? 'review'
      : 'pass';
  const finalReasonCodes = uniqueReasonCodes([
    ...reasonCodes,
    outcome === 'block'
      ? 'no-go-condition-block'
      : outcome === 'review'
        ? 'no-go-condition-review'
        : 'no-go-condition-pass',
  ]);
  const binding = noGoBinding();
  const observed = Object.freeze({
    ledgerRefDigest: normalizeOptionalString(input.ledgerRef)
      ? digestText(normalizeOptionalString(input.ledgerRef) as string)
      : null,
    bypassAttemptRefDigest: normalizeOptionalString(input.bypassAttemptRef)
      ? digestText(normalizeOptionalString(input.bypassAttemptRef) as string)
      : null,
    conditionCount: observedConditions.length,
    activeCount,
    pendingReviewCount,
    releasedCount,
    expiredCount,
    untrustedSourceCount,
    missingOwnerCount,
    missingAuthorityCount,
    naturalLanguageBypassAttempted,
    naturalLanguageBypassInferred,
    naturalLanguageBypassSignalCount: naturalLanguageBypassDetection.signalCount,
    naturalLanguageBypassSignalDigests: naturalLanguageBypassDetection.signalDigests,
  });
  const canonical = canonicalObject({
    version: CONSEQUENCE_NO_GO_CONDITION_LEDGER_VERSION,
    generatedAt,
    ...(actionSurface ? { actionSurface } : {}),
    ...(action ? { action } : {}),
    outcome,
    reasonCodes: finalReasonCodes,
    observed,
    observedConditions: observedConditions as unknown as CanonicalReleaseJsonValue,
  });

  return Object.freeze({
    version: CONSEQUENCE_NO_GO_CONDITION_LEDGER_VERSION,
    generatedAt,
    ...(actionSurface ? { actionSurface } : {}),
    ...(action ? { action } : {}),
    outcome,
    allowed: outcome === 'pass',
    failClosed: outcome !== 'pass',
    reasonCodes: finalReasonCodes,
    failureModeId: 'no-go-hold-bypass',
    invariantIds: [
      'no-go-hold-overrides-natural-language',
      'review-or-block-cannot-auto-promote',
      'human-review-packet-must-highlight-risk',
    ] as const,
    protectedPrinciples: [
      'fail-closed boundary',
      'customer authority',
      'auditability',
    ] as const,
    requiredControls: binding.controlIds,
    requiredEvidence: binding.requiredEvidence,
    requiredAuthoritySources: binding.requiredAuthority,
    requiredAuditRecords: binding.requiredAuditRecords,
    observed,
    observedConditions,
    approvalRequired: true,
    autoEnforce: false,
    rawPayloadStored: false,
    productionReady: false,
    activatesEnforcement: false,
    digestOnly: true,
    limitation:
      'This ledger evaluates supplied no-go hold records. It does not independently connect to every customer fraud, legal, compliance, security, privacy, or risk system.',
    canonical: canonical.canonical,
    digest: canonical.digest,
  });
}

export function consequenceNoGoConditionLedgerDescriptor():
ConsequenceNoGoConditionLedgerDescriptor {
  return Object.freeze({
    version: CONSEQUENCE_NO_GO_CONDITION_LEDGER_VERSION,
    failureModeId: 'no-go-hold-bypass',
    outcomes: CONSEQUENCE_NO_GO_CONDITION_OUTCOMES,
    conditionKinds: CONSEQUENCE_NO_GO_CONDITION_KINDS,
    states: CONSEQUENCE_NO_GO_CONDITION_STATES,
    sourceKinds: CONSEQUENCE_NO_GO_CONDITION_SOURCE_KINDS,
    reasonCodes: CONSEQUENCE_NO_GO_CONDITION_REASON_CODES,
    activeConditionBlocks: true,
    naturalLanguageBypassBlocks: true,
    requiresHoldOwner: true,
    requiresHoldAuthority: true,
    storesRawHoldRefs: false,
    digestOnly: true,
    approvalRequired: true,
    autoEnforce: false,
    productionReady: false,
    activatesEnforcement: false,
  });
}
