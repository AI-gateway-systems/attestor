import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  consequenceDataMinimizationRedactionPolicyDescriptor,
  evaluateConsequenceDataMinimizationArtifact,
} from '../src/consequence-admission/index.js';

let passed = 0;

function ok(condition: unknown, message: string): void {
  assert.ok(condition, message);
  passed += 1;
}

function equal<T>(actual: T, expected: T, message: string): void {
  assert.equal(actual, expected, message);
  passed += 1;
}

function includes(value: string, expected: string, message: string): void {
  assert.ok(value.includes(expected), `${message}\nExpected to include: ${expected}`);
  passed += 1;
}

function readProjectFile(...segments: string[]): string {
  return readFileSync(join(process.cwd(), ...segments), 'utf8');
}

function testArtifactEvaluationRunsMaterialScanner(): void {
  const decision = evaluateConsequenceDataMinimizationArtifact({
    surfaceKind: 'admission-model-feedback',
    material: JSON.stringify({
      prompt: 'raw-model-prompt must stay out of model feedback',
      key: 'private_key must not be returned',
      rawPayloadStored: true,
    }),
  });

  equal(decision.allowed, false, 'F4 LLM02: unsafe material is blocked');
  equal(decision.failClosed, true, 'F4 LLM02: unsafe material fails closed');
  ok(
    decision.reasonCodes.includes('unsafe-material-detected'),
    'F4 LLM02: material scanner feeds artifact evaluation',
  );
  ok(
    decision.reasonCodes.includes('material-raw-payload-storage'),
    'F4 LLM02: raw payload storage inside material is detected',
  );
  ok(
    !decision.reasonCodes.some((reason) => reason.includes('private_key')),
    'F4 LLM02: reason codes do not echo sensitive marker text',
  );
}

function testProductionReadinessBoundaryRemainsExplicit(): void {
  const descriptor = consequenceDataMinimizationRedactionPolicyDescriptor();

  equal(descriptor.productionReady, false, 'F4 LLM02: repo policy does not claim production readiness');
  equal(descriptor.rawPayloadStored, false, 'F4 LLM02: policy remains raw-payload-free');
  equal(descriptor.rawOverrideSupported, false, 'F4 LLM02: raw override remains unsupported');
}

function testDocsTrackerAndPackageStayAligned(): void {
  const validationDoc = readProjectFile('docs', 'audit', 'f4-data-minimization-scanning-readiness-validation.md');
  const architectureDoc = readProjectFile('docs', '02-architecture', 'data-minimization-redaction-policy.md');
  const tracker = readProjectFile('docs', 'audit', 'attestor-audit-remediation-tracker.md');
  const packageJson = JSON.parse(readProjectFile('package.json')) as {
    readonly scripts: Record<string, string>;
  };

  includes(validationDoc, 'F4-LLM02-A: repository-side `fixed`', 'F4 LLM02 doc: scanning fix is explicit');
  includes(validationDoc, 'F4-LLM02-B: `accepted-limitation`', 'F4 LLM02 doc: production boundary is explicit');
  includes(
    architectureDoc,
    'central material scanner',
    'F4 LLM02 architecture doc: evaluator scanner behavior is documented',
  );
  includes(
    tracker,
    'F4-LLM02-A data-minimization evaluation operator-driven | `fixed`',
    'Tracker: F4-LLM02-A is fixed',
  );
  includes(
    tracker,
    'F4-LLM02-B redaction policy not activated as an enforcement claim | `accepted-limitation`',
    'Tracker: F4-LLM02-B is accepted limitation',
  );
  equal(
    packageJson.scripts['test:f4-data-minimization-scanning-readiness-validation'],
    'tsx tests/f4-data-minimization-scanning-readiness-validation.test.ts',
    'Package: F4 data minimization validation script is exposed',
  );
}

try {
  testArtifactEvaluationRunsMaterialScanner();
  testProductionReadinessBoundaryRemainsExplicit();
  testDocsTrackerAndPackageStayAligned();
  console.log(`F4 data minimization scanning readiness validation tests: ${passed} passed, 0 failed`);
} catch (error) {
  console.error('F4 data minimization scanning readiness validation tests failed:', error);
  process.exitCode = 1;
}
