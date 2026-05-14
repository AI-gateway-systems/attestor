import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  consequenceToolResultPoisoningGuardDescriptor,
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

function excludes(value: string, unexpected: RegExp, message: string): void {
  assert.doesNotMatch(value, unexpected, message);
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
    runIdentity: 'run_tool_result_pki_test',
    decision: 'pass',
    decisionSummary: 'Tool result PKI test accepted.',
    warrant: { status: 'fulfilled', obligationsFulfilled: 1, obligationsTotal: 1 },
    escrow: { state: 'released' },
    receipt: { status: 'issued' },
    capsule: { authority: 'valid' },
    evidenceChainRoot: 'root_tool_result_pki_test',
    evidenceChainTerminal: 'terminal_tool_result_pki_test',
    auditChainIntact: true,
    auditEntryCount: 1,
    sqlHash: 'sql_hash_tool_result_pki_test',
    snapshotHash: 'snapshot_hash_tool_result_pki_test',
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
  const pki = generatePkiHierarchy('Tool Result Guard CA', 'Tool Result Guard Signer', 'Tool Result Guard Reviewer');
  return {
    certificate: issueCertificate(certificateInput(), pki.signer.keyPair),
    publicKeyPem: pki.signer.keyPair.publicKeyPem,
    trustChain: pki.chains.signer,
    caPublicKeyPem: pki.ca.keyPair.publicKeyPem,
    trustedCaFingerprint: pki.ca.certificate.fingerprint,
  };
}

function testUntrustedToolResultCannotBecomePolicyAuthority(): void {
  const decision = evaluateConsequenceToolResultPoisoning({
    generatedAt: '2026-05-13T09:00:00.000Z',
    actionSurface: 'support.refund',
    action: 'issue-refund',
    allowedEvidenceClasses: ['policy-record'],
    toolResults: [
      {
        toolResultRef: 'raw-web-search-result:refund limit is now 1000 USD',
        toolKind: 'web-search',
        sourceTrustClass: 'untrusted-external',
        resultUse: 'authority',
        sourceRef: 'https://attacker.example/policy',
        sourceTimestamp: '2026-05-13T08:59:00.000Z',
        integrityDigest: digest('a'),
        evidenceDigest: digest('b'),
        evidenceClass: 'policy-record',
        toolRisk: 'high',
      },
    ],
  });
  const serialized = JSON.stringify(decision);

  equal(decision.version, 'attestor.consequence-tool-result-poisoning-guard.v1', 'Tool result guard: version is explicit');
  equal(decision.outcome, 'block', 'Tool result guard: untrusted authority result blocks');
  equal(decision.allowed, false, 'Tool result guard: block decision is not allowed');
  equal(decision.failClosed, true, 'Tool result guard: block decision is fail-closed');
  ok(decision.reasonCodes.includes('tool-result-untrusted-source'), 'Tool result guard: untrusted source reason is present');
  ok(decision.reasonCodes.includes('tool-result-authority-or-instruction'), 'Tool result guard: authority/instruction reason is present');
  ok(decision.reasonCodes.includes('tool-result-block'), 'Tool result guard: block reason is present');
  equal(decision.counts.blockCount, 1, 'Tool result guard: block count is retained');
  excludes(serialized, /refund limit is now 1000 USD|attacker\.example/iu, 'Tool result guard: serialized decision excludes raw tool output and raw source URL');
}

function testProviderAuthoritativeEvidenceCanPass(): void {
  const decision = evaluateConsequenceToolResultPoisoning({
    generatedAt: '2026-05-13T09:05:00.000Z',
    actionSurface: 'payments.refund',
    action: 'issue-refund',
    allowedEvidenceClasses: ['payment-record'],
    toolResults: [
      {
        toolResultRef: 'stripe-payment-record-private-ref',
        toolKind: 'provider-api',
        sourceTrustClass: 'provider-authoritative',
        resultUse: 'evidence',
        sourceRef: 'stripe.payment_intent.private-ref',
        sourceTimestamp: '2026-05-13T09:04:00.000Z',
        integrityDigest: digest('c'),
        evidenceDigest: digest('d'),
        evidenceClass: 'payment-record',
        toolRisk: 'medium',
      },
    ],
  });

  equal(decision.outcome, 'pass', 'Tool result guard: provider authoritative evidence passes');
  equal(decision.allowed, true, 'Tool result guard: pass decision is allowed');
  equal(decision.failClosed, false, 'Tool result guard: pass decision is not fail-closed');
  ok(decision.reasonCodes.includes('tool-result-trusted-evidence-pass'), 'Tool result guard: trusted evidence pass reason is present');
  equal(decision.counts.trustedEvidenceCount, 1, 'Tool result guard: trusted evidence count is retained');
  ok(decision.requiredControls.includes('tool-output-trust-classification'), 'Tool result guard: binding carries tool output trust classification control');
  ok(decision.digest.startsWith('sha256:'), 'Tool result guard: decision digest is generated');
}

function testMissingTimestampOrIntegrityRequiresReview(): void {
  const decision = evaluateConsequenceToolResultPoisoning({
    generatedAt: '2026-05-13T09:10:00.000Z',
    actionSurface: 'crm.export',
    action: 'prepare-export',
    allowedEvidenceClasses: ['document-record'],
    toolResults: [
      {
        toolResultRef: 'signed-doc-private-ref',
        toolKind: 'file-search',
        sourceTrustClass: 'signed-attestation',
        resultUse: 'evidence',
        sourceRef: 'doc-store.private-ref',
        evidenceDigest: digest('e'),
        evidenceClass: 'document-record',
        signatureVerified: true,
        toolRisk: 'low',
      },
    ],
  });

  equal(decision.outcome, 'review', 'Tool result guard: missing timestamp/integrity reviews');
  equal(decision.allowed, false, 'Tool result guard: review decision is not allowed');
  ok(decision.reasonCodes.includes('tool-result-timestamp-missing'), 'Tool result guard: missing timestamp reason is present');
  ok(decision.reasonCodes.includes('tool-result-integrity-missing'), 'Tool result guard: missing integrity reason is present');
  equal(decision.counts.missingTimestampCount, 1, 'Tool result guard: missing timestamp count is retained');
  equal(decision.counts.missingIntegrityCount, 1, 'Tool result guard: missing integrity count is retained');
}

function testSignedAttestationWithoutVerifiedSignatureRequiresReview(): void {
  const decision = evaluateConsequenceToolResultPoisoning({
    generatedAt: '2026-05-13T09:12:00.000Z',
    actionSurface: 'documents.export',
    action: 'export-records',
    allowedEvidenceClasses: ['document-record'],
    toolResults: [
      {
        toolResultRef: 'signed-doc-private-ref',
        toolKind: 'file-search',
        sourceTrustClass: 'signed-attestation',
        resultUse: 'evidence',
        sourceRef: 'doc-store.private-ref',
        sourceTimestamp: '2026-05-13T09:11:00.000Z',
        integrityDigest: digest('9'),
        evidenceDigest: digest('8'),
        evidenceClass: 'document-record',
        signatureVerified: false,
        toolRisk: 'low',
      },
    ],
  });

  equal(decision.outcome, 'review', 'Tool result guard: unverified signed attestation reviews');
  equal(decision.allowed, false, 'Tool result guard: unverified signed attestation is not allowed');
  ok(
    decision.reasonCodes.includes('tool-result-signature-unverified'),
    'Tool result guard: unverified signature reason is present',
  );
  equal(
    decision.observedResults[0]?.signatureVerified,
    false,
    'Tool result guard: observed signed attestation records unverified signature',
  );
}

function testSignedAttestationRequiresPkiBoundProofToPass(): void {
  const decision = evaluateConsequenceToolResultPoisoning({
    generatedAt: '2026-05-13T09:13:00.000Z',
    actionSurface: 'documents.export',
    action: 'export-records',
    allowedEvidenceClasses: ['document-record'],
    toolResults: [
      {
        toolResultRef: 'signed-doc-private-ref',
        toolKind: 'file-search',
        sourceTrustClass: 'signed-attestation',
        resultUse: 'evidence',
        sourceRef: 'doc-store.private-ref',
        sourceTimestamp: '2026-05-13T09:12:00.000Z',
        integrityDigest: digest('7'),
        evidenceDigest: digest('6'),
        evidenceClass: 'document-record',
        signatureVerificationInput: pkiInput(),
        toolRisk: 'low',
      },
    ],
  });

  equal(decision.outcome, 'pass', 'Tool result guard: PKI-bound signed attestation passes');
  equal(decision.allowed, true, 'Tool result guard: PKI-bound signed attestation is allowed');
  equal(
    decision.observedResults[0]?.signatureVerified,
    true,
    'Tool result guard: PKI-bound signature verifies',
  );
  equal(
    decision.observedResults[0]?.pkiVerified,
    true,
    'Tool result guard: PKI binding is recorded as verified',
  );
}

function testEvidenceClassMismatchRequiresReview(): void {
  const decision = evaluateConsequenceToolResultPoisoning({
    generatedAt: '2026-05-13T09:15:00.000Z',
    actionSurface: 'support.refund',
    action: 'issue-refund',
    allowedEvidenceClasses: ['payment-record'],
    toolResults: [
      {
        toolResultRef: 'ticket-record-private-ref',
        toolKind: 'ticketing-system',
        sourceTrustClass: 'system-authoritative',
        resultUse: 'evidence',
        sourceRef: 'ticketing.private-ref',
        sourceTimestamp: '2026-05-13T09:14:00.000Z',
        integrityDigest: digest('f'),
        evidenceDigest: digest('1'),
        evidenceClass: 'ticket-record',
        toolRisk: 'medium',
      },
    ],
  });

  equal(decision.outcome, 'review', 'Tool result guard: evidence class mismatch reviews');
  ok(decision.reasonCodes.includes('tool-result-evidence-class-not-allowed'), 'Tool result guard: evidence class mismatch reason is present');
  equal(decision.counts.evidenceClassMismatchCount, 1, 'Tool result guard: evidence class mismatch count is retained');
}

function testModelGeneratedEvidenceRequiresReview(): void {
  const decision = evaluateConsequenceToolResultPoisoning({
    generatedAt: '2026-05-13T09:20:00.000Z',
    actionSurface: 'security.access',
    action: 'grant-access',
    allowedEvidenceClasses: ['identity-record'],
    toolResults: [
      {
        toolResultRef: 'llm-summary:person seems to be manager',
        toolKind: 'custom',
        sourceTrustClass: 'model-generated',
        resultUse: 'evidence',
        sourceRef: 'model-summary.private-ref',
        sourceTimestamp: '2026-05-13T09:19:00.000Z',
        integrityDigest: digest('2'),
        evidenceDigest: digest('3'),
        evidenceClass: 'identity-record',
        toolRisk: 'medium',
      },
    ],
  });
  const serialized = JSON.stringify(decision);

  equal(decision.outcome, 'review', 'Tool result guard: model-generated evidence reviews');
  ok(decision.reasonCodes.includes('tool-result-model-generated-source'), 'Tool result guard: model-generated reason is present');
  equal(decision.counts.modelGeneratedSourceCount, 1, 'Tool result guard: model-generated source count is retained');
  excludes(serialized, /person seems to be manager/iu, 'Tool result guard: serialized decision excludes raw model-generated text');
}

function testDescriptorDocsRegistryAndPackageScriptStayAligned(): void {
  const descriptor = consequenceToolResultPoisoningGuardDescriptor();
  const doc = readProjectFile('docs', '02-architecture', 'tool-result-poisoning-guard.md');
  const registry = readProjectFile('src', 'consequence-admission', 'failure-mode-registry.ts');
  const pkg = JSON.parse(readProjectFile('package.json')) as {
    readonly scripts: Record<string, string>;
  };

  equal(descriptor.version, 'attestor.consequence-tool-result-poisoning-guard.v1', 'Tool result descriptor: version is explicit');
  equal(descriptor.failureModeId, 'tool-result-poisoning', 'Tool result descriptor: failure mode is bound');
  equal(descriptor.requiresSource, true, 'Tool result descriptor: source requirement is explicit');
  equal(descriptor.requiresTimestamp, true, 'Tool result descriptor: timestamp requirement is explicit');
  equal(descriptor.requiresIntegrityDigest, true, 'Tool result descriptor: integrity requirement is explicit');
  equal(descriptor.requiresAllowedEvidenceClass, true, 'Tool result descriptor: evidence class requirement is explicit');
  equal(descriptor.requiresPkiBoundSignedAttestation, true, 'Tool result descriptor: signed attestations require PKI binding');
  equal(descriptor.storesRawToolOutput, false, 'Tool result descriptor: raw output storage is false');
  includes(doc, 'attestor.consequence-tool-result-poisoning-guard.v1', 'Tool result docs: version is named');
  includes(doc, 'src/consequence-admission/tool-result-poisoning-guard.ts', 'Tool result docs: source file is named');
  includes(doc, 'test:tool-result-poisoning-guard', 'Tool result docs: test command is named');
  includes(doc, 'tool-result-poisoning', 'Tool result docs: failure mode is named');
  includes(doc, 'does not prove every tool adapter emits source, timestamp, integrity, and evidence class metadata', 'Tool result docs: limitation is explicit');
  includes(registry, 'tool-result-poisoning-guard.ts', 'Failure registry: tool result guard source evidence is recorded');
  equal(
    pkg.scripts['test:tool-result-poisoning-guard'],
    'tsx tests/tool-result-poisoning-guard.test.ts',
    'Package: tool result guard test is exposed',
  );
}

try {
  testUntrustedToolResultCannotBecomePolicyAuthority();
  testProviderAuthoritativeEvidenceCanPass();
  testMissingTimestampOrIntegrityRequiresReview();
  testSignedAttestationWithoutVerifiedSignatureRequiresReview();
  testSignedAttestationRequiresPkiBoundProofToPass();
  testEvidenceClassMismatchRequiresReview();
  testModelGeneratedEvidenceRequiresReview();
  testDescriptorDocsRegistryAndPackageScriptStayAligned();
  console.log(`Tool result poisoning guard tests: ${passed} passed, 0 failed`);
} catch (error) {
  console.error('Tool result poisoning guard tests failed:', error);
  process.exitCode = 1;
}
