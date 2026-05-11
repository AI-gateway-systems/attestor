import assert from 'node:assert/strict';
import {
  CRYPTO_ADMISSION_CONFORMANCE_REQUIRED_SURFACES,
  CRYPTO_ADMISSION_NEGATIVE_CONFORMANCE_CLASSES,
  CRYPTO_ADMISSION_NEGATIVE_CONFORMANCE_FIXTURES,
  cryptoAdmissionConformanceDescriptor,
  validateCryptoAdmissionNegativeConformanceFixtures,
} from '../src/crypto-execution-admission/index.js';
import type {
  CryptoAdmissionNegativeConformanceFixture,
} from '../src/crypto-execution-admission/index.js';

let passed = 0;

function ok(condition: unknown, message: string): void {
  assert.ok(condition, message);
  passed += 1;
}

function equal<T>(actual: T, expected: T, message: string): void {
  assert.equal(actual, expected, message);
  passed += 1;
}

function deepEqual<T>(actual: T, expected: T, message: string): void {
  assert.deepEqual(actual, expected, message);
  passed += 1;
}

function cloneFixture(
  fixture: CryptoAdmissionNegativeConformanceFixture,
): Record<string, unknown> {
  return JSON.parse(JSON.stringify(fixture)) as Record<string, unknown>;
}

function testNegativeFixtureCoverage(): void {
  const expectedCount =
    CRYPTO_ADMISSION_CONFORMANCE_REQUIRED_SURFACES.length *
    CRYPTO_ADMISSION_NEGATIVE_CONFORMANCE_CLASSES.length;
  const validation = validateCryptoAdmissionNegativeConformanceFixtures();

  equal(
    CRYPTO_ADMISSION_NEGATIVE_CONFORMANCE_FIXTURES.length,
    expectedCount,
    'negative conformance: fixture count covers every surface and class',
  );
  equal(validation.status, 'valid', 'negative conformance: built-in fixtures validate');
  equal(validation.fixtureCount, 40, 'negative conformance: forty negative fixtures exist');
  deepEqual(validation.missingCoverage, [], 'negative conformance: no coverage gaps');

  for (const surface of CRYPTO_ADMISSION_CONFORMANCE_REQUIRED_SURFACES) {
    const surfaceFixtures = CRYPTO_ADMISSION_NEGATIVE_CONFORMANCE_FIXTURES.filter(
      (fixture) => fixture.surface === surface,
    );
    deepEqual(
      surfaceFixtures.map((fixture) => fixture.negativeClass).sort(),
      [...CRYPTO_ADMISSION_NEGATIVE_CONFORMANCE_CLASSES].sort(),
      `negative conformance: ${surface} has every negative class`,
    );
  }
}

function testNegativeFixturesFailClosedAndStayModelSafe(): void {
  for (const fixture of CRYPTO_ADMISSION_NEGATIVE_CONFORMANCE_FIXTURES) {
    equal(fixture.shouldFailClosed, true, `${fixture.fixtureId}: fails closed`);
    ok(
      fixture.expectedPlanOutcome === 'deny' ||
        fixture.expectedPlanOutcome === 'needs-evidence',
      `${fixture.fixtureId}: does not expect admit`,
    );
    ok(
      fixture.expectedSignal === 'blocked' ||
        fixture.expectedSignal === 'missing-evidence',
      `${fixture.fixtureId}: does not expect admitted telemetry`,
    );
    equal(fixture.rawPayloadStored, false, `${fixture.fixtureId}: stores no raw payload`);
    equal(
      fixture.rawProviderResponseStored,
      false,
      `${fixture.fixtureId}: stores no provider response body`,
    );
    equal(
      fixture.customerIdentifiersStored,
      false,
      `${fixture.fixtureId}: stores no customer identifiers`,
    );
    equal(
      fixture.privatePolicyThresholdsStored,
      false,
      `${fixture.fixtureId}: stores no private policy thresholds`,
    );
    equal(
      fixture.solverRouteSecretsStored,
      false,
      `${fixture.fixtureId}: stores no solver route secrets`,
    );
    ok(
      fixture.modelSafeFeedback.every(
        (entry) =>
          !entry.includes('must_not_escape') &&
          !entry.includes('credential') &&
          !entry.includes('secret='),
      ),
      `${fixture.fixtureId}: feedback is model-safe`,
    );
  }
}

function testKeyCryptoSurfacesHaveSpecificNegativeCases(): void {
  const byId = new Map(
    CRYPTO_ADMISSION_NEGATIVE_CONFORMANCE_FIXTURES.map((fixture) => [
      fixture.fixtureId,
      fixture,
    ]),
  );

  equal(
    byId.get('account-abstraction-bundler-malicious-negative-v1')
      ?.expectedFindingCode,
    'erc4337-validation-scope-malicious',
    'negative conformance: ERC-4337 malicious validation-scope fixture exists',
  );
  equal(
    byId.get('delegated-eoa-runtime-stale-negative-v1')?.expectedFindingCode,
    'eip7702-delegation-stale',
    'negative conformance: EIP-7702 stale delegation fixture exists',
  );
  equal(
    byId.get('agent-payment-http-contradictory-negative-v1')?.expectedFindingCode,
    'x402-payment-scope-contradiction',
    'negative conformance: x402 contradictory payment fixture exists',
  );
  equal(
    byId.get('custody-policy-engine-privacy-unsafe-negative-v1')
      ?.expectedFindingCode,
    'custody-callback-privacy-rejected',
    'negative conformance: custody privacy fixture exists',
  );
  equal(
    byId.get('intent-solver-malicious-negative-v1')?.expectedFindingCode,
    'intent-solver-route-malicious',
    'negative conformance: intent solver malicious route fixture exists',
  );
}

function testNegativeFixtureValidatorRejectsBrokenCases(): void {
  const missingCoverage = CRYPTO_ADMISSION_NEGATIVE_CONFORMANCE_FIXTURES.filter(
    (fixture) =>
      !(
        fixture.surface === 'intent-solver' &&
        fixture.negativeClass === 'privacy-unsafe'
      ),
  );
  const missingValidation =
    validateCryptoAdmissionNegativeConformanceFixtures(missingCoverage);
  equal(
    missingValidation.status,
    'invalid',
    'negative conformance: missing surface/class coverage is rejected',
  );
  ok(
    missingValidation.findings.some(
      (finding) => finding.code === 'negative-fixture-coverage-missing',
    ),
    'negative conformance: missing coverage finding is reported',
  );

  const unsafe = CRYPTO_ADMISSION_NEGATIVE_CONFORMANCE_FIXTURES.map(cloneFixture);
  unsafe[0].rawPayloadStored = true;
  const unsafeValidation = validateCryptoAdmissionNegativeConformanceFixtures(unsafe);
  equal(
    unsafeValidation.status,
    'invalid',
    'negative conformance: raw payload storage flag is rejected',
  );
  ok(
    unsafeValidation.findings.some(
      (finding) => finding.code === 'negative-privacy-flag-not-false',
    ),
    'negative conformance: privacy flag finding is reported',
  );

  const wrongSignal = CRYPTO_ADMISSION_NEGATIVE_CONFORMANCE_FIXTURES.map(cloneFixture);
  wrongSignal[1].expectedSignal = 'admitted';
  const wrongSignalValidation =
    validateCryptoAdmissionNegativeConformanceFixtures(wrongSignal);
  equal(
    wrongSignalValidation.status,
    'invalid',
    'negative conformance: admitted signal is rejected',
  );
  ok(
    wrongSignalValidation.findings.some(
      (finding) => finding.code === 'negative-signal-invalid',
    ),
    'negative conformance: invalid signal finding is reported',
  );
}

function testDescriptorExposesNegativeFixtureContract(): void {
  const descriptor = cryptoAdmissionConformanceDescriptor();

  equal(
    descriptor.negativeFixtureCount,
    40,
    'negative conformance: descriptor exposes fixture count',
  );
  deepEqual(
    descriptor.negativeFixtureClasses,
    CRYPTO_ADMISSION_NEGATIVE_CONFORMANCE_CLASSES,
    'negative conformance: descriptor exposes fixture classes',
  );
  ok(
    descriptor.runtimeChecks.includes('negative-fixture-privacy-safety'),
    'negative conformance: descriptor includes privacy safety check',
  );
}

testNegativeFixtureCoverage();
testNegativeFixturesFailClosedAndStayModelSafe();
testKeyCryptoSurfacesHaveSpecificNegativeCases();
testNegativeFixtureValidatorRejectsBrokenCases();
testDescriptorExposesNegativeFixtureContract();

console.log(`crypto-execution-admission-negative-conformance-fixtures: ${passed} assertions passed`);
