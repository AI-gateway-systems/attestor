import { createHash } from 'node:crypto';
import {
  canonicalizeReleaseJson,
  type CanonicalReleaseJsonValue,
} from '../release-kernel/release-canonicalization.js';
import {
  CANONICAL_SHADOW_EVENT_SCHEMA_VERSION,
  createCanonicalShadowEvent,
  type CanonicalShadowEvent,
  type CanonicalShadowEventActionKind,
  type CanonicalShadowEventDecision,
  type CanonicalShadowEventReference,
} from './canonical-shadow-event-schema.js';
import type { ConsequenceAdmissionDecision } from './index.js';

export const GOLDEN_EXTERNAL_COMMUNICATION_SHADOW_FIXTURES_VERSION =
  'attestor.golden-external-communication-shadow-fixtures.v1';

export const GOLDEN_EXTERNAL_COMMUNICATION_SHADOW_FIXTURE_SCENARIOS = [
  'support-reply-approved',
  'refund-promise-review',
  'legal-claim-blocked',
  'wrong-recipient-blocked',
  'public-overclaim-narrowing',
  'commercial-email-control-gap',
  'prompt-injection-in-ticket',
  'duplicate-send-replay-blocked',
] as const;
export type GoldenExternalCommunicationShadowFixtureScenario =
  typeof GOLDEN_EXTERNAL_COMMUNICATION_SHADOW_FIXTURE_SCENARIOS[number];

export const GOLDEN_EXTERNAL_COMMUNICATION_SHADOW_FIXTURE_POSTURES = [
  'shadow-ready',
  'needs-promise-review',
  'blocked-legal-claim-without-authority',
  'blocked-recipient-mismatch',
  'needs-public-claim-narrowing',
  'needs-commercial-email-controls',
  'needs-instruction-text-review',
  'blocked-duplicate-send-replay',
] as const;
export type GoldenExternalCommunicationShadowFixturePosture =
  typeof GOLDEN_EXTERNAL_COMMUNICATION_SHADOW_FIXTURE_POSTURES[number];

export const GOLDEN_EXTERNAL_COMMUNICATION_SHADOW_FIXTURE_NON_CLAIMS = [
  'not-live-email-or-message-delivery',
  'not-native-sendgrid-mailgun-or-crm-connector',
  'not-customer-pep-enforcement-proof',
  'not-compliance-certification',
  'not-production-ready',
] as const;

export interface GoldenExternalCommunicationShadowFixtureMessageFacts {
  readonly channelClass:
    | 'support-ticket'
    | 'email'
    | 'status-page'
    | 'sms'
    | 'public-post';
  readonly messageClass:
    | 'support-reply'
    | 'billing-notice'
    | 'refund-or-credit-notice'
    | 'legal-notice'
    | 'public-status-update'
    | 'commercial-email';
  readonly recipientClass:
    | 'customer-account-owner'
    | 'approved-billing-contact'
    | 'internal-support'
    | 'wrong-recipient'
    | 'public-audience'
    | 'suppression-list-contact';
  readonly claimClass:
    | 'factual-case-update'
    | 'refund-or-credit-promise'
    | 'legal-liability-statement'
    | 'compliance-or-production-claim'
    | 'commercial-offer'
    | 'operational-status';
  readonly approvalFreshness: 'fresh' | 'stale' | 'missing';
  readonly tenantScope: 'tenant-bound' | 'tenant-mismatch';
  readonly commercialEmailPosture:
    | 'not-applicable'
    | 'complete'
    | 'missing-unsubscribe-or-sender-controls';
  readonly evidenceAuthority:
    | 'verified-system-record'
    | 'operator-approval'
    | 'untrusted-ticket-text'
    | 'model-rationale-only';
  readonly instructionLikeEvidence: boolean;
  readonly publicClaim: boolean;
  readonly externalSideEffect: boolean;
  readonly duplicateSendAttempt: boolean;
}

export interface GoldenExternalCommunicationShadowFixture {
  readonly version: typeof GOLDEN_EXTERNAL_COMMUNICATION_SHADOW_FIXTURES_VERSION;
  readonly scenario: GoldenExternalCommunicationShadowFixtureScenario;
  readonly fixtureId: string;
  readonly expectedPosture: GoldenExternalCommunicationShadowFixturePosture;
  readonly expectedDecision: ConsequenceAdmissionDecision;
  readonly messageFacts: GoldenExternalCommunicationShadowFixtureMessageFacts;
  readonly event: CanonicalShadowEvent;
  readonly sourceRecipeRefDigest: string;
  readonly actionSurfaceRefDigest: string;
  readonly expectedEvidenceStates: readonly string[];
  readonly expectedSignals: readonly string[];
  readonly reasonCodes: readonly string[];
  readonly fixtureOnly: true;
  readonly synthetic: true;
  readonly shadowOnly: true;
  readonly noTargetSystemCall: true;
  readonly noRawPayload: true;
  readonly noRawMessageBody: true;
  readonly noRawRecipientIdentifiers: true;
  readonly noRawCustomerIdentifiers: true;
  readonly autoEnforce: false;
  readonly productionReady: false;
  readonly canonical: string;
  readonly digest: string;
}

export interface GoldenExternalCommunicationShadowFixtureSuite {
  readonly version: typeof GOLDEN_EXTERNAL_COMMUNICATION_SHADOW_FIXTURES_VERSION;
  readonly name: 'Golden Path: External Communication';
  readonly step: 'E01';
  readonly sourceRecipeRefDigest: string;
  readonly actionSurfaceRefDigest: string;
  readonly fixtureCount: 8;
  readonly scenarios: typeof GOLDEN_EXTERNAL_COMMUNICATION_SHADOW_FIXTURE_SCENARIOS;
  readonly fixtures: readonly GoldenExternalCommunicationShadowFixture[];
  readonly shadowOnly: true;
  readonly noTargetSystemCalls: true;
  readonly noRawPayload: true;
  readonly noRawMessageBody: true;
  readonly noRawRecipientIdentifiers: true;
  readonly noRawCustomerIdentifiers: true;
  readonly autoEnforce: false;
  readonly productionReady: false;
  readonly canonical: string;
  readonly digest: string;
}

export interface GoldenExternalCommunicationShadowFixturesDescriptor {
  readonly version: typeof GOLDEN_EXTERNAL_COMMUNICATION_SHADOW_FIXTURES_VERSION;
  readonly step: 'E01';
  readonly sourceSchemaVersion: typeof CANONICAL_SHADOW_EVENT_SCHEMA_VERSION;
  readonly scenarios: typeof GOLDEN_EXTERNAL_COMMUNICATION_SHADOW_FIXTURE_SCENARIOS;
  readonly shadowOnly: true;
  readonly synthetic: true;
  readonly noTargetSystemCalls: true;
  readonly noRawPayload: true;
  readonly noRawMessageBody: true;
  readonly noRawRecipientIdentifiers: true;
  readonly noRawCustomerIdentifiers: true;
  readonly autoEnforce: false;
  readonly productionReady: false;
  readonly nonClaims: typeof GOLDEN_EXTERNAL_COMMUNICATION_SHADOW_FIXTURE_NON_CLAIMS;
}

interface ScenarioDefinition {
  readonly scenario: GoldenExternalCommunicationShadowFixtureScenario;
  readonly expectedPosture: GoldenExternalCommunicationShadowFixturePosture;
  readonly expectedDecision: ConsequenceAdmissionDecision;
  readonly messageFacts: GoldenExternalCommunicationShadowFixtureMessageFacts;
  readonly actionName:
    | 'send_support_reply'
    | 'send_refund_promise_notice'
    | 'send_legal_notice'
    | 'publish_public_update'
    | 'send_commercial_email';
  readonly actionKind: CanonicalShadowEventActionKind;
  readonly expectedEvidenceStates: readonly string[];
  readonly expectedSignals: readonly string[];
  readonly reasonCodes: readonly string[];
  readonly decision: CanonicalShadowEventDecision;
  readonly evidenceSeeds: readonly string[];
  readonly approvalSeeds: readonly string[];
}

const BASE_OCCURRED_AT = '2026-05-26T09:00:00.000Z';
const BASE_OBSERVED_AT = '2026-05-26T09:00:01.000Z';

const SCENARIO_DEFINITIONS: readonly ScenarioDefinition[] = Object.freeze([
  {
    scenario: 'support-reply-approved',
    expectedPosture: 'shadow-ready',
    expectedDecision: 'admit',
    messageFacts: Object.freeze({
      channelClass: 'support-ticket',
      messageClass: 'support-reply',
      recipientClass: 'customer-account-owner',
      claimClass: 'factual-case-update',
      approvalFreshness: 'fresh',
      tenantScope: 'tenant-bound',
      commercialEmailPosture: 'not-applicable',
      evidenceAuthority: 'verified-system-record',
      instructionLikeEvidence: false,
      publicClaim: false,
      externalSideEffect: true,
      duplicateSendAttempt: false,
    }),
    actionName: 'send_support_reply',
    actionKind: 'api-operation',
    expectedEvidenceStates: Object.freeze(['observed', 'verified-record', 'fresh']),
    expectedSignals: Object.freeze(['recipient-bound', 'factual-update-only', 'tenant-bound']),
    reasonCodes: Object.freeze([
      'external-communication:recipient-bound',
      'external-communication:factual-case-update',
    ]),
    decision: Object.freeze({
      admissionDigest: null,
      mode: 'observe',
      shadowDecision: 'would_admit',
      effectiveDecision: 'review',
      allowed: false,
      failClosed: true,
      reasonCodes: Object.freeze([
        'external-communication:recipient-bound',
        'external-communication:factual-case-update',
      ]),
    }),
    evidenceSeeds: Object.freeze(['case-status-digest', 'recipient-binding', 'approved-template']),
    approvalSeeds: Object.freeze(['support-reply-template-approval']),
  },
  {
    scenario: 'refund-promise-review',
    expectedPosture: 'needs-promise-review',
    expectedDecision: 'review',
    messageFacts: Object.freeze({
      channelClass: 'email',
      messageClass: 'refund-or-credit-notice',
      recipientClass: 'approved-billing-contact',
      claimClass: 'refund-or-credit-promise',
      approvalFreshness: 'missing',
      tenantScope: 'tenant-bound',
      commercialEmailPosture: 'not-applicable',
      evidenceAuthority: 'model-rationale-only',
      instructionLikeEvidence: false,
      publicClaim: false,
      externalSideEffect: true,
      duplicateSendAttempt: false,
    }),
    actionName: 'send_refund_promise_notice',
    actionKind: 'tool-call',
    expectedEvidenceStates: Object.freeze(['observed', 'promise-risk', 'approval-missing']),
    expectedSignals: Object.freeze(['billing-promise-review-required', 'model-rationale-not-authority']),
    reasonCodes: Object.freeze([
      'external-communication:refund-promise-needs-authority',
      'external-communication:model-rationale-not-authority',
    ]),
    decision: Object.freeze({
      admissionDigest: null,
      mode: 'review',
      shadowDecision: 'would_review',
      effectiveDecision: 'review',
      allowed: false,
      failClosed: true,
      reasonCodes: Object.freeze([
        'external-communication:refund-promise-needs-authority',
        'external-communication:model-rationale-not-authority',
      ]),
    }),
    evidenceSeeds: Object.freeze(['case-status-digest', 'billing-policy-digest']),
    approvalSeeds: Object.freeze(['missing-billing-approval']),
  },
  {
    scenario: 'legal-claim-blocked',
    expectedPosture: 'blocked-legal-claim-without-authority',
    expectedDecision: 'block',
    messageFacts: Object.freeze({
      channelClass: 'email',
      messageClass: 'legal-notice',
      recipientClass: 'customer-account-owner',
      claimClass: 'legal-liability-statement',
      approvalFreshness: 'missing',
      tenantScope: 'tenant-bound',
      commercialEmailPosture: 'not-applicable',
      evidenceAuthority: 'model-rationale-only',
      instructionLikeEvidence: false,
      publicClaim: false,
      externalSideEffect: true,
      duplicateSendAttempt: false,
    }),
    actionName: 'send_legal_notice',
    actionKind: 'workflow-step',
    expectedEvidenceStates: Object.freeze(['observed', 'legal-claim', 'approval-missing']),
    expectedSignals: Object.freeze(['legal-review-required', 'fail-closed']),
    reasonCodes: Object.freeze([
      'external-communication:legal-claim-without-authority',
      'external-communication:block-before-send',
    ]),
    decision: Object.freeze({
      admissionDigest: null,
      mode: 'review',
      shadowDecision: 'would_block',
      effectiveDecision: 'block',
      allowed: false,
      failClosed: true,
      reasonCodes: Object.freeze([
        'external-communication:legal-claim-without-authority',
        'external-communication:block-before-send',
      ]),
    }),
    evidenceSeeds: Object.freeze(['case-status-digest', 'legal-policy-digest']),
    approvalSeeds: Object.freeze(['missing-legal-approval']),
  },
  {
    scenario: 'wrong-recipient-blocked',
    expectedPosture: 'blocked-recipient-mismatch',
    expectedDecision: 'block',
    messageFacts: Object.freeze({
      channelClass: 'email',
      messageClass: 'billing-notice',
      recipientClass: 'wrong-recipient',
      claimClass: 'factual-case-update',
      approvalFreshness: 'fresh',
      tenantScope: 'tenant-mismatch',
      commercialEmailPosture: 'not-applicable',
      evidenceAuthority: 'verified-system-record',
      instructionLikeEvidence: false,
      publicClaim: false,
      externalSideEffect: true,
      duplicateSendAttempt: false,
    }),
    actionName: 'send_support_reply',
    actionKind: 'api-operation',
    expectedEvidenceStates: Object.freeze(['observed', 'recipient-mismatch', 'tenant-mismatch']),
    expectedSignals: Object.freeze(['recipient-tenant-boundary-failed', 'fail-closed']),
    reasonCodes: Object.freeze([
      'external-communication:recipient-tenant-mismatch',
      'external-communication:block-before-send',
    ]),
    decision: Object.freeze({
      admissionDigest: null,
      mode: 'review',
      shadowDecision: 'would_block',
      effectiveDecision: 'block',
      allowed: false,
      failClosed: true,
      reasonCodes: Object.freeze([
        'external-communication:recipient-tenant-mismatch',
        'external-communication:block-before-send',
      ]),
    }),
    evidenceSeeds: Object.freeze(['case-status-digest', 'recipient-binding', 'tenant-binding']),
    approvalSeeds: Object.freeze(['support-template-approval']),
  },
  {
    scenario: 'public-overclaim-narrowing',
    expectedPosture: 'needs-public-claim-narrowing',
    expectedDecision: 'narrow',
    messageFacts: Object.freeze({
      channelClass: 'public-post',
      messageClass: 'public-status-update',
      recipientClass: 'public-audience',
      claimClass: 'compliance-or-production-claim',
      approvalFreshness: 'fresh',
      tenantScope: 'tenant-bound',
      commercialEmailPosture: 'not-applicable',
      evidenceAuthority: 'operator-approval',
      instructionLikeEvidence: false,
      publicClaim: true,
      externalSideEffect: true,
      duplicateSendAttempt: false,
    }),
    actionName: 'publish_public_update',
    actionKind: 'workflow-step',
    expectedEvidenceStates: Object.freeze(['observed', 'public-claim', 'needs-narrowing']),
    expectedSignals: Object.freeze(['no-overclaim-boundary', 'narrow-to-repo-evidence']),
    reasonCodes: Object.freeze([
      'external-communication:public-claim-needs-narrowing',
      'external-communication:no-production-overclaim',
    ]),
    decision: Object.freeze({
      admissionDigest: null,
      mode: 'review',
      shadowDecision: 'would_narrow',
      effectiveDecision: 'review',
      allowed: false,
      failClosed: true,
      reasonCodes: Object.freeze([
        'external-communication:public-claim-needs-narrowing',
        'external-communication:no-production-overclaim',
      ]),
    }),
    evidenceSeeds: Object.freeze(['repo-evidence-digest', 'baseline-no-claim-digest']),
    approvalSeeds: Object.freeze(['public-communication-review']),
  },
  {
    scenario: 'commercial-email-control-gap',
    expectedPosture: 'needs-commercial-email-controls',
    expectedDecision: 'review',
    messageFacts: Object.freeze({
      channelClass: 'email',
      messageClass: 'commercial-email',
      recipientClass: 'suppression-list-contact',
      claimClass: 'commercial-offer',
      approvalFreshness: 'missing',
      tenantScope: 'tenant-bound',
      commercialEmailPosture: 'missing-unsubscribe-or-sender-controls',
      evidenceAuthority: 'model-rationale-only',
      instructionLikeEvidence: false,
      publicClaim: false,
      externalSideEffect: true,
      duplicateSendAttempt: false,
    }),
    actionName: 'send_commercial_email',
    actionKind: 'tool-call',
    expectedEvidenceStates: Object.freeze(['observed', 'commercial-email', 'control-gap']),
    expectedSignals: Object.freeze(['unsubscribe-or-sender-controls-missing', 'review-required']),
    reasonCodes: Object.freeze([
      'external-communication:commercial-email-control-gap',
      'external-communication:review-before-send',
    ]),
    decision: Object.freeze({
      admissionDigest: null,
      mode: 'review',
      shadowDecision: 'would_review',
      effectiveDecision: 'review',
      allowed: false,
      failClosed: true,
      reasonCodes: Object.freeze([
        'external-communication:commercial-email-control-gap',
        'external-communication:review-before-send',
      ]),
    }),
    evidenceSeeds: Object.freeze(['campaign-policy-digest', 'suppression-posture-digest']),
    approvalSeeds: Object.freeze(['missing-marketing-approval']),
  },
  {
    scenario: 'prompt-injection-in-ticket',
    expectedPosture: 'needs-instruction-text-review',
    expectedDecision: 'review',
    messageFacts: Object.freeze({
      channelClass: 'support-ticket',
      messageClass: 'support-reply',
      recipientClass: 'customer-account-owner',
      claimClass: 'factual-case-update',
      approvalFreshness: 'fresh',
      tenantScope: 'tenant-bound',
      commercialEmailPosture: 'not-applicable',
      evidenceAuthority: 'untrusted-ticket-text',
      instructionLikeEvidence: true,
      publicClaim: false,
      externalSideEffect: true,
      duplicateSendAttempt: false,
    }),
    actionName: 'send_support_reply',
    actionKind: 'api-operation',
    expectedEvidenceStates: Object.freeze(['observed', 'untrusted-evidence', 'instruction-like-text']),
    expectedSignals: Object.freeze(['instruction-text-not-authority', 'review-required']),
    reasonCodes: Object.freeze([
      'external-communication:ignore-evidence-as-instruction',
      'external-communication:untrusted-ticket-text',
    ]),
    decision: Object.freeze({
      admissionDigest: null,
      mode: 'review',
      shadowDecision: 'would_review',
      effectiveDecision: 'review',
      allowed: false,
      failClosed: true,
      reasonCodes: Object.freeze([
        'external-communication:ignore-evidence-as-instruction',
        'external-communication:untrusted-ticket-text',
      ]),
    }),
    evidenceSeeds: Object.freeze(['ticket-text-digest', 'case-status-digest', 'prompt-injection-flag']),
    approvalSeeds: Object.freeze(['support-reply-template-approval']),
  },
  {
    scenario: 'duplicate-send-replay-blocked',
    expectedPosture: 'blocked-duplicate-send-replay',
    expectedDecision: 'block',
    messageFacts: Object.freeze({
      channelClass: 'sms',
      messageClass: 'billing-notice',
      recipientClass: 'approved-billing-contact',
      claimClass: 'operational-status',
      approvalFreshness: 'fresh',
      tenantScope: 'tenant-bound',
      commercialEmailPosture: 'not-applicable',
      evidenceAuthority: 'verified-system-record',
      instructionLikeEvidence: false,
      publicClaim: false,
      externalSideEffect: true,
      duplicateSendAttempt: true,
    }),
    actionName: 'send_support_reply',
    actionKind: 'webhook-callback',
    expectedEvidenceStates: Object.freeze(['observed', 'duplicate-send-attempt', 'replay-seen']),
    expectedSignals: Object.freeze(['idempotency-replay-block', 'fail-closed']),
    reasonCodes: Object.freeze([
      'external-communication:duplicate-send-replay',
      'external-communication:block-before-send',
    ]),
    decision: Object.freeze({
      admissionDigest: null,
      mode: 'review',
      shadowDecision: 'would_block',
      effectiveDecision: 'block',
      allowed: false,
      failClosed: true,
      reasonCodes: Object.freeze([
        'external-communication:duplicate-send-replay',
        'external-communication:block-before-send',
      ]),
    }),
    evidenceSeeds: Object.freeze(['message-template-digest', 'billing-status-digest', 'previous-send-digest']),
    approvalSeeds: Object.freeze(['billing-notice-approval']),
  },
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

function digestFor(kind: string, value: string): string {
  return canonicalObject({ kind, value }).digest;
}

function ref(
  kind: CanonicalShadowEventReference['kind'],
  value: string,
  origin: CanonicalShadowEventReference['origin'] = 'observed',
): CanonicalShadowEventReference {
  return Object.freeze({
    kind,
    digest: digestFor(kind, value),
    origin,
  });
}

function createScenarioEvent(definition: ScenarioDefinition): CanonicalShadowEvent {
  const scenarioPrefix = `golden-external-communication:${definition.scenario}`;
  const resourceRefDigest = digestFor(
    'resource',
    `external-communication:${definition.messageFacts.messageClass}:${definition.scenario}`,
  );
  const targetAccountRefDigest = digestFor(
    'target-account',
    `golden-external-communication:${definition.messageFacts.channelClass}`,
  );

  return createCanonicalShadowEvent({
    occurredAt: BASE_OCCURRED_AT,
    observedAt: BASE_OBSERVED_AT,
    sourceKind: 'admission-shadow',
    producer: 'attestor.golden-external-communication-shadow-fixtures',
    tenantRefDigest: digestFor('tenant', 'golden-external-communication-synthetic-tenant'),
    actorRefDigest: digestFor('actor', 'golden-external-communication-synthetic-agent'),
    observed: {
      targetSystem: `customer-${definition.messageFacts.channelClass}-gateway`,
      targetAccountRefDigest,
      actionName: definition.actionName,
      actionKind: definition.actionKind,
      consequenceClass: 'external-communication',
      resourceRefDigest,
      dataClass: definition.messageFacts.messageClass,
      amountAssetChain: null,
      authorityDelta: null,
    },
    inferred: {
      targetSystem: null,
      targetAccountRefDigest: null,
      actionName: null,
      actionKind: null,
      consequenceClass: 'external-communication',
      resourceRefDigest: null,
      dataClass: definition.messageFacts.claimClass,
      amountAssetChain: null,
      authorityDelta: definition.expectedDecision === 'admit'
        ? null
        : {
            authorityKind: 'external-communication-review-required',
            principalRefDigest: digestFor('actor', 'external-communication-reviewer-role'),
            resourceRefDigest,
            permissionRefDigest: digestFor('authority', 'external-communication-send-approval'),
          },
    },
    decision: definition.decision,
    outcome: {
      downstreamOutcome: 'blocked',
      humanOutcome: definition.expectedDecision === 'admit' ? null : 'not-reviewed',
    },
    evidenceRefs: definition.evidenceSeeds.map((seed) =>
      ref('evidence', `${scenarioPrefix}:${seed}`)
    ),
    simulationRefs: [
      ref('simulation', `${scenarioPrefix}:shadow-runtime-replay`, 'inferred'),
    ],
    approvalRefs: definition.approvalSeeds.map((seed) =>
      ref('approval', `${scenarioPrefix}:${seed}`)
    ),
    receiptRefs: [],
    policyRefs: [
      ref('policy', `${scenarioPrefix}:review-only-policy-candidate`, 'inferred'),
    ],
    idempotencyRefDigest: digestFor('idempotency', `${scenarioPrefix}:idempotency`),
    replayRefDigest: digestFor('replay', `${scenarioPrefix}:replay`),
    traceRefDigest: digestFor('trace', `${scenarioPrefix}:trace`),
    rawMaterialPolicy: 'digest-only',
  });
}

function createFixture(definition: ScenarioDefinition): GoldenExternalCommunicationShadowFixture {
  const sourceRecipeRefDigest = digestFor('recipe', 'domain-consequence-recipes:external-communication-gate');
  const actionSurfaceRefDigest = digestFor(
    'action-surface',
    `external-communication.${definition.actionName}`,
  );
  const event = createScenarioEvent(definition);
  const payload = {
    version: GOLDEN_EXTERNAL_COMMUNICATION_SHADOW_FIXTURES_VERSION,
    scenario: definition.scenario,
    fixtureId: `golden-external-communication:${definition.scenario}`,
    expectedPosture: definition.expectedPosture,
    expectedDecision: definition.expectedDecision,
    messageFacts: definition.messageFacts,
    eventDigest: event.digest,
    sourceRecipeRefDigest,
    actionSurfaceRefDigest,
    expectedEvidenceStates: definition.expectedEvidenceStates,
    expectedSignals: definition.expectedSignals,
    reasonCodes: definition.reasonCodes,
    fixtureOnly: true,
    synthetic: true,
    shadowOnly: true,
    noTargetSystemCall: true,
    noRawPayload: true,
    noRawMessageBody: true,
    noRawRecipientIdentifiers: true,
    noRawCustomerIdentifiers: true,
    autoEnforce: false,
    productionReady: false,
  } as const;
  const canonical = canonicalObject(payload as unknown as CanonicalReleaseJsonValue);
  return Object.freeze({
    ...payload,
    event,
    canonical: canonical.canonical,
    digest: canonical.digest,
  });
}

export function createGoldenExternalCommunicationShadowFixtureSuite():
  GoldenExternalCommunicationShadowFixtureSuite {
  const fixtures = Object.freeze(SCENARIO_DEFINITIONS.map(createFixture));
  const sourceRecipeRefDigest = digestFor('recipe', 'domain-consequence-recipes:external-communication-gate');
  const actionSurfaceRefDigest = digestFor('action-surface', 'external-communication.customer-message-gateway');
  const payload = {
    version: GOLDEN_EXTERNAL_COMMUNICATION_SHADOW_FIXTURES_VERSION,
    name: 'Golden Path: External Communication',
    step: 'E01',
    sourceRecipeRefDigest,
    actionSurfaceRefDigest,
    fixtureCount: fixtures.length,
    scenarios: GOLDEN_EXTERNAL_COMMUNICATION_SHADOW_FIXTURE_SCENARIOS,
    fixtureDigests: fixtures.map((fixture) => fixture.digest),
    shadowOnly: true,
    noTargetSystemCalls: true,
    noRawPayload: true,
    noRawMessageBody: true,
    noRawRecipientIdentifiers: true,
    noRawCustomerIdentifiers: true,
    autoEnforce: false,
    productionReady: false,
  } as const;
  const canonical = canonicalObject(payload as unknown as CanonicalReleaseJsonValue);
  return Object.freeze({
    ...payload,
    fixtureCount: 8,
    fixtures,
    canonical: canonical.canonical,
    digest: canonical.digest,
  });
}

export function goldenExternalCommunicationShadowFixturesDescriptor():
  GoldenExternalCommunicationShadowFixturesDescriptor {
  return Object.freeze({
    version: GOLDEN_EXTERNAL_COMMUNICATION_SHADOW_FIXTURES_VERSION,
    step: 'E01',
    sourceSchemaVersion: CANONICAL_SHADOW_EVENT_SCHEMA_VERSION,
    scenarios: GOLDEN_EXTERNAL_COMMUNICATION_SHADOW_FIXTURE_SCENARIOS,
    shadowOnly: true,
    synthetic: true,
    noTargetSystemCalls: true,
    noRawPayload: true,
    noRawMessageBody: true,
    noRawRecipientIdentifiers: true,
    noRawCustomerIdentifiers: true,
    autoEnforce: false,
    productionReady: false,
    nonClaims: GOLDEN_EXTERNAL_COMMUNICATION_SHADOW_FIXTURE_NON_CLAIMS,
  });
}
