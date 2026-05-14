import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  evaluateConsequenceApprovalProvenance,
  evaluateConsequenceToolResultPoisoning,
} from '../src/consequence-admission/index.js';
import {
  issueCertificate,
  type CertificateInput,
} from '../src/signing/certificate.js';
import { generatePkiHierarchy } from '../src/signing/pki-chain.js';
import type { VerifyPkiBoundCertificateInput } from '../src/signing/verification-trust-binding.js';

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

function digest(seed: string): string {
  return `sha256:${seed.repeat(64).slice(0, 64)}`;
}

function certificateInput(): CertificateInput {
  return {
    runIdentity: 'run_f4_pki_trust_class_test',
    decision: 'pass',
    decisionSummary: 'F4 trust class PKI test accepted.',
    warrant: { status: 'fulfilled', obligationsFulfilled: 1, obligationsTotal: 1 },
    escrow: { state: 'released' },
    receipt: { status: 'issued' },
    capsule: { authority: 'valid' },
    evidenceChainRoot: 'root_f4_pki_trust_class_test',
    evidenceChainTerminal: 'terminal_f4_pki_trust_class_test',
    auditChainIntact: true,
    auditEntryCount: 1,
    sqlHash: 'sql_hash_f4_pki_trust_class_test',
    snapshotHash: 'snapshot_hash_f4_pki_trust_class_test',
    sqlGovernance: 'pass',
    policy: 'pass',
    guardrails: 'pass',
    dataContracts: 'pass',
    scorersRun: 1,
    reviewRequired: false,
    liveProofMode: 'live_runtime',
    upstreamLive: true,
    executionLive: true,
    liveProofConsistent: true,
  };
}

function pkiInput(): VerifyPkiBoundCertificateInput {
  const pki = generatePkiHierarchy('F4 Trust Class CA', 'F4 Trust Class Signer', 'F4 Trust Class Reviewer');
  return {
    certificate: issueCertificate(certificateInput(), pki.signer.keyPair),
    publicKeyPem: pki.signer.keyPair.publicKeyPem,
    trustChain: pki.chains.signer,
    caPublicKeyPem: pki.ca.keyPair.publicKeyPem,
    trustedCaFingerprint: pki.ca.certificate.fingerprint,
  };
}

function testSignedAttestationCannotPassWithBooleanOnly(): void {
  const decision = evaluateConsequenceToolResultPoisoning({
    generatedAt: '2026-05-14T06:00:00.000Z',
    actionSurface: 'support.refund',
    action: 'issue-refund',
    allowedEvidenceClasses: ['payment-record'],
    toolResults: [
      {
        toolResultRef: 'signed-attestation:payment-private-ref',
        toolKind: 'provider-api',
        sourceTrustClass: 'signed-attestation',
        resultUse: 'evidence',
        sourceRef: 'payments.private-ref',
        sourceTimestamp: '2026-05-14T05:59:00.000Z',
        integrityDigest: digest('a'),
        evidenceDigest: digest('b'),
        evidenceClass: 'payment-record',
        signatureVerified: true,
      },
    ],
  });

  equal(decision.outcome, 'review', 'F4 trust class: boolean-only signed attestation reviews');
  ok(
    decision.reasonCodes.includes('tool-result-signature-unverified'),
    'F4 trust class: boolean-only signed attestation is not verified',
  );
  equal(decision.observedResults[0]?.pkiVerified, false, 'F4 trust class: PKI is false without input');
}

function testSignedAttestationCanPassWithPkiProof(): void {
  const decision = evaluateConsequenceToolResultPoisoning({
    generatedAt: '2026-05-14T06:01:00.000Z',
    actionSurface: 'support.refund',
    action: 'issue-refund',
    allowedEvidenceClasses: ['payment-record'],
    toolResults: [
      {
        toolResultRef: 'signed-attestation:payment-private-ref',
        toolKind: 'provider-api',
        sourceTrustClass: 'signed-attestation',
        resultUse: 'evidence',
        sourceRef: 'payments.private-ref',
        sourceTimestamp: '2026-05-14T06:00:00.000Z',
        integrityDigest: digest('c'),
        evidenceDigest: digest('d'),
        evidenceClass: 'payment-record',
        signatureVerificationInput: pkiInput(),
      },
    ],
  });

  equal(decision.outcome, 'pass', 'F4 trust class: PKI-bound signed attestation passes');
  equal(decision.observedResults[0]?.signatureVerified, true, 'F4 trust class: signature is derived from PKI proof');
  equal(decision.observedResults[0]?.pkiVerified, true, 'F4 trust class: PKI proof is recorded');
}

function testSignedAuthorityCannotPassWithBooleanOnly(): void {
  const decision = evaluateConsequenceApprovalProvenance({
    generatedAt: '2026-05-14T06:02:00.000Z',
    actionSurface: 'release.r4',
    action: 'issue-token',
    approvals: [
      {
        approvalRef: 'signed-approval:private-ref',
        sourceKind: 'signed-approval',
        state: 'approved',
        sourceRef: 'approval.private-ref',
        reviewerRef: 'reviewer:risk-owner',
        reviewerAuthorityDigest: digest('e'),
        approvalDigest: digest('f'),
        scopeDigest: digest('1'),
        issuedAt: '2026-05-14T06:01:00.000Z',
        signatureVerified: true,
      },
    ],
  });

  equal(decision.outcome, 'review', 'F4 trust class: boolean-only signed authority reviews');
  ok(
    decision.reasonCodes.includes('approval-signature-unverified'),
    'F4 trust class: boolean-only signed authority is not verified',
  );
  equal(decision.observedApprovals[0]?.pkiVerified, false, 'F4 trust class: approval PKI is false without input');
}

function testSignedAuthorityCanPassWithPkiProof(): void {
  const decision = evaluateConsequenceApprovalProvenance({
    generatedAt: '2026-05-14T06:03:00.000Z',
    actionSurface: 'release.r4',
    action: 'issue-token',
    approvals: [
      {
        approvalRef: 'signed-approval:private-ref',
        sourceKind: 'signed-approval',
        state: 'approved',
        sourceRef: 'approval.private-ref',
        reviewerRef: 'reviewer:risk-owner',
        reviewerAuthorityDigest: digest('2'),
        approvalDigest: digest('3'),
        scopeDigest: digest('4'),
        issuedAt: '2026-05-14T06:02:00.000Z',
        signatureVerificationInput: pkiInput(),
      },
    ],
  });

  equal(decision.outcome, 'pass', 'F4 trust class: PKI-bound signed authority passes');
  equal(decision.observedApprovals[0]?.signatureVerified, true, 'F4 trust class: approval signature is derived from PKI proof');
  equal(decision.observedApprovals[0]?.pkiVerified, true, 'F4 trust class: approval PKI proof is recorded');
}

function testDocsTrackerAndPackageStayAligned(): void {
  const validationDoc = readProjectFile('docs', 'audit', 'f4-trust-class-pki-proof-validation.md');
  const tracker = readProjectFile('docs', 'audit', 'attestor-audit-remediation-tracker.md');
  const packageJson = readProjectFile('package.json');

  includes(validationDoc, 'Status: repository-side `fixed`', 'F4 trust class doc: fixed status is explicit');
  includes(validationDoc, 'verifyPkiBoundCertificate', 'F4 trust class doc: PKI verifier is named');
  includes(tracker, 'F4-LLM01-A indirect prompt injection via operator-asserted trust class | `fixed`', 'Tracker: F4-LLM01-A is fixed');
  includes(tracker, 'test:f4-trust-class-pki-proof-validation', 'Tracker: F4 focused test is referenced');
  includes(packageJson, '"test:f4-trust-class-pki-proof-validation"', 'Package: F4 focused test script is exposed');
}

try {
  testSignedAttestationCannotPassWithBooleanOnly();
  testSignedAttestationCanPassWithPkiProof();
  testSignedAuthorityCannotPassWithBooleanOnly();
  testSignedAuthorityCanPassWithPkiProof();
  testDocsTrackerAndPackageStayAligned();
  console.log(`F4 trust class PKI proof validation tests: ${passed} passed, 0 failed`);
} catch (error) {
  console.error('F4 trust class PKI proof validation tests failed:', error);
  process.exitCode = 1;
}
