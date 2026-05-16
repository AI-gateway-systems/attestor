import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
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
  includes(doc, '## One-Picture Internal Map', 'Machine map: one-picture diagram section is present');
  includes(doc, '## The Ten Decision Axes', 'Machine map: decision axes section is present');
  includes(doc, '## Axis Fan-Out / Fan-In', 'Machine map: fan-out/fan-in section is present');
  includes(doc, '## Result Emergence', 'Machine map: result emergence section is present');

  const mermaidBlocks = doc.match(/```mermaid/g) ?? [];
  assert.equal(
    mermaidBlocks.length,
    1,
    'Machine map: document keeps the visual representation in one Mermaid picture',
  );
  passed += 1;

  for (const expected of [
    'Callers and proposed consequences',
    'Service ingress and tenant runtime',
    'Core route group',
    'Public site and proof route group',
    'Auth and account route group',
    'Admin and operator route group',
    'Pipeline route group',
    'Admission and shadow route group',
    'Webhook route group',
    'Ten decision axes applied to the same candidate',
    'Policy control plane and authority material',
    'Release PDP',
    'Domain packs projected into the shared machine',
    'Admission PDP',
    'Enforcement PEP and customer gate',
    'Shared storage, audit, and redaction surfaces',
    'Shared support and non-decision surfaces',
    'Shadow-to-policy side loop',
    'Terminal outcomes',
  ]) {
    includes(doc, expected, `Machine map: one-picture map includes ${expected}`);
  }

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

function testMachineMapNamesEveryTopLevelSourceDirectory(): void {
  const doc = readProjectFile('docs', '02-architecture', 'attestor-internal-machine-map.md');
  const sourceRoot = join(process.cwd(), 'src');
  const sourceDirectories = readdirSync(sourceRoot)
    .filter((entry) => statSync(join(sourceRoot, entry)).isDirectory())
    .sort((left, right) => left.localeCompare(right));

  for (const directory of sourceDirectories) {
    includes(
      doc,
      `src/${directory}`,
      `Machine map: top-level source directory src/${directory} is named`,
    );
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
testMachineMapNamesEveryTopLevelSourceDirectory();
testMachineMapCountsStayAlignedWithSourceConstants();
testMachineMapLinksAndFolderViewArePresent();

console.log(`Attestor internal machine map tests: ${passed} passed, 0 failed`);
