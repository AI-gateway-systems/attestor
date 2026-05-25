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

export const GOLDEN_DATA_EXPORT_SHADOW_FIXTURES_VERSION =
  'attestor.golden-data-export-shadow-fixtures.v1';

export const GOLDEN_DATA_EXPORT_SHADOW_FIXTURE_SCENARIOS = [
  'aggregate-report-release',
  'customer-export-approved',
  'pii-column-narrowing',
  'external-recipient-review',
  'tenant-scope-mismatch',
  'stale-approval',
  'prompt-injection-in-evidence',
  'write-query-blocked',
] as const;
export type GoldenDataExportShadowFixtureScenario =
  typeof GOLDEN_DATA_EXPORT_SHADOW_FIXTURE_SCENARIOS[number];

export const GOLDEN_DATA_EXPORT_SHADOW_FIXTURE_POSTURES = [
  'shadow-ready',
  'export-ready-with-approval',
  'needs-field-narrowing',
  'needs-recipient-review',
  'blocked-tenant-mismatch',
  'blocked-stale-approval',
  'needs-instruction-text-review',
  'blocked-write-side-effect',
] as const;
export type GoldenDataExportShadowFixturePosture =
  typeof GOLDEN_DATA_EXPORT_SHADOW_FIXTURE_POSTURES[number];

export const GOLDEN_DATA_EXPORT_SHADOW_FIXTURE_NON_CLAIMS = [
  'not-live-warehouse-execution',
  'not-live-data-export',
  'not-native-snowflake-or-databricks-connector',
  'not-customer-pep-enforcement-proof',
  'not-production-ready',
] as const;

export interface GoldenDataExportShadowFixtureDataFacts {
  readonly queryClass:
    | 'aggregate-report'
    | 'customer-export'
    | 'controlled-data-package'
    | 'external-share'
    | 'write-query';
  readonly dataClass:
    | 'aggregate-metrics'
    | 'customer-personal-data'
    | 'customer-financial-data'
    | 'internal-operational-data';
  readonly recipientClass:
    | 'internal-analyst'
    | 'customer-account-owner'
    | 'approved-external-processor'
    | 'unapproved-external-recipient'
    | 'cross-tenant-principal';
  readonly requestedFieldsClass:
    | 'aggregate-only'
    | 'approved-minimal'
    | 'overbroad-personal-data'
    | 'raw-row-level'
    | 'write-mutation';
  readonly rowCountBucket: '0-100' | '100-1k' | '1k-10k' | 'unbounded';
  readonly approvalFreshness: 'fresh' | 'stale' | 'missing';
  readonly tenantScope: 'tenant-bound' | 'tenant-mismatch';
  readonly purposeBound: boolean;
  readonly instructionLikeEvidence: boolean;
  readonly externalSideEffect: boolean;
  readonly writeSideEffect: boolean;
}

export interface GoldenDataExportShadowFixture {
  readonly version: typeof GOLDEN_DATA_EXPORT_SHADOW_FIXTURES_VERSION;
  readonly scenario: GoldenDataExportShadowFixtureScenario;
  readonly fixtureId: string;
  readonly expectedPosture: GoldenDataExportShadowFixturePosture;
  readonly expectedDecision: ConsequenceAdmissionDecision;
  readonly dataFacts: GoldenDataExportShadowFixtureDataFacts;
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
  readonly noRawSql: true;
  readonly noRawRows: true;
  readonly noRawCustomerIdentifiers: true;
  readonly autoEnforce: false;
  readonly productionReady: false;
  readonly canonical: string;
  readonly digest: string;
}

export interface GoldenDataExportShadowFixtureSuite {
  readonly version: typeof GOLDEN_DATA_EXPORT_SHADOW_FIXTURES_VERSION;
  readonly name: 'Golden Path: Controlled Data Export';
  readonly step: 'D01';
  readonly sourceRecipeRefDigest: string;
  readonly actionSurfaceRefDigest: string;
  readonly fixtureCount: 8;
  readonly scenarios: typeof GOLDEN_DATA_EXPORT_SHADOW_FIXTURE_SCENARIOS;
  readonly fixtures: readonly GoldenDataExportShadowFixture[];
  readonly shadowOnly: true;
  readonly noTargetSystemCalls: true;
  readonly noRawPayload: true;
  readonly noRawSql: true;
  readonly noRawRows: true;
  readonly noRawCustomerIdentifiers: true;
  readonly autoEnforce: false;
  readonly productionReady: false;
  readonly canonical: string;
  readonly digest: string;
}

export interface GoldenDataExportShadowFixturesDescriptor {
  readonly version: typeof GOLDEN_DATA_EXPORT_SHADOW_FIXTURES_VERSION;
  readonly step: 'D01';
  readonly sourceSchemaVersion: typeof CANONICAL_SHADOW_EVENT_SCHEMA_VERSION;
  readonly scenarios: typeof GOLDEN_DATA_EXPORT_SHADOW_FIXTURE_SCENARIOS;
  readonly shadowOnly: true;
  readonly synthetic: true;
  readonly noTargetSystemCalls: true;
  readonly noRawPayload: true;
  readonly noRawSql: true;
  readonly noRawRows: true;
  readonly noRawCustomerIdentifiers: true;
  readonly autoEnforce: false;
  readonly productionReady: false;
  readonly nonClaims: typeof GOLDEN_DATA_EXPORT_SHADOW_FIXTURE_NON_CLAIMS;
}

interface ScenarioDefinition {
  readonly scenario: GoldenDataExportShadowFixtureScenario;
  readonly expectedPosture: GoldenDataExportShadowFixturePosture;
  readonly expectedDecision: ConsequenceAdmissionDecision;
  readonly dataFacts: GoldenDataExportShadowFixtureDataFacts;
  readonly actionName:
    | 'release_aggregate_report'
    | 'export_customer_data'
    | 'prepare_controlled_data_package'
    | 'publish_semantic_query'
    | 'execute_write_query';
  readonly actionKind: CanonicalShadowEventActionKind;
  readonly expectedEvidenceStates: readonly string[];
  readonly expectedSignals: readonly string[];
  readonly reasonCodes: readonly string[];
  readonly decision: CanonicalShadowEventDecision;
  readonly evidenceSeeds: readonly string[];
  readonly approvalSeeds: readonly string[];
}

const BASE_OCCURRED_AT = '2026-05-25T09:00:00.000Z';
const BASE_OBSERVED_AT = '2026-05-25T09:00:01.000Z';

const SCENARIO_DEFINITIONS: readonly ScenarioDefinition[] = Object.freeze([
  {
    scenario: 'aggregate-report-release',
    expectedPosture: 'shadow-ready',
    expectedDecision: 'admit',
    dataFacts: Object.freeze({
      queryClass: 'aggregate-report',
      dataClass: 'aggregate-metrics',
      recipientClass: 'internal-analyst',
      requestedFieldsClass: 'aggregate-only',
      rowCountBucket: '0-100',
      approvalFreshness: 'fresh',
      tenantScope: 'tenant-bound',
      purposeBound: true,
      instructionLikeEvidence: false,
      externalSideEffect: false,
      writeSideEffect: false,
    }),
    actionName: 'release_aggregate_report',
    actionKind: 'api-operation',
    expectedEvidenceStates: Object.freeze(['observed', 'approved', 'fresh']),
    expectedSignals: Object.freeze(['aggregate-only', 'purpose-bound', 'tenant-bound']),
    reasonCodes: Object.freeze([
      'data-export:aggregate-report-approved',
      'data-export:shadow-ready',
    ]),
    decision: Object.freeze({
      admissionDigest: null,
      mode: 'observe',
      shadowDecision: 'would_admit',
      effectiveDecision: 'review',
      allowed: false,
      failClosed: true,
      reasonCodes: Object.freeze([
        'data-export:aggregate-report-approved',
        'data-export:shadow-ready',
      ]),
    }),
    evidenceSeeds: Object.freeze(['semantic-model', 'purpose-binding', 'aggregate-only-policy']),
    approvalSeeds: Object.freeze(['internal-report-release-approval']),
  },
  {
    scenario: 'customer-export-approved',
    expectedPosture: 'export-ready-with-approval',
    expectedDecision: 'admit',
    dataFacts: Object.freeze({
      queryClass: 'customer-export',
      dataClass: 'customer-personal-data',
      recipientClass: 'customer-account-owner',
      requestedFieldsClass: 'approved-minimal',
      rowCountBucket: '100-1k',
      approvalFreshness: 'fresh',
      tenantScope: 'tenant-bound',
      purposeBound: true,
      instructionLikeEvidence: false,
      externalSideEffect: false,
      writeSideEffect: false,
    }),
    actionName: 'export_customer_data',
    actionKind: 'tool-call',
    expectedEvidenceStates: Object.freeze(['observed', 'approved', 'fresh']),
    expectedSignals: Object.freeze(['customer-recipient-bound', 'minimal-fields', 'fresh-approval']),
    reasonCodes: Object.freeze([
      'data-export:customer-recipient-bound',
      'data-export:minimal-fields-approved',
    ]),
    decision: Object.freeze({
      admissionDigest: null,
      mode: 'observe',
      shadowDecision: 'would_admit',
      effectiveDecision: 'review',
      allowed: false,
      failClosed: true,
      reasonCodes: Object.freeze([
        'data-export:customer-recipient-bound',
        'data-export:minimal-fields-approved',
      ]),
    }),
    evidenceSeeds: Object.freeze(['customer-request-digest', 'field-policy', 'export-purpose']),
    approvalSeeds: Object.freeze(['customer-export-approval']),
  },
  {
    scenario: 'pii-column-narrowing',
    expectedPosture: 'needs-field-narrowing',
    expectedDecision: 'narrow',
    dataFacts: Object.freeze({
      queryClass: 'controlled-data-package',
      dataClass: 'customer-personal-data',
      recipientClass: 'approved-external-processor',
      requestedFieldsClass: 'overbroad-personal-data',
      rowCountBucket: '1k-10k',
      approvalFreshness: 'fresh',
      tenantScope: 'tenant-bound',
      purposeBound: true,
      instructionLikeEvidence: false,
      externalSideEffect: true,
      writeSideEffect: false,
    }),
    actionName: 'prepare_controlled_data_package',
    actionKind: 'tool-call',
    expectedEvidenceStates: Object.freeze(['observed', 'approved', 'fresh', 'overbroad']),
    expectedSignals: Object.freeze(['field-narrowing-required', 'external-processor-bound']),
    reasonCodes: Object.freeze([
      'data-export:overbroad-personal-data',
      'data-export:narrow-to-approved-fields',
    ]),
    decision: Object.freeze({
      admissionDigest: null,
      mode: 'review',
      shadowDecision: 'would_narrow',
      effectiveDecision: 'review',
      allowed: false,
      failClosed: true,
      reasonCodes: Object.freeze([
        'data-export:narrow-to-approved-fields',
        'data-export:overbroad-personal-data',
      ]),
    }),
    evidenceSeeds: Object.freeze(['data-minimization-policy', 'processor-agreement', 'field-policy']),
    approvalSeeds: Object.freeze(['external-processor-approval']),
  },
  {
    scenario: 'external-recipient-review',
    expectedPosture: 'needs-recipient-review',
    expectedDecision: 'review',
    dataFacts: Object.freeze({
      queryClass: 'external-share',
      dataClass: 'customer-financial-data',
      recipientClass: 'unapproved-external-recipient',
      requestedFieldsClass: 'approved-minimal',
      rowCountBucket: '100-1k',
      approvalFreshness: 'missing',
      tenantScope: 'tenant-bound',
      purposeBound: true,
      instructionLikeEvidence: false,
      externalSideEffect: true,
      writeSideEffect: false,
    }),
    actionName: 'prepare_controlled_data_package',
    actionKind: 'tool-call',
    expectedEvidenceStates: Object.freeze(['observed', 'missing-approval', 'external-recipient']),
    expectedSignals: Object.freeze(['recipient-approval-gap', 'financial-data-review']),
    reasonCodes: Object.freeze([
      'data-export:external-recipient-unapproved',
      'data-export:hold-for-recipient-review',
    ]),
    decision: Object.freeze({
      admissionDigest: null,
      mode: 'review',
      shadowDecision: 'would_review',
      effectiveDecision: 'review',
      allowed: false,
      failClosed: true,
      reasonCodes: Object.freeze([
        'data-export:external-recipient-unapproved',
        'data-export:hold-for-recipient-review',
      ]),
    }),
    evidenceSeeds: Object.freeze(['financial-data-classification', 'purpose-binding']),
    approvalSeeds: Object.freeze([]),
  },
  {
    scenario: 'tenant-scope-mismatch',
    expectedPosture: 'blocked-tenant-mismatch',
    expectedDecision: 'block',
    dataFacts: Object.freeze({
      queryClass: 'customer-export',
      dataClass: 'customer-personal-data',
      recipientClass: 'cross-tenant-principal',
      requestedFieldsClass: 'approved-minimal',
      rowCountBucket: '100-1k',
      approvalFreshness: 'fresh',
      tenantScope: 'tenant-mismatch',
      purposeBound: true,
      instructionLikeEvidence: false,
      externalSideEffect: false,
      writeSideEffect: false,
    }),
    actionName: 'export_customer_data',
    actionKind: 'tool-call',
    expectedEvidenceStates: Object.freeze(['observed', 'tenant-mismatch']),
    expectedSignals: Object.freeze(['cross-tenant-recipient', 'tenant-boundary-fail']),
    reasonCodes: Object.freeze([
      'data-export:tenant-scope-mismatch',
      'data-export:block-cross-tenant-export',
    ]),
    decision: Object.freeze({
      admissionDigest: null,
      mode: 'review',
      shadowDecision: 'would_block',
      effectiveDecision: 'block',
      allowed: false,
      failClosed: true,
      reasonCodes: Object.freeze([
        'data-export:block-cross-tenant-export',
        'data-export:tenant-scope-mismatch',
      ]),
    }),
    evidenceSeeds: Object.freeze(['tenant-binding', 'recipient-binding', 'export-purpose']),
    approvalSeeds: Object.freeze(['stale-or-wrong-tenant-approval']),
  },
  {
    scenario: 'stale-approval',
    expectedPosture: 'blocked-stale-approval',
    expectedDecision: 'block',
    dataFacts: Object.freeze({
      queryClass: 'customer-export',
      dataClass: 'customer-personal-data',
      recipientClass: 'customer-account-owner',
      requestedFieldsClass: 'approved-minimal',
      rowCountBucket: '100-1k',
      approvalFreshness: 'stale',
      tenantScope: 'tenant-bound',
      purposeBound: true,
      instructionLikeEvidence: false,
      externalSideEffect: false,
      writeSideEffect: false,
    }),
    actionName: 'export_customer_data',
    actionKind: 'tool-call',
    expectedEvidenceStates: Object.freeze(['observed', 'stale-approval']),
    expectedSignals: Object.freeze(['freshness-gap', 'approval-revalidation-required']),
    reasonCodes: Object.freeze([
      'data-export:approval-stale',
      'data-export:block-stale-approval',
    ]),
    decision: Object.freeze({
      admissionDigest: null,
      mode: 'review',
      shadowDecision: 'would_block',
      effectiveDecision: 'block',
      allowed: false,
      failClosed: true,
      reasonCodes: Object.freeze([
        'data-export:approval-stale',
        'data-export:block-stale-approval',
      ]),
    }),
    evidenceSeeds: Object.freeze(['customer-request-digest', 'field-policy', 'export-purpose']),
    approvalSeeds: Object.freeze(['stale-customer-export-approval']),
  },
  {
    scenario: 'prompt-injection-in-evidence',
    expectedPosture: 'needs-instruction-text-review',
    expectedDecision: 'review',
    dataFacts: Object.freeze({
      queryClass: 'aggregate-report',
      dataClass: 'internal-operational-data',
      recipientClass: 'internal-analyst',
      requestedFieldsClass: 'aggregate-only',
      rowCountBucket: '0-100',
      approvalFreshness: 'fresh',
      tenantScope: 'tenant-bound',
      purposeBound: true,
      instructionLikeEvidence: true,
      externalSideEffect: false,
      writeSideEffect: false,
    }),
    actionName: 'publish_semantic_query',
    actionKind: 'sql-execution',
    expectedEvidenceStates: Object.freeze(['observed', 'approved', 'instruction-like-evidence']),
    expectedSignals: Object.freeze(['untrusted-content-review', 'evidence-is-not-authority']),
    reasonCodes: Object.freeze([
      'data-export:instruction-like-evidence-text',
      'data-export:ignore-evidence-as-instruction',
    ]),
    decision: Object.freeze({
      admissionDigest: null,
      mode: 'review',
      shadowDecision: 'would_review',
      effectiveDecision: 'review',
      allowed: false,
      failClosed: true,
      reasonCodes: Object.freeze([
        'data-export:ignore-evidence-as-instruction',
        'data-export:instruction-like-evidence-text',
      ]),
    }),
    evidenceSeeds: Object.freeze(['semantic-model', 'instruction-like-evidence-digest', 'purpose-binding']),
    approvalSeeds: Object.freeze(['internal-report-release-approval']),
  },
  {
    scenario: 'write-query-blocked',
    expectedPosture: 'blocked-write-side-effect',
    expectedDecision: 'block',
    dataFacts: Object.freeze({
      queryClass: 'write-query',
      dataClass: 'internal-operational-data',
      recipientClass: 'internal-analyst',
      requestedFieldsClass: 'write-mutation',
      rowCountBucket: 'unbounded',
      approvalFreshness: 'missing',
      tenantScope: 'tenant-bound',
      purposeBound: false,
      instructionLikeEvidence: false,
      externalSideEffect: true,
      writeSideEffect: true,
    }),
    actionName: 'execute_write_query',
    actionKind: 'sql-execution',
    expectedEvidenceStates: Object.freeze(['observed', 'missing-approval', 'write-side-effect']),
    expectedSignals: Object.freeze(['write-query-side-effect', 'purpose-binding-missing']),
    reasonCodes: Object.freeze([
      'data-export:write-side-effect',
      'data-export:block-write-query',
    ]),
    decision: Object.freeze({
      admissionDigest: null,
      mode: 'review',
      shadowDecision: 'would_block',
      effectiveDecision: 'block',
      allowed: false,
      failClosed: true,
      reasonCodes: Object.freeze([
        'data-export:block-write-query',
        'data-export:write-side-effect',
      ]),
    }),
    evidenceSeeds: Object.freeze(['warehouse-action-intent', 'write-side-effect-digest']),
    approvalSeeds: Object.freeze([]),
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
  const scenarioPrefix = `golden-data-export:${definition.scenario}`;
  const resourceRefDigest = digestFor('resource', `controlled-data-export:${definition.scenario}`);
  const targetAccountRefDigest = digestFor('target-account', 'golden-data-export-warehouse');

  return createCanonicalShadowEvent({
    occurredAt: BASE_OCCURRED_AT,
    observedAt: BASE_OBSERVED_AT,
    sourceKind: 'admission-shadow',
    producer: 'attestor.golden-data-export-shadow-fixtures',
    tenantRefDigest: digestFor('tenant', 'golden-data-export-synthetic-tenant'),
    actorRefDigest: digestFor('actor', 'golden-data-export-synthetic-agent'),
    observed: {
      targetSystem: 'analytics-warehouse',
      targetAccountRefDigest,
      actionName: definition.actionName,
      actionKind: definition.actionKind,
      consequenceClass: 'data-movement',
      resourceRefDigest,
      dataClass: definition.dataFacts.dataClass,
      amountAssetChain: null,
      authorityDelta: null,
    },
    inferred: {
      targetSystem: null,
      targetAccountRefDigest: null,
      actionName: null,
      actionKind: null,
      consequenceClass: 'data-movement',
      resourceRefDigest: null,
      dataClass: definition.dataFacts.queryClass,
      amountAssetChain: null,
      authorityDelta: definition.expectedDecision === 'admit'
        ? null
        : {
            authorityKind: 'data-release-review-required',
            principalRefDigest: digestFor('actor', 'golden-data-export-reviewer-role'),
            resourceRefDigest,
            permissionRefDigest: digestFor('authority', 'data-release-approval'),
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
    schemaRefDigest: digestFor('schema', CANONICAL_SHADOW_EVENT_SCHEMA_VERSION),
    rawMaterialPolicy: 'digest-only',
  });
}

function createFixture(definition: ScenarioDefinition): GoldenDataExportShadowFixture {
  const sourceRecipeRefDigest = digestFor('recipe', 'domain-consequence-recipes:data-tool-gate');
  const actionSurfaceRefDigest = digestFor('action-surface', `data-movement.${definition.actionName}`);
  const event = createScenarioEvent(definition);
  const payload = {
    version: GOLDEN_DATA_EXPORT_SHADOW_FIXTURES_VERSION,
    scenario: definition.scenario,
    fixtureId: `golden-data-export:${definition.scenario}`,
    expectedPosture: definition.expectedPosture,
    expectedDecision: definition.expectedDecision,
    dataFacts: definition.dataFacts,
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
    noRawSql: true,
    noRawRows: true,
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

export function createGoldenDataExportShadowFixtureSuite():
  GoldenDataExportShadowFixtureSuite {
  const fixtures = Object.freeze(SCENARIO_DEFINITIONS.map(createFixture));
  const sourceRecipeRefDigest = digestFor('recipe', 'domain-consequence-recipes:data-tool-gate');
  const actionSurfaceRefDigest = digestFor('action-surface', 'data-movement.controlled-export');
  const payload = {
    version: GOLDEN_DATA_EXPORT_SHADOW_FIXTURES_VERSION,
    name: 'Golden Path: Controlled Data Export',
    step: 'D01',
    sourceRecipeRefDigest,
    actionSurfaceRefDigest,
    fixtureCount: fixtures.length,
    scenarios: GOLDEN_DATA_EXPORT_SHADOW_FIXTURE_SCENARIOS,
    fixtureDigests: fixtures.map((fixture) => fixture.digest),
    shadowOnly: true,
    noTargetSystemCalls: true,
    noRawPayload: true,
    noRawSql: true,
    noRawRows: true,
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

export function goldenDataExportShadowFixturesDescriptor():
  GoldenDataExportShadowFixturesDescriptor {
  return Object.freeze({
    version: GOLDEN_DATA_EXPORT_SHADOW_FIXTURES_VERSION,
    step: 'D01',
    sourceSchemaVersion: CANONICAL_SHADOW_EVENT_SCHEMA_VERSION,
    scenarios: GOLDEN_DATA_EXPORT_SHADOW_FIXTURE_SCENARIOS,
    shadowOnly: true,
    synthetic: true,
    noTargetSystemCalls: true,
    noRawPayload: true,
    noRawSql: true,
    noRawRows: true,
    noRawCustomerIdentifiers: true,
    autoEnforce: false,
    productionReady: false,
    nonClaims: GOLDEN_DATA_EXPORT_SHADOW_FIXTURE_NON_CLAIMS,
  });
}
