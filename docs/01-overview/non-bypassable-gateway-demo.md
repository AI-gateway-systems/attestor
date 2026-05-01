# Non-Bypassable Gateway Demo

Use this after the customer admission gate when you want to see the stronger integration shape:

```bash
npm run example:non-bypassable-gateway
```

The demo models a customer payment adapter. The payment dispatch function is private to the adapter. The only public path calls the Attestor verifier helper before the ledger changes.

```text
AI proposal
  -> Attestor admission
  -> verifier helper
  -> protected adapter
  -> downstream payment dispatch
```

No verifier allow, no downstream consequence.

## What The Demo Shows

The demo runs four cases:

- a valid supplier payment that executes
- a bypass attempt without an idempotency key that holds
- a bypass attempt against the wrong downstream system that holds
- a blocked Attestor admission that holds

Only the first case writes to the simulated payment ledger.

## Why This Matters

A gateway is not non-bypassable because the README says so. It becomes non-bypassable when the customer-owned adapter has no execution path that skips verification.

The useful rule is:

```text
the downstream system cannot act unless the adapter verifies the Attestor admission first
```

The demo keeps that rule small and concrete. It does not claim production payment infrastructure, wallet custody, or cryptographic release-token verification. It shows the placement pattern for the customer enforcement point.

## Relationship To Other Pieces

- [Consequence taxonomy](../02-architecture/consequence-taxonomy.md) names the consequence domain: money movement.
- [Downstream enforcement contract](../02-architecture/downstream-enforcement-contract.md) defines what must bind before the adapter can act.
- [Verifier helper](../02-architecture/verifier-helper.md) gives the adapter a `verify` / `assert` API.
- The customer payment adapter owns the actual dispatch.

Attestor supplies the admission and proof references. The customer adapter makes skipping the gate impossible inside its own execution path.
