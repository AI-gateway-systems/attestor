import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  CONSEQUENCE_FAILURE_MODE_IDS,
  CONSEQUENCE_FAILURE_MODE_REGISTRY_VERSION,
  consequenceFailureModeRegistry,
  type ConsequenceFailureModeId,
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

function includes(value: string, expected: string, message: string): void {
  assert.ok(value.includes(expected), `${message}\nExpected to include: ${expected}`);
  passed += 1;
}

function readProjectFile(...segments: string[]): string {
  return readFileSync(join(process.cwd(), ...segments), 'utf8');
}

function entry(id: ConsequenceFailureModeId) {
  const registry = consequenceFailureModeRegistry();
  const found = registry.entries.find((item) => item.id === id);
  assert.ok(found, `Missing failure mode registry entry: ${id}`);
  return found;
}

function testRegistryShapeIsDeterministicAndConservative(): void {
  const registry = consequenceFailureModeRegistry();
  const ids = registry.entries.map((item) => item.id);
  const uniqueIds = new Set(ids);

  equal(registry.version, CONSEQUENCE_FAILURE_MODE_REGISTRY_VERSION, 'Failure registry: version is explicit');
  equal(registry.version, 'attestor.consequence-failure-mode-registry.v1', 'Failure registry: version literal is stable');
  equal(registry.entryCount, CONSEQUENCE_FAILURE_MODE_IDS.length, 'Failure registry: entry count matches declared id catalog');
  equal(uniqueIds.size, ids.length, 'Failure registry: ids are unique');
  equal(registry.approvalRequired, true, 'Failure registry: approval is required');
  equal(registry.autoEnforce, false, 'Failure registry: auto enforce is false');
  equal(registry.productionReady, false, 'Failure registry: production readiness is false');
  equal(registry.activatesEnforcement, false, 'Failure registry: enforcement activation is false');
  equal(registry.rawPayloadStored, false, 'Failure registry: raw payload storage is false');
  ok(registry.digest.startsWith('sha256:'), 'Failure registry: digest is generated');
  includes(registry.canonical, '"version":"attestor.consequence-failure-mode-registry.v1"', 'Failure registry: canonical payload includes version');
}

function testAllEntriesHaveEvidenceAndControls(): void {
  const registry = consequenceFailureModeRegistry();
  const sourceIds = new Set(registry.sources.map((source) => source.id));

  for (const item of registry.entries) {
    ok(item.sourceRefs.length > 0, `Failure registry: ${item.id} has source refs`);
    ok(item.requiredControls.length > 0, `Failure registry: ${item.id} has required controls`);
    ok(item.repositoryEvidence.length > 0, `Failure registry: ${item.id} has repository evidence`);
    ok(item.protectedPrinciples.length > 0, `Failure registry: ${item.id} has protected principles`);
    ok(item.limitation.length > 0, `Failure registry: ${item.id} has explicit limitation`);
    ok(item.defaultDecision !== 'admit', `Failure registry: ${item.id} cannot default to admit`);
    for (const sourceRef of item.sourceRefs) {
      ok(sourceIds.has(sourceRef), `Failure registry: ${item.id} source ${sourceRef} is declared`);
    }
  }
}

function testCriticalFailureModesAreBoundToSafeDefaults(): void {
  const untrusted = entry('untrusted-content-authorizes-action');
  const fakeApproval = entry('fake-approval-laundering');
  const wrongRecipient = entry('wrong-recipient-disclosure');
  const scope = entry('scope-explosion');
  const reviewFatigue = entry('human-review-fatigue');
  const supplyChain = entry('agentic-supply-chain-compromise');

  equal(untrusted.defaultDecision, 'block', 'Failure registry: untrusted authorization blocks');
  ok(
    untrusted.requiredControls.includes('trusted-authority-source'),
    'Failure registry: untrusted authorization requires trusted authority source',
  );
  ok(
    untrusted.sourceRefs.includes('microsoft-indirect-prompt-injection'),
    'Failure registry: untrusted authorization keeps Microsoft indirect prompt injection anchor',
  );

  equal(fakeApproval.defaultDecision, 'block', 'Failure registry: fake approval laundering blocks');
  ok(
    fakeApproval.requiredControls.includes('approval-provenance-required'),
    'Failure registry: fake approval requires approval provenance',
  );

  equal(wrongRecipient.defaultDecision, 'block', 'Failure registry: wrong-recipient disclosure blocks');
  ok(
    wrongRecipient.requiredControls.includes('recipient-scope-binding'),
    'Failure registry: wrong recipient requires recipient scope binding',
  );

  equal(scope.defaultDecision, 'narrow', 'Failure registry: scope explosion narrows before review/block escalation');
  ok(
    scope.requiredControls.includes('requested-vs-approved-scope-diff'),
    'Failure registry: scope explosion requires requested-vs-approved diff',
  );

  equal(reviewFatigue.defaultDecision, 'review', 'Failure registry: review fatigue remains a review hardening concern');
  equal(supplyChain.defaultDecision, 'block', 'Failure registry: agentic supply-chain compromise blocks');
}

function testDocsAndPackageScriptStayAligned(): void {
  const doc = readProjectFile('docs', '02-architecture', 'failure-mode-registry.md');
  const pkg = JSON.parse(readProjectFile('package.json')) as {
    readonly scripts: Record<string, string>;
  };

  includes(doc, 'attestor.consequence-failure-mode-registry.v1', 'Failure registry docs: version is named');
  includes(doc, 'src/consequence-admission/failure-mode-registry.ts', 'Failure registry docs: source file is named');
  includes(doc, 'test:failure-mode-registry', 'Failure registry docs: test command is named');
  includes(doc, 'untrusted-content-authorizes-action', 'Failure registry docs: untrusted content mode is named');
  includes(doc, 'fake-approval-laundering', 'Failure registry docs: approval laundering mode is named');
  includes(doc, 'not a certification', 'Failure registry docs: no certification disclaimer is present');
  equal(
    pkg.scripts['test:failure-mode-registry'],
    'tsx tests/failure-mode-registry.test.ts',
    'Package: failure registry test is exposed',
  );
}

try {
  testRegistryShapeIsDeterministicAndConservative();
  testAllEntriesHaveEvidenceAndControls();
  testCriticalFailureModesAreBoundToSafeDefaults();
  testDocsAndPackageScriptStayAligned();
  console.log(`Failure mode registry tests: ${passed} passed, 0 failed`);
} catch (error) {
  console.error('Failure mode registry tests failed:', error);
  process.exitCode = 1;
}
