# Decision Trace Logger

Status: W06 implementation contract for Runtime Assurance Wiring v1. This is a
digest-only shadow decision trace, not a production audit log, not external
immutability, not formal verification, not live enforcement, and not production
readiness.

Version: `attestor.decision-trace-logger.v1`

## Decision

The Decision Trace Logger records the W05 shadow runtime pipeline as a bounded,
TTL-scoped, replay-rejecting trace:

```text
Shadow Runtime Pipeline result
  -> eight ordered trace phases
  -> digest-only entry payloads
  -> linear hash chain
  -> TTL-bound verification
  -> replay-rejected duplicate pipeline digest
  -> snapshot for later offline spec checks
```

The logger is intentionally not the audit plane. It reads the shadow pipeline
result, derives structured digest-only entries, and returns a verifiable
snapshot. It cannot admit, narrow, execute, activate policy, call downstream
systems, sign production packets, grant authority, write the audit plane, or
claim production log integrity.

## Files

```text
src/consequence-admission/decision-trace-logger.ts
tests/decision-trace-logger.test.ts
docs/02-architecture/decision-trace-logger.md
```

## Trace Phases

W06 records exactly one entry for each phase:

```text
shadow-event
envelope-projection
signal-extraction
relationship-detection
relationship-aware-fusion
conflict-abstention-gate
human-comprehension-gate
assurance-packet
```

Each entry binds:

```text
traceId
sequence
phase
componentVersion
pipelineDigest
envelopeRefDigest
inputDigest
outputDigest
observedAt
ttlExpiresAt
reasonCodes
previousEntryDigest
previousRootDigest
entryPayloadDigest
entryDigest
rootDigest
```

The trace keeps only digest refs and reason codes. It does not store raw
prompt, raw provider body, raw payload, wallet material, payment detail, tenant
identifier, downstream error body, or private thresholds.

## Boundaries

The logger preserves these invariants:

```text
chainMode = linear-hash-chain
ttlRequired = true
replayRejected = true
digestOnly = true
structuredForOfflineSpecChecks = true
writesAuditPlane = false
grantsAuthority = false
canAdmit = false
activatesEnforcement = false
autoEnforce = false
rawPayloadStored = false
productionReady = false
```

The logger rejects duplicate `pipelineDigest` values inside the same trace as
`replay-rejected`. It holds rather than appends if the configured entry capacity
would be exceeded. `ttlSeconds` is mandatory for every logger instance.
Verification fails closed when TTL has expired or when the
sequence, previous-entry digest, previous-root digest, entry payload digest,
entry digest, or root digest no longer matches.

## Why This Shape

ACM Queue's AWS PObserve discussion is the main source pattern: production
systems emit structured observations that can be checked against a model
without extracting a model from code. W06 makes the shadow runtime pipeline a
PObserve-style trace source, while keeping the actual W07 formal spec as a
later manual artifact.

CloudTrail log file integrity validation is the hash-chain source pattern:
each digest binds a time window and the previous digest so reviewers can detect
modification, deletion, or reordering. W06 applies the same shape locally to
decision trace entries, without claiming CloudTrail, WORM storage, or external
immutability.

OPA Decision Logs are the policy decision observability anchor. They are useful
because policy decisions can be debugged from structured decision records, and
sensitive data needs masking before upload. W06 keeps trace entries digest-only
and records non-authority reason codes.

OpenTelemetry Logs Data Model is the observability structure anchor. W06 keeps
events structured with timestamps, bodies represented by digests, attributes as
reason codes and versions, and a shape that can be mapped later without putting
raw AI or customer material into the trace.

## Non-Claims

W06 is:

```text
not production log integrity
not external immutability
not audit-plane write
not live enforcement
not policy activation
not packet signing
not downstream execution
not TLA+ validated
not Alloy validated
not learning
not baseline extraction
not cross-tenant aggregation
not production readiness
```

W06 does not replace W07 TLA+ Admission State Machine Skeleton, W08 Alloy
Tenant Isolation Model, W09 Baseline Cohort Contract, or the later invariant
catalog, calibration, and promotion gates.

## Verification

Targeted verification:

```bash
npm run test:decision-trace-logger
npm run test:consequence-runtime-assurance-overview
npm run typecheck
```

Broader confidence should include W01-W05 tests, tamper-evident history tests,
package-surface checks, hygiene, build, and `npm run verify` before merging.

## Sources

- ACM Queue, [Systems Correctness Practices at AWS](https://queue.acm.org/detail.cfm?id=3712057)
- AWS CloudTrail, [Validating CloudTrail log file integrity](https://docs.aws.amazon.com/awscloudtrail/latest/userguide/cloudtrail-log-file-validation-intro.html)
- OPA, [Decision Logs](https://www.openpolicyagent.org/docs/management-decision-logs)
- OpenTelemetry, [Logs Data Model](https://opentelemetry.io/docs/specs/otel/logs/data-model/)
