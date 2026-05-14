# F7 Shadow Event Origin And Redaction Witness Validation

Status: repository slice for F7-S1 and F7-S2.

Baseline: follows the F7 validation slice on `origin/master`.

This slice adds machine-readable witness records to every shadow admission event.
It does not claim an external transparency log, an HSM-backed signature, or live
customer runtime enforcement. It closes the repository contract gap where shadow
events previously carried only `admissionDigest` and `redactionLevel` without a
separate witness digest.

## Changes

- Every `ShadowAdmissionEvent` now includes `originWitness` and
  `originWitnessDigest`.
- Every `ShadowAdmissionEvent` now includes `redactionWitness` and
  `redactionWitnessDigest`.
- The origin witness binds:
  - admission id
  - admission digest
  - request id
  - decision
  - allowed / fail-closed flags
  - tenant and environment scope
- The redaction witness binds:
  - redaction level
  - data-minimization redaction policy version
  - observed feature keys
  - observed feature digest
  - explicit `rawPayloadStored: false`
  - explicit `rawObservedValuesStored: false`

## Validation Result

| Finding | Prior status | New status | Reason |
|---|---|---|---|
| F7-S1 shadow event injection without origin-binding | `partial` | `fixed` | Shadow events now carry a deterministic origin witness digest derived from the admission response digest and decision context. |
| F7-S2 operator-supplied redaction self-attest | `partial` | `fixed` | Shadow events now carry a deterministic redaction witness digest bound to the data-minimization policy version and observed-feature digest. |

## Remaining Boundary

The witness is repository-side and deterministic. It is not a third-party
signature, not a public transparency log, and not a proof that an external agent
cannot fabricate a whole admission response before calling a trusted route. Those
claims remain out of scope until shadow recording is tied to a signed
production-path admission proof.

The active F7 queue shrinks from six planned repository units to five planned
repository units:

1. F7-S3 server-owned simulation policy floor.
2. F7-S4 break-glass hardening.
3. F7-S8 two-person high-risk activation handoff.
4. F7-S9 shadow bundle signing boundary validation.
5. F7-S10 shadow readiness and claim alignment.
