# AUD-2026-POL-BUNDLESIGN-001 — Policy Bundle Signer Key Custody Boundary

Lifecycle state: accepted-limitation
Severity: low
Original report: legacy label `R23 B-076`
Current validation ref: origin/master c1344ee276b2bbd25c51ce5f6a68d54c6bfdbfc6
Protected principle: proof integrity; release provenance; no overclaim; operational boundedness
Trust surface: release policy control-plane bundle signing

## Repository Evidence

- `src/release-policy-control-plane/bundle-signing.ts` creates a DSSE/in-toto
  Ed25519 signer from caller-provided PEM private key material.
- The same module now exposes `policyBundleSignerBoundaryDescriptor()` with
  `signerKind: runtime-pem`, `privateKeyMaterial: process-memory`, and
  `productionReady: false`.
- `docs/03-governance/cryptography-policy.md` states that external KMS/HSM
  custody remains future work unless a deployment implements and verifies it
  separately.

## Risk

The policy bundle signer provides strong artifact integrity, but its current
private key custody is process-local PEM material. A heap snapshot, memory dump,
or compromised runtime with process memory access could expose that signing key.
Production-oriented policy bundle signing should use a non-exportable external
KMS/HSM signer instead of process memory private key material.

## External Anchors

- NIST SP 800-57 Part 1 Rev. 5: key-management guidance for protecting keying
  material according to key type, lifetime, and assurance needs.
- DSSE/in-toto: the signed envelope and statement shape is appropriate for
  artifact integrity, but the envelope format does not by itself solve private
  key custody.
- OWASP ASVS: verification evidence should distinguish cryptographic control
  behavior from deployment key-management claims.

## Why Applicable

Policy bundles can influence release-policy activation and runtime resolution.
The signing key is therefore part of the proof-integrity and release-provenance
boundary. The current signer correctly verifies DSSE payload integrity, but its
key custody posture must not be described as HSM/KMS-backed.

## Why Not Overclaimed

This record does not claim policy bundle signing is production KMS/HSM backed.
It does not implement an external signer adapter, live provider proof, rotation,
or compromise-response workflow. It only makes the current runtime-PEM boundary
explicit and machine-readable.

## Decision

Status is `accepted-limitation`, not `fixed`. The limitation is acceptable for
evaluation and repository-side proof generation, provided downstream docs and
readiness checks do not claim external key custody for policy bundle signing.

## Verification

Use these repository checks when this limitation is touched:

```bash
npm run test:release-policy-control-plane-bundle-signing
npm run test:audit-id-alias-registry
npm run test:audit-finding-evidence
npm run typecheck
npm run typecheck:hygiene
```

## Remaining Limitation

Future production-grade policy bundle signing needs a signer interface whose
implementation can call a non-exportable external KMS/HSM key and emit
digest-only live provider evidence. This record does not close that future work.
