# Downstream Execution Receipt

The gateway path should not end at permission.

After an admission is allowed, presented, and replay-consumed, the customer enforcement point still needs to record what happened at the real system edge.

```text
Attestor admission
  -> downstream contract
  -> presentation binding
  -> replay ledger consumption
  -> downstream execution receipt
```

The execution receipt answers the last question:

```text
What consequence was actually attempted, and what result was observed?
```

## What It Binds

A downstream execution receipt binds:

- admission id and digest
- presentation binding id and digest
- replay ledger id, replay key digest, replay entry digest, and replay receipt digest
- contract id and enforcement point id
- downstream system
- target digest
- execution status: `succeeded`, `failed`, or `skipped`
- execution and completion timestamps
- result digest, external receipt digest, error digest, or skip reason
- optional operator and idempotency references as digests
- a CloudEvents-compatible envelope

It does not store raw payment responses, wallet transaction payloads, customer rows, downstream request bodies, target URLs, error bodies, operator identifiers, or idempotency keys.

Result, external receipt, and error material must be supplied as digest references such as `sha256:...`. If raw downstream material is placed in a digest field, the receipt decision holds fail-closed and no receipt is emitted.

## Package Surface

The package surface is exported through `attestor/consequence-admission`.

Core functions:

- `recordConsequenceAdmissionDownstreamExecution(...)`
- `consequenceAdmissionDownstreamExecutionReceiptDescriptor()`

The model is a receipt contract, not a transport. A customer adapter can write the receipt to its own log, evidence store, SIEM, event bus, or audit archive.

## Example: Supplier Payment

```text
admission: admit
presentation: allowed for supplier-payment-service
replay ledger: consumed
execution: succeeded
external receipt digest: sha256:...
```

The receipt says the payment adapter did not just receive permission. It consumed the replay key and recorded the downstream payment result by digest.

If the adapter tries to record a successful execution before replay consumption, the receipt decision is held.

## Example: Wallet Handoff

A wallet adapter may record:

- replay-consumed Safe transaction presentation
- transaction hash digest or custody callback receipt digest
- failure digest when the wallet, bundler, paymaster, or custody provider rejects the handoff

The receipt does not sign or broadcast. It closes the Attestor proof trail around the customer-owned execution boundary.

## Example: Data Export

For a bounded export, the receipt can record:

```text
status: succeeded
target digest: sha256:...
external receipt digest: sha256:export-job-result
```

The receipt does not store exported rows. It stores the digest that lets the customer verify which export result belongs to the admitted consequence.

## Failure Reasons

The evaluator returns explicit failure reasons:

- `admission-mismatch`
- `replay-not-consumed`
- `replay-entry-missing`
- `target-digest-mismatch`
- `downstream-system-mismatch`
- `executed-before-replay-consumption`
- `completed-before-executed`
- `result-digest-invalid`
- `external-receipt-digest-invalid`
- `error-digest-invalid`
- `success-result-missing`
- `failure-result-missing`
- `skip-reason-missing`

## Relationship To Other Layers

- [Downstream enforcement contract](downstream-enforcement-contract.md) decides whether the enforcement point may act.
- [Downstream presentation binding](downstream-presentation-binding.md) binds the exact target and executable body.
- [Presentation replay ledger](presentation-replay-ledger.md) consumes the replay key once.
- Downstream execution receipt records the observed consequence result without storing raw sensitive data.
- The release-enforcement plane remains the stronger cryptographic path for signed release tokens, sender-constrained presentation, online introspection, and enforcement receipts.
