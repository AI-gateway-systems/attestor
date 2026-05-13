# F3 Agentic Guard Validation

This document validates the supplied F3 cross-cutting agentic guard report against current repository evidence. It is not a certification, not an independent external audit, and not a claim of full production readiness.

## Audit Run Header

```text
Audit ID: F3-agentic-guard-validation
Audit title: Agentic guard trust-label and scope-boundary validation
Mode: remediation
Target ref: origin/master @ b33bc24302d3
Date: 2026-05-13
Reviewer: Codex
Threat model / framework: Attestor failure-mode registry, OWASP LLM/agentic control patterns, NIST AI RMF control-boundary framing
Scope: tool-result poisoning guard, approval provenance guard, scope explosion guard
Out of scope: shared production store for agent-loop abuse guard, production enforcement activation, external adapter implementation, customer deployment verification
Known limitations: repository evidence only; no live customer workflow, IdP, approval workflow, adapter, or production gateway was exercised
```

## Validated Finding Status

| Finding | Status | Result |
|---|---|---|
| F3-CC-3 operator-asserted signed tool result | confirmed and fixed in this branch | `signed-attestation` no longer passes as trusted evidence unless signature verification is true. |
| F3-CC-6 approval trust class laundering | confirmed and fixed in this branch | Untrusted approval sources cannot be promoted by a supplied `trustClass`; signed approvals require verified signature state. |
| F3-CC-5 unknown reversibility | confirmed and fixed in this branch | Explicit `unknown` reversibility routes to review and fail-closed output. |
| F3-CC-9 missing `model-tool-config-drift` guard | disputed as stated | Current repo contains `decision-context-drift-binding.ts` and control bindings for `model-tool-config-drift`. |
| F3-CC-1 declared vs enforced guard posture | accepted limitation | Many guard artifacts intentionally remain `autoEnforce: false`, `productionReady: false`, and `activatesEnforcement: false`; this prevents overclaiming but remains production-readiness backlog. |
| F3-CC-2 agent loop in-memory store | accepted limitation | Shared-store production hardening remains backlog and is not fixed in this branch. |

## Remediation Slice In This PR

### F3-R1 - Operator labels cannot create trusted authority

```text
ID: F3-R1
Title: Signed/trusted guard labels must require supporting verification state
Audit run: F3-agentic-guard-validation
Status: fixed by F3-R1
Severity: high
Protected principle: proof integrity; customer authority; fail-closed boundary
Trust surface: tool-result evidence, approval provenance, requested-vs-approved scope
Source: supplied F3 agentic cross-cutting audit, validated against current code
Exact files: src/consequence-admission/tool-result-poisoning-guard.ts; src/consequence-admission/approval-provenance-guard.ts; src/consequence-admission/scope-explosion-guard.ts
Observed behavior: trusted labels could be over-read when supplied by an adapter, and explicit unknown reversibility could avoid fail-closed review.
Expected behavior: signed claims require verified signature state, untrusted source kinds cannot be promoted by trustClass override, and unknown reversibility requires review.
Smallest safe fix: add deterministic reason codes and guard logic without changing public guard placement or production-readiness claims.
Regression tests: npm run test:tool-result-poisoning-guard; npm run test:approval-provenance-guard; npm run test:scope-explosion-guard
Remaining limitation: the guards classify supplied metadata; they do not prove every customer adapter, IdP, approval workflow, or downstream verifier has integrated the guard.
```

## Remaining Backlog

- Shared-store / multi-pod hardening for `agent-loop-abuse-guard`.
- Runtime enforcement activation checklist for guards that currently render decisions but do not activate enforcement.
- Customer adapter conformance for signed tool-result attestations and signed approvals.
- Reviewer behavior telemetry for fatigue/rubber-stamp detection.
