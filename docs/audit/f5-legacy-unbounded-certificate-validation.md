# F5 Legacy Unbounded Certificate Validation

Status: F5-NEW-3 fixed.

This note validates the scoped `allowLegacyUnbounded` remediation from the
project-owner supplied F5 signing-layer redo. It is not a certification and does
not claim historical certificates are production-grade.

## Finding

`verifyCertificate(..., { allowLegacyUnbounded: true })` can accept historical
certificate JSON that lacks `notBefore` / `notAfter`. The compatibility path was
intentional, but it did not emit a machine-readable warning or carry a sunset
date.

## Resolution

The default verifier path still rejects unbounded certificates. The compatibility
path now returns a structured warning when it accepts one:

```text
code: legacy-unbounded-certificate-accepted
severity: warning
sunsetAt: 2026-12-31T23:59:59.999Z
```

Modern bounded certificates do not emit the compatibility warning, even if the
caller passes `allowLegacyUnbounded: true`.

## Boundary

This does not remove the compatibility flag. It makes use of the flag visible and
testable so callers can inventory old artifacts and reissue them before the
sunset date.

## Validation

- `npm run test:f5-legacy-unbounded-certificate-validation`
- `npm run test:audit-remediation-tracker`
- `npm run typecheck`
- `npm run typecheck:hygiene`
