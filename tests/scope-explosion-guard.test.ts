import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  consequenceScopeExplosionGuardDescriptor,
  evaluateConsequenceScopeExplosion,
} from '../src/consequence-admission/index.js';

let passed = 0;

function equal<T>(actual: T, expected: T, message: string): void {
  assert.equal(actual, expected, message);
  passed += 1;
}

function ok(condition: unknown, message: string): void {
  assert.ok(condition, message);
  passed += 1;
}

function includes(content: string, expected: string, message: string): void {
  assert.ok(content.includes(expected), `${message}\nExpected to find: ${expected}`);
  passed += 1;
}

function excludes(content: string, unexpected: RegExp, message: string): void {
  assert.doesNotMatch(content, unexpected, message);
  passed += 1;
}

function readProjectFile(...segments: string[]): string {
  return readFileSync(join(process.cwd(), ...segments), 'utf8');
}

function cleanInput() {
  return {
    generatedAt: '2026-05-13T13:00:00.000Z',
    actionSurface: 'refund-service.issue_refund',
    action: 'issue_refund',
    scopeOwnerPolicyRef: 'policy:refund-scope-private',
    requestedScope: {
      amountMinorUnits: 4000,
      currency: 'usd',
      recordCount: 1,
      operationType: 'refund' as const,
      recipientId: 'recipient_customer_private',
      tenantId: 'tenant_current_private',
      environment: 'production',
      downstreamSystem: 'refund-service-private',
      dataClass: 'customer-visible' as const,
      reversibilityClass: 'compensating-action-available' as const,
    },
    approvedScope: {
      maxAmountMinorUnits: 5000,
      currency: 'usd',
      maxRecordCount: 1,
      operationTypes: ['refund'] as const,
      recipientIds: ['recipient_customer_private'],
      tenantId: 'tenant_current_private',
      environments: ['production'],
      downstreamSystems: ['refund-service-private'],
      dataClasses: ['customer-visible'],
      reversibilityClasses: ['reversible', 'compensating-action-available'] as const,
    },
  };
}

function testApprovedScopePasses(): void {
  const decision = evaluateConsequenceScopeExplosion(cleanInput());
  const serialized = JSON.stringify(decision);

  equal(decision.version, 'attestor.consequence-scope-explosion-guard.v1', 'Scope guard: version is explicit');
  equal(decision.outcome, 'pass', 'Scope guard: approved scope passes');
  equal(decision.allowed, true, 'Scope guard: pass decision is allowed');
  equal(decision.failClosed, false, 'Scope guard: pass decision is not fail-closed');
  ok(decision.reasonCodes.includes('scope-pass'), 'Scope guard: pass reason is present');
  ok(decision.requiredControls.includes('requested-vs-approved-scope-diff'), 'Scope guard: binding carries scope diff control');
  ok(decision.digest.startsWith('sha256:'), 'Scope guard: digest is generated');
  excludes(serialized, /recipient_customer_private|tenant_current_private|refund-service-private|policy:refund-scope-private/iu, 'Scope guard: serialized output excludes raw tenant, recipient, downstream, and policy refs');
}

function testAmountRecordRecipientExpansionNarrows(): void {
  const decision = evaluateConsequenceScopeExplosion({
    ...cleanInput(),
    requestedScope: {
      ...cleanInput().requestedScope,
      amountMinorUnits: 9000,
      recordCount: 12,
      recipientId: 'recipient_other_private',
    },
  });
  const serialized = JSON.stringify(decision);

  equal(decision.outcome, 'narrow', 'Scope guard: amount, record, and recipient expansion narrows');
  equal(decision.allowed, true, 'Scope guard: narrow is allowed only with returned constraints');
  equal(decision.failClosed, false, 'Scope guard: narrow itself is not review/block');
  ok(decision.reasonCodes.includes('amount-exceeds-approved-scope'), 'Scope guard: amount reason is present');
  ok(decision.reasonCodes.includes('record-count-exceeds-approved-scope'), 'Scope guard: record count reason is present');
  ok(decision.reasonCodes.includes('recipient-out-of-scope'), 'Scope guard: recipient reason is present');
  equal(decision.constraints.length, 3, 'Scope guard: three narrowing constraints are returned');
  ok(decision.constraints.some((item) => item.dimension === 'amount'), 'Scope guard: amount constraint is returned');
  ok(decision.constraints.some((item) => item.dimension === 'record-count'), 'Scope guard: record-count constraint is returned');
  ok(decision.constraints.some((item) => item.dimension === 'recipient'), 'Scope guard: recipient constraint is returned');
  excludes(serialized, /9000|recipient_other_private|recipient_customer_private/iu, 'Scope guard: narrow output excludes raw private amounts and recipients');
}

function testOperationDataClassAndIrreversibleEscalationBlocks(): void {
  const decision = evaluateConsequenceScopeExplosion({
    ...cleanInput(),
    requestedScope: {
      ...cleanInput().requestedScope,
      operationType: 'delete',
      dataClass: 'credential',
      reversibilityClass: 'irreversible',
    },
  });

  equal(decision.outcome, 'block', 'Scope guard: high-risk operation/data/reversibility escalation blocks');
  equal(decision.allowed, false, 'Scope guard: block decision is not allowed');
  equal(decision.failClosed, true, 'Scope guard: block decision is fail-closed');
  ok(decision.reasonCodes.includes('operation-out-of-scope'), 'Scope guard: operation out-of-scope reason is present');
  ok(decision.reasonCodes.includes('data-class-out-of-scope'), 'Scope guard: data-class out-of-scope reason is present');
  ok(decision.reasonCodes.includes('irreversible-action-not-approved'), 'Scope guard: irreversible reason is present');
  ok(decision.reasonCodes.includes('scope-blocked'), 'Scope guard: scope-blocked reason is present');
}

function testTenantMismatchBlocks(): void {
  const decision = evaluateConsequenceScopeExplosion({
    ...cleanInput(),
    requestedScope: {
      ...cleanInput().requestedScope,
      tenantId: 'tenant_foreign_private',
    },
  });
  const serialized = JSON.stringify(decision);

  equal(decision.outcome, 'block', 'Scope guard: tenant mismatch blocks');
  ok(decision.reasonCodes.includes('tenant-out-of-scope'), 'Scope guard: tenant out-of-scope reason is present');
  ok(decision.observed.blockingDimensions.includes('tenant'), 'Scope guard: tenant is a blocking dimension');
  excludes(serialized, /tenant_foreign_private|tenant_current_private/iu, 'Scope guard: tenant ids are digest-only');
}

function testMissingApprovedScopeReviews(): void {
  const decision = evaluateConsequenceScopeExplosion({
    ...cleanInput(),
    approvedScope: null,
  });

  equal(decision.outcome, 'review', 'Scope guard: missing approved scope reviews');
  equal(decision.allowed, false, 'Scope guard: review decision is not allowed');
  equal(decision.failClosed, true, 'Scope guard: review decision is fail-closed');
  ok(decision.reasonCodes.includes('approved-scope-missing'), 'Scope guard: approved scope missing reason is present');
  ok(decision.reasonCodes.includes('scope-review-required'), 'Scope guard: review reason is present');
}

function testDescriptorDocsRegistryAndPackageScriptStayAligned(): void {
  const descriptor = consequenceScopeExplosionGuardDescriptor();
  const doc = readProjectFile('docs', '02-architecture', 'scope-explosion-guard.md');
  const registry = readProjectFile('src', 'consequence-admission', 'failure-mode-registry.ts');
  const pkg = JSON.parse(readProjectFile('package.json')) as {
    readonly scripts: Record<string, string>;
  };

  equal(descriptor.version, 'attestor.consequence-scope-explosion-guard.v1', 'Scope descriptor: version is explicit');
  equal(descriptor.failureModeId, 'scope-explosion', 'Scope descriptor: failure mode is bound');
  equal(descriptor.comparesRequestedVsApprovedScope, true, 'Scope descriptor: requested-vs-approved comparison is explicit');
  equal(descriptor.emitsNarrowingConstraints, true, 'Scope descriptor: narrowing constraints are explicit');
  equal(descriptor.storesRawScopeValues, false, 'Scope descriptor: raw scope storage is false');
  includes(doc, 'attestor.consequence-scope-explosion-guard.v1', 'Scope docs: version is named');
  includes(doc, 'src/consequence-admission/scope-explosion-guard.ts', 'Scope docs: source file is named');
  includes(doc, 'test:scope-explosion-guard', 'Scope docs: test command is named');
  includes(doc, 'scope-explosion', 'Scope docs: failure mode is named');
  includes(registry, 'scope-explosion-guard.ts', 'Failure registry: scope guard source evidence is recorded');
  equal(
    pkg.scripts['test:scope-explosion-guard'],
    'tsx tests/scope-explosion-guard.test.ts',
    'Package: scope guard test is exposed',
  );
}

try {
  testApprovedScopePasses();
  testAmountRecordRecipientExpansionNarrows();
  testOperationDataClassAndIrreversibleEscalationBlocks();
  testTenantMismatchBlocks();
  testMissingApprovedScopeReviews();
  testDescriptorDocsRegistryAndPackageScriptStayAligned();
  console.log(`Scope explosion guard tests: ${passed} passed, 0 failed`);
} catch (error) {
  console.error('Scope explosion guard tests failed:', error);
  process.exitCode = 1;
}
