import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

let passed = 0;

function readProjectFile(...segments: string[]): string {
  return readFileSync(join(process.cwd(), ...segments), 'utf8');
}

function ok(condition: unknown, message: string): void {
  assert.ok(condition, message);
  passed += 1;
}

function equal<T>(actual: T, expected: T, message: string): void {
  assert.equal(actual, expected, message);
  passed += 1;
}

function includes(content: string, expected: string, message: string): void {
  assert.ok(
    content.includes(expected),
    `${message}\nExpected to find: ${expected}`,
  );
  passed += 1;
}

function excludes(content: string, unexpected: RegExp, message: string): void {
  assert.doesNotMatch(content, unexpected, message);
  passed += 1;
}

function packageJson(): {
  readonly scripts: Readonly<Record<string, string>>;
} {
  return JSON.parse(readProjectFile('package.json')) as {
    readonly scripts: Readonly<Record<string, string>>;
  };
}

function testM05AContractShape(): void {
  const doc = readProjectFile('docs', '02-architecture', 'data-movement-full-consequence-engine-proof.md');

  includes(
    doc,
    'Status: M05A external provider run contract.',
    'M05A contract: status names the external provider run contract',
  );
  includes(
    doc,
    '## M05A - External Data Provider Run Contract',
    'M05A contract: dedicated section is documented',
  );
  includes(
    doc,
    'The first M05 target is a controlled BigQuery to Cloud Storage export run:',
    'M05A contract: first provider target is explicit',
  );
  includes(
    doc,
    'same M02-M04 engine path',
    'M05A contract: external run must use the existing engine path',
  );
  includes(
    doc,
    'BigQuery query/export job',
    'M05A contract: BigQuery job receipt is in scope',
  );
  includes(
    doc,
    'Cloud Storage object receipt',
    'M05A contract: Cloud Storage object receipt is in scope',
  );
  includes(
    doc,
    'Snowflake remains a valid later external-provider target',
    'M05A contract: Snowflake remains a later provider option without becoming the first target',
  );
}

function testM05ASourceAnchorsAndCostBoundaries(): void {
  const doc = readProjectFile('docs', '02-architecture', 'data-movement-full-consequence-engine-proof.md');

  for (const expected of [
    'BigQuery supports exporting table data and query results to Cloud Storage',
    'BigQuery dry runs validate a query and estimate bytes/cost without charging',
    'BigQuery cost controls include daily custom query quotas',
    'Cloud Storage object metadata includes generation, metageneration, CRC32C',
    'Cloud Storage audit logs can record Admin Activity and Data Access events',
    'Cloud Billing budgets and alerts help monitor spend, but a budget alert does',
    'Snowflake query history exposes a query id',
    'These are engineering anchors only.',
  ]) {
    includes(doc, expected, `M05A sources: records ${expected}`);
  }

  includes(
    doc,
    'Claim that budget alerts hard-cap spend.',
    'M05A cost boundary: budget alerts are not presented as hard caps',
  );
  includes(
    doc,
    'provider-local cost controls that directly bound the external run',
    'M05A paid services: provider-local cost controls are decision-adjacent only for the scoped run',
  );
  excludes(
    doc,
    /Budget alerts hard-cap spend\./u,
    'M05A cost boundary: no positive hard-cap sentence is present',
  );
}

function testM05AEvidenceAndFailClosedRequirements(): void {
  const doc = readProjectFile('docs', '02-architecture', 'data-movement-full-consequence-engine-proof.md');

  for (const expected of [
    '## Required M05 Run Evidence',
    '`POST /api/v1/admissions`, protected release token, online introspection, replay consumption, release-enforcement PEP decision, export gate outcome.',
    'BigQuery dry-run result or equivalent provider estimate',
    'BigQuery job id or digest, job status, destination URI digest, bounded exported scope digest, Cloud Storage object generation/metageneration/CRC32C refs.',
    'Cloud audit log ref or digest when Data Access logging is enabled; otherwise an explicit `audit-log-not-enabled` limitation.',
    '`npm run check:public-artifacts-redaction` over the generated M05 public artifact root before publication.',
    'M05 must still use the same consequence engine.',
    '## M05 External Fail-Closed Cases',
    'Review or block | No provider export call may be made.',
    'Missing proof, stale token, or replay | No provider export call may be made, including retries.',
    'Redaction failure | No public artifact may be published.',
  ]) {
    includes(doc, expected, `M05A evidence/fail-closed: records ${expected}`);
  }

  for (const forbidden of [
    'Raw token',
    'Raw rows',
    'Raw audit log body',
    'Unscanned generated artifact publication',
  ]) {
    includes(doc, forbidden, `M05A evidence table: forbidden publication surface is named: ${forbidden}`);
  }
}

function testPackageScriptExposesContractCheck(): void {
  const pkg = packageJson();

  equal(
    pkg.scripts['test:data-movement-external-engine-run-contract'],
    'tsx tests/data-movement-external-engine-run-contract.test.ts',
    'M05A package script: targeted contract test is exposed',
  );
}

testM05AContractShape();
testM05ASourceAnchorsAndCostBoundaries();
testM05AEvidenceAndFailClosedRequirements();
testPackageScriptExposesContractCheck();

console.log(`data-movement-external-engine-run-contract: ${passed} assertions passed`);
