import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  configureReleaseRuntimeKeylessCa,
  createKeylessSigner,
  resetKeylessCa,
} from '../src/signing/keyless-signer.js';
import { generatePkiHierarchy } from '../src/signing/pki-chain.js';

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

function excludes(value: string, unexpected: string, message: string): void {
  assert.equal(value.includes(unexpected), false, `${message}\nUnexpected: ${unexpected}`);
  passed += 1;
}

function readProjectFile(...segments: string[]): string {
  return readFileSync(join(process.cwd(), ...segments), 'utf8');
}

try {
  const keylessSource = readProjectFile('src', 'signing', 'keyless-signer.ts');
  const releaseRuntimeSource = readProjectFile('src', 'service', 'bootstrap', 'release-runtime.ts');
  const packageJson = readProjectFile('package.json');
  const tracker = readProjectFile('docs', 'audit', 'attestor-audit-remediation-tracker.md');

  excludes(keylessSource, 'export function setKeylessCa', 'F5-A7: generic setKeylessCa export is removed');
  includes(
    keylessSource,
    'export function configureReleaseRuntimeKeylessCa',
    'F5-A7: release-runtime CA configuration boundary is explicit',
  );
  includes(
    keylessSource,
    'Refusing to replace configured keyless CA',
    'F5-A7: in-process replacement of a different CA is guarded',
  );
  includes(
    releaseRuntimeSource,
    'configureReleaseRuntimeKeylessCa(pki.ca,',
    'F5-A7: release runtime uses the explicit CA configuration boundary',
  );
  excludes(packageJson, './signing/keyless-signer', 'F5-A7: keyless signer internals are not public package exports');

  resetKeylessCa();
  const first = generatePkiHierarchy('Runtime CA', 'Runtime Signer', 'Runtime Reviewer');
  const configured = configureReleaseRuntimeKeylessCa(first.ca);
  equal(configured.source, 'release-runtime-bootstrap', 'F5-A7: configuration source is explicit');
  equal(configured.caFingerprint, first.ca.certificate.fingerprint, 'F5-A7: configured CA fingerprint is reported');
  equal(configured.alreadyConfigured, false, 'F5-A7: first configuration is not marked idempotent');
  equal(configured.replacedExisting, false, 'F5-A7: first configuration does not replace an existing CA');

  const idempotent = configureReleaseRuntimeKeylessCa(first.ca);
  equal(idempotent.alreadyConfigured, true, 'F5-A7: repeat configuration of the same CA is idempotent');

  const signer = createKeylessSigner({
    subject: 'Runtime',
    role: 'runtime_signer',
    source: 'ephemeral',
    identifier: 'runtime',
  });
  equal(signer.caPublicKeyPem, first.ca.keyPair.publicKeyPem, 'F5-A7: keyless signer uses the configured runtime CA');

  assert.throws(
    () => configureReleaseRuntimeKeylessCa({
      keyPair: first.ca.keyPair,
      certificate: { ...first.ca.certificate, fingerprint: 'bad-fingerprint' },
    }),
    /fingerprint mismatch/u,
    'F5-A7: CA fingerprint/key mismatch is rejected',
  );
  passed += 1;

  const second = generatePkiHierarchy('Second CA', 'Second Signer', 'Second Reviewer');
  assert.throws(
    () => configureReleaseRuntimeKeylessCa(second.ca),
    /Refusing to replace configured keyless CA/u,
    'F5-A7: different CA replacement is rejected without reset',
  );
  passed += 1;

  const replaced = configureReleaseRuntimeKeylessCa(second.ca, {
    allowReplace: true,
    replacementReason: 'release-runtime-bootstrap',
  });
  equal(replaced.replacedExisting, true, 'F5-A7: explicit release-runtime replacement is reported');
  equal(
    replaced.replacementReason,
    'release-runtime-bootstrap',
    'F5-A7: explicit release-runtime replacement carries a reason',
  );

  includes(tracker, 'F5-A7 module-level CA singleton / injection point | `fixed`', 'Tracker: F5-A7 is fixed');
  includes(tracker, 'F5-NEW-1 exported `setKeylessCa` runtime injection | `fixed`', 'Tracker: F5-NEW-1 is fixed');
  includes(tracker, 'F5 Keyless CA Injection Boundary Validation', 'Tracker: validation evidence is linked');

  console.log(`f5-keyless-ca-injection-boundary-validation.test.ts: ${passed} assertions passed`);
} finally {
  resetKeylessCa();
}
