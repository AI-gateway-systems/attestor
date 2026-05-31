# Admission Boundary Validation 2026-05-31

Status: `partial / route and gate hardening remediated`

Source HEAD: `a0f3d1adbeb887f411be930b4c5c2f1cf92396ea`

Scope:

- generic admission observe/warn to execution boundary
- customer admission gate proof handling
- workflow entitlement customer-gate proof handling
- `/api/v1/admissions` idempotency posture
- customer middleware copy-paste examples

Source anchors:

- OWASP Authorization Cheat Sheet: deny by default, fail safely, and test authorization logic.
- IETF HTTPAPI Idempotency-Key draft: use a client-supplied idempotency key to bind duplicate unsafe requests to replay or conflict behavior.

## Validation Frame

Protected principles:

- fail-closed boundary
- proof integrity
- customer authority
- replay and idempotency safety
- no overclaim

The validation treats shadow/observe output as adoption evidence, not execution
authority. It also keeps workflow entitlement as billing/capability context,
not proof that a customer PEP is deployed or non-bypassable.

## Findings And Closure

| Finding | Evidence state | Repo-side action |
|---|---|---|
| Observe/warn generic admissions could be passed to the shared customer gate as executable `admit` responses. | `repo-proven` | Customer gate now holds non-enforcing admissions via `customer-gate-non-enforcing-mode-held`; docs/examples separate observe/warn from execution. |
| Generic `admission-receipt` proof could satisfy the base customer gate by proof presence alone. | `repo-proven` for the gate path; `partial-repo` for broader evidence verification. | Customer gate now requires execution proof beyond `admission-receipt`; docs state that a receipt is not execution proof. Reference-only generic evidence remains decision context unless stronger proof is attached. |
| Workflow enforce access could be unlocked by caller-supplied `customerGateProofPresent` fields. | `repo-proven` | Workflow entitlement now ignores caller-asserted gate proof for enforce and emits `caller-asserted-gate-proof-ignored`; stored entitlement/control-plane proof remains required. |
| Generic admission route lacked admission-level idempotency/replay handling. | `repo-proven` | Hosted route deps now wire the existing idempotency service for generic admissions and require `Idempotency-Key` for enforce-mode admissions in bootstrap. Same-key replay/conflict behavior is covered by route tests. |

## Boundaries

Repo-side hardening does not prove:

- live customer PEP no-bypass
- production deployment readiness
- external KMS/HSM signing
- shared replay/introspection store behavior under live multi-instance load
- compliance certification
- enterprise readiness

Generic reference strings are still reference material. They are not verified
evidence by themselves, and they do not become execution proof unless a stronger
proof path is attached and checked by the customer-owned gate.

## Verification Plan

Run the targeted gates for this slice:

- `npm run test:consequence-admission-customer-gate`
- `npm run test:workflow-entitlement`
- `npm run test:generic-admission-routes`
- `npm run test:generic-admission-mode-ladder`
- `npm run test:customer-middleware-examples`
- `npm run typecheck`
- `npm run typecheck:hygiene`
- `git diff --check`

Final state remains `partial` until live deployment proves the configured
idempotency store, customer gate, release-enforcement verifier, and replay
consumption in the real runtime.
