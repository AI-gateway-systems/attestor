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

function includes(value: string, expected: string, message: string): void {
  assert.ok(value.includes(expected), `${message}\nExpected to find: ${expected}`);
  passed += 1;
}

const stableRuntimeSignalModules = [
  'runtime-signal-envelope',
  'runtime-signal-authority-guard',
  'runtime-signal-source-binding',
  'runtime-signal-normalizer',
  'runtime-signal-consequence-mapping',
  'action-surface-auto-context',
  'runtime-signal-integration-readiness-bridge',
  'runtime-signal-review-packet',
  'runtime-signal-proof-intake',
] as const;

const stableRuntimeSignalProbeMarkers = [
  'RUNTIME_SIGNAL_ENVELOPE_VERSION',
  'createRuntimeSignalEnvelope',
  'RUNTIME_SIGNAL_AUTHORITY_GUARD_VERSION',
  'assertRuntimeSignalAuthorityBoundary',
  'RUNTIME_SIGNAL_SOURCE_BINDING_VERSION',
  'createRuntimeSignalSourceBinding',
  'RUNTIME_SIGNAL_NORMALIZER_VERSION',
  'normalizeRuntimeSignal',
  'RUNTIME_SIGNAL_CONSEQUENCE_MAPPING_VERSION',
  'mapRuntimeSignalToConsequenceCandidate',
  'ACTION_SURFACE_RUNTIME_SIGNAL_BRIDGE_VERSION',
  'runtimeSignalEnvelopeToActionSurfaceAutoContextSignal',
  'RUNTIME_SIGNAL_INTEGRATION_READINESS_BRIDGE_VERSION',
  'createRuntimeSignalIntegrationReadinessBridge',
  'RUNTIME_SIGNAL_REVIEW_PACKET_VERSION',
  'createRuntimeSignalReviewPacket',
  'RUNTIME_SIGNAL_PROOF_INTAKE_VERSION',
  'createRuntimeSignalProofIntake',
] as const;

function testRuntimeSignalModulesUseCuratedConsequenceAdmissionSurface(): void {
  const publicSurface = readProjectFile(
    'src',
    'consequence-admission',
    'public-surface.ts',
  );
  const index = readProjectFile('src', 'consequence-admission', 'index.ts');

  includes(
    index,
    "export * from './public-surface.js';",
    'Runtime signal public surface: consequence-admission index delegates to public-surface',
  );
  for (const moduleName of stableRuntimeSignalModules) {
    includes(
      publicSurface,
      `export * from './${moduleName}.js';`,
      `Runtime signal public surface: ${moduleName} is exported through the curated catalogue`,
    );
  }
}

function testPackageExportMapDoesNotExposeRuntimeSignalDeepImports(): void {
  const packageJson = JSON.parse(readProjectFile('package.json')) as {
    readonly exports: Readonly<Record<string, { readonly types: string; readonly default: string }>>;
  };

  equal(
    packageJson.exports['./consequence-admission'].default,
    './dist/consequence-admission/index.js',
    'Runtime signal public surface: consequence-admission subpath resolves through index.js',
  );
  equal(
    packageJson.exports['./consequence-admission'].types,
    './dist/consequence-admission/index.d.ts',
    'Runtime signal public surface: consequence-admission subpath types resolve through index.d.ts',
  );
  for (const moduleName of stableRuntimeSignalModules) {
    ok(
      !Object.prototype.hasOwnProperty.call(
        packageJson.exports,
        `./consequence-admission/${moduleName}`,
      ),
      `Runtime signal public surface: ${moduleName} has no package deep-import subpath`,
    );
  }
}

function testPackageProbeCoversStableRuntimeSignalContracts(): void {
  const probe = readProjectFile(
    'scripts',
    'probe',
    'probe-consequence-admission-package-surface.mjs',
  );
  const deepImportProbe = readProjectFile(
    'scripts',
    'probe',
    'consequence-admission-package-surface',
    'surface-07.mjs',
  );

  for (const marker of stableRuntimeSignalProbeMarkers) {
    includes(
      probe,
      marker,
      `Runtime signal public surface: package probe covers ${marker}`,
    );
  }
  for (const moduleName of stableRuntimeSignalModules) {
    includes(
      deepImportProbe,
      `attestor/consequence-admission/${moduleName}.js`,
      `Runtime signal public surface: package probe blocks ${moduleName} deep import`,
    );
  }
}

function testDocsPackageAndNoOverclaimBoundaryStayAligned(): void {
  const doc = readProjectFile(
    'docs',
    '02-architecture',
    'runtime-signal-handling.md',
  );
  const packageJson = JSON.parse(readProjectFile('package.json')) as {
    readonly scripts: Readonly<Record<string, string>>;
  };

  includes(doc, 'RS11 Public Package Surface', 'Runtime signal public surface: architecture note names RS11');
  includes(doc, '`attestor/consequence-admission`', 'Runtime signal public surface: architecture note names the stable import path');
  includes(doc, 'deep module paths remain private', 'Runtime signal public surface: architecture note names deep-import boundary');
  includes(doc, 'Node.js package exports', 'Runtime signal public surface: Node.js export-map anchor is present');
  includes(doc, 'TypeScript module resolution', 'Runtime signal public surface: TypeScript module-resolution anchor is present');
  equal(
    packageJson.scripts['test:runtime-signal-public-surface'],
    'tsx tests/runtime-signal-public-surface.test.ts',
    'Runtime signal public surface: package script is registered',
  );
}

testRuntimeSignalModulesUseCuratedConsequenceAdmissionSurface();
testPackageExportMapDoesNotExposeRuntimeSignalDeepImports();
testPackageProbeCoversStableRuntimeSignalContracts();
testDocsPackageAndNoOverclaimBoundaryStayAligned();

console.log(`Runtime signal public surface tests: ${passed} passed, 0 failed`);
