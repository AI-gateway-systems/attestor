# Scope Explosion Guard

This document describes `attestor.consequence-scope-explosion-guard.v1`.

The guard turns the failure mode `scope-explosion` into a deterministic requested-vs-approved scope contract.

It is not a certification, not a full downstream verifier, and not a claim of production readiness. It compares supplied scope metadata only; customer policy stores, domain packs, downstream verifiers, and customer gateways must still enforce the returned constraints.

## Research Anchors

- OWASP Agentic Top 10: legitimate tools can be misused and agents can operate beyond intended scope.
- OWASP MCP Top 10: scope creep and loosely defined permissions can grant excessive capabilities.
- Microsoft Entra Agent ID guidance: agent permissions should stay narrow and least-privileged.
- NIST AI RMF Playbook: AI risk should be governed, mapped, measured, and managed through explicit controls.

## Contract

Source file:

```text
src/consequence-admission/scope-explosion-guard.ts
```

Test command:

```bash
npm run test:scope-explosion-guard
```

The guard compares requested scope against approved scope across:

- amount
- record count
- operation
- recipient
- tenant
- environment
- downstream system
- data class
- reversibility

Raw tenant ids, recipient ids, downstream system ids, scope-owner policy refs, and private amount thresholds are not serialized. Output is digest-first.

## Decisions

The guard returns one of:

- `pass`: requested scope is inside approved scope
- `narrow`: requested scope exceeds approved scope but can be constrained before execution
- `review`: requested or approved scope evidence is missing, or reversibility is unknown
- `block`: tenant, operation, data class, or irreversible-action boundary is violated

`narrow` returns explicit digest-only constraints. Review and block are fail-closed.

Unknown reversibility is not treated as reversible. If an adapter cannot classify
whether an action is reversible, compensating, partially reversible, or
irreversible, the guard returns `review` with `reversibility-unknown`.

## Binding

The guard reuses the Control Binding Contract for:

```text
failureModeId: scope-explosion
invariants:
- scope-cannot-exceed-approved-boundary
- downstream-side-effects-must-be-declared
- review-or-block-cannot-auto-promote
```

Required controls, evidence, authority, and audit records come from:

```text
src/consequence-admission/failure-mode-control-bindings.ts
```

## Limitations

This is a central guard contract, not full customer enforcement.

Remaining work:

- customer policies must provide approved scope metadata
- domain packs must translate business thresholds into approved scope
- downstream verifier helpers must enforce returned narrowing constraints
- customer gates must refuse review/block and only execute pass/narrow with proof
- README positioning is handled in the final docs alignment step
