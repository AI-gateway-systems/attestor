# F7 Shadow Bundle Signing Boundary Validation

Status: repository slice for F7-S9.

This slice narrows the shadow policy bundle signing claim. A signature can still
be attached for evaluation, but only an explicit production signing boundary can
promote the publication signature status to `signed-production`.

## Changes

- `SHADOW_POLICY_BUNDLE_PRODUCTION_SIGNING_BOUNDARIES` defines the current
  production-capable bundle-signing boundary as `external-kms-hsm`.
- `ShadowPolicyBundlePublication` now records:
  - `productionSigningBoundaryRequired`
  - `productionSigningBoundaryReady`
- Runtime signatures with `productionReady: true` but a non-production boundary
  remain visible for audit, but are downgraded to `signed-evaluation`.
- Such unsafe signatures add `production-signing-boundary-invalid` to activation
  blockers.

## Validation Result

| Finding | Prior status | New status | Reason |
|---|---|---|---|
| F7-S9 shadow bundle signing boundary | `partial` | `fixed` | Shadow bundle publication now separates evaluation signatures from production-boundary signatures and refuses to treat runtime-memory/file-pem signing as production-signed. |

## Remaining Boundary

This does not implement tenant-specific signing leaves or KMS/HSM deployment.
Those remain covered by the F6 tenant signer blast-radius limitations. This
slice only prevents shadow policy bundle publication from overclaiming
production signing status when the signature came from a runtime boundary.

The active F7 queue shrinks from two planned repository units to one planned
repository unit:

1. F7-S10 shadow readiness and claim alignment.
