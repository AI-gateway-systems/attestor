# AUD-2026-SVC-USERSTORE-001 — Hosted Account User Store Boundary

Lifecycle state: accepted-limitation
Severity: medium
Original report: legacy label `R22 B-075`
Current validation ref: origin/master a3fb83fb1d0499d7e29270c42a56c867dc30dfcc
Protected principle: runtime readiness; operational boundedness; no overclaim
Trust surface: hosted account user persistence, account auth state, production-shared deployment boundary

## Repository Evidence

- `src/service/account-user-store.ts` states the hosted account user store is a
  local file-backed first slice.
- `docs/08-deployment/deployment.md` documents
  `ATTESTOR_ACCOUNT_USER_STORE_PATH` as the file-backed hosted account user
  registry used when `ATTESTOR_CONTROL_PLANE_PG_URL` is not configured.
- `src/service/high-availability.ts` reports that public hosted deployments
  require `ATTESTOR_CONTROL_PLANE_PG_URL` so account, session, and tenant state
  do not fall back to local file-backed stores.

## Risk

The local JSON account user store is acceptable for local development,
evaluation, and single-node durable rehearsal, but it is not a multi-node
production identity store. A production-shared deployment needs shared
control-plane persistence before account user state can be treated as
deployment-ready.

## External Anchors

- NIST SP 800-115: mitigation tracking and verification evidence for technical
  security findings.
- OWASP ASVS: application security verification should produce testable control
  evidence for authentication and session-adjacent state.

## Why Applicable

Hosted account users, roles, MFA state, and federated identities are authority
inputs for account-facing routes. Persistence scope therefore affects runtime
readiness and customer authority boundaries.

## Why Not Overclaimed

This record does not claim the local JSON store is production-ready. It records
the limitation and points production-shared deployments to shared control-plane
persistence. It does not prove live database deployment, backup/restore, HA, or
customer-operated rollout readiness.

## Decision

Status is `accepted-limitation`, not `fixed`. The limitation is acceptable only
because the repository already separates evaluation/single-node storage from
production-shared readiness gates.

## Verification

Use these repository checks when this limitation is touched:

```bash
npm run test:production-storage-path
npm run test:production-runtime-profile
npm run typecheck
npm run typecheck:hygiene
```

## Remaining Limitation

The tail of `src/service/account-user-store.ts` still warrants future audit for
password verification, user write operations, and identity linking behavior.
