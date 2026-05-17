import { createHash } from 'node:crypto';
import {
  canonicalizeReleaseJson,
  type CanonicalReleaseJsonValue,
} from '../release-kernel/release-canonicalization.js';
import type {
  PolicyCandidatePrCandidate,
  PolicyCandidatePrContract,
} from './policy-candidate-pr-contract.js';
import type { EvidenceStateField } from './evidence-state-model.js';

export const ACTIVE_QUESTION_ENGINE_VERSION =
  'attestor.active-question-engine.v1';

export const ACTIVE_QUESTION_KINDS = [
  'bind-missing-evidence',
  'confirm-inferred-field',
  'resolve-conflicting-evidence',
  'refresh-stale-evidence',
  'approve-or-replace-producer',
  'attach-replay-digest',
  'answer-review-gate',
  'approve-or-dismiss-candidate',
] as const;
export type ActiveQuestionKind = typeof ACTIVE_QUESTION_KINDS[number];

export const ACTIVE_QUESTION_EXPECTED_ANSWER_KINDS = [
  'digest-ref',
  'yes-no',
  'choice',
  'producer-trust-decision',
  'conflict-resolution',
  'replay-digest',
  'approval-decision',
] as const;
export type ActiveQuestionExpectedAnswerKind =
  typeof ACTIVE_QUESTION_EXPECTED_ANSWER_KINDS[number];

export const ACTIVE_QUESTION_IMPACT_BANDS = [
  'low',
  'medium',
  'high',
  'critical',
] as const;
export type ActiveQuestionImpactBand =
  typeof ACTIVE_QUESTION_IMPACT_BANDS[number];

export const ACTIVE_QUESTION_ENGINE_STATUSES = [
  'questions-required',
  'no-active-questions',
] as const;
export type ActiveQuestionEngineStatus =
  typeof ACTIVE_QUESTION_ENGINE_STATUSES[number];

export interface CreateActiveQuestionEngineInput {
  readonly policyCandidatePrContract: PolicyCandidatePrContract;
  readonly generatedAt?: string | null;
  readonly maxQuestions?: number | null;
  readonly includeApprovalQuestions?: boolean | null;
}

export interface ActiveQuestion {
  readonly questionId: string;
  readonly questionDigest: string;
  readonly kind: ActiveQuestionKind;
  readonly expectedAnswerKind: ActiveQuestionExpectedAnswerKind;
  readonly prompt: string;
  readonly candidateId: string;
  readonly surfaceId: string;
  readonly actionSurface: string;
  readonly candidateApprovalState: PolicyCandidatePrCandidate['approvalState'];
  readonly candidateRiskScore: number;
  readonly candidateRiskBand: PolicyCandidatePrCandidate['riskBand'];
  readonly priorityScore: number;
  readonly impactBand: ActiveQuestionImpactBand;
  readonly riskReductionScore: number;
  readonly eventCoverageScore: number;
  readonly reviewLoadDeltaScore: number;
  readonly uncertaintyReductionScore: number;
  readonly sourceFieldRefs: readonly EvidenceStateField[];
  readonly resolvesReasonCodes: readonly string[];
  readonly sourceQuestionDigests: readonly string[];
  readonly sourceEventDigests: readonly string[];
  readonly sourceEvidenceStateDigest: string;
  readonly sourcePolicyCandidateDigest: string;
  readonly approvalRequired: true;
  readonly autoEnforce: false;
  readonly activatesEnforcement: false;
  readonly rawPayloadStored: false;
  readonly decisionSupportOnly: true;
}

export interface ActiveQuestionEngineResult {
  readonly version: typeof ACTIVE_QUESTION_ENGINE_VERSION;
  readonly generatedAt: string;
  readonly policyCandidatePrContractDigest: string;
  readonly policyCandidatePrContractVersion: PolicyCandidatePrContract['version'];
  readonly tenantRefDigest: string;
  readonly graphDigest: string;
  readonly schemaDigest: string;
  readonly candidateCount: number;
  readonly candidateWithQuestionCount: number;
  readonly questionCount: number;
  readonly omittedQuestionCount: number;
  readonly maxQuestions: number;
  readonly status: ActiveQuestionEngineStatus;
  readonly topPriorityScore: number | null;
  readonly questions: readonly ActiveQuestion[];
  readonly approvalRequired: true;
  readonly autoEnforce: false;
  readonly activatesEnforcement: false;
  readonly rawPayloadStored: false;
  readonly productionReady: false;
  readonly decisionSupportOnly: true;
  readonly canonical: string;
  readonly digest: string;
}

export interface ActiveQuestionEngineDescriptor {
  readonly version: typeof ACTIVE_QUESTION_ENGINE_VERSION;
  readonly questionKinds: typeof ACTIVE_QUESTION_KINDS;
  readonly expectedAnswerKinds: typeof ACTIVE_QUESTION_EXPECTED_ANSWER_KINDS;
  readonly impactBands: typeof ACTIVE_QUESTION_IMPACT_BANDS;
  readonly statuses: typeof ACTIVE_QUESTION_ENGINE_STATUSES;
  readonly defaultMaxQuestions: number;
  readonly tenantBound: true;
  readonly approvalRequired: true;
  readonly autoEnforce: false;
  readonly activatesEnforcement: false;
  readonly rawPayloadStored: false;
  readonly productionReady: false;
  readonly decisionSupportOnly: true;
}

const DEFAULT_MAX_QUESTIONS = 5;

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
    throw new Error(`Active question engine ${fieldName} must be an ISO timestamp.`);
  }
  return timestamp.toISOString();
}

function normalizeMaxQuestions(value: number | null | undefined): number {
  const raw = value ?? DEFAULT_MAX_QUESTIONS;
  if (!Number.isInteger(raw) || raw < 1 || raw > 25) {
    throw new Error('Active question engine maxQuestions must be an integer from 1 to 25.');
  }
  return raw;
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function expectedAnswerKind(kind: ActiveQuestionKind): ActiveQuestionExpectedAnswerKind {
  switch (kind) {
    case 'bind-missing-evidence':
      return 'digest-ref';
    case 'confirm-inferred-field':
      return 'yes-no';
    case 'resolve-conflicting-evidence':
      return 'conflict-resolution';
    case 'refresh-stale-evidence':
      return 'digest-ref';
    case 'approve-or-replace-producer':
      return 'producer-trust-decision';
    case 'attach-replay-digest':
      return 'replay-digest';
    case 'answer-review-gate':
      return 'choice';
    case 'approve-or-dismiss-candidate':
      return 'approval-decision';
  }
}

function impactBand(score: number): ActiveQuestionImpactBand {
  if (score >= 80) return 'critical';
  if (score >= 60) return 'high';
  if (score >= 35) return 'medium';
  return 'low';
}

function eventCoverageScore(candidate: PolicyCandidatePrCandidate): number {
  return clampScore(candidate.sourceEventDigests.length * 25);
}

function kindScores(input: {
  readonly kind: ActiveQuestionKind;
  readonly candidate: PolicyCandidatePrCandidate;
  readonly fieldCount: number;
}): {
  readonly riskReductionScore: number;
  readonly reviewLoadDeltaScore: number;
  readonly uncertaintyReductionScore: number;
} {
  const riskBase = input.candidate.riskScore;
  switch (input.kind) {
    case 'bind-missing-evidence':
      return {
        riskReductionScore: clampScore(riskBase + 25),
        reviewLoadDeltaScore: clampScore(45 + input.fieldCount * 12),
        uncertaintyReductionScore: 95,
      };
    case 'confirm-inferred-field':
      return {
        riskReductionScore: clampScore(riskBase + 12),
        reviewLoadDeltaScore: clampScore(40 + input.fieldCount * 10),
        uncertaintyReductionScore: 82,
      };
    case 'resolve-conflicting-evidence':
      return {
        riskReductionScore: clampScore(riskBase + 30),
        reviewLoadDeltaScore: 78,
        uncertaintyReductionScore: 100,
      };
    case 'refresh-stale-evidence':
      return {
        riskReductionScore: clampScore(riskBase + 18),
        reviewLoadDeltaScore: 64,
        uncertaintyReductionScore: 76,
      };
    case 'approve-or-replace-producer':
      return {
        riskReductionScore: clampScore(riskBase + 22),
        reviewLoadDeltaScore: 72,
        uncertaintyReductionScore: 86,
      };
    case 'attach-replay-digest':
      return {
        riskReductionScore: clampScore(riskBase + 16),
        reviewLoadDeltaScore: 80,
        uncertaintyReductionScore: 72,
      };
    case 'answer-review-gate':
      return {
        riskReductionScore: clampScore(riskBase + 10),
        reviewLoadDeltaScore: 74,
        uncertaintyReductionScore: 84,
      };
    case 'approve-or-dismiss-candidate':
      return {
        riskReductionScore: clampScore(riskBase + 8),
        reviewLoadDeltaScore: 94,
        uncertaintyReductionScore: 45,
      };
  }
}

function priorityScore(input: {
  readonly riskReductionScore: number;
  readonly eventCoverageScore: number;
  readonly reviewLoadDeltaScore: number;
  readonly uncertaintyReductionScore: number;
}): number {
  return clampScore(
    input.riskReductionScore * 0.4 +
    input.eventCoverageScore * 0.2 +
    input.reviewLoadDeltaScore * 0.2 +
    input.uncertaintyReductionScore * 0.2,
  );
}

function matchingReasonCodes(
  candidate: PolicyCandidatePrCandidate,
  patterns: readonly RegExp[],
): readonly string[] {
  return Object.freeze(
    candidate.blockerReasonCodes
      .filter((code) => patterns.some((pattern) => pattern.test(code)))
      .sort(),
  );
}

function promptFor(input: {
  readonly kind: ActiveQuestionKind;
  readonly actionSurface: string;
  readonly fields: readonly EvidenceStateField[];
}): string {
  const fieldText = input.fields.length > 0 ? input.fields.join(', ') : 'this candidate';
  switch (input.kind) {
    case 'bind-missing-evidence':
      return `Bind digest-only evidence for ${fieldText} on ${input.actionSurface}.`;
    case 'confirm-inferred-field':
      return `Confirm whether inferred fields ${fieldText} are correct for ${input.actionSurface}.`;
    case 'resolve-conflicting-evidence':
      return `Resolve conflicting evidence for ${input.actionSurface} and attach a digest reference.`;
    case 'refresh-stale-evidence':
      return `Refresh stale evidence for ${input.actionSurface} and attach a digest reference.`;
    case 'approve-or-replace-producer':
      return `Approve or replace the untrusted producer evidence for ${input.actionSurface}.`;
    case 'attach-replay-digest':
      return `Attach replay or backtest digest evidence for ${input.actionSurface}.`;
    case 'answer-review-gate':
      return `Answer the existing review-gate question set for ${input.actionSurface}.`;
    case 'approve-or-dismiss-candidate':
      return `Approve or dismiss the policy candidate for ${input.actionSurface}.`;
  }
}

function createQuestion(input: {
  readonly kind: ActiveQuestionKind;
  readonly candidate: PolicyCandidatePrCandidate;
  readonly fields?: readonly EvidenceStateField[];
  readonly reasonCodes?: readonly string[];
  readonly sourceQuestionDigests?: readonly string[];
}): ActiveQuestion {
  const fields = Object.freeze([...(input.fields ?? [])].sort());
  const reasonCodes = Object.freeze([...(input.reasonCodes ?? [])].sort());
  const sourceQuestionDigests = Object.freeze([...(input.sourceQuestionDigests ?? [])].sort());
  const scores = kindScores({
    kind: input.kind,
    candidate: input.candidate,
    fieldCount: fields.length,
  });
  const coverageScore = eventCoverageScore(input.candidate);
  const score = priorityScore({
    ...scores,
    eventCoverageScore: coverageScore,
  });
  const base = {
    kind: input.kind,
    expectedAnswerKind: expectedAnswerKind(input.kind),
    prompt: promptFor({
      kind: input.kind,
      actionSurface: input.candidate.actionSurface,
      fields,
    }),
    candidateId: input.candidate.candidateId,
    surfaceId: input.candidate.surfaceId,
    actionSurface: input.candidate.actionSurface,
    candidateApprovalState: input.candidate.approvalState,
    candidateRiskScore: input.candidate.riskScore,
    candidateRiskBand: input.candidate.riskBand,
    priorityScore: score,
    impactBand: impactBand(score),
    riskReductionScore: scores.riskReductionScore,
    eventCoverageScore: coverageScore,
    reviewLoadDeltaScore: scores.reviewLoadDeltaScore,
    uncertaintyReductionScore: scores.uncertaintyReductionScore,
    sourceFieldRefs: fields,
    resolvesReasonCodes: reasonCodes,
    sourceQuestionDigests,
    sourceEventDigests: input.candidate.sourceEventDigests,
    sourceEvidenceStateDigest: input.candidate.sourceEvidenceStateDigest,
    sourcePolicyCandidateDigest: input.candidate.digest,
    approvalRequired: true as const,
    autoEnforce: false as const,
    activatesEnforcement: false as const,
    rawPayloadStored: false as const,
    decisionSupportOnly: true as const,
  };
  const questionDigest = canonicalObject(base as unknown as CanonicalReleaseJsonValue).digest;
  return Object.freeze({
    questionId: `active-question:${questionDigest.slice('sha256:'.length, 23)}`,
    questionDigest,
    ...base,
  });
}

function questionsForCandidate(
  candidate: PolicyCandidatePrCandidate,
  includeApprovalQuestions: boolean,
): readonly ActiveQuestion[] {
  const questions: ActiveQuestion[] = [];
  if (candidate.missingEvidenceFields.length > 0) {
    questions.push(createQuestion({
      kind: 'bind-missing-evidence',
      candidate,
      fields: candidate.missingEvidenceFields,
      reasonCodes: matchingReasonCodes(candidate, [/missing/u]),
    }));
  }
  if (candidate.inferredFields.length > 0) {
    questions.push(createQuestion({
      kind: 'confirm-inferred-field',
      candidate,
      fields: candidate.inferredFields,
      reasonCodes: matchingReasonCodes(candidate, [/inferred/u]),
    }));
  }
  const conflictCodes = matchingReasonCodes(candidate, [/conflict/u]);
  if (conflictCodes.length > 0) {
    questions.push(createQuestion({
      kind: 'resolve-conflicting-evidence',
      candidate,
      reasonCodes: conflictCodes,
    }));
  }
  const staleCodes = matchingReasonCodes(candidate, [/stale/u]);
  if (staleCodes.length > 0) {
    questions.push(createQuestion({
      kind: 'refresh-stale-evidence',
      candidate,
      reasonCodes: staleCodes,
    }));
  }
  const producerCodes = matchingReasonCodes(candidate, [/untrusted/u, /producer/u]);
  if (producerCodes.length > 0) {
    questions.push(createQuestion({
      kind: 'approve-or-replace-producer',
      candidate,
      reasonCodes: producerCodes,
    }));
  }
  if (candidate.replayDigest === null) {
    questions.push(createQuestion({
      kind: 'attach-replay-digest',
      candidate,
      reasonCodes: ['replay-digest-missing'],
    }));
  }
  if (candidate.questionDigests.length > 0) {
    questions.push(createQuestion({
      kind: 'answer-review-gate',
      candidate,
      sourceQuestionDigests: candidate.questionDigests,
      reasonCodes: ['review-gate-questions-present'],
    }));
  }
  if (includeApprovalQuestions && candidate.approvalState === 'approval-ready') {
    questions.push(createQuestion({
      kind: 'approve-or-dismiss-candidate',
      candidate,
      reasonCodes: ['human-approval-required'],
    }));
  }
  return Object.freeze(questions);
}

export function createActiveQuestionEngine(
  input: CreateActiveQuestionEngineInput,
): ActiveQuestionEngineResult {
  const generatedAt = normalizeIsoTimestamp(
    input.generatedAt,
    input.policyCandidatePrContract.generatedAt,
    'generatedAt',
  );
  const maxQuestions = normalizeMaxQuestions(input.maxQuestions);
  const includeApprovalQuestions = input.includeApprovalQuestions ?? true;
  const allQuestions = input.policyCandidatePrContract.candidates
    .flatMap((candidate) => questionsForCandidate(candidate, includeApprovalQuestions))
    .sort((left, right) =>
      right.priorityScore - left.priorityScore ||
      right.riskReductionScore - left.riskReductionScore ||
      left.kind.localeCompare(right.kind) ||
      left.candidateId.localeCompare(right.candidateId)
    );
  const questions = Object.freeze(allQuestions.slice(0, maxQuestions));
  const candidateIds = new Set(questions.map((question) => question.candidateId));
  const payload = {
    version: ACTIVE_QUESTION_ENGINE_VERSION as typeof ACTIVE_QUESTION_ENGINE_VERSION,
    generatedAt,
    policyCandidatePrContractDigest: input.policyCandidatePrContract.digest,
    policyCandidatePrContractVersion: input.policyCandidatePrContract.version,
    tenantRefDigest: input.policyCandidatePrContract.tenantRefDigest,
    graphDigest: input.policyCandidatePrContract.graphDigest,
    schemaDigest: input.policyCandidatePrContract.schemaDigest,
    candidateCount: input.policyCandidatePrContract.candidateCount,
    candidateWithQuestionCount: candidateIds.size,
    questionCount: questions.length,
    omittedQuestionCount: Math.max(0, allQuestions.length - questions.length),
    maxQuestions,
    status: questions.length > 0
      ? 'questions-required' as const
      : 'no-active-questions' as const,
    topPriorityScore: questions[0]?.priorityScore ?? null,
    questions,
    approvalRequired: true as const,
    autoEnforce: false as const,
    activatesEnforcement: false as const,
    rawPayloadStored: false as const,
    productionReady: false as const,
    decisionSupportOnly: true as const,
  };
  const canonical = canonicalObject(payload as unknown as CanonicalReleaseJsonValue);
  return Object.freeze({
    ...payload,
    canonical: canonical.canonical,
    digest: canonical.digest,
  });
}

export function activeQuestionEngineDescriptor(): ActiveQuestionEngineDescriptor {
  return Object.freeze({
    version: ACTIVE_QUESTION_ENGINE_VERSION,
    questionKinds: ACTIVE_QUESTION_KINDS,
    expectedAnswerKinds: ACTIVE_QUESTION_EXPECTED_ANSWER_KINDS,
    impactBands: ACTIVE_QUESTION_IMPACT_BANDS,
    statuses: ACTIVE_QUESTION_ENGINE_STATUSES,
    defaultMaxQuestions: DEFAULT_MAX_QUESTIONS,
    tenantBound: true,
    approvalRequired: true,
    autoEnforce: false,
    activatesEnforcement: false,
    rawPayloadStored: false,
    productionReady: false,
    decisionSupportOnly: true,
  });
}
