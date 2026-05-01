# Shadow Event Recorder

The shadow event recorder is the first data-minimized record for the adoption path:

```text
observe -> recommend -> simulate -> approve -> enforce -> prove
```

It exists so Attestor can later produce policy recommendations and simulation reports without turning shadow mode into a raw-data sink.

## What It Records

Each shadow event records the admission metadata needed to understand a proposed AI action:

- admission id, request id, and admission digest
- mode and shadow decision
- effective decision, allowed state, and fail-closed state
- actor, action, consequence domain, downstream system, and action surface
- policy, tenant, and environment references
- reason codes
- downstream and human outcome labels
- evidence and native input counts
- observed feature keys and a digest of operator-supplied feature values

The event explicitly sets `rawPayloadStored: false`.

## What It Does Not Record

The recorder does not store raw prompts, raw tool payloads, recipients, evidence ids, SQL, customer data, payment secrets, wallet material, or downstream response bodies.

Observed features should be bucketed or classified by the operator before they reach the recorder. For example, use `amountBucket: "25k-50k"` rather than a raw account number, email address, bank instruction, or wallet secret.

## Current Boundary

This is an evaluation/local helper, not the production audit log. The included in-memory recorder is useful for tests, examples, policy-discovery prototypes, and simulation plumbing.

Production deployment still needs a shared append-only or tamper-evident event store, retention policy, access controls, export controls, and incident-review workflow.

## Design Basis

The shape follows existing control-plane patterns rather than inventing a raw data lake:

- OPA decision logs support masking sensitive fields before upload.
- Google Cloud Organization Policy dry-run reports policy violations without enforcing them.
- Kubernetes admission policy supports audit/warn/deny style promotion paths.
- OWASP LLM06 recommends downstream authorization for agentic actions instead of relying on the model to decide what is allowed.

The Attestor-specific version is narrower: it records what the consequence gateway would have decided, while keeping sensitive payloads outside the event.
