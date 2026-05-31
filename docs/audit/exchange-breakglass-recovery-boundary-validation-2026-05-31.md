# Exchange, Break-Glass, And Recovery Boundary Validation - 2026-05-31

## Recent Fixes Chain-Effect Check

- Source of truth: `origin/master`
- Source HEAD at validation start: `48f0a88a4baf85c047388f8e784b9b6eb74b772c`
- Recent relevant merge: evidence, workload, and MFA boundary hardening.
- Direct regression found from the recent merge: none in this scope.
- Cross-fix interaction: token exchange, degraded-mode overrides, and account
  recovery all feed authority or one-time control paths, but they do not change
  the Customer PEP no-bypass boundary.

## Validation Frame

Newest request in operational terms: validate the submitted token-exchange,
degraded-mode, and recovery-code boundary findings against current repository
evidence and primary sources; fix repo-proven issues; keep public wording free
of internal process references.

Trust surfaces:

- release-token exchange -> parent liveness -> child token authority
- degraded-mode grant creation -> approval provenance -> break-glass override
- recovery code -> MFA bypass/session or MFA disable -> one-time account control

Protected principles:

- proof integrity
- fail-closed boundary
- customer authority
- replay and idempotency safety
- auditability
- no overclaim

## Sources Checked

Repository evidence:

- `src/release-enforcement-plane/token-exchange.ts`
- `tests/release-enforcement-plane-token-exchange.test.ts`
- `src/service/http/routes/admin-release-enforcement-routes.ts`
- `src/release-enforcement-plane/degraded-mode.ts`
- `src/service/release/release-degraded-mode-grant-store.ts`
- `src/service/account/account-mfa.ts`
- `src/service/account/account-user-store.ts`
- `src/service/control-plane-store/account-auth-state.ts`
- `src/service/http/routes/account-mfa-passkey-routes.ts`
- relevant release-enforcement, account MFA, and service-boundary tests

Official / primary sources:

- RFC 8693 token exchange: exchanged tokens must be based on validated subject
  token inputs and narrowed request parameters.
- RFC 7662 token introspection: online active-state checks are the source for
  revoked/inactive token state.
- NIST SP 800-63B: recovery and authentication ceremonies must preserve
  authenticator lifecycle and verifier-controlled state.
- PostgreSQL row locking documentation: `SELECT ... FOR UPDATE` is the row-lock
  pattern used for shared-state compare-and-update operations.
- OWASP Authorization Cheat Sheet: authorization decisions should be enforced
  server-side and fail securely.

## Findings

### OPS-188 - Token exchange could mint a high-risk child without parent liveness proof

Status: `repo-proven`, fixed repo-side.

The submitted finding was correct for the scoped exchange path.
`subjectIntrospector` and `store` were optional independently. A cryptographically
valid but revoked or consumed high-risk parent could be exchanged if the caller
configured a child store but omitted parent active-state introspection.

Fix:

- R3, R4, and `introspection_required` parents now require a
  `subjectIntrospector`.
- The same parents also require a child registration store, so the minted child
  cannot become an unregistered high-risk authority artifact.
- Exchange results now expose bounded `parentIntrospectionChecked` metadata.
- Missing parent active-state proof or missing child registration store fails
  closed before child token issuance.

Locking evidence:

- `tests/release-enforcement-plane-token-exchange.test.ts`

Limit: this is repository-side exchange behavior. It does not prove live shared
introspection, live downstream PEP no-bypass, or production readiness.

### OPS-189 - Degraded-mode admin route accepted body-supplied approval authority

Status: `repo-proven`, fixed repo-side for the admin route.

The submitted finding was correct for the scoped route. The degraded-mode grant
creation endpoint accepted `approvedBy`, `authorizedBy`, `grantedBy`, and
`authorizedAt` from request body data. That could make dual-break-glass evidence
look internally consistent without proving independent approval.

Fix:

- Grant creation rejects body-supplied authorizer or approver fields.
- Grant creation derives `authorizedBy` from the authenticated admin credential
  and starts with no route-supplied approvers.
- Grant revocation rejects body-supplied revoker fields and derives the revoker
  from the authenticated admin credential.
- Tests lock that body-supplied approvers/revokers are rejected and no grant is
  created from self-attested approver data.

Locking evidence:

- `tests/release-enforcement-plane-degraded-mode.test.ts`

Limit: this does not implement a separate signed approval-receipt workflow.
The core degraded-mode constructor can still represent already-validated
approval records; it does not independently authenticate them. Production
operator approval workflow proof remains unclaimed.

### OPS-190 - MFA recovery codes were consumed by route-level read-modify-write

Status: `repo-proven`, fixed repo-side.

The submitted finding was correct for the scoped account MFA paths. Recovery
code login and MFA disable verified the candidate against a loaded user record,
mutated a cloned TOTP state, and saved later. Concurrent requests could validate
the same unconsumed recovery code before either write landed.

Fix:

- The file-backed account user store now exposes a store-level
  `consumeAccountUserRecoveryCode` operation under the existing file lock.
- The shared PostgreSQL control-plane path now claims recovery codes in a
  transaction with `FOR UPDATE`.
- MFA login and MFA disable call the atomic store operation before session
  issuance or MFA disable side effects.
- MFA disable audit metadata includes the bounded recovery-code evidence id
  when a recovery code is used.
- Tests lock single-use recovery-code consumption at the store boundary and
  route use of the state-service port.

Locking evidence:

- `tests/account-mfa-replay.test.ts`
- `tests/service-account-state-service.test.ts`
- `tests/service-route-boundary.test.ts`

Limit: this is repository-side atomicity. It does not prove deployed multi-node
account-route behavior, shared auth-abuse-store behavior under live traffic, or
production account-security posture.

## Positive Observations

- Token exchange already narrowed audience, resource, scope, TTL, actor chain,
  and parent linkage; the fix tightens the parent liveness and child-store
  boundary for high-risk exchange.
- Degraded-mode grants already enforce scope narrowing, TTL limits, status, and
  use budgets; the fix prevents the admin route from turning body data into
  approval authority.
- TOTP step replay already had store-level guards; the fix extends the same
  one-time-control discipline to recovery codes.

## Chain Effects

- Revoked or consumed high-risk release tokens can no longer be transformed
  into registered child tokens by omitting parent introspection.
- Route-created degraded-mode grants no longer carry body-supplied dual
  approver evidence.
- Recovery-code session issuance and MFA disable now depend on a single
  store-level claim.
- Customer PEP no-bypass, live shared stores, live approval workflow, and
  production readiness remain separate proof surfaces.

## Verdict

- OPS-188: fixed repo-side.
- OPS-189: fixed repo-side for body-supplied admin-route authority.
- OPS-190: fixed repo-side for recovery-code one-time consumption.

No production readiness, compliance readiness, live shared-store proof, live
approval-workflow proof, customer PEP no-bypass proof, or enterprise readiness
is claimed by this validation.

## Final Checkpoint

Scoped remediation is repo-side complete after the listed checks and PR merge.
Live proof and operator workflow proof remain separate.
