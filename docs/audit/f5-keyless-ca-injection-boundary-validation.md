# F5 Keyless CA Injection Boundary Validation

Status: fixed.

This document validates the scoped F5-A7 / F5-NEW-1 remediation. It is not a
claim that in-process JavaScript modules are a cryptographic security boundary.

## Scope

This slice covers the keyless signing CA singleton and the release-runtime
bootstrap path that configures it:

- `src/signing/keyless-signer.ts`
- `src/service/bootstrap/release-runtime.ts`
- package export boundary evidence

## Repository Change

The generic `setKeylessCa(...)` mutation function has been removed. Release
runtime now calls `configureReleaseRuntimeKeylessCa(...)`, which:

- accepts only the explicit `release-runtime-bootstrap` configuration source
- validates that the CA certificate public key matches the key pair
- validates that the CA certificate fingerprint matches the key pair
- treats repeat configuration of the same CA as idempotent
- refuses silent in-process replacement with a different CA fingerprint
- requires explicit `allowReplace` plus a replacement reason for release-runtime
  bootstrap reconfiguration

The keyless signer module remains internal to the repository package. It is not
published through `package.json` `exports`.

## Claim Boundary

This does not make arbitrary in-process code untrusted. A malicious dependency
already executing inside the same Node process remains inside the process trust
boundary. This fix narrows the public mutation surface and prevents accidental
or silent CA replacement through the release-runtime path.

## Validation

Run:

```bash
npm run test:f5-keyless-ca-injection-boundary-validation
npm run test:signing
```

The targeted test proves:

- `setKeylessCa` is no longer exported from `keyless-signer.ts`
- release runtime imports `configureReleaseRuntimeKeylessCa`
- package exports do not publish `keyless-signer`
- configured CA/key mismatches are rejected
- repeat configuration of the same CA is idempotent
- in-process replacement with a different CA fingerprint is rejected unless the
  release-runtime path explicitly allows and explains the replacement
