import { createHash } from 'node:crypto';
import {
  canonicalizeReleaseJson,
  type CanonicalReleaseJsonValue,
} from '../release-kernel/release-canonicalization.js';
import {
  CONSEQUENCE_DATA_MINIMIZATION_REDACTION_POLICY_VERSION,
} from './data-minimization-redaction-policy.js';
import type {
  ConsequenceAdmissionDownstreamExecutionReceipt,
} from './downstream-execution-receipt.js';
import type {
  PolicyFoundryCoverageScore,
} from './policy-foundry-coverage-score.js';
import type {
  PolicyFoundryOnboardingSession,
} from './policy-foundry-onboarding-session.js';
import type {
  PolicyFoundryPolicyTwinSummary,
} from './policy-foundry-policy-twin-summary.js';

export const POLICY_FOUNDRY_OUTCOME_FEEDBACK_LOOP_VERSION =
  'attestor.policy-foundry-outcome-feedback-loop.v1';

export const POLICY_FOUNDRY_OUTCOME_FEEDBACK_LOOP_STATUSES = [
  'no-feedback',
  'collecting-feedback',
  'scoring-feedback-ready',
] as const;
export type PolicyFoundryOutcomeFeedbackLoopStatus =
  typeof POLICY_FOUNDRY_OUTCOME_FEEDBACK_LOOP_STATUSES[number];

export const POLICY_FOUNDRY_REVIEWED_DECISION_OUTCOMES = [
  'approved',
  'rejected',
  'modified',
  'escalated',
] as const;
export type PolicyFoundryReviewedDecisionOutcome =
  typeof POLICY_FOUNDRY_REVIEWED_DECISION_OUTCOMES[number];

export const POLICY_FOUNDRY_OUTCOME_FEEDBACK_NO_GO_REASONS = [
  'no-reviewed-decisions',
  'no-downstream-receipts',
  'missing-feedback-digests',
  'invalid-feedback-digests',
  'reviewer-disagreement',
  'failed-downstream-receipts',
  'skipped-downstream-receipts',
  'missing-receipts-after-review',
] as const;
export type PolicyFoundryOutcomeFeedbackNoGoReason =
  typeof POLICY_FOUNDRY_OUTCOME_FEEDBACK_NO_GO_REASONS[number];

export interface PolicyFoundryReviewedDecisionFeedback {
  readonly decisionDigest: string;
  readonly decidedAt: string;
  readonly outcome: PolicyFoundryReviewedDecisionOutcome;
  readonly actionSurface?: string | null;
  readonly domain?: string | null;
  readonly downstreamSystem?: string | null;
  readonly policyCandidateDigest?: string | null;
  readonly reviewerRefDigest?: string | null;
  readonly evidenceDigest?: string | null;
  readonly reasonCodes?: readonly string[] | null;
}

export interface CreatePolicyFoundryOutcomeFeedbackLoopInput {
  readonly generatedAt?: string | null;
  readonly actionSurface?: string | null;
  readonly domain?: string | null;
  readonly downstreamSystem?: string | null;
  readonly onboardingSession?: PolicyFoundryOnboardingSession | null;
  readonly coverage?: PolicyFoundryCoverageScore | null;
  readonly policyTwinSummary?: PolicyFoundryPolicyTwinSummary | null;
  readonly reviewedDecisions?: readonly PolicyFoundryReviewedDecisionFeedback[] | null;
  readonly downstreamReceipts?: readonly ConsequenceAdmissionDownstreamExecutionReceipt[] | null;
}

export interface PolicyFoundryOutcomeFeedbackSignals {
  readonly reviewedDecisionCount: number;
  readonly approvedCount: number;
  readonly rejectedCount: number;
  readonly modifiedCount: number;
  readonly escalatedCount: number;
  readonly downstreamReceiptCount: number;
  readonly succeededCount: number;
  readonly failedCount: number;
  readonly skippedCount: number;
  readonly reviewerAgreementRate: number;
  readonly downstreamSuccessRate: number;
  readonly downstreamFailureRate: number;
  readonly downstreamSkipRate: number;
  readonly missingReceiptCount: number;
  readonly feedbackCompletenessRate: number;
  readonly scoringSignal:
    | 'insufficient-feedback'
    | 'negative-outcome-signal'
    | 'mixed-outcome-signal'
    | 'positive-outcome-signal';
}

export interface PolicyFoundryOutcomeFeedbackScoringAdjustment {
  readonly dimension:
    | 'customer-approval'
    | 'policy-twin'
    | 'verifier-or-gateway'
    | 'replay-idempotency'
    | 'evidence-binding';
  readonly effect: 'positive' | 'negative' | 'neutral';
  readonly reasonCodes: readonly string[];
}

export interface PolicyFoundryOutcomeFeedbackLoop {
  readonly version: typeof POLICY_FOUNDRY_OUTCOME_FEEDBACK_LOOP_VERSION;
  readonly generatedAt: string;
  readonly status: PolicyFoundryOutcomeFeedbackLoopStatus;
  readonly actionSurface: string | null;
  readonly domain: string | null;
  readonly downstreamSystem: string | null;
  readonly sourceDigests: {
    readonly onboardingSessionDigest: string | null;
    readonly coverageDigest: string | null;
    readonly policyTwinSummaryDigest: string | null;
    readonly reviewedDecisionDigests: readonly string[];
    readonly downstreamReceiptDigests: readonly string[];
  };
  readonly signals: PolicyFoundryOutcomeFeedbackSignals;
  readonly scoringAdjustments: readonly PolicyFoundryOutcomeFeedbackScoringAdjustment[];
  readonly noGoReasons: readonly PolicyFoundryOutcomeFeedbackNoGoReason[];
  readonly nextSafeStep: string;
  readonly approvalRequired: true;
  readonly autoEnforce: false;
  readonly rawPayloadStored: false;
  readonly productionReady: false;
  readonly activatesEnforcement: false;
  readonly scoringInputOnly: true;
  readonly automaticScoreMutationAllowed: false;
  readonly feedbackAuthorityAllowed: false;
  readonly llmTrainingAllowed: false;
  readonly dataMinimizationPolicyVersion: typeof CONSEQUENCE_DATA_MINIMIZATION_REDACTION_POLICY_VERSION;
  readonly dataMinimizationSurfaceKind: 'policy-foundry-outcome-feedback-loop';
  readonly limitation: string;
  readonly canonical: string;
  readonly digest: string;
}

export interface PolicyFoundryOutcomeFeedbackLoopDescriptor {
  readonly version: typeof POLICY_FOUNDRY_OUTCOME_FEEDBACK_LOOP_VERSION;
  readonly statuses: typeof POLICY_FOUNDRY_OUTCOME_FEEDBACK_LOOP_STATUSES;
  readonly reviewedDecisionOutcomes: typeof POLICY_FOUNDRY_REVIEWED_DECISION_OUTCOMES;
  readonly noGoReasons: typeof POLICY_FOUNDRY_OUTCOME_FEEDBACK_NO_GO_REASONS;
  readonly approvalRequired: true;
  readonly autoEnforce: false;
  readonly rawPayloadStored: false;
  readonly productionReady: false;
  readonly activatesEnforcement: false;
  readonly scoringInputOnly: true;
  readonly automaticScoreMutationAllowed: false;
  readonly feedbackAuthorityAllowed: false;
  readonly llmTrainingAllowed: false;
  readonly dataMinimizationPolicyVersion: typeof CONSEQUENCE_DATA_MINIMIZATION_REDACTION_POLICY_VERSION;
  readonly dataMinimizationSurfaceKind: 'policy-foundry-outcome-feedback-loop';
}

interface DigestNormalization {
  readonly digest: string | null;
  readonly invalid: boolean;
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
    throw new Error(`Policy Foundry outcome feedback loop ${fieldName} must be an ISO timestamp.`);
  }
  return timestamp.toISOString();
}

function normalizeOptionalText(value: string | null | undefined): string | null {
  const normalized = value?.trim();
  return normalized && normalized.length > 0 ? normalized : null;
}

function isDigestReference(value: string): boolean {
  return /^sha256:[a-f0-9]{64}$/iu.test(value);
}

function normalizeDigestReference(
  value: string | null | undefined,
): DigestNormalization {
  const normalized = normalizeOptionalText(value);
  if (normalized === null) return Object.freeze({ digest: null, invalid: false });
  if (!isDigestReference(normalized)) return Object.freeze({ digest: null, invalid: true });
  return Object.freeze({ digest: normalized, invalid: false });
}

function roundedRate(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return Number(Math.max(0, Math.min(1, numerator / denominator)).toFixed(2));
}

function safeReasonCodes(values: readonly string[] | null | undefined): readonly string[] {
  if (!values) return Object.freeze([]);
  return Object.freeze([...new Set(values
    .map((value) => value.trim().toLowerCase())
    .filter((value) => /^[a-z0-9:._-]{1,96}$/u.test(value)))].sort());
}

function outcomeCounts(
  decisions: readonly PolicyFoundryReviewedDecisionFeedback[],
): Pick<
PolicyFoundryOutcomeFeedbackSignals,
'approvedCount' | 'rejectedCount' | 'modifiedCount' | 'escalatedCount'
> {
  return Object.freeze({
    approvedCount: decisions.filter((decision) => decision.outcome === 'approved').length,
    rejectedCount: decisions.filter((decision) => decision.outcome === 'rejected').length,
    modifiedCount: decisions.filter((decision) => decision.outcome === 'modified').length,
    escalatedCount: decisions.filter((decision) => decision.outcome === 'escalated').length,
  });
}

function statusCounts(
  receipts: readonly ConsequenceAdmissionDownstreamExecutionReceipt[],
): Pick<
PolicyFoundryOutcomeFeedbackSignals,
'succeededCount' | 'failedCount' | 'skippedCount'
> {
  return Object.freeze({
    succeededCount: receipts.filter((receipt) => receipt.status === 'succeeded').length,
    failedCount: receipts.filter((receipt) => receipt.status === 'failed').length,
    skippedCount: receipts.filter((receipt) => receipt.status === 'skipped').length,
  });
}

function noGoReasons(input: {
  readonly decisions: readonly PolicyFoundryReviewedDecisionFeedback[];
  readonly receipts: readonly ConsequenceAdmissionDownstreamExecutionReceipt[];
  readonly invalidDigestCount: number;
  readonly signals: PolicyFoundryOutcomeFeedbackSignals;
}): readonly PolicyFoundryOutcomeFeedbackNoGoReason[] {
  const reasons: PolicyFoundryOutcomeFeedbackNoGoReason[] = [];
  if (input.decisions.length === 0) reasons.push('no-reviewed-decisions');
  if (input.receipts.length === 0) reasons.push('no-downstream-receipts');
  if (input.decisions.some((decision) => !normalizeOptionalText(decision.decisionDigest))) {
    reasons.push('missing-feedback-digests');
  }
  if (input.invalidDigestCount > 0) reasons.push('invalid-feedback-digests');
  if (input.signals.reviewerAgreementRate < 0.8 && input.decisions.length > 0) {
    reasons.push('reviewer-disagreement');
  }
  if (input.signals.failedCount > 0) reasons.push('failed-downstream-receipts');
  if (input.signals.skippedCount > 0) reasons.push('skipped-downstream-receipts');
  if (input.signals.missingReceiptCount > 0) reasons.push('missing-receipts-after-review');
  return Object.freeze(POLICY_FOUNDRY_OUTCOME_FEEDBACK_NO_GO_REASONS.filter((reason) =>
    reasons.includes(reason),
  ));
}

function scoringSignal(
  signals: Omit<PolicyFoundryOutcomeFeedbackSignals, 'scoringSignal'>,
): PolicyFoundryOutcomeFeedbackSignals['scoringSignal'] {
  if (signals.reviewedDecisionCount === 0 || signals.downstreamReceiptCount === 0) {
    return 'insufficient-feedback';
  }
  if (signals.downstreamFailureRate > 0 || signals.downstreamSkipRate > 0) {
    return 'negative-outcome-signal';
  }
  if (signals.reviewerAgreementRate < 0.9 || signals.feedbackCompletenessRate < 1) {
    return 'mixed-outcome-signal';
  }
  return 'positive-outcome-signal';
}

function createSignals(input: {
  readonly decisions: readonly PolicyFoundryReviewedDecisionFeedback[];
  readonly receipts: readonly ConsequenceAdmissionDownstreamExecutionReceipt[];
}): PolicyFoundryOutcomeFeedbackSignals {
  const decisionCounts = outcomeCounts(input.decisions);
  const receiptCounts = statusCounts(input.receipts);
  const reviewedDecisionCount = input.decisions.length;
  const downstreamReceiptCount = input.receipts.length;
  const missingReceiptCount = Math.max(0, reviewedDecisionCount - downstreamReceiptCount);
  const base = {
    reviewedDecisionCount,
    ...decisionCounts,
    downstreamReceiptCount,
    ...receiptCounts,
    reviewerAgreementRate: roundedRate(decisionCounts.approvedCount, reviewedDecisionCount),
    downstreamSuccessRate: roundedRate(receiptCounts.succeededCount, downstreamReceiptCount),
    downstreamFailureRate: roundedRate(receiptCounts.failedCount, downstreamReceiptCount),
    downstreamSkipRate: roundedRate(receiptCounts.skippedCount, downstreamReceiptCount),
    missingReceiptCount,
    feedbackCompletenessRate: reviewedDecisionCount === 0 && downstreamReceiptCount === 0
      ? 0
      : roundedRate(
        Math.min(reviewedDecisionCount, downstreamReceiptCount),
        Math.max(reviewedDecisionCount, downstreamReceiptCount),
      ),
  };
  return Object.freeze({
    ...base,
    scoringSignal: scoringSignal(base),
  });
}

function statusFor(input: {
  readonly decisions: readonly PolicyFoundryReviewedDecisionFeedback[];
  readonly receipts: readonly ConsequenceAdmissionDownstreamExecutionReceipt[];
  readonly noGoReasons: readonly PolicyFoundryOutcomeFeedbackNoGoReason[];
}): PolicyFoundryOutcomeFeedbackLoopStatus {
  if (input.decisions.length === 0 && input.receipts.length === 0) return 'no-feedback';
  if (input.noGoReasons.length > 0) return 'collecting-feedback';
  return 'scoring-feedback-ready';
}

function nextSafeStep(status: PolicyFoundryOutcomeFeedbackLoopStatus): string {
  switch (status) {
    case 'no-feedback':
      return 'Collect reviewed decisions and downstream execution receipts before feeding outcome signals into scoring.';
    case 'collecting-feedback':
      return 'Close outcome feedback no-go reasons before using these signals in Policy Foundry scoring review.';
    case 'scoring-feedback-ready':
      return 'Use the digest-first outcome signals as review input only; do not mutate scores or activate enforcement automatically.';
  }
}

function scoringAdjustments(
  signals: PolicyFoundryOutcomeFeedbackSignals,
  reasons: readonly PolicyFoundryOutcomeFeedbackNoGoReason[],
): readonly PolicyFoundryOutcomeFeedbackScoringAdjustment[] {
  const negative = reasons.length > 0;
  return Object.freeze([
    Object.freeze({
      dimension: 'customer-approval' as const,
      effect: signals.reviewerAgreementRate >= 0.9 && signals.reviewedDecisionCount > 0
        ? 'positive' as const
        : negative ? 'negative' as const : 'neutral' as const,
      reasonCodes: safeReasonCodes([
        `reviewer-agreement:${signals.reviewerAgreementRate}`,
        ...reasons.filter((reason) => reason === 'reviewer-disagreement'),
      ]),
    }),
    Object.freeze({
      dimension: 'verifier-or-gateway' as const,
      effect: signals.downstreamSuccessRate === 1 && signals.downstreamReceiptCount > 0
        ? 'positive' as const
        : negative ? 'negative' as const : 'neutral' as const,
      reasonCodes: safeReasonCodes([
        `downstream-success:${signals.downstreamSuccessRate}`,
        ...reasons.filter((reason) =>
          reason === 'failed-downstream-receipts' ||
          reason === 'skipped-downstream-receipts' ||
          reason === 'no-downstream-receipts'
        ),
      ]),
    }),
    Object.freeze({
      dimension: 'replay-idempotency' as const,
      effect: signals.missingReceiptCount === 0 && signals.downstreamReceiptCount > 0
        ? 'positive' as const
        : 'negative' as const,
      reasonCodes: safeReasonCodes([
        `feedback-completeness:${signals.feedbackCompletenessRate}`,
        ...reasons.filter((reason) => reason === 'missing-receipts-after-review'),
      ]),
    }),
    Object.freeze({
      dimension: 'policy-twin' as const,
      effect: signals.scoringSignal === 'positive-outcome-signal'
        ? 'positive' as const
        : signals.scoringSignal === 'insufficient-feedback' ? 'neutral' as const : 'negative' as const,
      reasonCodes: safeReasonCodes([signals.scoringSignal]),
    }),
    Object.freeze({
      dimension: 'evidence-binding' as const,
      effect: reasons.includes('invalid-feedback-digests') ||
        reasons.includes('missing-feedback-digests')
        ? 'negative' as const
        : 'neutral' as const,
      reasonCodes: safeReasonCodes(reasons.filter((reason) =>
        reason === 'invalid-feedback-digests' || reason === 'missing-feedback-digests'
      )),
    }),
  ]);
}

function sourceActionSurface(input: CreatePolicyFoundryOutcomeFeedbackLoopInput): string | null {
  return normalizeOptionalText(input.actionSurface) ??
    input.coverage?.surfaces[0]?.actionSurface ??
    input.policyTwinSummary?.actionSurface ??
    input.onboardingSession?.actionSurface ??
    input.reviewedDecisions?.find((decision) => normalizeOptionalText(decision.actionSurface))?.actionSurface ??
    null;
}

function sourceDomain(input: CreatePolicyFoundryOutcomeFeedbackLoopInput): string | null {
  return normalizeOptionalText(input.domain) ??
    input.coverage?.surfaces[0]?.domain ??
    input.policyTwinSummary?.domain ??
    input.onboardingSession?.domain ??
    input.reviewedDecisions?.find((decision) => normalizeOptionalText(decision.domain))?.domain ??
    null;
}

function sourceDownstreamSystem(input: CreatePolicyFoundryOutcomeFeedbackLoopInput): string | null {
  return normalizeOptionalText(input.downstreamSystem) ??
    input.coverage?.surfaces[0]?.downstreamSystem ??
    input.onboardingSession?.downstreamSystem ??
    input.downstreamReceipts?.find((receipt) => normalizeOptionalText(receipt.downstreamSystem))?.downstreamSystem ??
    input.reviewedDecisions?.find((decision) => normalizeOptionalText(decision.downstreamSystem))?.downstreamSystem ??
    null;
}

export function createPolicyFoundryOutcomeFeedbackLoop(
  input: CreatePolicyFoundryOutcomeFeedbackLoopInput,
): PolicyFoundryOutcomeFeedbackLoop {
  const generatedAt = normalizeIsoTimestamp(
    input.generatedAt,
    new Date().toISOString(),
    'generatedAt',
  );
  const decisions = Object.freeze([...(input.reviewedDecisions ?? [])]);
  const receipts = Object.freeze([...(input.downstreamReceipts ?? [])]);
  const decisionDigestRefs = decisions.map((decision) => normalizeDigestReference(decision.decisionDigest));
  const optionalDigestRefs = decisions.flatMap((decision) => [
    normalizeDigestReference(decision.policyCandidateDigest),
    normalizeDigestReference(decision.reviewerRefDigest),
    normalizeDigestReference(decision.evidenceDigest),
  ]);
  const receiptDigestRefs = receipts.map((receipt) => normalizeDigestReference(receipt.receiptDigest));
  const invalidDigestCount = [...decisionDigestRefs, ...optionalDigestRefs, ...receiptDigestRefs]
    .filter((ref) => ref.invalid).length;
  const signals = createSignals({ decisions, receipts });
  const reasons = noGoReasons({
    decisions,
    receipts,
    invalidDigestCount,
    signals,
  });
  const status = statusFor({ decisions, receipts, noGoReasons: reasons });
  const payload = {
    version: POLICY_FOUNDRY_OUTCOME_FEEDBACK_LOOP_VERSION as typeof POLICY_FOUNDRY_OUTCOME_FEEDBACK_LOOP_VERSION,
    generatedAt,
    status,
    actionSurface: sourceActionSurface(input),
    domain: sourceDomain(input),
    downstreamSystem: sourceDownstreamSystem(input),
    sourceDigests: {
      onboardingSessionDigest: input.onboardingSession?.digest ?? null,
      coverageDigest: input.coverage?.digest ?? null,
      policyTwinSummaryDigest: input.policyTwinSummary?.digest ?? null,
      reviewedDecisionDigests: Object.freeze(decisionDigestRefs
        .map((ref) => ref.digest)
        .filter((digest): digest is string => digest !== null)
        .sort()),
      downstreamReceiptDigests: Object.freeze(receiptDigestRefs
        .map((ref) => ref.digest)
        .filter((digest): digest is string => digest !== null)
        .sort()),
    },
    signals,
    scoringAdjustments: scoringAdjustments(signals, reasons),
    noGoReasons: reasons,
    nextSafeStep: nextSafeStep(status),
    approvalRequired: true as const,
    autoEnforce: false as const,
    rawPayloadStored: false as const,
    productionReady: false as const,
    activatesEnforcement: false as const,
    scoringInputOnly: true as const,
    automaticScoreMutationAllowed: false as const,
    feedbackAuthorityAllowed: false as const,
    llmTrainingAllowed: false as const,
    dataMinimizationPolicyVersion: CONSEQUENCE_DATA_MINIMIZATION_REDACTION_POLICY_VERSION as typeof CONSEQUENCE_DATA_MINIMIZATION_REDACTION_POLICY_VERSION,
    dataMinimizationSurfaceKind: 'policy-foundry-outcome-feedback-loop' as const,
    limitation:
      'Outcome feedback is a digest-first scoring signal. It does not train a model, mutate scores automatically, approve policies, activate enforcement, or prove production readiness.',
  };
  const canonical = canonicalObject(payload as unknown as CanonicalReleaseJsonValue);
  return Object.freeze({
    ...payload,
    canonical: canonical.canonical,
    digest: canonical.digest,
  });
}

export function policyFoundryOutcomeFeedbackLoopDescriptor():
PolicyFoundryOutcomeFeedbackLoopDescriptor {
  return Object.freeze({
    version: POLICY_FOUNDRY_OUTCOME_FEEDBACK_LOOP_VERSION,
    statuses: POLICY_FOUNDRY_OUTCOME_FEEDBACK_LOOP_STATUSES,
    reviewedDecisionOutcomes: POLICY_FOUNDRY_REVIEWED_DECISION_OUTCOMES,
    noGoReasons: POLICY_FOUNDRY_OUTCOME_FEEDBACK_NO_GO_REASONS,
    approvalRequired: true,
    autoEnforce: false,
    rawPayloadStored: false,
    productionReady: false,
    activatesEnforcement: false,
    scoringInputOnly: true,
    automaticScoreMutationAllowed: false,
    feedbackAuthorityAllowed: false,
    llmTrainingAllowed: false,
    dataMinimizationPolicyVersion: CONSEQUENCE_DATA_MINIMIZATION_REDACTION_POLICY_VERSION,
    dataMinimizationSurfaceKind: 'policy-foundry-outcome-feedback-loop',
  });
}
