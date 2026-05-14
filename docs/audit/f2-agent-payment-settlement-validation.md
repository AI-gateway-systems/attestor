# F2-AG-2 Agent Payment Settlement Post-Condition Validation

Status: `partial`.

This note validates the project-owner supplied finding that agent-payment
settlement evidence can be operator-asserted unless Attestor verifies a
facilitator or chain-backed receipt before treating the consequence as closed.

## Scope

Files inspected:

- `src/crypto-authorization-core/x402-agentic-payment-adapter.ts`
- `src/crypto-execution-admission/x402-resource-server.ts`
- `src/crypto-execution-admission/telemetry-receipts.ts`
- `src/consequence-admission/downstream-execution-receipt.ts`
- `tests/crypto-authorization-core-x402-agentic-payment-adapter.test.ts`
- `tests/crypto-execution-admission-x402-resource-server.test.ts`
- `tests/crypto-execution-admission-telemetry-receipts.test.ts`
- `tests/downstream-execution-receipt.test.ts`

Research anchor:

- Official x402 documentation describes the server/facilitator flow as verify,
  settle, then return the paid resource with `PAYMENT-RESPONSE` settlement
  evidence.
- Source: `https://docs.x402.org/core-concepts/facilitator`.

## Validation Result

The original finding is stale if it claims Attestor has no settlement gate.

The repo has multiple settlement-specific controls:

- `x402-agentic-payment-adapter.ts` includes `x402-facilitator-verify`,
  `x402-settlement-posture`, and `x402-enforcement-binding-ready` checks.
- Settlement only passes when facilitator settlement succeeded, a
  `PAYMENT-RESPONSE` header is present, and settlement transaction, network,
  payer, and amount are bound to the expected payment.
- Pending settlement produces `review-required`, not `allow`.
- `x402-resource-server.ts` models the HTTP resource-server phases and keeps
  fulfillment behind `requiresSettlementSuccess`,
  `requiresPaymentResponseHeader`, and `requiresIdempotencyProtection`.
- Existing tests prove pending settlement waits, invalid verify blocks, duplicate
  payment blocks, and fulfillment only becomes ready after settlement and
  payment-response binding.

The finding remains valid in a narrower form.

`X402FacilitatorEvidence` and `X402ResourceServerRuntimeObservation` still carry
settlement truth as adapter/runtime observations:

```text
verifyResponseValid
settleResponseSuccess
settlementTransaction
settlementNetwork
settlementPayer
settlementAmount
paymentResponseHeaderPresent
runtimeObservation.settlementAccepted
```

Attestor checks consistency across those fields, but it does not independently
verify a facilitator-signed settlement attestation or read chain settlement
state in this layer.

## Corrected Finding

F2-AG-2 should not say "Attestor has no settlement post-condition gate." That is
stale.

It should say:

```text
Attestor has x402 preflight and resource-server settlement gates, but the
facilitator/settlement result remains an adapter observation. Before this can be
marked fixed, Attestor needs a verifier-bound settlement receipt, such as a
facilitator-signed attestation, on-chain receipt verifier, or explicit
customer-owned settlement verifier contract.
```

## Remaining Work

Before this can be marked `fixed`, the agent-payment path needs a repo-proven
settlement-attestation contract with at least:

- settlement digest bound to admission/preflight id
- facilitator identity or chain source
- settlement transaction or external receipt digest
- payer, payee, network, asset, and amount binding
- verification result produced by Attestor-side code or a pinned verifier
- failure mode when the attestation is missing, stale, mismatched, or unverifiable

Current repo evidence supports `partial`, not `fixed`.

## Tests

Focused test:

```bash
npm run test:f2-agent-payment-settlement-validation
```

Related tests:

```bash
npm run test:crypto-authorization-core-x402-agentic-payment-adapter
npm run test:crypto-execution-admission-x402-resource-server
npm run test:crypto-execution-admission-telemetry-receipts
npm run test:downstream-execution-receipt
```
