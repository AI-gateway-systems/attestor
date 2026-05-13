# F3 Agent Loop Shared Store Validation

This document validates the agent-loop shared-store portion of the supplied F3 cross-cutting audit against current repository evidence. It is not a certification, not an independent external audit, and not a claim of full production readiness.

## Audit Run Header

```text
Audit ID: F3-agent-loop-shared-store-validation
Audit title: Agent-loop shared-store readiness truth validation
Mode: remediation
Target ref: origin/master @ 42e54d258da8
Date: 2026-05-13
Reviewer: Codex
Threat model / framework: Attestor failure-mode registry, Redis-backed shared counter semantics, production readiness truth gates
Scope: service agent-loop abuse guard status, shared Redis readiness claim, production storage path documentation
Out of scope: full shared consequence-admission storage migration, retry attempt ledger migration, presentation replay ledger migration, external Redis production deployment
Known limitations: repository evidence only; no external customer Redis, Kubernetes, or hosted production environment was exercised
```

## Validated Finding Status

| Finding | Status | Result |
|---|---|---|
| F3-CC-2 agent-loop in-memory only | outdated as stated | Current repo has a Redis-backed service wrapper and multi-instance shared tests. |
| F3-CC-2 readiness overclaim risk | confirmed and fixed in this branch | Configuring a Redis URL no longer marks the guard as shared-durable until the Redis shared counter path has executed successfully. |
| Production-shared storage gate | partially covered | The production storage path already inventories the agent-loop guard, but this branch tightens the status truth source. |

## Research Anchors

- Redis `EVAL` / Lua scripting is the right primitive for atomic shared counter updates, but it only proves shared behavior after the service can execute the script path: <https://redis.io/docs/latest/commands/eval/>
- Kubernetes readiness semantics make a failed readiness condition explicit; Attestor mirrors that pattern by refusing `shared-durable` status until the dependency has been proven reachable: <https://kubernetes.io/docs/concepts/configuration/liveness-readiness-startup-probes/>

## Remediation Slice In This PR

```text
ID: F3-R2
Title: Agent-loop shared-store status must be connection-proven
Audit run: F3-agent-loop-shared-store-validation
Status: fixed by F3-R2
Severity: high
Protected principle: fail-closed boundary; runtime readiness; operational boundedness
Trust surface: automatic retry guard, admission edge, production-shared storage readiness
Repository evidence: src/service/agent-loop-abuse-guard.ts; tests/consequence-admission-agent-loop-abuse-guard-shared.test.ts; docs/02-architecture/agent-loop-abuse-guard.md; docs/02-architecture/production-storage-path.md
Observed behavior: configureAgentLoopAbuseGuard() could set backend status to redis before a guard evaluation proved the Redis script path.
Expected behavior: shared-durable status requires a successful Redis-backed guard evaluation; configured URL alone is not readiness evidence.
Smallest safe fix: keep the backend status in-memory until the Redis shared counter script executes, and document the readiness boundary.
Regression tests: npm run test:agent-loop-abuse-guard-shared; npm run test:production-storage-path
Remaining limitation: this does not migrate all consequence-admission storage surfaces to shared durable storage and does not prove any external production Redis deployment.
```

## Remaining Backlog

- Shared durable paths for retry attempt ledger and presentation replay ledger.
- Shared durable source history for shadow events, simulations, candidates, activation receipts, audit evidence export, and business risk dashboard.
- External Redis/Kubernetes production rehearsal for customer-operated deployments.
