import { createHash } from 'node:crypto';
import {
  canonicalizeReleaseJson,
  type CanonicalReleaseJsonValue,
} from '../release-kernel/release-canonicalization.js';
import {
  SIGNED_ASSURANCE_PACKET_VERSION,
  type SignedAssurancePacket,
} from './signed-assurance-packet.js';

export const OUTCOME_INCIDENT_FEEDBACK_CONTRACT_VERSION =
  'attestor.outcome-incident-feedback-contract.v1';

export const OUTCOME_INCIDENT_FEEDBACK_SOURCE_CLASSES = [
  'downstream-receipt',
  'reviewer-label',
  'confirmed-incident',
  'operator-annotation',
  'inferred-signal',
] as const;
export type OutcomeIncidentFeedbackSourceClass =
  typeof OUTCOME_INCIDENT_FEEDBACK_SOURCE_CLASSES[number];

export const OUTCOME_INCIDENT_FEEDBACK_STATES = [
  'admitted',
  'executed',
  'receipted',
  'contested',
  'reversed',
  'incident',
  'postmortem',
  'learned',
] as const;
export type OutcomeIncidentFeedbackState =
  typeof OUTCOME_INCIDENT_FEEDBACK_STATES[number];

export const OUTCOME_INCIDENT_FEEDBACK_OUTCOMES = [
  'succeeded',
  'failed',
  'skipped',
  'contested',
  'reversed',
  'near-miss',
  'unknown',
] as const;
export type OutcomeIncidentFeedbackOutcome =
  typeof OUTCOME_INCIDENT_FEEDBACK_OUTCOMES[number];

export const OUTCOME_INCIDENT_CONSEQUENCE_EFFECTS = [
  'none',
  'bounded',
  'customer-impact',
  'tenant-impact',
  'systemic-impact',
] as const;
export type OutcomeIncidentConsequenceEffect =
  typeof OUTCOME_INCIDENT_CONSEQUENCE_EFFECTS[number];

export const OUTCOME_INCIDENT_MUTATION_REQUESTS = [
  'policy-update',
  'score-update',
  'model-training',
  'enforcement-activation',
  'measurement-update',
] as const;
export type OutcomeIncidentMutationRequest =
  typeof OUTCOME_INCIDENT_MUTATION_REQUESTS[number];

export const OUTCOME_INCIDENT_FEEDBACK_STATUSES = [
  'no-feedback',
  'collecting-feedback',
  'regression-required',
  'incident-review-required',
  'learning-ready',
] as const;
export type OutcomeIncidentFeedbackStatus =
  typeof OUTCOME_INCIDENT_FEEDBACK_STATUSES[number];

export const OUTCOME_INCIDENT_REPLAY_TRIGGER_REASONS = [
  'failed-downstream-outcome',
  'contested-outcome',
  'reversed-outcome',
  'near-miss-outcome',
  'confirmed-incident',
  'postmortem-required',
] as const;
export type OutcomeIncidentReplayTriggerReason =
  typeof OUTCOME_INCIDENT_REPLAY_TRIGGER_REASONS[number];

export const OUTCOME_INCIDENT_NO_GO_REASONS = [
  'no-feedback-events',
  'assurance-packet-not-ready',
  'only-inferred-feedback',
  'incident-without-incident-ref',
  'postmortem-without-postmortem-ref',
  'replay-regression-required',
  'blocked-mutation-requested',
  'customer-impact-review-required',
] as const;
export type OutcomeIncidentNoGoReason =
  typeof OUTCOME_INCIDENT_NO_GO_REASONS[number];

export interface OutcomeIncidentFeedbackEventInput {
  readonly eventId: string;
  readonly sourceClass: OutcomeIncidentFeedbackSourceClass;
  readonly sourceDigest: string;
  readonly observedAt: string;
  readonly state: OutcomeIncidentFeedbackState;
  readonly outcome: OutcomeIncidentFeedbackOutcome;
  readonly consequenceEffect: OutcomeIncidentConsequenceEffect;
  readonly confidence: number;
  readonly reviewerRefDigest?: string | null;
  readonly operatorRefDigest?: string | null;
  readonly incidentRefDigest?: string | null;
  readonly postmortemRefDigest?: string | null;
  readonly replayRefDigest?: string | null;
  readonly actionItemDigests?: readonly string[] | null;
  readonly requestedMutations?: readonly OutcomeIncidentMutationRequest[] | null;
  readonly reasonCodes?: readonly string[] | null;
}

export interface OutcomeIncidentFeedbackEvent {
  readonly eventId: string;
  readonly eventDigest: string;
  readonly sourceClass: OutcomeIncidentFeedbackSourceClass;
  readonly sourceDigest: string;
  readonly observedAt: string;
  readonly state: OutcomeIncidentFeedbackState;
  readonly outcome: OutcomeIncidentFeedbackOutcome;
  readonly consequenceEffect: OutcomeIncidentConsequenceEffect;
  readonly confidence: number;
  readonly reviewerRefDigest: string | null;
  readonly operatorRefDigest: string | null;
  readonly incidentRefDigest: string | null;
  readonly postmortemRefDigest: string | null;
  readonly replayRefDigest: string | null;
  readonly actionItemDigests: readonly string[];
  readonly requestedMutations: readonly OutcomeIncidentMutationRequest[];
  readonly blockedMutations: readonly OutcomeIncidentMutationRequest[];
  readonly replayTriggerReasons: readonly OutcomeIncidentReplayTriggerReason[];
  readonly reasonCodes: readonly string[];
  readonly rawPayloadStored: false;
}

export interface OutcomeIncidentFeedbackSourceCounts {
  readonly downstreamReceipt: number;
  readonly reviewerLabel: number;
  readonly confirmedIncident: number;
  readonly operatorAnnotation: number;
  readonly inferredSignal: number;
}

export interface OutcomeIncidentFeedbackSummary {
  readonly eventCount: number;
  readonly succeededCount: number;
  readonly failedCount: number;
  readonly contestedCount: number;
  readonly reversedCount: number;
  readonly nearMissCount: number;
  readonly directEvidenceCount: number;
  readonly inferredSignalCount: number;
  readonly blockedMutationCount: number;
  readonly actionItemCount: number;
  readonly highestConsequenceEffect: OutcomeIncidentConsequenceEffect;
  readonly terminalState: OutcomeIncidentFeedbackState | null;
  readonly sourceCounts: OutcomeIncidentFeedbackSourceCounts;
}

export interface CreateOutcomeIncidentFeedbackContractInput {
  readonly assurancePacket: SignedAssurancePacket;
  readonly feedbackEvents: readonly OutcomeIncidentFeedbackEventInput[];
  readonly generatedAt?: string | null;
}

export interface OutcomeIncidentFeedbackContract {
  readonly version: typeof OUTCOME_INCIDENT_FEEDBACK_CONTRACT_VERSION;
  readonly generatedAt: string;
  readonly status: OutcomeIncidentFeedbackStatus;
  readonly assurancePacketVersion: typeof SIGNED_ASSURANCE_PACKET_VERSION;
  readonly assurancePacketId: string;
  readonly assurancePacketDigest: string;
  readonly assurancePacketReady: boolean;
  readonly eventCount: number;
  readonly events: readonly OutcomeIncidentFeedbackEvent[];
  readonly summary: OutcomeIncidentFeedbackSummary;
  readonly noGoReasons: readonly OutcomeIncidentNoGoReason[];
  readonly replayRegressionRequired: boolean;
  readonly replayTriggerReasons: readonly OutcomeIncidentReplayTriggerReason[];
  readonly incidentReviewRequired: boolean;
  readonly blockedMutationRequests: readonly OutcomeIncidentMutationRequest[];
  readonly nextSafeStep: string;
  readonly feedbackInputOnly: true;
  readonly automaticPolicyMutationAllowed: false;
  readonly automaticScoreMutationAllowed: false;
  readonly automaticCalibrationMutationAllowed: false;
  readonly llmTrainingAllowed: false;
  readonly grantsAuthority: false;
  readonly canAdmit: false;
  readonly activatesEnforcement: false;
  readonly autoEnforce: false;
  readonly rawPayloadStored: false;
  readonly productionReady: false;
  readonly canonical: string;
  readonly digest: string;
}

export interface OutcomeIncidentFeedbackContractDescriptor {
  readonly version: typeof OUTCOME_INCIDENT_FEEDBACK_CONTRACT_VERSION;
  readonly assurancePacketVersion: typeof SIGNED_ASSURANCE_PACKET_VERSION;
  readonly sourceClasses: readonly OutcomeIncidentFeedbackSourceClass[];
  readonly states: readonly OutcomeIncidentFeedbackState[];
  readonly outcomes: readonly OutcomeIncidentFeedbackOutcome[];
  readonly consequenceEffects: readonly OutcomeIncidentConsequenceEffect[];
  readonly mutationRequests: readonly OutcomeIncidentMutationRequest[];
  readonly statuses: readonly OutcomeIncidentFeedbackStatus[];
  readonly replayTriggerReasons: readonly OutcomeIncidentReplayTriggerReason[];
  readonly noGoReasons: readonly OutcomeIncidentNoGoReason[];
  readonly digestOnlySources: true;
  readonly separatesSourceClasses: true;
  readonly incidentPathFirstClass: true;
  readonly replayRegressionTriggering: true;
  readonly feedbackInputOnly: true;
  readonly automaticPolicyMutationAllowed: false;
  readonly automaticScoreMutationAllowed: false;
  readonly automaticCalibrationMutationAllowed: false;
  readonly llmTrainingAllowed: false;
  readonly grantsAuthority: false;
  readonly canAdmit: false;
  readonly activatesEnforcement: false;
  readonly autoEnforce: false;
  readonly rawPayloadStored: false;
  readonly productionReady: false;
}

const SHA256_DIGEST_PATTERN = /^sha256:[a-f0-9]{64}$/u;

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

function hashCanonical(value: CanonicalReleaseJsonValue): string {
  return canonicalObject(value).digest;
}

function normalizeDigest(value: string, fieldName: string): string {
  const normalized = value.trim();
  if (!SHA256_DIGEST_PATTERN.test(normalized)) {
    throw new Error(`Outcome and incident feedback ${fieldName} must be a sha256 digest.`);
  }
  return normalized;
}

function normalizeOptionalDigest(
  value: string | null | undefined,
  fieldName: string,
): string | null {
  if (value === undefined || value === null || value.trim().length === 0) {
    return null;
  }
  return normalizeDigest(value, fieldName);
}

function normalizeDigestList(
  values: readonly string[] | null | undefined,
  fieldName: string,
): readonly string[] {
  if (!values) return Object.freeze([]);
  return Object.freeze(
    [...new Set(values.map((value) => normalizeDigest(value, fieldName)))].sort(),
  );
}

function normalizeIdentifier(value: string, fieldName: string): string {
  const normalized = value.trim();
  if (
    normalized.length === 0 ||
    normalized.length > 256 ||
    /[\u0000-\u001f\u007f]/u.test(normalized)
  ) {
    throw new Error(
      `Outcome and incident feedback ${fieldName} must be non-empty, bounded, and control-free.`,
    );
  }
  return normalized;
}

function normalizeIsoTimestamp(value: string, fieldName: string): string {
  const timestamp = new Date(value);
  if (Number.isNaN(timestamp.getTime())) {
    throw new Error(`Outcome and incident feedback ${fieldName} must be an ISO timestamp.`);
  }
  return timestamp.toISOString();
}

function normalizeGeneratedAt(
  value: string | null | undefined,
): string {
  return normalizeIsoTimestamp(value ?? new Date().toISOString(), 'generatedAt');
}

function normalizeConfidence(value: number): number {
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new Error('Outcome and incident feedback confidence must be between 0 and 1.');
  }
  return Number(value.toFixed(4));
}

function normalizeSourceClass(
  value: OutcomeIncidentFeedbackSourceClass,
): OutcomeIncidentFeedbackSourceClass {
  if (!OUTCOME_INCIDENT_FEEDBACK_SOURCE_CLASSES.includes(value)) {
    throw new Error('Outcome and incident feedback sourceClass is not supported.');
  }
  return value;
}

function normalizeState(value: OutcomeIncidentFeedbackState):
OutcomeIncidentFeedbackState {
  if (!OUTCOME_INCIDENT_FEEDBACK_STATES.includes(value)) {
    throw new Error('Outcome and incident feedback state is not supported.');
  }
  return value;
}

function normalizeOutcome(value: OutcomeIncidentFeedbackOutcome):
OutcomeIncidentFeedbackOutcome {
  if (!OUTCOME_INCIDENT_FEEDBACK_OUTCOMES.includes(value)) {
    throw new Error('Outcome and incident feedback outcome is not supported.');
  }
  return value;
}

function normalizeEffect(value: OutcomeIncidentConsequenceEffect):
OutcomeIncidentConsequenceEffect {
  if (!OUTCOME_INCIDENT_CONSEQUENCE_EFFECTS.includes(value)) {
    throw new Error('Outcome and incident feedback consequenceEffect is not supported.');
  }
  return value;
}

function normalizeMutations(
  values: readonly OutcomeIncidentMutationRequest[] | null | undefined,
): readonly OutcomeIncidentMutationRequest[] {
  if (!values) return Object.freeze([]);
  for (const value of values) {
    if (!OUTCOME_INCIDENT_MUTATION_REQUESTS.includes(value)) {
      throw new Error('Outcome and incident feedback requested mutation is not supported.');
    }
  }
  return Object.freeze([...new Set(values)].sort());
}

function normalizeReasonCodes(
  values: readonly string[] | null | undefined,
): readonly string[] {
  if (!values) return Object.freeze([]);
  return Object.freeze([...new Set(values
    .map((value) => value.trim().toLowerCase())
    .filter((value) => /^[a-z0-9:._-]{1,96}$/u.test(value)))].sort());
}

function stateRank(state: OutcomeIncidentFeedbackState): number {
  return OUTCOME_INCIDENT_FEEDBACK_STATES.indexOf(state);
}

function effectRank(effect: OutcomeIncidentConsequenceEffect): number {
  return OUTCOME_INCIDENT_CONSEQUENCE_EFFECTS.indexOf(effect);
}

function replayTriggerReasons(input: {
  readonly sourceClass: OutcomeIncidentFeedbackSourceClass;
  readonly state: OutcomeIncidentFeedbackState;
  readonly outcome: OutcomeIncidentFeedbackOutcome;
}): readonly OutcomeIncidentReplayTriggerReason[] {
  const reasons = new Set<OutcomeIncidentReplayTriggerReason>();
  if (input.outcome === 'failed') reasons.add('failed-downstream-outcome');
  if (input.outcome === 'contested' || input.state === 'contested') {
    reasons.add('contested-outcome');
  }
  if (input.outcome === 'reversed' || input.state === 'reversed') {
    reasons.add('reversed-outcome');
  }
  if (input.outcome === 'near-miss') reasons.add('near-miss-outcome');
  if (input.sourceClass === 'confirmed-incident' || input.state === 'incident') {
    reasons.add('confirmed-incident');
  }
  if (input.state === 'postmortem') reasons.add('postmortem-required');
  return Object.freeze(OUTCOME_INCIDENT_REPLAY_TRIGGER_REASONS.filter((reason) =>
    reasons.has(reason),
  ));
}

function normalizeEvent(input: OutcomeIncidentFeedbackEventInput):
OutcomeIncidentFeedbackEvent {
  const sourceClass = normalizeSourceClass(input.sourceClass);
  const state = normalizeState(input.state);
  const outcome = normalizeOutcome(input.outcome);
  const consequenceEffect = normalizeEffect(input.consequenceEffect);
  const requestedMutations = normalizeMutations(input.requestedMutations);
  const eventBase = {
    eventId: normalizeIdentifier(input.eventId, 'eventId'),
    sourceClass,
    sourceDigest: normalizeDigest(input.sourceDigest, 'sourceDigest'),
    observedAt: normalizeIsoTimestamp(input.observedAt, 'observedAt'),
    state,
    outcome,
    consequenceEffect,
    confidence: normalizeConfidence(input.confidence),
    reviewerRefDigest: normalizeOptionalDigest(input.reviewerRefDigest, 'reviewerRefDigest'),
    operatorRefDigest: normalizeOptionalDigest(input.operatorRefDigest, 'operatorRefDigest'),
    incidentRefDigest: normalizeOptionalDigest(input.incidentRefDigest, 'incidentRefDigest'),
    postmortemRefDigest: normalizeOptionalDigest(input.postmortemRefDigest, 'postmortemRefDigest'),
    replayRefDigest: normalizeOptionalDigest(input.replayRefDigest, 'replayRefDigest'),
    actionItemDigests: normalizeDigestList(input.actionItemDigests, 'actionItemDigests'),
    requestedMutations,
    blockedMutations: requestedMutations,
    replayTriggerReasons: replayTriggerReasons({ sourceClass, state, outcome }),
    reasonCodes: normalizeReasonCodes(input.reasonCodes),
    rawPayloadStored: false as const,
  };
  return Object.freeze({
    ...eventBase,
    eventDigest: hashCanonical(eventBase as unknown as CanonicalReleaseJsonValue),
  });
}

function sourceCounts(
  events: readonly OutcomeIncidentFeedbackEvent[],
): OutcomeIncidentFeedbackSourceCounts {
  return Object.freeze({
    downstreamReceipt: events.filter((event) => event.sourceClass === 'downstream-receipt').length,
    reviewerLabel: events.filter((event) => event.sourceClass === 'reviewer-label').length,
    confirmedIncident: events.filter((event) => event.sourceClass === 'confirmed-incident').length,
    operatorAnnotation: events.filter((event) => event.sourceClass === 'operator-annotation').length,
    inferredSignal: events.filter((event) => event.sourceClass === 'inferred-signal').length,
  });
}

function summary(events: readonly OutcomeIncidentFeedbackEvent[]):
OutcomeIncidentFeedbackSummary {
  const terminalState = events.length === 0
    ? null
    : [...events].sort((left, right) => stateRank(right.state) - stateRank(left.state))[0]?.state ?? null;
  const highestConsequenceEffect = events.length === 0
    ? 'none'
    : [...events].sort(
      (left, right) => effectRank(right.consequenceEffect) - effectRank(left.consequenceEffect),
    )[0]?.consequenceEffect ?? 'none';
  return Object.freeze({
    eventCount: events.length,
    succeededCount: events.filter((event) => event.outcome === 'succeeded').length,
    failedCount: events.filter((event) => event.outcome === 'failed').length,
    contestedCount: events.filter((event) => event.outcome === 'contested' || event.state === 'contested').length,
    reversedCount: events.filter((event) => event.outcome === 'reversed' || event.state === 'reversed').length,
    nearMissCount: events.filter((event) => event.outcome === 'near-miss').length,
    directEvidenceCount: events.filter((event) =>
      event.sourceClass === 'downstream-receipt' ||
      event.sourceClass === 'reviewer-label' ||
      event.sourceClass === 'confirmed-incident'
    ).length,
    inferredSignalCount: events.filter((event) => event.sourceClass === 'inferred-signal').length,
    blockedMutationCount: events.reduce((sum, event) => sum + event.blockedMutations.length, 0),
    actionItemCount: events.reduce((sum, event) => sum + event.actionItemDigests.length, 0),
    highestConsequenceEffect,
    terminalState,
    sourceCounts: sourceCounts(events),
  });
}

function uniqueReplayReasons(
  events: readonly OutcomeIncidentFeedbackEvent[],
): readonly OutcomeIncidentReplayTriggerReason[] {
  const present = new Set(events.flatMap((event) => event.replayTriggerReasons));
  return Object.freeze(OUTCOME_INCIDENT_REPLAY_TRIGGER_REASONS.filter((reason) =>
    present.has(reason),
  ));
}

function uniqueBlockedMutations(
  events: readonly OutcomeIncidentFeedbackEvent[],
): readonly OutcomeIncidentMutationRequest[] {
  const present = new Set(events.flatMap((event) => event.blockedMutations));
  return Object.freeze(OUTCOME_INCIDENT_MUTATION_REQUESTS.filter((mutation) =>
    present.has(mutation),
  ));
}

function noGoReasons(input: {
  readonly assurancePacket: SignedAssurancePacket;
  readonly events: readonly OutcomeIncidentFeedbackEvent[];
  readonly replayReasons: readonly OutcomeIncidentReplayTriggerReason[];
  readonly blockedMutations: readonly OutcomeIncidentMutationRequest[];
}): readonly OutcomeIncidentNoGoReason[] {
  const reasons = new Set<OutcomeIncidentNoGoReason>();
  if (input.events.length === 0) reasons.add('no-feedback-events');
  if (!input.assurancePacket.packetReady) reasons.add('assurance-packet-not-ready');
  if (
    input.events.length > 0 &&
    input.events.every((event) => event.sourceClass === 'inferred-signal')
  ) {
    reasons.add('only-inferred-feedback');
  }
  if (
    input.events.some((event) =>
      (event.sourceClass === 'confirmed-incident' || event.state === 'incident') &&
      event.incidentRefDigest === null
    )
  ) {
    reasons.add('incident-without-incident-ref');
  }
  if (
    input.events.some((event) =>
      event.state === 'postmortem' && event.postmortemRefDigest === null
    )
  ) {
    reasons.add('postmortem-without-postmortem-ref');
  }
  if (input.replayReasons.length > 0) reasons.add('replay-regression-required');
  if (input.blockedMutations.length > 0) reasons.add('blocked-mutation-requested');
  if (
    input.events.some((event) =>
      event.consequenceEffect === 'customer-impact' ||
      event.consequenceEffect === 'tenant-impact' ||
      event.consequenceEffect === 'systemic-impact'
    )
  ) {
    reasons.add('customer-impact-review-required');
  }
  return Object.freeze(OUTCOME_INCIDENT_NO_GO_REASONS.filter((reason) =>
    reasons.has(reason),
  ));
}

function statusFor(input: {
  readonly events: readonly OutcomeIncidentFeedbackEvent[];
  readonly noGoReasons: readonly OutcomeIncidentNoGoReason[];
  readonly replayReasons: readonly OutcomeIncidentReplayTriggerReason[];
}): OutcomeIncidentFeedbackStatus {
  if (input.events.length === 0) return 'no-feedback';
  if (
    input.noGoReasons.includes('incident-without-incident-ref') ||
    input.noGoReasons.includes('postmortem-without-postmortem-ref') ||
    input.noGoReasons.includes('customer-impact-review-required')
  ) {
    return 'incident-review-required';
  }
  if (input.replayReasons.length > 0) return 'regression-required';
  if (input.noGoReasons.length > 0) return 'collecting-feedback';
  return 'learning-ready';
}

function nextSafeStep(status: OutcomeIncidentFeedbackStatus): string {
  switch (status) {
    case 'no-feedback':
      return 'Collect digest-bound downstream receipts, reviewer labels, incident refs, or operator annotations before using outcome feedback.';
    case 'collecting-feedback':
      return 'Close feedback no-go reasons; do not mutate policy, scores, calibration, enforcement, or training data.';
    case 'regression-required':
      return 'Create or attach replay regression evidence before this feedback can be considered for reviewed learning.';
    case 'incident-review-required':
      return 'Route to incident review with digest-bound incident and postmortem refs before any learning decision.';
    case 'learning-ready':
      return 'Use this digest-bound feedback as human-reviewed learning input only; no automatic policy or model mutation is allowed.';
  }
}

export function outcomeIncidentFeedbackContractDescriptor():
OutcomeIncidentFeedbackContractDescriptor {
  return Object.freeze({
    version: OUTCOME_INCIDENT_FEEDBACK_CONTRACT_VERSION,
    assurancePacketVersion: SIGNED_ASSURANCE_PACKET_VERSION,
    sourceClasses: OUTCOME_INCIDENT_FEEDBACK_SOURCE_CLASSES,
    states: OUTCOME_INCIDENT_FEEDBACK_STATES,
    outcomes: OUTCOME_INCIDENT_FEEDBACK_OUTCOMES,
    consequenceEffects: OUTCOME_INCIDENT_CONSEQUENCE_EFFECTS,
    mutationRequests: OUTCOME_INCIDENT_MUTATION_REQUESTS,
    statuses: OUTCOME_INCIDENT_FEEDBACK_STATUSES,
    replayTriggerReasons: OUTCOME_INCIDENT_REPLAY_TRIGGER_REASONS,
    noGoReasons: OUTCOME_INCIDENT_NO_GO_REASONS,
    digestOnlySources: true,
    separatesSourceClasses: true,
    incidentPathFirstClass: true,
    replayRegressionTriggering: true,
    feedbackInputOnly: true,
    automaticPolicyMutationAllowed: false,
    automaticScoreMutationAllowed: false,
    automaticCalibrationMutationAllowed: false,
    llmTrainingAllowed: false,
    grantsAuthority: false,
    canAdmit: false,
    activatesEnforcement: false,
    autoEnforce: false,
    rawPayloadStored: false,
    productionReady: false,
  });
}

export function createOutcomeIncidentFeedbackContract(
  input: CreateOutcomeIncidentFeedbackContractInput,
): OutcomeIncidentFeedbackContract {
  if (input.assurancePacket.version !== SIGNED_ASSURANCE_PACKET_VERSION) {
    throw new Error(
      'Outcome and incident feedback assurancePacket version must match signed assurance packet version.',
    );
  }
  if (
    input.assurancePacket.canAdmit ||
    input.assurancePacket.grantsAuthority ||
    input.assurancePacket.activatesEnforcement ||
    input.assurancePacket.autoEnforce ||
    input.assurancePacket.rawPayloadStored ||
    input.assurancePacket.productionReady
  ) {
    throw new Error(
      'Outcome and incident feedback assurancePacket must be no-authority and data-minimized.',
    );
  }
  const generatedAt = normalizeGeneratedAt(input.generatedAt);
  const events = Object.freeze(
    [...input.feedbackEvents]
      .map(normalizeEvent)
      .sort((left, right) =>
        left.observedAt.localeCompare(right.observedAt) ||
        left.eventId.localeCompare(right.eventId)
      ),
  );
  const replayReasons = uniqueReplayReasons(events);
  const blockedMutations = uniqueBlockedMutations(events);
  const reasons = noGoReasons({
    assurancePacket: input.assurancePacket,
    events,
    replayReasons,
    blockedMutations,
  });
  const status = statusFor({ events, noGoReasons: reasons, replayReasons });
  const payload = {
    version: OUTCOME_INCIDENT_FEEDBACK_CONTRACT_VERSION,
    generatedAt,
    status,
    assurancePacketVersion: SIGNED_ASSURANCE_PACKET_VERSION,
    assurancePacketId: input.assurancePacket.packetId,
    assurancePacketDigest: normalizeDigest(
      input.assurancePacket.digest,
      'assurancePacket.digest',
    ),
    assurancePacketReady: input.assurancePacket.packetReady,
    eventCount: events.length,
    events,
    summary: summary(events),
    noGoReasons: reasons,
    replayRegressionRequired: replayReasons.length > 0,
    replayTriggerReasons: replayReasons,
    incidentReviewRequired: status === 'incident-review-required',
    blockedMutationRequests: blockedMutations,
    nextSafeStep: nextSafeStep(status),
    feedbackInputOnly: true,
    automaticPolicyMutationAllowed: false,
    automaticScoreMutationAllowed: false,
    automaticCalibrationMutationAllowed: false,
    llmTrainingAllowed: false,
    grantsAuthority: false,
    canAdmit: false,
    activatesEnforcement: false,
    autoEnforce: false,
    rawPayloadStored: false,
    productionReady: false,
  } as const;
  const canonical = canonicalObject(payload as unknown as CanonicalReleaseJsonValue);
  return Object.freeze({
    ...payload,
    canonical: canonical.canonical,
    digest: canonical.digest,
  });
}
