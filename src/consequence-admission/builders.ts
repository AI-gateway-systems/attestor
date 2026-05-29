import type {
  CryptoExecutionAdmissionOutcome,
} from '../crypto-execution-admission/index.js';
import type {
  CanonicalReleaseJsonValue,
} from '../release-kernel/release-canonicalization.js';
import {
  CONSEQUENCE_ADMISSION_CHECK_KINDS,
  CONSEQUENCE_ADMISSION_CHECK_OUTCOMES,
  CONSEQUENCE_ADMISSION_CONSEQUENCE_KINDS,
  CONSEQUENCE_ADMISSION_CONTRACT_VERSION,
  CONSEQUENCE_ADMISSION_DECISIONS,
  CONSEQUENCE_ADMISSION_ENTRY_POINT_KINDS,
  CONSEQUENCE_ADMISSION_PACK_FAMILIES,
  CONSEQUENCE_ADMISSION_RISK_CLASSES,
  type ConsequenceAdmissionCheck,
  type ConsequenceAdmissionDecision,
  type ConsequenceAdmissionNativeDecision,
  type ConsequenceAdmissionProblem,
  type ConsequenceAdmissionRequest,
  type ConsequenceAdmissionResponse,
  type CreateConsequenceAdmissionRequestInput,
  type CreateConsequenceAdmissionResponseInput,
} from './contracts.js';
import {
  createAdmissionFeedback,
  createAdmissionRetryGuidance,
} from './correction-catalog.js';
import {
  normalizeRetryAttemptBinding,
} from './generic-input-normalization.js';
import {
  admissionIdFor,
  canonicalObject,
  normalizeConstraint,
  normalizeEnumValue,
  normalizeEvidenceRef,
  normalizeIdentifier,
  normalizeIsoTimestamp,
  normalizeNativeDecision,
  normalizeOptionalIdentifier,
  normalizeProofRef,
  readonlyCopy,
  requestIdFor,
} from './normalization.js';

export function isConsequenceAdmissionDecision(
  value: string,
): value is ConsequenceAdmissionDecision {
  return CONSEQUENCE_ADMISSION_DECISIONS.includes(
    value as ConsequenceAdmissionDecision,
  );
}

export function consequenceAdmissionAllowsConsequence(
  decision: ConsequenceAdmissionDecision,
): boolean {
  return decision === 'admit' || decision === 'narrow';
}

export function mapFinancePipelineDecisionToAdmission(
  value: string,
): ConsequenceAdmissionNativeDecision {
  const normalized = value.trim().toLowerCase();
  let mappedDecision: ConsequenceAdmissionDecision = 'block';
  let mappingReason = 'Unknown finance decision values fail closed.';

  if (['pass', 'accepted', 'allow', 'allowed'].includes(normalized)) {
    mappedDecision = 'admit';
    mappingReason = 'Finance allow branch maps to canonical admit.';
  } else if (
    ['narrow', 'constrained', 'scope-reduced', 'limited'].includes(normalized)
  ) {
    mappedDecision = 'narrow';
    mappingReason = 'Finance constrained allow branch maps to canonical narrow.';
  } else if (
    ['hold', 'review', 'review-required', 'needs-review', 'pending-review'].includes(normalized)
  ) {
    mappedDecision = 'review';
    mappingReason = 'Finance hold/review branch maps to canonical review.';
  } else if (
    ['fail', 'block', 'blocked', 'deny', 'denied', 'expired', 'revoked'].includes(normalized)
  ) {
    mappedDecision = 'block';
    mappingReason = 'Finance denial or invalid release state maps to canonical block.';
  }

  return Object.freeze({
    surface: 'finance-pipeline',
    value,
    mappedDecision,
    mappingReason,
  });
}

export function mapCryptoAdmissionOutcomeToAdmission(
  value: CryptoExecutionAdmissionOutcome | string,
): ConsequenceAdmissionNativeDecision {
  const normalized = value.trim().toLowerCase();
  let mappedDecision: ConsequenceAdmissionDecision = 'block';
  let mappingReason = 'Unknown crypto admission outcomes fail closed.';

  if (normalized === 'admit') {
    mappedDecision = 'admit';
    mappingReason = 'Crypto execution-admission admit maps to canonical admit.';
  } else if (normalized === 'needs-evidence') {
    mappedDecision = 'review';
    mappingReason = 'Crypto needs-evidence maps to canonical review.';
  } else if (normalized === 'deny') {
    mappedDecision = 'block';
    mappingReason = 'Crypto deny maps to canonical block.';
  }

  return Object.freeze({
    surface: 'crypto-execution-admission',
    value,
    mappedDecision,
    mappingReason,
  });
}

export function createConsequenceAdmissionCheck(
  input: ConsequenceAdmissionCheck,
): ConsequenceAdmissionCheck {
  return Object.freeze({
    kind: normalizeEnumValue(input.kind, CONSEQUENCE_ADMISSION_CHECK_KINDS, 'check.kind'),
    label: normalizeIdentifier(input.label, 'check.label'),
    outcome: normalizeEnumValue(
      input.outcome,
      CONSEQUENCE_ADMISSION_CHECK_OUTCOMES,
      'check.outcome',
    ),
    required: input.required,
    summary: normalizeIdentifier(input.summary, 'check.summary'),
    reasonCodes: readonlyCopy(input.reasonCodes),
    evidenceRefs: readonlyCopy(input.evidenceRefs),
  });
}


export function createConsequenceAdmissionRequest(
  input: CreateConsequenceAdmissionRequestInput,
): ConsequenceAdmissionRequest {
  const requestedAt = normalizeIsoTimestamp(input.requestedAt, 'requestedAt');
  const base = Object.freeze({
    version: CONSEQUENCE_ADMISSION_CONTRACT_VERSION,
    requestedAt,
    packFamily: normalizeEnumValue(
      input.packFamily,
      CONSEQUENCE_ADMISSION_PACK_FAMILIES,
      'packFamily',
    ),
    entryPoint: Object.freeze({
      kind: normalizeEnumValue(
        input.entryPoint.kind,
        CONSEQUENCE_ADMISSION_ENTRY_POINT_KINDS,
        'entryPoint.kind',
      ),
      id: normalizeIdentifier(input.entryPoint.id, 'entryPoint.id'),
      route: normalizeOptionalIdentifier(input.entryPoint.route, 'entryPoint.route'),
      packageSubpath: normalizeOptionalIdentifier(
        input.entryPoint.packageSubpath,
        'entryPoint.packageSubpath',
      ),
      sourceRef: normalizeOptionalIdentifier(input.entryPoint.sourceRef, 'entryPoint.sourceRef'),
    }),
    proposedConsequence: Object.freeze({
      actor: normalizeIdentifier(input.proposedConsequence.actor, 'proposedConsequence.actor'),
      action: normalizeIdentifier(input.proposedConsequence.action, 'proposedConsequence.action'),
      downstreamSystem: normalizeIdentifier(
        input.proposedConsequence.downstreamSystem,
        'proposedConsequence.downstreamSystem',
      ),
      consequenceKind: normalizeEnumValue(
        input.proposedConsequence.consequenceKind,
        CONSEQUENCE_ADMISSION_CONSEQUENCE_KINDS,
        'proposedConsequence.consequenceKind',
      ),
      riskClass: normalizeEnumValue(
        input.proposedConsequence.riskClass,
        CONSEQUENCE_ADMISSION_RISK_CLASSES,
        'proposedConsequence.riskClass',
      ),
      summary: normalizeIdentifier(
        input.proposedConsequence.summary,
        'proposedConsequence.summary',
      ),
    }),
    policyScope: Object.freeze({
      policyRef: input.policyScope?.policyRef ?? null,
      tenantId: input.policyScope?.tenantId ?? null,
      environment: input.policyScope?.environment ?? null,
      dimensions: Object.freeze(input.policyScope?.dimensions ?? {}),
    }),
    authority: Object.freeze({
      actorRef: input.authority?.actorRef ?? null,
      reviewerRef: input.authority?.reviewerRef ?? null,
      signerRef: input.authority?.signerRef ?? null,
      delegationRef: input.authority?.delegationRef ?? null,
      authorityMode: input.authority?.authorityMode ?? null,
    }),
    evidence: Object.freeze((input.evidence ?? []).map(normalizeEvidenceRef)),
    nativeInputRefs: Object.freeze(
      (input.nativeInputRefs ?? []).map((entry) =>
        normalizeIdentifier(entry, 'nativeInputRefs[]'),
      ),
    ),
    retryAttempt: normalizeRetryAttemptBinding(input.retryAttempt),
  } satisfies Omit<ConsequenceAdmissionRequest, 'requestId'>);
  const requestId = normalizeOptionalIdentifier(input.requestId, 'requestId');

  if (base.retryAttempt !== null && requestId === base.retryAttempt.previousRequestId) {
    throw new Error(
      'Consequence admission retry attempts must not reuse the previous requestId.',
    );
  }

  return Object.freeze({
    ...base,
    requestId: requestId ?? requestIdFor(base),
  });
}

export function createConsequenceAdmissionResponse(
  input: CreateConsequenceAdmissionResponseInput,
): ConsequenceAdmissionResponse {
  const decidedAt = normalizeIsoTimestamp(input.decidedAt, 'decidedAt');
  const decision = normalizeEnumValue(input.decision, CONSEQUENCE_ADMISSION_DECISIONS, 'decision');
  const reason = normalizeIdentifier(input.reason, 'reason');
  const reasonCodes = readonlyCopy(input.reasonCodes);
  const constraints = Object.freeze((input.constraints ?? []).map(normalizeConstraint));

  if (decision === 'narrow' && constraints.length === 0) {
    throw new Error(
      'Consequence admission narrow decisions require at least one explicit constraint.',
    );
  }

  const nativeDecision = normalizeNativeDecision(input.nativeDecision);
  if (nativeDecision && nativeDecision.mappedDecision !== decision) {
    throw new Error(
      'Consequence admission native decision mapping must match the canonical decision.',
    );
  }

  const checks = Object.freeze((input.checks ?? []).map(createConsequenceAdmissionCheck));
  const proof = Object.freeze((input.proof ?? []).map(normalizeProofRef));
  const decisionAllows = consequenceAdmissionAllowsConsequence(decision);
  const requiredChecksSatisfied = !checks.some(
    (check) => check.required && check.outcome === 'fail',
  );
  const proofSatisfied = !decisionAllows || proof.length > 0;
  const decisionFailClosed = decision === 'review' || decision === 'block';
  const requestedFailClosed = input.failClosed ?? false;
  const allowed =
    decisionAllows &&
    proofSatisfied &&
    requiredChecksSatisfied &&
    !requestedFailClosed &&
    !decisionFailClosed;
  const failClosed = decisionFailClosed || requestedFailClosed || (decisionAllows && !allowed);
  const operationalContext = Object.freeze(input.operationalContext ?? {});
  const retry = createAdmissionRetryGuidance({
    decision,
    allowed,
    reasonCodes,
    operationalContext,
  });
  const feedback = createAdmissionFeedback({
    allowed,
    reasonCodes,
    retryAllowed: retry.retryAllowed,
  });
  const admissionId = admissionIdFor({
    decidedAt,
    requestId: input.request.requestId,
    decision,
    reasonCodes,
    proofDigests: proof.map((entry) => entry.digest ?? entry.id),
  });
  const canonicalPayload = {
    version: CONSEQUENCE_ADMISSION_CONTRACT_VERSION,
    admissionId,
    decidedAt,
    request: input.request,
    decision,
    allowed,
    failClosed,
    reason,
    reasonCodes,
    checks,
    constraints,
    nativeDecision,
    proof,
    feedback,
    retry,
    operationalContext,
  } as const;
  const canonical = canonicalObject(canonicalPayload as unknown as CanonicalReleaseJsonValue);

  return Object.freeze({
    ...canonicalPayload,
    canonical: canonical.canonical,
    digest: canonical.digest,
  });
}

export function createConsequenceAdmissionProblem(input: {
  readonly type: string;
  readonly title: string;
  readonly status: number;
  readonly detail: string;
  readonly instance?: string | null;
  readonly reasonCodes?: readonly string[];
}): ConsequenceAdmissionProblem {
  return Object.freeze({
    type: normalizeIdentifier(input.type, 'problem.type'),
    title: normalizeIdentifier(input.title, 'problem.title'),
    status: input.status,
    detail: normalizeIdentifier(input.detail, 'problem.detail'),
    instance: input.instance ?? null,
    decision: 'block',
    failClosed: true,
    reasonCodes: readonlyCopy(input.reasonCodes),
  });
}
