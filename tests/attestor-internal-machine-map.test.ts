import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  CONSEQUENCE_TYPES,
  RELEASE_DECISION_STATUSES,
  RELEASE_DECISION_TERMINAL_STATUSES,
  RISK_CLASSES,
} from '../src/release-kernel/types.js';
import {
  DETERMINISTIC_CONTROL_CATEGORIES,
} from '../src/release-kernel/risk-controls.js';
import {
  CONSEQUENCE_ADMISSION_CHECK_KINDS,
  CONSEQUENCE_ADMISSION_DECISIONS,
  GENERIC_ADMISSION_MODES,
  GENERIC_ADMISSION_SHADOW_DECISIONS,
} from '../src/consequence-admission/index.js';
import {
  CONSEQUENCE_ADMISSION_DOMAINS,
} from '../src/consequence-admission/taxonomy.js';
import {
  CONSEQUENCE_DATA_MINIMIZATION_FORBIDDEN_RAW_CLASSES,
  CONSEQUENCE_DATA_MINIMIZATION_SURFACE_KINDS,
} from '../src/consequence-admission/data-minimization-redaction-policy.js';
import {
  CONSEQUENCE_FAILURE_MODE_IDS,
} from '../src/consequence-admission/failure-mode-registry.js';
import {
  ENFORCEMENT_BOUNDARY_KINDS,
  ENFORCEMENT_FAILURE_REASONS,
  ENFORCEMENT_OUTCOMES,
  ENFORCEMENT_POINT_KINDS,
  ENFORCEMENT_VERIFICATION_MODES,
  RELEASE_PRESENTATION_MODES,
} from '../src/release-enforcement-plane/types.js';

let passed = 0;

function readProjectFile(...segments: string[]): string {
  return readFileSync(join(process.cwd(), ...segments), 'utf8');
}

function includes(content: string, expected: string, message: string): void {
  assert.ok(
    content.includes(expected),
    `${message}\nExpected to find: ${expected}`,
  );
  passed += 1;
}

function countLine(label: string, count: number): string {
  return `| ${label} | ${count} |`;
}

function testMachineMapExistsAndNamesTheCoreShape(): void {
  const doc = readProjectFile('docs', '02-architecture', 'attestor-internal-machine-map.md');

  includes(doc, '# Attestor Internal Machine Map', 'Machine map: document exists');
  includes(doc, 'release PDP -> admission PDP -> enforcement PEP', 'Machine map: core shape is explicit');
  includes(doc, '## Whole-System Diagram', 'Machine map: whole-system diagram is present');
  includes(doc, '## The Ten Decision Axes', 'Machine map: decision axes section is present');
  includes(doc, '## Axis Fan-Out / Fan-In', 'Machine map: fan-out/fan-in diagram is present');
  includes(doc, '## Result Emergence', 'Machine map: result emergence section is present');

  for (const axis of [
    '| Time |',
    '| Identity |',
    '| Content |',
    '| Evidence |',
    '| Risk |',
    '| Scope / intent |',
    '| Rollout |',
    '| Consequence |',
    '| Human |',
    '| Cryptography |',
  ]) {
    includes(doc, axis, `Machine map: axis row ${axis} exists`);
  }
}

function testMachineMapCountsStayAlignedWithSourceConstants(): void {
  const doc = readProjectFile('docs', '02-architecture', 'attestor-internal-machine-map.md');

  for (const [label, count] of [
    ['Release consequence types', CONSEQUENCE_TYPES.length],
    ['Risk classes', RISK_CLASSES.length],
    ['Release decision statuses', RELEASE_DECISION_STATUSES.length],
    ['Terminal release statuses', RELEASE_DECISION_TERMINAL_STATUSES.length],
    ['Deterministic control categories', DETERMINISTIC_CONTROL_CATEGORIES.length],
    ['Admission decisions', CONSEQUENCE_ADMISSION_DECISIONS.length],
    ['Generic admission modes', GENERIC_ADMISSION_MODES.length],
    ['Generic shadow decisions', GENERIC_ADMISSION_SHADOW_DECISIONS.length],
    ['Consequence admission checks', CONSEQUENCE_ADMISSION_CHECK_KINDS.length],
    ['Consequence admission domains', CONSEQUENCE_ADMISSION_DOMAINS.length],
    ['Data minimization surfaces', CONSEQUENCE_DATA_MINIMIZATION_SURFACE_KINDS.length],
    ['Forbidden raw data classes', CONSEQUENCE_DATA_MINIMIZATION_FORBIDDEN_RAW_CLASSES.length],
    ['Failure modes', CONSEQUENCE_FAILURE_MODE_IDS.length],
    ['Enforcement point kinds', ENFORCEMENT_POINT_KINDS.length],
    ['Enforcement boundary kinds', ENFORCEMENT_BOUNDARY_KINDS.length],
    ['Enforcement verification modes', ENFORCEMENT_VERIFICATION_MODES.length],
    ['Release presentation modes', RELEASE_PRESENTATION_MODES.length],
    ['Enforcement outcomes', ENFORCEMENT_OUTCOMES.length],
    ['Enforcement failure reasons', ENFORCEMENT_FAILURE_REASONS.length],
  ] as const) {
    includes(doc, countLine(label, count), `Machine map: count for ${label} is current`);
  }

  includes(doc, '| Release rollout modes | 4 |', 'Machine map: rollout mode count is recorded');
  includes(doc, '| Release rollout reasons | 6 |', 'Machine map: rollout reason count is recorded');
  includes(doc, '| Public package entrypoints | 9 |', 'Machine map: package entrypoint count is recorded');
}

function testMachineMapLinksAndFolderViewArePresent(): void {
  const doc = readProjectFile('docs', '02-architecture', 'attestor-internal-machine-map.md');
  const overview = readProjectFile('docs', '02-architecture', 'system-overview.md');
  const packageJson = JSON.parse(readProjectFile('package.json')) as {
    readonly scripts: Readonly<Record<string, string>>;
  };

  for (const expected of [
    'src/release-kernel/*',
    'src/release-policy-control-plane/*',
    'src/consequence-admission/index.ts',
    'src/release-enforcement-plane/*',
    'src/consequence-admission/customer-gate.ts',
    'src/crypto-execution-admission/*',
    'src/service/*',
    'src/consequence-admission/policy-foundry-*.ts',
  ]) {
    includes(doc, expected, `Machine map: source area ${expected} is mapped`);
  }

  includes(
    overview,
    '[Attestor internal machine map](attestor-internal-machine-map.md)',
    'Machine map: system overview links the raw structure map',
  );
  assert.equal(
    packageJson.scripts['test:attestor-internal-machine-map'],
    'tsx tests/attestor-internal-machine-map.test.ts',
    'Machine map: package script is registered',
  );
  passed += 1;
}

testMachineMapExistsAndNamesTheCoreShape();
testMachineMapCountsStayAlignedWithSourceConstants();
testMachineMapLinksAndFolderViewArePresent();

console.log(`Attestor internal machine map tests: ${passed} passed, 0 failed`);
