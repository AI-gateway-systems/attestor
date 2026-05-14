import { strict as assert } from 'node:assert';
import {
  LEGACY_UNBOUNDED_CERTIFICATE_SUNSET_AT,
  issueCertificate,
  verifyCertificate,
  type AttestationCertificate,
  type CertificateInput,
} from '../src/signing/certificate.js';
import { generateKeyPair } from '../src/signing/keys.js';
import { canonicalize, signPayload } from '../src/signing/sign.js';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

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

function certInput(): CertificateInput {
  return {
    runIdentity: 'legacy-unbounded-validation-run',
    decision: 'pass',
    decisionSummary: 'Validation fixture for legacy certificate warning behavior.',
    warrant: { status: 'fulfilled', obligationsFulfilled: 1, obligationsTotal: 1 },
    escrow: { state: 'released' },
    receipt: { status: 'issued' },
    capsule: { authority: 'authorized' },
    evidenceChainRoot: 'sha256:legacy-root',
    evidenceChainTerminal: 'sha256:legacy-terminal',
    auditChainIntact: true,
    auditEntryCount: 1,
    sqlHash: 'sha256:legacy-sql',
    snapshotHash: 'sha256:legacy-snapshot',
    sqlGovernance: 'pass',
    policy: 'pass',
    guardrails: 'pass',
    dataContracts: 'pass',
    scorersRun: 1,
    reviewRequired: false,
    liveProofMode: 'offline_fixture',
    upstreamLive: false,
    executionLive: false,
    liveProofConsistent: true,
  };
}

function legacyUnboundedCertificate(
  certificate: AttestationCertificate,
  privateKeyPem: string,
): AttestationCertificate {
  const body = { ...certificate } as Record<string, unknown>;
  const originalSigning = certificate.signing;
  delete body.signing;
  delete body.notBefore;
  delete body.notAfter;
  return {
    ...body,
    signing: {
      ...originalSigning,
      signature: signPayload(canonicalize(body), privateKeyPem),
    },
  } as unknown as AttestationCertificate;
}

const keyPair = generateKeyPair();
const certificate = issueCertificate(certInput(), keyPair);
const legacy = legacyUnboundedCertificate(certificate, keyPair.privateKeyPem);

const rejected = verifyCertificate(legacy, keyPair.publicKeyPem);
equal(
  rejected.overall,
  'schema_error',
  'F5 legacy unbounded certificate: bounded validity remains required by default',
);
equal(
  rejected.warnings.length,
  0,
  'F5 legacy unbounded certificate: rejected legacy certificates do not emit acceptance warnings',
);

const accepted = verifyCertificate(legacy, keyPair.publicKeyPem, {
  allowLegacyUnbounded: true,
});
equal(
  accepted.overall,
  'valid',
  'F5 legacy unbounded certificate: explicit compatibility mode still verifies historical boundedness-free certificates',
);
equal(
  accepted.expiryBounded,
  false,
  'F5 legacy unbounded certificate: compatibility acceptance records missing validity bounds',
);
equal(
  accepted.warnings.length,
  1,
  'F5 legacy unbounded certificate: compatibility acceptance emits a structured warning',
);
equal(
  accepted.warnings[0]?.code,
  'legacy-unbounded-certificate-accepted',
  'F5 legacy unbounded certificate: warning code is machine-readable',
);
equal(
  accepted.warnings[0]?.sunsetAt,
  LEGACY_UNBOUNDED_CERTIFICATE_SUNSET_AT,
  'F5 legacy unbounded certificate: warning carries the sunset date',
);

const modern = verifyCertificate(certificate, keyPair.publicKeyPem, {
  allowLegacyUnbounded: true,
});
equal(
  modern.overall,
  'valid',
  'F5 legacy unbounded certificate: modern bounded certificates still verify',
);
equal(
  modern.warnings.length,
  0,
  'F5 legacy unbounded certificate: modern bounded certificates do not emit compatibility warnings',
);

const tracker = readFileSync(join(process.cwd(), 'docs', 'audit', 'attestor-audit-remediation-tracker.md'), 'utf8');
const validationDoc = readFileSync(join(process.cwd(), 'docs', 'audit', 'f5-legacy-unbounded-certificate-validation.md'), 'utf8');
includes(
  tracker,
  'F5-NEW-3 `allowLegacyUnbounded` escape hatch | `fixed`',
  'F5 legacy unbounded certificate: tracker marks F5-NEW-3 fixed',
);
includes(
  validationDoc,
  LEGACY_UNBOUNDED_CERTIFICATE_SUNSET_AT,
  'F5 legacy unbounded certificate: validation doc records the sunset date',
);
ok(
  validationDoc.includes('not a certification'),
  'F5 legacy unbounded certificate: validation doc avoids certification overclaiming',
);

console.log(`F5 legacy unbounded certificate validation tests: ${passed} passed, 0 failed`);
