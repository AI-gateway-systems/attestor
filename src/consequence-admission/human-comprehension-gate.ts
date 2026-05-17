import {
  ACTIVE_QUESTION_ENGINE_VERSION,
  type ActiveQuestion,
} from './active-question-engine.js';
import {
  CONFLICT_ABSTENTION_GATE_VERSION,
  type ConflictAbstentionGateReasonCode,
  type ConflictAbstentionGateResult,
} from './conflict-abstention-gate.js';

export const HUMAN_COMPREHENSION_GATE_VERSION =
  'attestor.human-comprehension-gate.v1';

export const HUMAN_COMPREHENSION_GATE_STATUSES = [
  'compact',
  'needs-human-review',
  'escalate',
  'overloaded',
] as const;
export type HumanComprehensionGateStatus =
  typeof HUMAN_COMPREHENSION_GATE_STATUSES[number];

export const HUMAN_COMPREHENSION_REVIEW_LOAD_BANDS = [
  'normal',
  'elevated',
  'overloaded',
] as const;
export type HumanComprehensionReviewLoadBand =
  typeof HUMAN_COMPREHENSION_REVIEW_LOAD_BANDS[number];

export const HUMAN_COMPREHENSION_REASON_SEVERITIES = [
  'info',
  'watch',
  'review',
  'escalate',
] as const;
export type HumanComprehensionReasonSeverity =
  typeof HUMAN_COMPREHENSION_REASON_SEVERITIES[number];

export const HUMAN_COMPREHENSION_GATE_REASON_CODES = [
  'reason-line-limit-applied',
  'active-question-cap-applied',
  'review-load-visible',
  'review-load-elevated',
  'review-load-overloaded',
  'first-readable-target-recorded',
  'decision-time-target-recorded',
  'hard-escalation-time-recorded',
  'escalation-required',
  'conflict-gate-review',
  'conflict-gate-hold',
  'conflict-gate-block-pressure',
  'no-admit-authority',
] as const;
export type HumanComprehensionGateReasonCode =
  typeof HUMAN_COMPREHENSION_GATE_REASON_CODES[number];

export const HUMAN_COMPREHENSION_LIMITS = Object.freeze({
  maxReasonLines: 7,
  defaultActiveQuestionCap: 3,
  hardActiveQuestionCap: 5,
  firstReadableTargetSeconds: 30,
  typicalDecisionTargetSeconds: 180,
  hardEscalationSeconds: 600,
  overloadReviewRatePerMinute: 4,
});

export interface HumanComprehensionReasonLineInput {
  readonly lineId: string;
  readonly severity: HumanComprehensionReasonSeverity;
  readonly text: string;
  readonly sourceDigest: string;
  readonly reasonCodes: readonly string[];
  readonly actionHint: string | null;
}

export interface HumanComprehensionReasonLine {
  readonly lineId: string;
  readonly rank: number;
  readonly severity: HumanComprehensionReasonSeverity;
  readonly text: string;
  readonly sourceDigest: string;
  readonly reasonCodes: readonly string[];
  readonly actionHint: string | null;
}

export interface HumanComprehensionActiveQuestionRef {
  readonly questionId: string;
  readonly questionDigest: string;
  readonly prompt: string;
  readonly expectedAnswerKind: ActiveQuestion['expectedAnswerKind'];
  readonly impactBand: ActiveQuestion['impactBand'];
  readonly priorityScore: number;
  readonly resolvesReasonCodes: readonly string[];
}

export interface HumanComprehensionReviewLoadInput {
  readonly pendingReviewItemCount: number;
  readonly humanActionItemCount: number;
  readonly reviewerCapacityPerHour: number;
  readonly currentReviewRatePerMinute: number;
}

export interface HumanComprehensionReviewLoadSummary {
  readonly pendingReviewItemCount: number;
  readonly humanActionItemCount: number;
  readonly reviewerCapacityPerHour: number;
  readonly currentReviewRatePerMinute: number;
  readonly loadRatio: number;
  readonly band: HumanComprehensionReviewLoadBand;
}

export interface HumanComprehensionGateInput {
  readonly envelopeRefDigest: string;
  readonly conflictGate: ConflictAbstentionGateResult;
  readonly reasonLineCandidates: readonly HumanComprehensionReasonLineInput[];
  readonly activeQuestions: readonly HumanComprehensionActiveQuestionRef[];
  readonly reviewLoad: HumanComprehensionReviewLoadInput;
  readonly maxReasonLines?: number | null;
  readonly maxActiveQuestions?: number | null;
}

export interface HumanComprehensionGateResult {
  readonly version: typeof HUMAN_COMPREHENSION_GATE_VERSION;
  readonly conflictAbstentionGateVersion: typeof CONFLICT_ABSTENTION_GATE_VERSION;
  readonly activeQuestionEngineVersion: typeof ACTIVE_QUESTION_ENGINE_VERSION;
  readonly envelopeRefDigest: string;
  readonly status: HumanComprehensionGateStatus;
  readonly reasonLineCount: number;
  readonly omittedReasonLineCount: number;
  readonly maxReasonLines: number;
  readonly reasonLines: readonly HumanComprehensionReasonLine[];
  readonly activeQuestionCount: number;
  readonly omittedActiveQuestionCount: number;
  readonly maxActiveQuestions: number;
  readonly activeQuestions: readonly HumanComprehensionActiveQuestionRef[];
  readonly reviewLoad: HumanComprehensionReviewLoadSummary;
  readonly escalationRequired: boolean;
  readonly estimatedDecisionSeconds: number;
  readonly firstReadableTargetSeconds:
    typeof HUMAN_COMPREHENSION_LIMITS.firstReadableTargetSeconds;
  readonly typicalDecisionTargetSeconds:
    typeof HUMAN_COMPREHENSION_LIMITS.typicalDecisionTargetSeconds;
  readonly hardEscalationSeconds:
    typeof HUMAN_COMPREHENSION_LIMITS.hardEscalationSeconds;
  readonly reasonCodes: readonly HumanComprehensionGateReasonCode[];
  readonly sourceConflictGateReasonCodes:
    readonly ConflictAbstentionGateReasonCode[];
  readonly boundedForHumanReview: true;
  readonly noNoisyDashboard: true;
  readonly canAdmit: false;
  readonly grantsAuthority: false;
  readonly activatesEnforcement: false;
  readonly autoEnforce: false;
  readonly rawPayloadStored: false;
  readonly productionReady: false;
}

export interface HumanComprehensionGateDescriptor {
  readonly version: typeof HUMAN_COMPREHENSION_GATE_VERSION;
  readonly conflictAbstentionGateVersion: typeof CONFLICT_ABSTENTION_GATE_VERSION;
  readonly activeQuestionEngineVersion: typeof ACTIVE_QUESTION_ENGINE_VERSION;
  readonly statuses: readonly HumanComprehensionGateStatus[];
  readonly reviewLoadBands: readonly HumanComprehensionReviewLoadBand[];
  readonly reasonSeverities: readonly HumanComprehensionReasonSeverity[];
  readonly reasonCodes: readonly HumanComprehensionGateReasonCode[];
  readonly limits: typeof HUMAN_COMPREHENSION_LIMITS;
  readonly pureFunction: true;
  readonly boundedForHumanReview: true;
  readonly maxReasonLinesEnforced: true;
  readonly activeQuestionCapEnforced: true;
  readonly reviewLoadVisible: true;
  readonly noNoisyDashboard: true;
  readonly canAdmit: false;
  readonly grantsAuthority: false;
  readonly activatesEnforcement: false;
  readonly autoEnforce: false;
  readonly rawPayloadStored: false;
  readonly productionReady: false;
}

const SHA256_DIGEST_PATTERN = /^sha256:[a-f0-9]{64}$/u;

function normalizeLimit(
  value: number | null | undefined,
  fallback: number,
  max: number,
  fieldName: string,
): number {
  const raw = value ?? fallback;
  if (!Number.isInteger(raw) || raw < 0 || raw > max) {
    throw new Error(
      `Human comprehension gate ${fieldName} must be an integer from 0 to ${max}.`,
    );
  }
  return raw;
}

function normalizeNonNegativeInteger(value: number, fieldName: string): number {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`Human comprehension gate ${fieldName} must be a non-negative integer.`);
  }
  return value;
}

function normalizeNonNegativeNumber(value: number, fieldName: string): number {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`Human comprehension gate ${fieldName} must be a non-negative number.`);
  }
  return value;
}

function normalizeDigest(value: string, fieldName: string): string {
  if (!SHA256_DIGEST_PATTERN.test(value)) {
    throw new Error(`Human comprehension gate ${fieldName} must be a sha256 digest.`);
  }
  return value;
}

function severityRank(severity: HumanComprehensionReasonSeverity): number {
  switch (severity) {
    case 'escalate':
      return 4;
    case 'review':
      return 3;
    case 'watch':
      return 2;
    case 'info':
      return 1;
  }
}

function impactRank(impactBand: ActiveQuestion['impactBand']): number {
  switch (impactBand) {
    case 'critical':
      return 4;
    case 'high':
      return 3;
    case 'medium':
      return 2;
    case 'low':
      return 1;
  }
}

function boundedText(value: string, fieldName: string): string {
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.length > 220) {
    throw new Error(
      `Human comprehension gate ${fieldName} must be non-empty and at most 220 characters.`,
    );
  }
  return trimmed;
}

function reviewLoadSummary(
  input: HumanComprehensionReviewLoadInput,
): HumanComprehensionReviewLoadSummary {
  const pendingReviewItemCount = normalizeNonNegativeInteger(
    input.pendingReviewItemCount,
    'pendingReviewItemCount',
  );
  const humanActionItemCount = normalizeNonNegativeInteger(
    input.humanActionItemCount,
    'humanActionItemCount',
  );
  const reviewerCapacityPerHour = normalizeNonNegativeInteger(
    input.reviewerCapacityPerHour,
    'reviewerCapacityPerHour',
  );
  const currentReviewRatePerMinute = normalizeNonNegativeNumber(
    input.currentReviewRatePerMinute,
    'currentReviewRatePerMinute',
  );
  const loadRatio = reviewerCapacityPerHour === 0
    ? pendingReviewItemCount === 0 ? 0 : 1
    : Math.min(1, pendingReviewItemCount / reviewerCapacityPerHour);
  const band = currentReviewRatePerMinute >= HUMAN_COMPREHENSION_LIMITS.overloadReviewRatePerMinute ||
    loadRatio >= 1
    ? 'overloaded'
    : currentReviewRatePerMinute >= 2 || loadRatio >= 0.7
      ? 'elevated'
      : 'normal';

  return Object.freeze({
    pendingReviewItemCount,
    humanActionItemCount,
    reviewerCapacityPerHour,
    currentReviewRatePerMinute,
    loadRatio,
    band,
  });
}

function normalizeReasonLines(
  candidates: readonly HumanComprehensionReasonLineInput[],
  maxReasonLines: number,
): readonly HumanComprehensionReasonLine[] {
  return Object.freeze(
    [...candidates]
      .map((line) => ({
        lineId: boundedText(line.lineId, 'reason lineId'),
        severity: line.severity,
        text: boundedText(line.text, 'reason text'),
        sourceDigest: normalizeDigest(line.sourceDigest, 'reason sourceDigest'),
        reasonCodes: Object.freeze([...line.reasonCodes]),
        actionHint: line.actionHint === null
          ? null
          : boundedText(line.actionHint, 'reason actionHint'),
      }))
      .sort((left, right) =>
        severityRank(right.severity) - severityRank(left.severity) ||
        left.lineId.localeCompare(right.lineId)
      )
      .slice(0, maxReasonLines)
      .map((line, index) => Object.freeze({
        ...line,
        rank: index + 1,
      })),
  );
}

function normalizeActiveQuestions(
  questions: readonly HumanComprehensionActiveQuestionRef[],
  maxActiveQuestions: number,
): readonly HumanComprehensionActiveQuestionRef[] {
  return Object.freeze(
    [...questions]
      .map((question) => Object.freeze({
        questionId: boundedText(question.questionId, 'questionId'),
        questionDigest: normalizeDigest(question.questionDigest, 'questionDigest'),
        prompt: boundedText(question.prompt, 'question prompt'),
        expectedAnswerKind: question.expectedAnswerKind,
        impactBand: question.impactBand,
        priorityScore: normalizeNonNegativeInteger(
          question.priorityScore,
          'question priorityScore',
        ),
        resolvesReasonCodes: Object.freeze([...question.resolvesReasonCodes]),
      }))
      .sort((left, right) =>
        right.priorityScore - left.priorityScore ||
        impactRank(right.impactBand) - impactRank(left.impactBand) ||
        left.questionId.localeCompare(right.questionId)
      )
      .slice(0, maxActiveQuestions),
  );
}

function estimatedDecisionSeconds(input: {
  readonly reasonLineCount: number;
  readonly activeQuestionCount: number;
  readonly reviewLoadBand: HumanComprehensionReviewLoadBand;
}): number {
  const loadPenalty = input.reviewLoadBand === 'overloaded'
    ? 360
    : input.reviewLoadBand === 'elevated'
      ? 120
      : 0;
  return Math.min(
    HUMAN_COMPREHENSION_LIMITS.hardEscalationSeconds,
    30 + input.reasonLineCount * 15 + input.activeQuestionCount * 45 + loadPenalty,
  );
}

export function humanComprehensionGateDescriptor():
  HumanComprehensionGateDescriptor {
  return Object.freeze({
    version: HUMAN_COMPREHENSION_GATE_VERSION,
    conflictAbstentionGateVersion: CONFLICT_ABSTENTION_GATE_VERSION,
    activeQuestionEngineVersion: ACTIVE_QUESTION_ENGINE_VERSION,
    statuses: HUMAN_COMPREHENSION_GATE_STATUSES,
    reviewLoadBands: HUMAN_COMPREHENSION_REVIEW_LOAD_BANDS,
    reasonSeverities: HUMAN_COMPREHENSION_REASON_SEVERITIES,
    reasonCodes: HUMAN_COMPREHENSION_GATE_REASON_CODES,
    limits: HUMAN_COMPREHENSION_LIMITS,
    pureFunction: true,
    boundedForHumanReview: true,
    maxReasonLinesEnforced: true,
    activeQuestionCapEnforced: true,
    reviewLoadVisible: true,
    noNoisyDashboard: true,
    canAdmit: false,
    grantsAuthority: false,
    activatesEnforcement: false,
    autoEnforce: false,
    rawPayloadStored: false,
    productionReady: false,
  });
}

export function evaluateHumanComprehensionGate(
  input: HumanComprehensionGateInput,
): HumanComprehensionGateResult {
  if (input.conflictGate.envelopeRefDigest !== input.envelopeRefDigest) {
    throw new Error(
      'Human comprehension gate conflict gate envelope digest must match input envelope digest.',
    );
  }
  const maxReasonLines = normalizeLimit(
    input.maxReasonLines,
    HUMAN_COMPREHENSION_LIMITS.maxReasonLines,
    HUMAN_COMPREHENSION_LIMITS.maxReasonLines,
    'maxReasonLines',
  );
  const maxActiveQuestions = normalizeLimit(
    input.maxActiveQuestions,
    HUMAN_COMPREHENSION_LIMITS.defaultActiveQuestionCap,
    HUMAN_COMPREHENSION_LIMITS.hardActiveQuestionCap,
    'maxActiveQuestions',
  );
  const reasonLines = normalizeReasonLines(
    input.reasonLineCandidates,
    maxReasonLines,
  );
  const activeQuestions = normalizeActiveQuestions(
    input.activeQuestions,
    maxActiveQuestions,
  );
  const reviewLoad = reviewLoadSummary(input.reviewLoad);
  const decisionSeconds = estimatedDecisionSeconds({
    reasonLineCount: reasonLines.length,
    activeQuestionCount: activeQuestions.length,
    reviewLoadBand: reviewLoad.band,
  });

  const sourceOutcome = input.conflictGate.outcome;
  const escalationRequired = sourceOutcome === 'block-pressure' ||
    sourceOutcome === 'abstain-hold' ||
    reviewLoad.band === 'overloaded' ||
    decisionSeconds >= HUMAN_COMPREHENSION_LIMITS.hardEscalationSeconds;
  const status = reviewLoad.band === 'overloaded'
    ? 'overloaded'
    : escalationRequired
      ? 'escalate'
      : sourceOutcome === 'review' || activeQuestions.length > 0
        ? 'needs-human-review'
        : 'compact';

  const reasonCodes: HumanComprehensionGateReasonCode[] = [
    'review-load-visible',
    'first-readable-target-recorded',
    'decision-time-target-recorded',
    'hard-escalation-time-recorded',
    'no-admit-authority',
  ];
  if (input.reasonLineCandidates.length > reasonLines.length) {
    reasonCodes.push('reason-line-limit-applied');
  }
  if (input.activeQuestions.length > activeQuestions.length) {
    reasonCodes.push('active-question-cap-applied');
  }
  if (reviewLoad.band === 'elevated') reasonCodes.push('review-load-elevated');
  if (reviewLoad.band === 'overloaded') reasonCodes.push('review-load-overloaded');
  if (escalationRequired) reasonCodes.push('escalation-required');
  if (sourceOutcome === 'review') reasonCodes.push('conflict-gate-review');
  if (sourceOutcome === 'abstain-hold') reasonCodes.push('conflict-gate-hold');
  if (sourceOutcome === 'block-pressure') {
    reasonCodes.push('conflict-gate-block-pressure');
  }

  return Object.freeze({
    version: HUMAN_COMPREHENSION_GATE_VERSION,
    conflictAbstentionGateVersion: CONFLICT_ABSTENTION_GATE_VERSION,
    activeQuestionEngineVersion: ACTIVE_QUESTION_ENGINE_VERSION,
    envelopeRefDigest: input.envelopeRefDigest,
    status,
    reasonLineCount: reasonLines.length,
    omittedReasonLineCount: input.reasonLineCandidates.length - reasonLines.length,
    maxReasonLines,
    reasonLines,
    activeQuestionCount: activeQuestions.length,
    omittedActiveQuestionCount: input.activeQuestions.length - activeQuestions.length,
    maxActiveQuestions,
    activeQuestions,
    reviewLoad,
    escalationRequired,
    estimatedDecisionSeconds: decisionSeconds,
    firstReadableTargetSeconds:
      HUMAN_COMPREHENSION_LIMITS.firstReadableTargetSeconds,
    typicalDecisionTargetSeconds:
      HUMAN_COMPREHENSION_LIMITS.typicalDecisionTargetSeconds,
    hardEscalationSeconds:
      HUMAN_COMPREHENSION_LIMITS.hardEscalationSeconds,
    reasonCodes: Object.freeze([...new Set(reasonCodes)]),
    sourceConflictGateReasonCodes: input.conflictGate.reasonCodes,
    boundedForHumanReview: true,
    noNoisyDashboard: true,
    canAdmit: false,
    grantsAuthority: false,
    activatesEnforcement: false,
    autoEnforce: false,
    rawPayloadStored: false,
    productionReady: false,
  });
}
