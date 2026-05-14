# Cryptography Policy

Status: repository cryptography posture and key-management boundary.

This policy summarizes the code-level cryptography choices. It is not an HSM,
KMS, or customer key-management program.

Official anchors:

- [NIST SP 800-57 Part 1 Rev. 5](https://csrc.nist.gov/pubs/sp/800/57/pt1/r5/final)
- [FIPS 186-5](https://csrc.nist.gov/pubs/fips/186-5/final)
- [RFC 5280](https://datatracker.ietf.org/doc/html/rfc5280)

## Repository Posture

| Area | Current stance |
|---|---|
| Signing algorithm | Ed25519 for Attestor signing surfaces. |
| Verification | PKI-bound verification requires an out-of-band trusted CA fingerprint for independent third-party trust. |
| Certificate validity | Certificates carry validity windows and revocation inputs. |
| Fingerprints | Signing key fingerprints use widened truncated SHA-256 identity material per F5 validation. |
| Canonicalization | Attestor-specific strict canonical JSON; RFC 8785/JCS interoperability is not claimed. |
| Local key persistence | Key-pair persistence routes through atomic file writes where implemented by current helpers. |
| Legacy material | Legacy unbounded certificate acceptance is explicit, warning-bearing, and not the default. |
| Transparency | Public Rekor-style transparency log is not implemented or claimed. |
| KMS/HSM | External KMS/HSM custody remains future work unless a deployment implements and verifies it separately. |

## Key Boundary

The strongest production posture is:

1. external key custody or explicit shared PKI path attestation
2. pinned trust root distribution
3. short-lived signing leaves
4. revocation list propagation
5. verifier-side refusal without trust root
6. rotation and incident runbook

## Non-Claims

Attestor does not claim public transparency-log inclusion, customer-owned KMS
custody, HSM-backed signing, or third-party trust when the verifier accepts only
kit-contained trust material.
