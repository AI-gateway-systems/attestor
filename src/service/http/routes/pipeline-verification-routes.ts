import type { Hono } from 'hono';
import type {
  AttestationCertificate,
  CertificateVerification,
  VerifyCertificateOptions,
} from '../../../signing/certificate.js';
import type {
  ChainVerification,
  TrustChain,
  VerifyTrustChainOptions,
} from '../../../signing/pki-chain.js';

interface PublicKeyIdentity {
  publicKeyHex: string;
  fingerprint: string;
}

export interface PipelineVerificationRoutesDeps {
  verifyCertificate(
    certificate: AttestationCertificate,
    publicKeyPem: string,
    options?: VerifyCertificateOptions,
  ): CertificateVerification;
  verifyTrustChain(
    chain: TrustChain,
    caPublicKeyPem: string,
    options?: VerifyTrustChainOptions,
  ): ChainVerification;
  derivePublicKeyIdentity(publicKeyPem: string): PublicKeyIdentity;
}

export function registerPipelineVerificationRoutes(app: Hono, deps: PipelineVerificationRoutesDeps): void {
  const {
    verifyCertificate,
    verifyTrustChain,
    derivePublicKeyIdentity,
  } = deps;


// Verify Certificate

app.post('/api/v1/verify', async (c) => {
  try {
    const body = await c.req.json();
    const { certificate, publicKeyPem, trustChain, caPublicKeyPem } = body;
    if (!certificate || !publicKeyPem) {
      return c.json({ error: 'certificate and publicKeyPem are required' }, 400);
    }

    // PKI mandatory gate: reject flat Ed25519 unless legacy escape is set
    const allowLegacyApi = process.env.ATTESTOR_ALLOW_LEGACY_API === 'true';
    const hasPkiMaterial = trustChain && trustChain.ca && trustChain.leaf && caPublicKeyPem;
    if (!hasPkiMaterial && !allowLegacyApi) {
      console.log(`[verify] Rejected: no PKI chain material submitted`);
      return c.json({
        error: 'PKI trust chain required for verification.',
        hint: 'Submit trustChain and caPublicKeyPem alongside certificate and publicKeyPem.',
        legacyEscape: 'Set ATTESTOR_ALLOW_LEGACY_API=true to allow flat Ed25519 verification (deprecated).',
      }, 422);
    }

    // 1. Verify PKI trust chain if provided
    let chainVerification = null;
    let pkiBound = false;
    let expectedFingerprint: string | null = null;
    if (hasPkiMaterial) {
      const chainResult = verifyTrustChain(trustChain, caPublicKeyPem);
      expectedFingerprint = trustChain.leaf.subjectFingerprint;

      // 2. CRITICAL: Bind certificate to chain leaf
      // The leaf's subject key must be the same key that signed the certificate
      const signerIdentity = derivePublicKeyIdentity(publicKeyPem);
      const leafMatchesCertificateKey = trustChain.leaf.subjectFingerprint === signerIdentity.fingerprint;
      const leafMatchesCertificateFingerprint = certificate.signing?.fingerprint === trustChain.leaf.subjectFingerprint;

      pkiBound =
        chainResult.overall === 'valid' &&
        leafMatchesCertificateKey &&
        leafMatchesCertificateFingerprint;

      chainVerification = {
        caValid: chainResult.caValid,
        leafValid: chainResult.leafValid,
        chainIntact: chainResult.chainIntact,
        issuerMatch: chainResult.issuerMatch,
        caExpired: chainResult.caExpired,
        leafExpired: chainResult.leafExpired,
        caRevoked: chainResult.caRevoked,
        leafRevoked: chainResult.leafRevoked,
        // Certificate-to-leaf binding
        leafMatchesCertificateKey,
        leafMatchesCertificateFingerprint,
        pkiBound,
        overall: chainResult.overall,
        caName: trustChain.ca.name ?? null,
        leafSubject: trustChain.leaf.subject ?? null,
      };
    }

    // 3. Verify certificate signature with PKI-derived signer pin when available.
    const certResult = verifyCertificate(certificate, publicKeyPem, {
      expectedFingerprint,
    });

    // 4. Structured verification scope summary
    const pkiVerified = certResult.overall === 'valid' && pkiBound;
    const verificationMode = chainVerification ? 'pki' as const : 'legacy_ed25519' as const;
    const overall = verificationMode === 'pki' && !pkiVerified ? 'invalid' : certResult.overall;
    const explanation = verificationMode === 'pki' && !pkiVerified
      ? `PKI trust binding failed: certificate=${certResult.overall}, chain=${chainVerification?.overall ?? 'missing'}, pki_bound=${pkiBound}`
      : certResult.explanation;
    const trustBinding = {
      certificateSignature: certResult.signatureValid && certResult.fingerprintConsistent,
      chainValid: chainVerification?.chainIntact ?? false,
      certificateBoundToLeaf: pkiBound,
      pkiVerified,
    };

    // 5. Deprecation notice when legacy flat Ed25519 path is used
    const deprecationNotice = verificationMode === 'legacy_ed25519'
      ? 'Flat Ed25519 verification without PKI trust chain is deprecated. ' +
        'Submit trustChain + caPublicKeyPem for full PKI-backed verification. ' +
        'Legacy mode will be removed in a future version.'
      : null;

    if (verificationMode === 'legacy_ed25519') {
      console.log(`[verify] Legacy flat Ed25519 verification used (no trust chain submitted)`);
    }

    return c.json({
      signatureValid: certResult.signatureValid,
      fingerprintConsistent: certResult.fingerprintConsistent,
      schemaValid: certResult.schemaValid,
      overall,
      explanation,
      verificationMode,
      deprecationNotice,
      chainVerification,
      trustBinding,
    });
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : String(err) }, 500);
  }
});
}
