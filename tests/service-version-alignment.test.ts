import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ATTESTOR_SERVICE_VERSION } from '../src/service/version.js';

let passed = 0;

function readProjectFile(...segments: string[]): string {
  return readFileSync(join(process.cwd(), ...segments), 'utf8');
}

function equal<T>(actual: T, expected: T, message: string): void {
  assert.equal(actual, expected, message);
  passed += 1;
}

function includes(content: string, expected: string, message: string): void {
  assert.ok(content.includes(expected), `${message}\nExpected to find: ${expected}`);
  passed += 1;
}

function excludes(content: string, forbidden: string, message: string): void {
  assert.ok(!content.includes(forbidden), `${message}\nUnexpected text: ${forbidden}`);
  passed += 1;
}

function testServiceVersionMatchesPackageVersion(): void {
  const packageJson = JSON.parse(readProjectFile('package.json')) as { version: string };
  const coreRoutes = readProjectFile('src', 'service', 'http', 'routes', 'core-routes.ts');
  const server = readProjectFile('src', 'service', 'bootstrap', 'server.ts');
  const observability = readProjectFile('src', 'service', 'observability.ts');

  equal(ATTESTOR_SERVICE_VERSION, packageJson.version, 'Service version: exported version matches package.json');
  includes(coreRoutes, 'version: serviceVersion', 'Service version: health route uses injected service version');
  excludes(coreRoutes, "version: '1.0.0'", 'Service version: health route is not hardcoded to 1.0.0');
  includes(server, 'initializeTelemetry(ATTESTOR_SERVICE_VERSION)', 'Service version: server telemetry uses service version');
  includes(observability, 'ATTESTOR_SERVICE_VERSION', 'Service version: observability defaults use shared version');
}

testServiceVersionMatchesPackageVersion();

console.log(`Service version alignment tests: ${passed} passed, 0 failed`);
