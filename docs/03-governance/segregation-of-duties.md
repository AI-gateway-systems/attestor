# Segregation Of Duties

Status: policy boundary for Attestor control-plane operations.

This document maps the repository's role and approval mechanics to a simple
segregation-of-duties model. It is not an HR policy and does not prove that a
customer has assigned people to these roles.

## Operating Roles

| Role | Can do | Must not do alone |
|---|---|---|
| System operator | Configure runtime, observe health/readiness, run backup/restore drills. | Promote high-risk shadow policy to enforcement. |
| Policy owner | Approve policy intent, scope, constraints, and risk acceptance. | Bypass release verification or sign runtime keys. |
| Reviewer | Review packets, no-go conditions, evidence summaries, and narrowed constraints. | Self-approve their own high-risk policy activation. |
| Security owner | Manage key boundaries, trust roots, incident posture, and provider risk. | Replace business approval for consequence scope. |
| Auditor / observer | Inspect evidence packs, tracker rows, logs, and validation docs. | Mutate policy, tenant keys, or runtime configuration. |

## Required Two-Person Boundaries

High-risk activation should require at least:

- operator approval
- independent secondary approver
- evidence packet or promotion packet digest
- rollback or kill-switch reference
- monitoring or alert reference

Repository anchors:

- high-risk shadow activation two-person checks
- break-glass secondary approval and reconciliation fields
- control-plane role names
- reviewer queue and release review site
- audit remediation tracker and validation docs

## Break-Glass Boundary

Break-glass is an incident mechanism, not a normal rollout path. It must be
time-bound, scoped, logged, reconciled after use, and distinct from the operator
who requested the activation.

## Remaining External Evidence

An audit still needs named role assignments, access reviews, approval samples,
offboarding samples, and incident records from the operating organization.
