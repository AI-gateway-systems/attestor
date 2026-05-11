import {
  CRYPTO_ADMISSION_RECEIPT_CLASSIFICATIONS,
  CRYPTO_ADMISSION_RECEIPT_SIGNATURE_MODES,
  CRYPTO_ADMISSION_RECEIPT_SPEC_VERSION,
  CRYPTO_ADMISSION_TELEMETRY_EVENT_TYPE,
  CRYPTO_ADMISSION_TELEMETRY_SIGNALS,
  CRYPTO_ADMISSION_TELEMETRY_SPEC_VERSION,
  verifyCryptoAdmissionReceipt,
  type CryptoAdmissionReceipt,
  type CryptoAdmissionReceiptClassification,
  type CryptoAdmissionReceiptSigner,
  type CryptoAdmissionTelemetryEvent,
  type CryptoAdmissionTelemetrySignal,
  type CryptoAdmissionTelemetrySubject,
} from './telemetry-receipts.js';
import {
  consequenceDataMinimizationMaterialSafetyFindings,
} from '../consequence-admission/data-minimization-redaction-policy.js';
import type {
  CryptoExecutionAdmissionOutcome,
  CryptoExecutionAdmissionPlan,
  CryptoExecutionAdmissionSurface,
} from './index.js';
import type { CryptoExecutionAdapterKind } from '../crypto-authorization-core/types.js';

/**
 * Adapter-neutral conformance fixtures for integrators that need to prove their
 * wallet, guard, bundler, payment, custody, or solver handoff honors the same
 * Attestor admission contract.
 */

export const CRYPTO_ADMISSION_CONFORMANCE_FIXTURES_SPEC_VERSION =
  'attestor.crypto-execution-admission-conformance-fixtures.v1';

export const CRYPTO_ADMISSION_CONFORMANCE_SCHEMA_DIALECT =
  'https://json-schema.org/draft/2020-12/schema';

export const CRYPTO_ADMISSION_CONFORMANCE_FIXTURE_PATH =
  'fixtures/crypto-execution-admission/conformance-fixtures.v1.json';

export const CRYPTO_ADMISSION_CONFORMANCE_SCHEMA_PATH =
  'fixtures/crypto-execution-admission/conformance-fixtures.schema.json';

export const CRYPTO_ADMISSION_CONFORMANCE_REQUIRED_SURFACES = [
  'wallet-rpc',
  'smart-account-guard',
  'account-abstraction-bundler',
  'modular-account-runtime',
  'delegated-eoa-runtime',
  'agent-payment-http',
  'custody-policy-engine',
  'intent-solver',
] as const satisfies readonly CryptoExecutionAdmissionSurface[];
export type CryptoAdmissionConformanceSurface =
  typeof CRYPTO_ADMISSION_CONFORMANCE_REQUIRED_SURFACES[number];

export const CRYPTO_ADMISSION_CONFORMANCE_RUNTIME_CHECKS = [
  'json-schema-2020-12-shape',
  'surface-coverage',
  'plan-subject-binding',
  'cloudevents-telemetry-shape',
  'signed-receipt-verification',
  'fail-closed-integrator-assertions',
  'negative-fixture-coverage',
  'negative-fixture-privacy-safety',
] as const;
export type CryptoAdmissionConformanceRuntimeCheck =
  typeof CRYPTO_ADMISSION_CONFORMANCE_RUNTIME_CHECKS[number];

export const CRYPTO_ADMISSION_NEGATIVE_CONFORMANCE_CLASSES = [
  'malformed',
  'stale',
  'malicious',
  'contradictory',
  'privacy-unsafe',
] as const;
export type CryptoAdmissionNegativeConformanceClass =
  typeof CRYPTO_ADMISSION_NEGATIVE_CONFORMANCE_CLASSES[number];

export const CRYPTO_ADMISSION_CONFORMANCE_TELEMETRY_SIGNALS = [
  'admitted',
  'blocked',
  'missing-evidence',
] as const satisfies readonly Exclude<CryptoAdmissionTelemetrySignal, 'receipt-issued'>[];

export interface CryptoAdmissionConformanceFixtureSigner
  extends CryptoAdmissionReceiptSigner {
  readonly purpose: 'fixture-only';
}

export interface CryptoAdmissionConformanceFixture {
  readonly fixtureId: string;
  readonly surface: CryptoAdmissionConformanceSurface;
  readonly adapterKind: CryptoExecutionAdapterKind;
  readonly standards: readonly string[];
  readonly scenario: string;
  readonly expectedSignal: Exclude<CryptoAdmissionTelemetrySignal, 'receipt-issued'>;
  readonly expectedReceiptClassification: CryptoAdmissionReceiptClassification;
  readonly expectedPlanOutcome: CryptoExecutionAdmissionOutcome;
  readonly expectedDownstreamAction: string;
  readonly plan: CryptoExecutionAdmissionPlan;
  readonly subject: CryptoAdmissionTelemetrySubject;
  readonly telemetryEvent: CryptoAdmissionTelemetryEvent;
  readonly receipt: CryptoAdmissionReceipt;
  readonly externalIntegratorAssertions: readonly string[];
}

export interface CryptoAdmissionNegativeConformanceFixture {
  readonly fixtureId: string;
  readonly surface: CryptoAdmissionConformanceSurface;
  readonly adapterKind: CryptoExecutionAdapterKind;
  readonly negativeClass: CryptoAdmissionNegativeConformanceClass;
  readonly standards: readonly string[];
  readonly scenario: string;
  readonly evidenceClass: string;
  readonly expectedFindingCode: string;
  readonly expectedPlanOutcome: Exclude<CryptoExecutionAdmissionOutcome, 'admit'>;
  readonly expectedSignal: Exclude<
    CryptoAdmissionTelemetrySignal,
    'admitted' | 'receipt-issued'
  >;
  readonly expectedDownstreamAction:
    | 'block-execution'
    | 'collect-evidence'
    | 'hold-for-review'
    | 'reject-fixture';
  readonly modelSafeFeedback: readonly string[];
  readonly shouldFailClosed: true;
  readonly rawPayloadStored: false;
  readonly rawProviderResponseStored: false;
  readonly customerIdentifiersStored: false;
  readonly privatePolicyThresholdsStored: false;
  readonly solverRouteSecretsStored: false;
}

export interface CryptoAdmissionConformanceFixtureSuite {
  readonly version: typeof CRYPTO_ADMISSION_CONFORMANCE_FIXTURES_SPEC_VERSION;
  readonly schemaDialect: typeof CRYPTO_ADMISSION_CONFORMANCE_SCHEMA_DIALECT;
  readonly generatedAt: string;
  readonly fixtureSigner: CryptoAdmissionConformanceFixtureSigner;
  readonly requiredSurfaces: readonly CryptoAdmissionConformanceSurface[];
  readonly fixtures: readonly CryptoAdmissionConformanceFixture[];
}

export interface CryptoAdmissionConformanceDescriptor {
  readonly fixtureVersion: typeof CRYPTO_ADMISSION_CONFORMANCE_FIXTURES_SPEC_VERSION;
  readonly schemaDialect: typeof CRYPTO_ADMISSION_CONFORMANCE_SCHEMA_DIALECT;
  readonly fixturePath: typeof CRYPTO_ADMISSION_CONFORMANCE_FIXTURE_PATH;
  readonly schemaPath: typeof CRYPTO_ADMISSION_CONFORMANCE_SCHEMA_PATH;
  readonly requiredSurfaces: typeof CRYPTO_ADMISSION_CONFORMANCE_REQUIRED_SURFACES;
  readonly runtimeChecks: typeof CRYPTO_ADMISSION_CONFORMANCE_RUNTIME_CHECKS;
  readonly telemetrySignals: typeof CRYPTO_ADMISSION_CONFORMANCE_TELEMETRY_SIGNALS;
  readonly receiptClassifications: typeof CRYPTO_ADMISSION_RECEIPT_CLASSIFICATIONS;
  readonly negativeFixtureClasses: typeof CRYPTO_ADMISSION_NEGATIVE_CONFORMANCE_CLASSES;
  readonly negativeFixtureCount: number;
}

export type CryptoAdmissionConformanceFindingSeverity = 'error' | 'warning';

export interface CryptoAdmissionConformanceValidationFinding {
  readonly severity: CryptoAdmissionConformanceFindingSeverity;
  readonly code: string;
  readonly path: string;
  readonly message: string;
}

export interface CryptoAdmissionConformanceValidationResult {
  readonly status: 'valid' | 'invalid';
  readonly fixtureCount: number;
  readonly coveredSurfaces: readonly CryptoAdmissionConformanceSurface[];
  readonly missingSurfaces: readonly CryptoAdmissionConformanceSurface[];
  readonly findings: readonly CryptoAdmissionConformanceValidationFinding[];
}

export interface CryptoAdmissionNegativeConformanceValidationResult {
  readonly status: 'valid' | 'invalid';
  readonly fixtureCount: number;
  readonly missingCoverage: readonly string[];
  readonly findings: readonly CryptoAdmissionConformanceValidationFinding[];
}

interface NegativeConformanceCase {
  readonly scenario: string;
  readonly evidenceClass: string;
  readonly expectedFindingCode: string;
}

interface NegativeConformanceSurfaceProfile {
  readonly adapterKind: CryptoExecutionAdapterKind;
  readonly standards: readonly string[];
  readonly cases: Readonly<
    Record<CryptoAdmissionNegativeConformanceClass, NegativeConformanceCase>
  >;
}

const EXPECTED_SIGNAL_BY_OUTCOME: Readonly<
  Record<CryptoExecutionAdmissionOutcome, Exclude<CryptoAdmissionTelemetrySignal, 'receipt-issued'>>
> = Object.freeze({
  admit: 'admitted',
  deny: 'blocked',
  'needs-evidence': 'missing-evidence',
});

const EXPECTED_CLASSIFICATION_BY_OUTCOME: Readonly<
  Record<CryptoExecutionAdmissionOutcome, CryptoAdmissionReceiptClassification>
> = Object.freeze({
  admit: 'admitted',
  deny: 'blocked',
  'needs-evidence': 'missing-evidence',
});

const NEGATIVE_OUTCOME_BY_CLASS: Readonly<
  Record<CryptoAdmissionNegativeConformanceClass, Exclude<CryptoExecutionAdmissionOutcome, 'admit'>>
> = Object.freeze({
  malformed: 'needs-evidence',
  stale: 'needs-evidence',
  malicious: 'deny',
  contradictory: 'deny',
  'privacy-unsafe': 'deny',
});

const NEGATIVE_ACTION_BY_CLASS: Readonly<
  Record<
    CryptoAdmissionNegativeConformanceClass,
    CryptoAdmissionNegativeConformanceFixture['expectedDownstreamAction']
  >
> = Object.freeze({
  malformed: 'collect-evidence',
  stale: 'collect-evidence',
  malicious: 'block-execution',
  contradictory: 'hold-for-review',
  'privacy-unsafe': 'reject-fixture',
});

const NEGATIVE_SURFACE_PROFILES: Readonly<
  Record<CryptoAdmissionConformanceSurface, NegativeConformanceSurfaceProfile>
> = Object.freeze({
  'wallet-rpc': Object.freeze({
    adapterKind: 'wallet-call-api',
    standards: Object.freeze(['EIP-5792', 'ERC-7715', 'ERC-7902']),
    cases: Object.freeze({
      malformed: {
        scenario: 'Wallet RPC call bundle omits a parseable prepared-call structure.',
        evidenceClass: 'prepared-call-bundle',
        expectedFindingCode: 'wallet-rpc-call-bundle-malformed',
      },
      stale: {
        scenario: 'Wallet capability evidence is older than the admitted wallet-call scope.',
        evidenceClass: 'wallet-capabilities',
        expectedFindingCode: 'wallet-rpc-capabilities-stale',
      },
      malicious: {
        scenario: 'Wallet permission request attempts to expand spend or target scope.',
        evidenceClass: 'wallet-permission-scope',
        expectedFindingCode: 'wallet-rpc-permission-escalation',
      },
      contradictory: {
        scenario: 'Wallet chain and prepared-call chain disagree.',
        evidenceClass: 'wallet-chain-binding',
        expectedFindingCode: 'wallet-rpc-chain-contradiction',
      },
      'privacy-unsafe': {
        scenario: 'Wallet metadata includes data that must be rejected before feedback.',
        evidenceClass: 'wallet-metadata-redaction',
        expectedFindingCode: 'wallet-rpc-metadata-privacy-rejected',
      },
    }),
  }),
  'smart-account-guard': Object.freeze({
    adapterKind: 'safe-guard',
    standards: Object.freeze(['Safe Guard', 'Safe Module Guard', 'ERC-1271']),
    cases: Object.freeze({
      malformed: {
        scenario: 'Safe transaction hash evidence is not structurally valid.',
        evidenceClass: 'safe-transaction-hash',
        expectedFindingCode: 'safe-transaction-hash-malformed',
      },
      stale: {
        scenario: 'Guard installation evidence is stale relative to the current Safe config.',
        evidenceClass: 'guard-precheck',
        expectedFindingCode: 'safe-guard-installation-stale',
      },
      malicious: {
        scenario: 'Module path attempts to bypass the expected guard enforcement point.',
        evidenceClass: 'module-guard-precheck',
        expectedFindingCode: 'safe-module-guard-bypass',
      },
      contradictory: {
        scenario: 'Safe owner or threshold evidence conflicts with the guard precheck.',
        evidenceClass: 'safe-owner-threshold',
        expectedFindingCode: 'safe-owner-threshold-contradiction',
      },
      'privacy-unsafe': {
        scenario: 'Safe integration metadata contains material that must not enter telemetry.',
        evidenceClass: 'safe-metadata-redaction',
        expectedFindingCode: 'safe-metadata-privacy-rejected',
      },
    }),
  }),
  'account-abstraction-bundler': Object.freeze({
    adapterKind: 'erc-4337-user-operation',
    standards: Object.freeze(['ERC-4337', 'ERC-7562', 'ERC-1271']),
    cases: Object.freeze({
      malformed: {
        scenario: 'UserOperation evidence is not structurally parseable.',
        evidenceClass: 'user-operation-hash',
        expectedFindingCode: 'erc4337-user-operation-malformed',
      },
      stale: {
        scenario: 'UserOperation validity or nonce evidence is stale.',
        evidenceClass: 'simulate-validation-result',
        expectedFindingCode: 'erc4337-validation-stale',
      },
      malicious: {
        scenario: 'Paymaster, factory, or account validation attempts an unsafe execution path.',
        evidenceClass: 'erc-7562-validation-scope',
        expectedFindingCode: 'erc4337-validation-scope-malicious',
      },
      contradictory: {
        scenario: 'EntryPoint, chain, or account evidence conflicts with the admitted plan.',
        evidenceClass: 'entrypoint-chain-binding',
        expectedFindingCode: 'erc4337-entrypoint-contradiction',
      },
      'privacy-unsafe': {
        scenario: 'UserOperation metadata includes material that must be rejected before export.',
        evidenceClass: 'user-operation-metadata-redaction',
        expectedFindingCode: 'erc4337-metadata-privacy-rejected',
      },
    }),
  }),
  'modular-account-runtime': Object.freeze({
    adapterKind: 'erc-6900-plugin',
    standards: Object.freeze(['ERC-7579', 'ERC-6900', 'ERC-4337']),
    cases: Object.freeze({
      malformed: {
        scenario: 'Module or plugin manifest cannot be parsed into an approved runtime shape.',
        evidenceClass: 'plugin-manifest-approval',
        expectedFindingCode: 'modular-account-manifest-malformed',
      },
      stale: {
        scenario: 'Module installation evidence is stale relative to runtime state.',
        evidenceClass: 'module-installation-evidence',
        expectedFindingCode: 'modular-account-installation-stale',
      },
      malicious: {
        scenario: 'Module hook attempts to bypass validation or execution checks.',
        evidenceClass: 'module-hook-precheck',
        expectedFindingCode: 'modular-account-hook-bypass',
      },
      contradictory: {
        scenario: 'Module type, selector, or plugin manifest evidence conflicts.',
        evidenceClass: 'module-runtime-binding',
        expectedFindingCode: 'modular-account-runtime-contradiction',
      },
      'privacy-unsafe': {
        scenario: 'Module metadata includes material that must stay out of proof and telemetry.',
        evidenceClass: 'module-metadata-redaction',
        expectedFindingCode: 'modular-account-metadata-privacy-rejected',
      },
    }),
  }),
  'delegated-eoa-runtime': Object.freeze({
    adapterKind: 'eip-7702-delegation',
    standards: Object.freeze(['EIP-7702', 'EIP-5792', 'ERC-7902']),
    cases: Object.freeze({
      malformed: {
        scenario: 'Delegated EOA authorization tuple is not structurally valid.',
        evidenceClass: 'authorization-list-tuple',
        expectedFindingCode: 'eip7702-authorization-tuple-malformed',
      },
      stale: {
        scenario: 'Delegation nonce or validity evidence is stale.',
        evidenceClass: 'delegation-freshness',
        expectedFindingCode: 'eip7702-delegation-stale',
      },
      malicious: {
        scenario: 'Delegate code target is not approved for the admitted account scope.',
        evidenceClass: 'delegate-code-approval',
        expectedFindingCode: 'eip7702-delegate-code-malicious',
      },
      contradictory: {
        scenario: 'Authorization tuple chain and wallet-call chain disagree.',
        evidenceClass: 'delegated-chain-binding',
        expectedFindingCode: 'eip7702-chain-contradiction',
      },
      'privacy-unsafe': {
        scenario: 'Delegation metadata includes material that must not enter model feedback.',
        evidenceClass: 'delegation-metadata-redaction',
        expectedFindingCode: 'eip7702-metadata-privacy-rejected',
      },
    }),
  }),
  'agent-payment-http': Object.freeze({
    adapterKind: 'x402-payment',
    standards: Object.freeze(['x402-v2', 'HTTP 402', 'EIP-3009']),
    cases: Object.freeze({
      malformed: {
        scenario: 'x402 payment header or payment response cannot be decoded.',
        evidenceClass: 'x402-payment-header',
        expectedFindingCode: 'x402-payment-header-malformed',
      },
      stale: {
        scenario: 'Payment requirement or facilitator verification is stale.',
        evidenceClass: 'x402-payment-requirement',
        expectedFindingCode: 'x402-payment-requirement-stale',
      },
      malicious: {
        scenario: 'Facilitator, payee, or resource route attempts to change the admitted payment scope.',
        evidenceClass: 'x402-facilitator-trust',
        expectedFindingCode: 'x402-facilitator-or-payee-malicious',
      },
      contradictory: {
        scenario: 'Amount, network, asset, or payer evidence conflicts across x402 handoff material.',
        evidenceClass: 'x402-payment-verification',
        expectedFindingCode: 'x402-payment-scope-contradiction',
      },
      'privacy-unsafe': {
        scenario: 'x402 metadata includes material that must not be echoed to telemetry or proof.',
        evidenceClass: 'x402-metadata-redaction',
        expectedFindingCode: 'x402-metadata-privacy-rejected',
      },
    }),
  }),
  'custody-policy-engine': Object.freeze({
    adapterKind: 'custody-cosigner',
    standards: Object.freeze(['custody-policy-engine', 'co-signer-callback']),
    cases: Object.freeze({
      malformed: {
        scenario: 'Custody co-signer callback evidence cannot be parsed into a decision.',
        evidenceClass: 'co-signer-response',
        expectedFindingCode: 'custody-cosigner-callback-malformed',
      },
      stale: {
        scenario: 'Custody policy decision is stale for the requested withdrawal.',
        evidenceClass: 'custody-policy-decision',
        expectedFindingCode: 'custody-policy-decision-stale',
      },
      malicious: {
        scenario: 'Custody callback attempts to bypass quorum or approval policy.',
        evidenceClass: 'custody-quorum-binding',
        expectedFindingCode: 'custody-quorum-bypass',
      },
      contradictory: {
        scenario: 'Provider status and Attestor custody policy outcome conflict.',
        evidenceClass: 'custody-provider-status',
        expectedFindingCode: 'custody-provider-status-contradiction',
      },
      'privacy-unsafe': {
        scenario: 'Custody callback body includes material that must not be stored in outputs.',
        evidenceClass: 'custody-callback-redaction',
        expectedFindingCode: 'custody-callback-privacy-rejected',
      },
    }),
  }),
  'intent-solver': Object.freeze({
    adapterKind: 'intent-settlement',
    standards: Object.freeze(['ERC-7683', 'intent-settlement', 'solver-preflight']),
    cases: Object.freeze({
      malformed: {
        scenario: 'Intent order or route commitment cannot be parsed.',
        evidenceClass: 'solver-route-commitment',
        expectedFindingCode: 'intent-solver-order-malformed',
      },
      stale: {
        scenario: 'Settlement deadline, quote, or route freshness has expired.',
        evidenceClass: 'settlement-preflight',
        expectedFindingCode: 'intent-solver-settlement-stale',
      },
      malicious: {
        scenario: 'Solver route attempts to substitute destination, asset, or settlement path.',
        evidenceClass: 'solver-route-risk',
        expectedFindingCode: 'intent-solver-route-malicious',
      },
      contradictory: {
        scenario: 'Route commitment and settlement preflight conflict.',
        evidenceClass: 'route-settlement-binding',
        expectedFindingCode: 'intent-solver-route-contradiction',
      },
      'privacy-unsafe': {
        scenario: 'Solver route metadata includes material that must not be disclosed.',
        evidenceClass: 'solver-route-redaction',
        expectedFindingCode: 'intent-solver-route-privacy-rejected',
      },
    }),
  }),
});

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function stringAt(record: Record<string, unknown>, key: string): string | null {
  const value = record[key];
  return typeof value === 'string' ? value : null;
}

function arrayAt(record: Record<string, unknown>, key: string): readonly unknown[] {
  const value = record[key];
  return Array.isArray(value) ? value : [];
}

function hasStringArray(record: Record<string, unknown>, key: string): boolean {
  return arrayAt(record, key).every((item) => typeof item === 'string');
}

function pushFinding(
  findings: CryptoAdmissionConformanceValidationFinding[],
  finding: CryptoAdmissionConformanceValidationFinding,
): void {
  findings.push(Object.freeze(finding));
}

function pushError(
  findings: CryptoAdmissionConformanceValidationFinding[],
  path: string,
  code: string,
  message: string,
): void {
  pushFinding(findings, {
    severity: 'error',
    code,
    path,
    message,
  });
}

function negativeFixture(input: {
  readonly surface: CryptoAdmissionConformanceSurface;
  readonly profile: NegativeConformanceSurfaceProfile;
  readonly negativeClass: CryptoAdmissionNegativeConformanceClass;
  readonly scenario: NegativeConformanceCase;
}): CryptoAdmissionNegativeConformanceFixture {
  const expectedPlanOutcome = NEGATIVE_OUTCOME_BY_CLASS[input.negativeClass];
  const expectedSignal = EXPECTED_SIGNAL_BY_OUTCOME[expectedPlanOutcome] as Exclude<
    CryptoAdmissionTelemetrySignal,
    'admitted' | 'receipt-issued'
  >;
  return Object.freeze({
    fixtureId: `${input.surface}-${input.negativeClass}-negative-v1`,
    surface: input.surface,
    adapterKind: input.profile.adapterKind,
    negativeClass: input.negativeClass,
    standards: input.profile.standards,
    scenario: input.scenario.scenario,
    evidenceClass: input.scenario.evidenceClass,
    expectedFindingCode: input.scenario.expectedFindingCode,
    expectedPlanOutcome,
    expectedSignal,
    expectedDownstreamAction: NEGATIVE_ACTION_BY_CLASS[input.negativeClass],
    modelSafeFeedback: Object.freeze([
      `negative-class:${input.negativeClass}`,
      `finding:${input.scenario.expectedFindingCode}`,
      `evidence:${input.scenario.evidenceClass}`,
    ]),
    shouldFailClosed: true,
    rawPayloadStored: false,
    rawProviderResponseStored: false,
    customerIdentifiersStored: false,
    privatePolicyThresholdsStored: false,
    solverRouteSecretsStored: false,
  });
}

export const CRYPTO_ADMISSION_NEGATIVE_CONFORMANCE_FIXTURES = Object.freeze(
  CRYPTO_ADMISSION_CONFORMANCE_REQUIRED_SURFACES.flatMap((surface) => {
    const profile = NEGATIVE_SURFACE_PROFILES[surface];
    return CRYPTO_ADMISSION_NEGATIVE_CONFORMANCE_CLASSES.map((negativeClass) =>
      negativeFixture({
        surface,
        profile,
        negativeClass,
        scenario: profile.cases[negativeClass],
      }),
    );
  }),
);

function isRequiredSurface(value: unknown): value is CryptoAdmissionConformanceSurface {
  return typeof value === 'string' &&
    CRYPTO_ADMISSION_CONFORMANCE_REQUIRED_SURFACES.includes(
      value as CryptoAdmissionConformanceSurface,
    );
}

function isTelemetrySignal(
  value: unknown,
): value is Exclude<CryptoAdmissionTelemetrySignal, 'receipt-issued'> {
  return typeof value === 'string' &&
    value !== 'receipt-issued' &&
    CRYPTO_ADMISSION_TELEMETRY_SIGNALS.includes(
      value as CryptoAdmissionTelemetrySignal,
    );
}

function isReceiptClassification(
  value: unknown,
): value is CryptoAdmissionReceiptClassification {
  return typeof value === 'string' &&
    CRYPTO_ADMISSION_RECEIPT_CLASSIFICATIONS.includes(
      value as CryptoAdmissionReceiptClassification,
    );
}

function isNegativeClass(value: unknown): value is CryptoAdmissionNegativeConformanceClass {
  return typeof value === 'string' &&
    CRYPTO_ADMISSION_NEGATIVE_CONFORMANCE_CLASSES.includes(
      value as CryptoAdmissionNegativeConformanceClass,
    );
}

function isPlanOutcome(value: unknown): value is CryptoExecutionAdmissionOutcome {
  return value === 'admit' || value === 'deny' || value === 'needs-evidence';
}

function isSha256Digest(value: unknown): boolean {
  return typeof value === 'string' && /^sha256:[a-f0-9]{64}$/.test(value);
}

function assertEqual(
  findings: CryptoAdmissionConformanceValidationFinding[],
  actual: unknown,
  expected: unknown,
  path: string,
  code: string,
  message: string,
): void {
  if (actual !== expected) {
    pushError(findings, path, code, message);
  }
}

function validateFixture(
  input: unknown,
  index: number,
  signer: CryptoAdmissionConformanceFixtureSigner | null,
  seenFixtureIds: Set<string>,
  coveredSurfaces: Set<CryptoAdmissionConformanceSurface>,
  findings: CryptoAdmissionConformanceValidationFinding[],
): void {
  const path = `fixtures[${index}]`;
  if (!isRecord(input)) {
    pushError(findings, path, 'fixture-not-object', 'Fixture must be an object.');
    return;
  }

  const fixtureId = stringAt(input, 'fixtureId');
  if (fixtureId == null || fixtureId.length === 0) {
    pushError(findings, `${path}.fixtureId`, 'fixture-id-required', 'Fixture id is required.');
  } else if (seenFixtureIds.has(fixtureId)) {
    pushError(
      findings,
      `${path}.fixtureId`,
      'fixture-id-duplicate',
      `Fixture id ${fixtureId} appears more than once.`,
    );
  } else {
    seenFixtureIds.add(fixtureId);
  }

  const surface = input.surface;
  if (!isRequiredSurface(surface)) {
    pushError(
      findings,
      `${path}.surface`,
      'surface-unsupported',
      'Fixture surface must be one of the required external admission surfaces.',
    );
  } else {
    coveredSurfaces.add(surface);
  }

  if (stringAt(input, 'adapterKind') == null) {
    pushError(findings, `${path}.adapterKind`, 'adapter-kind-required', 'Adapter kind is required.');
  }
  if (stringAt(input, 'scenario') == null) {
    pushError(findings, `${path}.scenario`, 'scenario-required', 'Scenario is required.');
  }
  if (!hasStringArray(input, 'standards') || arrayAt(input, 'standards').length === 0) {
    pushError(
      findings,
      `${path}.standards`,
      'standards-required',
      'Fixture must name at least one external standard or surface convention.',
    );
  }
  if (!hasStringArray(input, 'externalIntegratorAssertions') ||
    arrayAt(input, 'externalIntegratorAssertions').length < 4) {
    pushError(
      findings,
      `${path}.externalIntegratorAssertions`,
      'integrator-assertions-required',
      'Fixture must include fail-closed assertions for external integrators.',
    );
  }

  const expectedSignal = input.expectedSignal;
  const expectedReceiptClassification = input.expectedReceiptClassification;
  const expectedPlanOutcome = input.expectedPlanOutcome;
  if (!isTelemetrySignal(expectedSignal)) {
    pushError(
      findings,
      `${path}.expectedSignal`,
      'expected-signal-invalid',
      'Expected signal must be admitted, blocked, or missing-evidence.',
    );
  }
  if (!isReceiptClassification(expectedReceiptClassification)) {
    pushError(
      findings,
      `${path}.expectedReceiptClassification`,
      'expected-classification-invalid',
      'Expected receipt classification is invalid.',
    );
  }
  if (!isPlanOutcome(expectedPlanOutcome)) {
    pushError(
      findings,
      `${path}.expectedPlanOutcome`,
      'expected-plan-outcome-invalid',
      'Expected plan outcome is invalid.',
    );
  }
  if (stringAt(input, 'expectedDownstreamAction') == null) {
    pushError(
      findings,
      `${path}.expectedDownstreamAction`,
      'expected-action-required',
      'Expected downstream action is required.',
    );
  }
  if (isPlanOutcome(expectedPlanOutcome) && isTelemetrySignal(expectedSignal)) {
    assertEqual(
      findings,
      expectedSignal,
      EXPECTED_SIGNAL_BY_OUTCOME[expectedPlanOutcome],
      `${path}.expectedSignal`,
      'signal-outcome-mismatch',
      'Expected telemetry signal must match the expected plan outcome.',
    );
  }
  if (isPlanOutcome(expectedPlanOutcome) && isReceiptClassification(expectedReceiptClassification)) {
    assertEqual(
      findings,
      expectedReceiptClassification,
      EXPECTED_CLASSIFICATION_BY_OUTCOME[expectedPlanOutcome],
      `${path}.expectedReceiptClassification`,
      'classification-outcome-mismatch',
      'Expected receipt classification must match the expected plan outcome.',
    );
  }

  const plan = input.plan;
  const subject = input.subject;
  const telemetryEvent = input.telemetryEvent;
  const receipt = input.receipt;
  if (!isRecord(plan)) {
    pushError(findings, `${path}.plan`, 'plan-required', 'Plan fixture object is required.');
  }
  if (!isRecord(subject)) {
    pushError(
      findings,
      `${path}.subject`,
      'subject-required',
      'Telemetry subject fixture object is required.',
    );
  }
  if (!isRecord(telemetryEvent)) {
    pushError(
      findings,
      `${path}.telemetryEvent`,
      'telemetry-event-required',
      'Telemetry event fixture object is required.',
    );
  }
  if (!isRecord(receipt)) {
    pushError(findings, `${path}.receipt`, 'receipt-required', 'Receipt fixture object is required.');
  }
  if (!isRecord(plan) || !isRecord(subject) || !isRecord(telemetryEvent) || !isRecord(receipt)) {
    return;
  }

  assertEqual(
    findings,
    plan.version,
    'attestor.crypto-execution-admission.v1',
    `${path}.plan.version`,
    'plan-version-mismatch',
    'Plan version must match crypto execution admission v1.',
  );
  assertEqual(
    findings,
    plan.surface,
    surface,
    `${path}.plan.surface`,
    'plan-surface-mismatch',
    'Plan surface must match fixture surface.',
  );
  assertEqual(
    findings,
    plan.adapterKind,
    input.adapterKind,
    `${path}.plan.adapterKind`,
    'plan-adapter-mismatch',
    'Plan adapter kind must match fixture adapter kind.',
  );
  assertEqual(
    findings,
    plan.outcome,
    expectedPlanOutcome,
    `${path}.plan.outcome`,
    'plan-outcome-mismatch',
    'Plan outcome must match fixture expectation.',
  );
  if (!isSha256Digest(plan.digest)) {
    pushError(
      findings,
      `${path}.plan.digest`,
      'plan-digest-invalid',
      'Plan digest must be a sha256 digest.',
    );
  }

  assertEqual(
    findings,
    subject.surface,
    surface,
    `${path}.subject.surface`,
    'subject-surface-mismatch',
    'Subject surface must match fixture surface.',
  );
  assertEqual(
    findings,
    subject.adapterKind,
    input.adapterKind,
    `${path}.subject.adapterKind`,
    'subject-adapter-mismatch',
    'Subject adapter kind must match fixture adapter kind.',
  );
  assertEqual(
    findings,
    subject.planId,
    plan.planId,
    `${path}.subject.planId`,
    'subject-plan-id-mismatch',
    'Subject plan id must bind to plan id.',
  );
  assertEqual(
    findings,
    subject.planDigest,
    plan.digest,
    `${path}.subject.planDigest`,
    'subject-plan-digest-mismatch',
    'Subject plan digest must bind to plan digest.',
  );
  if (!isSha256Digest(subject.subjectDigest)) {
    pushError(
      findings,
      `${path}.subject.subjectDigest`,
      'subject-digest-invalid',
      'Subject digest must be a sha256 digest.',
    );
  }

  assertEqual(
    findings,
    telemetryEvent.version,
    CRYPTO_ADMISSION_TELEMETRY_SPEC_VERSION,
    `${path}.telemetryEvent.version`,
    'telemetry-version-mismatch',
    'Telemetry version must match crypto admission telemetry v1.',
  );
  assertEqual(
    findings,
    telemetryEvent.specversion,
    '1.0',
    `${path}.telemetryEvent.specversion`,
    'telemetry-specversion-mismatch',
    'Telemetry event must use CloudEvents specversion 1.0.',
  );
  assertEqual(
    findings,
    telemetryEvent.type,
    CRYPTO_ADMISSION_TELEMETRY_EVENT_TYPE,
    `${path}.telemetryEvent.type`,
    'telemetry-type-mismatch',
    'Conformance telemetry event must be an admission decision event.',
  );
  assertEqual(
    findings,
    telemetryEvent.signal,
    expectedSignal,
    `${path}.telemetryEvent.signal`,
    'telemetry-signal-mismatch',
    'Telemetry signal must match fixture expectation.',
  );
  const eventData = isRecord(telemetryEvent.data) ? telemetryEvent.data : null;
  if (eventData == null) {
    pushError(
      findings,
      `${path}.telemetryEvent.data`,
      'telemetry-data-required',
      'Telemetry data object is required.',
    );
  } else {
    assertEqual(
      findings,
      eventData.planId,
      plan.planId,
      `${path}.telemetryEvent.data.planId`,
      'telemetry-plan-id-mismatch',
      'Telemetry plan id must bind to plan id.',
    );
    assertEqual(
      findings,
      eventData.planDigest,
      plan.digest,
      `${path}.telemetryEvent.data.planDigest`,
      'telemetry-plan-digest-mismatch',
      'Telemetry plan digest must bind to plan digest.',
    );
    assertEqual(
      findings,
      eventData.surface,
      surface,
      `${path}.telemetryEvent.data.surface`,
      'telemetry-surface-mismatch',
      'Telemetry surface must match fixture surface.',
    );
    assertEqual(
      findings,
      eventData.subjectId,
      subject.subjectId,
      `${path}.telemetryEvent.data.subjectId`,
      'telemetry-subject-id-mismatch',
      'Telemetry subject id must bind to subject.',
    );
  }
  if (!isSha256Digest(telemetryEvent.eventDigest)) {
    pushError(
      findings,
      `${path}.telemetryEvent.eventDigest`,
      'telemetry-digest-invalid',
      'Telemetry event digest must be a sha256 digest.',
    );
  }

  assertEqual(
    findings,
    receipt.version,
    CRYPTO_ADMISSION_RECEIPT_SPEC_VERSION,
    `${path}.receipt.version`,
    'receipt-version-mismatch',
    'Receipt version must match crypto admission receipt v1.',
  );
  assertEqual(
    findings,
    receipt.classification,
    expectedReceiptClassification,
    `${path}.receipt.classification`,
    'receipt-classification-mismatch',
    'Receipt classification must match fixture expectation.',
  );
  assertEqual(
    findings,
    receipt.planId,
    plan.planId,
    `${path}.receipt.planId`,
    'receipt-plan-id-mismatch',
    'Receipt plan id must bind to plan id.',
  );
  assertEqual(
    findings,
    receipt.planDigest,
    plan.digest,
    `${path}.receipt.planDigest`,
    'receipt-plan-digest-mismatch',
    'Receipt plan digest must bind to plan digest.',
  );
  assertEqual(
    findings,
    receipt.surface,
    surface,
    `${path}.receipt.surface`,
    'receipt-surface-mismatch',
    'Receipt surface must match fixture surface.',
  );
  assertEqual(
    findings,
    receipt.adapterKind,
    input.adapterKind,
    `${path}.receipt.adapterKind`,
    'receipt-adapter-mismatch',
    'Receipt adapter kind must match fixture adapter kind.',
  );
  assertEqual(
    findings,
    receipt.planOutcome,
    expectedPlanOutcome,
    `${path}.receipt.planOutcome`,
    'receipt-plan-outcome-mismatch',
    'Receipt plan outcome must match fixture expectation.',
  );
  if (!isSha256Digest(receipt.receiptDigest)) {
    pushError(
      findings,
      `${path}.receipt.receiptDigest`,
      'receipt-digest-invalid',
      'Receipt digest must be a sha256 digest.',
    );
  }
  const signature = isRecord(receipt.signature) ? receipt.signature : null;
  if (signature == null) {
    pushError(
      findings,
      `${path}.receipt.signature`,
      'receipt-signature-required',
      'Receipt signature object is required.',
    );
  } else {
    assertEqual(
      findings,
      signature.mode,
      CRYPTO_ADMISSION_RECEIPT_SIGNATURE_MODES[0],
      `${path}.receipt.signature.mode`,
      'receipt-signature-mode-mismatch',
      'Receipt signature must use the fixture signature mode.',
    );
    if (signer != null) {
      assertEqual(
        findings,
        signature.keyId,
        signer.keyId,
        `${path}.receipt.signature.keyId`,
        'receipt-signature-key-mismatch',
        'Receipt signature key must match fixture signer key id.',
      );
      try {
        const verification = verifyCryptoAdmissionReceipt({
          receipt: receipt as unknown as CryptoAdmissionReceipt,
          signer,
        });
        if (verification.status !== 'valid') {
          pushError(
            findings,
            `${path}.receipt.signature`,
            'receipt-signature-invalid',
            `Receipt signature failed verification: ${verification.failureReasons.join(', ')}`,
          );
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        pushError(
          findings,
          `${path}.receipt.signature`,
          'receipt-signature-verification-error',
          message,
        );
      }
    }
  }
}

function fixtureSignerFrom(input: Record<string, unknown>): CryptoAdmissionConformanceFixtureSigner | null {
  const signerInput = input.fixtureSigner;
  if (!isRecord(signerInput)) {
    return null;
  }
  const keyId = stringAt(signerInput, 'keyId');
  const secret = stringAt(signerInput, 'secret');
  const purpose = signerInput.purpose;
  if (keyId == null || secret == null || purpose !== 'fixture-only') {
    return null;
  }
  return Object.freeze({
    keyId,
    secret,
    purpose,
  });
}

function validateNegativeFixture(
  fixture: unknown,
  index: number,
  seenFixtureIds: Set<string>,
  coverage: Set<string>,
  findings: CryptoAdmissionConformanceValidationFinding[],
): void {
  const path = `negativeFixtures[${index}]`;
  if (!isRecord(fixture)) {
    pushError(findings, path, 'negative-fixture-not-object', 'Negative fixture must be an object.');
    return;
  }

  const fixtureId = stringAt(fixture, 'fixtureId');
  if (fixtureId == null || fixtureId.length === 0) {
    pushError(findings, `${path}.fixtureId`, 'negative-fixture-id-required', 'Fixture id is required.');
  } else if (seenFixtureIds.has(fixtureId)) {
    pushError(findings, `${path}.fixtureId`, 'negative-fixture-id-duplicate', `Fixture id ${fixtureId} appears more than once.`);
  } else {
    seenFixtureIds.add(fixtureId);
  }

  const surface = fixture.surface;
  const negativeClass = fixture.negativeClass;
  if (!isRequiredSurface(surface)) {
    pushError(findings, `${path}.surface`, 'negative-surface-unsupported', 'Negative fixture surface is unsupported.');
  }
  if (!isNegativeClass(negativeClass)) {
    pushError(findings, `${path}.negativeClass`, 'negative-class-unsupported', 'Negative fixture class is unsupported.');
  }
  if (isRequiredSurface(surface) && isNegativeClass(negativeClass)) {
    coverage.add(`${surface}:${negativeClass}`);
    const expectedProfile = NEGATIVE_SURFACE_PROFILES[surface];
    assertEqual(
      findings,
      fixture.adapterKind,
      expectedProfile.adapterKind,
      `${path}.adapterKind`,
      'negative-adapter-kind-mismatch',
      'Negative fixture adapter kind must match its required surface.',
    );
  }

  if (fixture.shouldFailClosed !== true) {
    pushError(findings, `${path}.shouldFailClosed`, 'negative-fixture-not-fail-closed', 'Negative fixture must fail closed.');
  }
  for (const flag of [
    'rawPayloadStored',
    'rawProviderResponseStored',
    'customerIdentifiersStored',
    'privatePolicyThresholdsStored',
    'solverRouteSecretsStored',
  ]) {
    if (fixture[flag] !== false) {
      pushError(findings, `${path}.${flag}`, 'negative-privacy-flag-not-false', `${flag} must be false.`);
    }
  }

  const expectedPlanOutcome = fixture.expectedPlanOutcome;
  const expectedSignal = fixture.expectedSignal;
  if (!isPlanOutcome(expectedPlanOutcome) || expectedPlanOutcome === 'admit') {
    pushError(findings, `${path}.expectedPlanOutcome`, 'negative-plan-outcome-invalid', 'Negative fixture cannot expect an admit outcome.');
  }
  if (!isTelemetrySignal(expectedSignal) || expectedSignal === 'admitted') {
    pushError(findings, `${path}.expectedSignal`, 'negative-signal-invalid', 'Negative fixture cannot expect an admitted signal.');
  }
  if (
    isPlanOutcome(expectedPlanOutcome) &&
    expectedPlanOutcome !== 'admit' &&
    isTelemetrySignal(expectedSignal)
  ) {
    assertEqual(
      findings,
      expectedSignal,
      EXPECTED_SIGNAL_BY_OUTCOME[expectedPlanOutcome],
      `${path}.expectedSignal`,
      'negative-signal-outcome-mismatch',
      'Negative fixture signal must match the expected fail-closed plan outcome.',
    );
  }

  if (!hasStringArray(fixture, 'standards') || arrayAt(fixture, 'standards').length === 0) {
    pushError(findings, `${path}.standards`, 'negative-standards-required', 'Negative fixture must name at least one standard.');
  }
  for (const field of ['scenario', 'evidenceClass', 'expectedFindingCode']) {
    if (stringAt(fixture, field) == null) {
      pushError(findings, `${path}.${field}`, 'negative-field-required', `${field} is required.`);
    }
  }
  if (!hasStringArray(fixture, 'modelSafeFeedback') || arrayAt(fixture, 'modelSafeFeedback').length < 3) {
    pushError(findings, `${path}.modelSafeFeedback`, 'negative-feedback-required', 'Negative fixture feedback must be model-safe and actionable.');
  }

  const safetyFindings = consequenceDataMinimizationMaterialSafetyFindings({
    material: JSON.stringify({
      fixtureId,
      scenario: fixture.scenario,
      evidenceClass: fixture.evidenceClass,
      expectedFindingCode: fixture.expectedFindingCode,
      modelSafeFeedback: fixture.modelSafeFeedback,
      rawPayloadStored: fixture.rawPayloadStored,
    }),
    findingSubject: `negative fixture ${fixtureId ?? index}`,
  });
  for (const safetyFinding of safetyFindings) {
    pushError(
      findings,
      path,
      'negative-fixture-privacy-unsafe',
      safetyFinding,
    );
  }
}

export function validateCryptoAdmissionConformanceFixtureSuite(
  suite: unknown,
): CryptoAdmissionConformanceValidationResult {
  const findings: CryptoAdmissionConformanceValidationFinding[] = [];
  const coveredSurfaces = new Set<CryptoAdmissionConformanceSurface>();
  const seenFixtureIds = new Set<string>();

  if (!isRecord(suite)) {
    pushError(findings, '$', 'suite-not-object', 'Conformance suite must be an object.');
    return Object.freeze({
      status: 'invalid',
      fixtureCount: 0,
      coveredSurfaces: Object.freeze([]),
      missingSurfaces: CRYPTO_ADMISSION_CONFORMANCE_REQUIRED_SURFACES,
      findings: Object.freeze(findings),
    });
  }

  assertEqual(
    findings,
    suite.version,
    CRYPTO_ADMISSION_CONFORMANCE_FIXTURES_SPEC_VERSION,
    '$.version',
    'suite-version-mismatch',
    'Suite version must match crypto admission conformance fixtures v1.',
  );
  assertEqual(
    findings,
    suite.schemaDialect,
    CRYPTO_ADMISSION_CONFORMANCE_SCHEMA_DIALECT,
    '$.schemaDialect',
    'schema-dialect-mismatch',
    'Suite schema dialect must be JSON Schema Draft 2020-12.',
  );
  if (stringAt(suite, 'generatedAt') == null) {
    pushError(findings, '$.generatedAt', 'generated-at-required', 'Generated timestamp is required.');
  }

  const signer = fixtureSignerFrom(suite);
  if (signer == null) {
    pushError(
      findings,
      '$.fixtureSigner',
      'fixture-signer-invalid',
      'Fixture signer must include keyId, secret, and purpose=fixture-only.',
    );
  }

  const requiredSurfaces = arrayAt(suite, 'requiredSurfaces');
  for (const requiredSurface of CRYPTO_ADMISSION_CONFORMANCE_REQUIRED_SURFACES) {
    if (!requiredSurfaces.includes(requiredSurface)) {
      pushError(
        findings,
        '$.requiredSurfaces',
        'required-surface-missing-from-suite',
        `Suite requiredSurfaces must include ${requiredSurface}.`,
      );
    }
  }

  const fixtures = arrayAt(suite, 'fixtures');
  if (fixtures.length === 0) {
    pushError(findings, '$.fixtures', 'fixtures-empty', 'At least one conformance fixture is required.');
  }
  fixtures.forEach((fixture, index) =>
    validateFixture(fixture, index, signer, seenFixtureIds, coveredSurfaces, findings),
  );

  const missingSurfaces = CRYPTO_ADMISSION_CONFORMANCE_REQUIRED_SURFACES.filter(
    (surface) => !coveredSurfaces.has(surface),
  );
  for (const missingSurface of missingSurfaces) {
    pushError(
      findings,
      '$.fixtures',
      'surface-coverage-missing',
      `No conformance fixture covers ${missingSurface}.`,
    );
  }

  const errorCount = findings.filter((finding) => finding.severity === 'error').length;
  return Object.freeze({
    status: errorCount === 0 ? 'valid' : 'invalid',
    fixtureCount: fixtures.length,
    coveredSurfaces: Object.freeze([...coveredSurfaces].sort()),
    missingSurfaces: Object.freeze(missingSurfaces),
    findings: Object.freeze(findings),
  });
}

export function validateCryptoAdmissionNegativeConformanceFixtures(
  fixtures: readonly unknown[] = CRYPTO_ADMISSION_NEGATIVE_CONFORMANCE_FIXTURES,
): CryptoAdmissionNegativeConformanceValidationResult {
  const findings: CryptoAdmissionConformanceValidationFinding[] = [];
  const coverage = new Set<string>();
  const seenFixtureIds = new Set<string>();

  fixtures.forEach((fixture, index) =>
    validateNegativeFixture(fixture, index, seenFixtureIds, coverage, findings),
  );

  const expectedCoverage = CRYPTO_ADMISSION_CONFORMANCE_REQUIRED_SURFACES.flatMap((surface) =>
    CRYPTO_ADMISSION_NEGATIVE_CONFORMANCE_CLASSES.map(
      (negativeClass) => `${surface}:${negativeClass}`,
    ),
  );
  const missingCoverage = Object.freeze(
    expectedCoverage.filter((entry) => !coverage.has(entry)),
  );
  for (const missing of missingCoverage) {
    pushError(
      findings,
      '$.negativeFixtures',
      'negative-fixture-coverage-missing',
      `No negative conformance fixture covers ${missing}.`,
    );
  }

  const errorCount = findings.filter((finding) => finding.severity === 'error').length;
  return Object.freeze({
    status: errorCount === 0 ? 'valid' : 'invalid',
    fixtureCount: fixtures.length,
    missingCoverage,
    findings: Object.freeze(findings),
  });
}

export function cryptoAdmissionConformanceDescriptor():
CryptoAdmissionConformanceDescriptor {
  return Object.freeze({
    fixtureVersion: CRYPTO_ADMISSION_CONFORMANCE_FIXTURES_SPEC_VERSION,
    schemaDialect: CRYPTO_ADMISSION_CONFORMANCE_SCHEMA_DIALECT,
    fixturePath: CRYPTO_ADMISSION_CONFORMANCE_FIXTURE_PATH,
    schemaPath: CRYPTO_ADMISSION_CONFORMANCE_SCHEMA_PATH,
    requiredSurfaces: CRYPTO_ADMISSION_CONFORMANCE_REQUIRED_SURFACES,
    runtimeChecks: CRYPTO_ADMISSION_CONFORMANCE_RUNTIME_CHECKS,
    telemetrySignals: CRYPTO_ADMISSION_CONFORMANCE_TELEMETRY_SIGNALS,
    receiptClassifications: CRYPTO_ADMISSION_RECEIPT_CLASSIFICATIONS,
    negativeFixtureClasses: CRYPTO_ADMISSION_NEGATIVE_CONFORMANCE_CLASSES,
    negativeFixtureCount: CRYPTO_ADMISSION_NEGATIVE_CONFORMANCE_FIXTURES.length,
  });
}
