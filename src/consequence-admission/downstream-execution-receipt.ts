import { createHash } from 'node:crypto';
import {
  canonicalizeReleaseJson,
  type CanonicalReleaseJsonValue,
} from '../release-kernel/release-canonicalization.js';
import type {
  ConsequenceAdmissionResponse,
} from './index.js';
import type {
  ConsequenceAdmissionPresentationReplayLedgerDecision,
  ConsequenceAdmissionPresentationReplayLedgerEntry,
} from './presentation-replay-ledger.js';

export const CONSEQUENCE_ADMISSION_DOWNSTREAM_EXECUTION_RECEIPT_VERSION =
  'attestor.consequence-admission-downstream-execution-receipt.v1';

export const CONSEQUENCE_ADMISSION_DOWNSTREAM_EXECUTION_STATUSES = [
  'succeeded',
  'failed',
  'skipped',
] as const;
export type ConsequenceAdmissionDownstreamExecutionStatus =
  typeof CONSEQUENCE_ADMISSION_DOWNSTREAM_EXECUTION_STATUSES[number];

export const CONSEQUENCE_ADMISSION_DOWNSTREAM_EXECUTION_RECEIPT_OUTCOMES = [
  'recorded',
  'held',
] as const;
export type ConsequenceAdmissionDownstreamExecutionReceiptOutcome =
  typeof CONSEQUENCE_ADMISSION_DOWNSTREAM_EXECUTION_RECEIPT_OUTCOMES[number];

export const CONSEQUENCE_ADMISSION_DOWNSTREAM_EXECUTION_RECEIPT_FAILURE_REASONS = [
  'admission-mismatch',
  'replay-not-consumed',
  'replay-entry-missing',
  'target-digest-mismatch',
  'downstream-system-mismatch',
  'executed-before-replay-consumption',
  'completed-before-executed',
  'success-result-missing',
  'failure-result-missing',
  'skip-reason-missing',
] as const;
export type ConsequenceAdmissionDownstreamExecutionReceiptFailureReason =
  typeof CONSEQUENCE_ADMISSION_DOWNSTREAM_EXECUTION_RECEIPT_FAILURE_REASONS[number];

export interface ConsequenceAdmissionDownstreamExecutionObservation {
  readonly status: ConsequenceAdmissionDownstreamExecutionStatus;
  readonly downstreamSystem: string;
  readonly executedAt: string;
  readonly completedAt?: string | null;
  readonly resultDigest?: string | null;
  readonly externalReceiptDigest?: string | null;
  readonly errorDigest?: string | null;
  readonly skipReasonCode?: string | null;
  readonly operatorRef?: string | null;
  readonly idempotencyRef?: string | null;
}

export interface ConsequenceAdmissionDownstreamExecutionReceipt {
  readonly version: typeof CONSEQUENCE_ADMISSION_DOWNSTREAM_EXECUTION_RECEIPT_VERSION;
  readonly receiptId: string;
  readonly status: ConsequenceAdmissionDownstreamExecutionStatus;
  readonly admissionId: string;
  readonly admissionDigest: string;
  readonly bindingId: string;
  readonly bindingDigest: string;
  readonly replayLedgerId: string;
  readonly replayKeyDigest: string;
  readonly replayReceiptDigest: string;
  readonly replayEntryDigest: string;
  readonly presentationReceiptDigest: string;
  readonly contractId: string;
  readonly enforcementPointId: string;
  readonly downstreamSystem: string;
  readonly targetDigest: string;
  readonly executedAt: string;
  readonly completedAt: string;
  readonly resultDigest: string | null;
  readonly externalReceiptDigest: string | null;
  readonly errorDigest: string | null;
  readonly skipReasonCode: string | null;
  readonly operatorRefDigest: string | null;
  readonly idempotencyRefDigest: string | null;
  readonly cloudEvent: ConsequenceAdmissionDownstreamExecutionCloudEvent;
  readonly canonical: string;
  readonly receiptDigest: string;
}

export interface ConsequenceAdmissionDownstreamExecutionCloudEvent {
  readonly specversion: '1.0';
  readonly id: string;
  readonly source: string;
  readonly type: 'dev.attestor.consequence.downstream.execution.v1';
  readonly subject: string;
  readonly time: string;
  readonly datacontenttype: 'application/json';
  readonly dataDigest: string;
}

export interface RecordConsequenceAdmissionDownstreamExecutionInput {
  readonly admission: ConsequenceAdmissionResponse;
  readonly replayDecision: ConsequenceAdmissionPresentationReplayLedgerDecision;
  readonly execution: ConsequenceAdmissionDownstreamExecutionObservation;
  readonly targetDigest?: string | null;
}

export interface ConsequenceAdmissionDownstreamExecutionReceiptDecision {
  readonly version: typeof CONSEQUENCE_ADMISSION_DOWNSTREAM_EXECUTION_RECEIPT_VERSION;
  readonly outcome: ConsequenceAdmissionDownstreamExecutionReceiptOutcome;
  readonly recorded: boolean;
  readonly failClosed: boolean;
  readonly admissionId: string;
  readonly admissionDigest: string;
  readonly bindingId: string;
  readonly bindingDigest: string;
  readonly replayLedgerId: string;
  readonly replayReceiptDigest: string;
  readonly receipt: ConsequenceAdmissionDownstreamExecutionReceipt | null;
  readonly failureReasons: readonly ConsequenceAdmissionDownstreamExecutionReceiptFailureReason[];
  readonly reasonCodes: readonly string[];
  readonly reason: string;
  readonly instruction: string;
  readonly decisionDigest: string;
}

export interface ConsequenceAdmissionDownstreamExecutionReceiptDescriptor {
  readonly version: typeof CONSEQUENCE_ADMISSION_DOWNSTREAM_EXECUTION_RECEIPT_VERSION;
  readonly statuses: typeof CONSEQUENCE_ADMISSION_DOWNSTREAM_EXECUTION_STATUSES;
  readonly outcomes: typeof CONSEQUENCE_ADMISSION_DOWNSTREAM_EXECUTION_RECEIPT_OUTCOMES;
  readonly failureReasons: typeof CONSEQUENCE_ADMISSION_DOWNSTREAM_EXECUTION_RECEIPT_FAILURE_REASONS;
  readonly storesRawResults: false;
  readonly storesRawTargets: false;
  readonly storesRawErrors: false;
  readonly cloudEventsCompatible: true;
  readonly inTotoStatementCompatible: false;
  readonly failClosed: true;
}

function normalizeIdentifier(value: string | null | undefined, fieldName: string): string {
  if (typeof value !== 'string') {
    throw new Error(`Consequence admission downstream execution receipt ${fieldName} requires a string.`);
  }
  const normalized = value.trim();
  if (!normalized) {
    throw new Error(
      `Consequence admission downstream execution receipt ${fieldName} requires a non-empty value.`,
    );
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

function normalizeIsoTimestamp(value: string, fieldName: string): string {
  const timestamp = new Date(value);
  if (Number.isNaN(timestamp.getTime())) {
    throw new Error(
      `Consequence admission downstream execution receipt ${fieldName} must be an ISO timestamp.`,
    );
  }
  return timestamp.toISOString();
}

function canonicalObject<T extends CanonicalReleaseJsonValue>(value: T): {
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

function digestValue(value: CanonicalReleaseJsonValue): string {
  return canonicalObject(value).digest;
}

function normalizeStatus(value: ConsequenceAdmissionDownstreamExecutionStatus):
ConsequenceAdmissionDownstreamExecutionStatus {
  if (!CONSEQUENCE_ADMISSION_DOWNSTREAM_EXECUTION_STATUSES.includes(value)) {
    throw new Error(
      `Consequence admission downstream execution receipt status must be one of: ${CONSEQUENCE_ADMISSION_DOWNSTREAM_EXECUTION_STATUSES.join(', ')}.`,
    );
  }
  return value;
}

function orderedFailureReasons(
  reasons: readonly ConsequenceAdmissionDownstreamExecutionReceiptFailureReason[],
): readonly ConsequenceAdmissionDownstreamExecutionReceiptFailureReason[] {
  const present = new Set(reasons);
  return Object.freeze(
    CONSEQUENCE_ADMISSION_DOWNSTREAM_EXECUTION_RECEIPT_FAILURE_REASONS.filter((reason) =>
      present.has(reason),
    ),
  );
}

function replayEntry(
  replayDecision: ConsequenceAdmissionPresentationReplayLedgerDecision,
): ConsequenceAdmissionPresentationReplayLedgerEntry | null {
  return replayDecision.entry;
}

function receiptPayload(input: Omit<ConsequenceAdmissionDownstreamExecutionReceipt, 'canonical' | 'receiptDigest'>):
CanonicalReleaseJsonValue {
  return {
    version: input.version,
    receiptId: input.receiptId,
    status: input.status,
    admissionId: input.admissionId,
    admissionDigest: input.admissionDigest,
    bindingId: input.bindingId,
    bindingDigest: input.bindingDigest,
    replayLedgerId: input.replayLedgerId,
    replayKeyDigest: input.replayKeyDigest,
    replayReceiptDigest: input.replayReceiptDigest,
    replayEntryDigest: input.replayEntryDigest,
    presentationReceiptDigest: input.presentationReceiptDigest,
    contractId: input.contractId,
    enforcementPointId: input.enforcementPointId,
    downstreamSystem: input.downstreamSystem,
    targetDigest: input.targetDigest,
    executedAt: input.executedAt,
    completedAt: input.completedAt,
    resultDigest: input.resultDigest,
    externalReceiptDigest: input.externalReceiptDigest,
    errorDigest: input.errorDigest,
    skipReasonCode: input.skipReasonCode,
    operatorRefDigest: input.operatorRefDigest,
    idempotencyRefDigest: input.idempotencyRefDigest,
    cloudEvent: input.cloudEvent,
  } as unknown as CanonicalReleaseJsonValue;
}

function decisionDigest(input: {
  readonly outcome: ConsequenceAdmissionDownstreamExecutionReceiptOutcome;
  readonly admissionId: string;
  readonly admissionDigest: string;
  readonly bindingId: string;
  readonly bindingDigest: string;
  readonly replayLedgerId: string;
  readonly replayReceiptDigest: string;
  readonly receiptDigest: string | null;
  readonly failureReasons: readonly ConsequenceAdmissionDownstreamExecutionReceiptFailureReason[];
}): string {
  return digestValue({
    version: CONSEQUENCE_ADMISSION_DOWNSTREAM_EXECUTION_RECEIPT_VERSION,
    outcome: input.outcome,
    admissionId: input.admissionId,
    admissionDigest: input.admissionDigest,
    bindingId: input.bindingId,
    bindingDigest: input.bindingDigest,
    replayLedgerId: input.replayLedgerId,
    replayReceiptDigest: input.replayReceiptDigest,
    receiptDigest: input.receiptDigest,
    failureReasons: input.failureReasons,
  } as CanonicalReleaseJsonValue);
}

function reasonFor(
  outcome: ConsequenceAdmissionDownstreamExecutionReceiptOutcome,
  failureReasons: readonly ConsequenceAdmissionDownstreamExecutionReceiptFailureReason[],
): string {
  if (outcome === 'recorded') {
    return 'Downstream execution receipt recorded the consequence result after admission, presentation binding, and replay consumption closed.';
  }
  if (failureReasons.includes('replay-not-consumed')) {
    return 'Downstream execution receipt held because replay consumption did not close before the downstream consequence.';
  }
  if (failureReasons.includes('success-result-missing')) {
    return 'Downstream execution receipt held because successful execution requires a result or external receipt digest.';
  }
  if (failureReasons.includes('failure-result-missing')) {
    return 'Downstream execution receipt held because failed execution requires an error or external receipt digest.';
  }
  if (failureReasons.includes('target-digest-mismatch')) {
    return 'Downstream execution receipt held because the execution target digest did not match the consumed presentation.';
  }
  return 'Downstream execution receipt held because consequence result binding did not close safely.';
}

function createCloudEvent(input: {
  readonly receiptId: string;
  readonly admissionId: string;
  readonly downstreamSystem: string;
  readonly completedAt: string;
  readonly dataDigest: string;
}): ConsequenceAdmissionDownstreamExecutionCloudEvent {
  return Object.freeze({
    specversion: '1.0',
    id: input.receiptId,
    source: `attestor:consequence-admission:${input.downstreamSystem}`,
    type: 'dev.attestor.consequence.downstream.execution.v1',
    subject: input.admissionId,
    time: input.completedAt,
    datacontenttype: 'application/json',
    dataDigest: input.dataDigest,
  });
}

export function recordConsequenceAdmissionDownstreamExecution(
  input: RecordConsequenceAdmissionDownstreamExecutionInput,
): ConsequenceAdmissionDownstreamExecutionReceiptDecision {
  const replay = input.replayDecision;
  const entry = replayEntry(replay);
  const status = normalizeStatus(input.execution.status);
  const executedAt = normalizeIsoTimestamp(input.execution.executedAt, 'execution.executedAt');
  const completedAt = normalizeIsoTimestamp(
    input.execution.completedAt ?? input.execution.executedAt,
    'execution.completedAt',
  );
  const downstreamSystem = normalizeIdentifier(
    input.execution.downstreamSystem,
    'execution.downstreamSystem',
  );
  const resultDigest = normalizeOptionalIdentifier(
    input.execution.resultDigest,
    'execution.resultDigest',
  );
  const externalReceiptDigest = normalizeOptionalIdentifier(
    input.execution.externalReceiptDigest,
    'execution.externalReceiptDigest',
  );
  const errorDigest = normalizeOptionalIdentifier(
    input.execution.errorDigest,
    'execution.errorDigest',
  );
  const skipReasonCode = normalizeOptionalIdentifier(
    input.execution.skipReasonCode,
    'execution.skipReasonCode',
  );
  const operatorRefDigest = input.execution.operatorRef === undefined ||
    input.execution.operatorRef === null
    ? null
    : digestText(normalizeIdentifier(input.execution.operatorRef, 'execution.operatorRef'));
  const idempotencyRefDigest = input.execution.idempotencyRef === undefined ||
    input.execution.idempotencyRef === null
    ? null
    : digestText(normalizeIdentifier(input.execution.idempotencyRef, 'execution.idempotencyRef'));
  const targetDigest = normalizeOptionalIdentifier(input.targetDigest, 'targetDigest') ??
    entry?.targetDigest ??
    null;
  const executedAtMs = new Date(executedAt).getTime();
  const completedAtMs = new Date(completedAt).getTime();
  const consumedAtMs = new Date(replay.consumedAt).getTime();
  const failureReasons = orderedFailureReasons([
    ...(replay.admissionId !== input.admission.admissionId ||
      replay.admissionDigest !== input.admission.digest
      ? ['admission-mismatch' as const]
      : []),
    ...(!replay.consumed ? ['replay-not-consumed' as const] : []),
    ...(replay.consumed && entry === null ? ['replay-entry-missing' as const] : []),
    ...(targetDigest !== null && entry !== null && targetDigest !== entry.targetDigest
      ? ['target-digest-mismatch' as const]
      : []),
    ...(entry !== null && downstreamSystem !== replay.presentationDecision.downstreamDecision.downstreamSystem
      ? ['downstream-system-mismatch' as const]
      : []),
    ...(executedAtMs < consumedAtMs ? ['executed-before-replay-consumption' as const] : []),
    ...(completedAtMs < executedAtMs ? ['completed-before-executed' as const] : []),
    ...(status === 'succeeded' && resultDigest === null && externalReceiptDigest === null
      ? ['success-result-missing' as const]
      : []),
    ...(status === 'failed' && errorDigest === null && externalReceiptDigest === null
      ? ['failure-result-missing' as const]
      : []),
    ...(status === 'skipped' && skipReasonCode === null ? ['skip-reason-missing' as const] : []),
  ]);
  const outcome: ConsequenceAdmissionDownstreamExecutionReceiptOutcome =
    failureReasons.length === 0 ? 'recorded' : 'held';

  let receipt: ConsequenceAdmissionDownstreamExecutionReceipt | null = null;
  if (outcome === 'recorded' && entry !== null && replay.replayKeyDigest !== null) {
    const receiptId = digestValue({
      version: CONSEQUENCE_ADMISSION_DOWNSTREAM_EXECUTION_RECEIPT_VERSION,
      admissionId: input.admission.admissionId,
      admissionDigest: input.admission.digest,
      bindingId: replay.bindingId,
      bindingDigest: replay.bindingDigest,
      replayReceiptDigest: replay.receiptDigest,
      status,
      downstreamSystem,
      targetDigest: entry.targetDigest,
      executedAt,
      completedAt,
      resultDigest,
      externalReceiptDigest,
      errorDigest,
      skipReasonCode,
    } as CanonicalReleaseJsonValue);
    const dataDigest = digestValue({
      status,
      resultDigest,
      externalReceiptDigest,
      errorDigest,
      skipReasonCode,
      replayReceiptDigest: replay.receiptDigest,
      replayEntryDigest: entry.entryDigest,
    } as CanonicalReleaseJsonValue);
    const cloudEvent = createCloudEvent({
      receiptId,
      admissionId: input.admission.admissionId,
      downstreamSystem,
      completedAt,
      dataDigest,
    });
    const base = Object.freeze({
      version: CONSEQUENCE_ADMISSION_DOWNSTREAM_EXECUTION_RECEIPT_VERSION,
      receiptId,
      status,
      admissionId: input.admission.admissionId,
      admissionDigest: input.admission.digest,
      bindingId: replay.bindingId,
      bindingDigest: replay.bindingDigest,
      replayLedgerId: replay.ledgerId,
      replayKeyDigest: replay.replayKeyDigest,
      replayReceiptDigest: replay.receiptDigest,
      replayEntryDigest: entry.entryDigest,
      presentationReceiptDigest: entry.presentationReceiptDigest,
      contractId: entry.contractId,
      enforcementPointId: entry.enforcementPointId,
      downstreamSystem,
      targetDigest: entry.targetDigest,
      executedAt,
      completedAt,
      resultDigest,
      externalReceiptDigest,
      errorDigest,
      skipReasonCode,
      operatorRefDigest,
      idempotencyRefDigest,
      cloudEvent,
    } satisfies Omit<ConsequenceAdmissionDownstreamExecutionReceipt, 'canonical' | 'receiptDigest'>);
    const canonical = canonicalObject(receiptPayload(base));
    receipt = Object.freeze({
      ...base,
      canonical: canonical.canonical,
      receiptDigest: canonical.digest,
    });
  }

  const decisionDigestValue = decisionDigest({
    outcome,
    admissionId: input.admission.admissionId,
    admissionDigest: input.admission.digest,
    bindingId: replay.bindingId,
    bindingDigest: replay.bindingDigest,
    replayLedgerId: replay.ledgerId,
    replayReceiptDigest: replay.receiptDigest,
    receiptDigest: receipt?.receiptDigest ?? null,
    failureReasons,
  });

  return Object.freeze({
    version: CONSEQUENCE_ADMISSION_DOWNSTREAM_EXECUTION_RECEIPT_VERSION,
    outcome,
    recorded: outcome === 'recorded',
    failClosed: outcome !== 'recorded',
    admissionId: input.admission.admissionId,
    admissionDigest: input.admission.digest,
    bindingId: replay.bindingId,
    bindingDigest: replay.bindingDigest,
    replayLedgerId: replay.ledgerId,
    replayReceiptDigest: replay.receiptDigest,
    receipt,
    failureReasons,
    reasonCodes: Object.freeze([
      ...replay.reasonCodes,
      ...failureReasons.map((reason) => `downstream-execution-receipt-${reason}`),
      `downstream-execution-receipt-${outcome}`,
    ]),
    reason: reasonFor(outcome, failureReasons),
    instruction: outcome === 'recorded'
      ? 'Keep the downstream execution receipt with the admission proof trail.'
      : 'Do not treat the downstream consequence as closed by Attestor receipt.',
    decisionDigest: decisionDigestValue,
  });
}

export function consequenceAdmissionDownstreamExecutionReceiptDescriptor():
ConsequenceAdmissionDownstreamExecutionReceiptDescriptor {
  return Object.freeze({
    version: CONSEQUENCE_ADMISSION_DOWNSTREAM_EXECUTION_RECEIPT_VERSION,
    statuses: CONSEQUENCE_ADMISSION_DOWNSTREAM_EXECUTION_STATUSES,
    outcomes: CONSEQUENCE_ADMISSION_DOWNSTREAM_EXECUTION_RECEIPT_OUTCOMES,
    failureReasons: CONSEQUENCE_ADMISSION_DOWNSTREAM_EXECUTION_RECEIPT_FAILURE_REASONS,
    storesRawResults: false,
    storesRawTargets: false,
    storesRawErrors: false,
    cloudEventsCompatible: true,
    inTotoStatementCompatible: false,
    failClosed: true,
  });
}
