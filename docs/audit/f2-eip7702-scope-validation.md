# F2-AG-3 EIP-7702 Delegation Scope Validation

Status: `partial`.

This note validates the project-owner supplied finding that an EIP-7702
delegation can turn one admitted account-delegation action into broader
delegated execution unless scope, nonce, delegate-code, and runtime evidence are
bound before execution.

## Scope

Files inspected:

- `src/crypto-authorization-core/eip7702-delegation-adapter.ts`
- `src/crypto-execution-admission/delegated-eoa.ts`
- `src/crypto-authorization-core/replay-freshness-rules.ts`
- `src/crypto-authorization-core/object-model.ts`
- `src/crypto-authorization-core/policy-control-plane-scope-binding.ts`
- `tests/crypto-authorization-core-eip7702-delegation-adapter.test.ts`
- `tests/crypto-execution-admission-delegated-eoa.test.ts`
- `tests/crypto-authorization-core-replay-freshness.test.ts`
- `tests/crypto-authorization-core-policy-scope-binding.test.ts`

Research anchor:

- EIP-7702 defines a set-code transaction with an authorization list and an
  authorization tuple containing `chain_id`, `address`, `nonce`, `y_parity`,
  `r`, and `s`.
- The EIP also allows `chain_id = 0`, which makes the authorization valid on
  any chain and therefore requires explicit policy treatment.
- Source: `https://eips.ethereum.org/EIPS/eip-7702`.

## Validation Result

The original finding is stale if it says Attestor has no EIP-7702 delegation
scope gate.

The repo has multiple EIP-7702 controls:

- `eip7702-delegation-adapter.ts` models the authorization tuple, delegate-code
  posture, account code state, authorization list, execution path, call scope,
  initialization, sponsor posture, recovery posture, and post-execution status.
- Universal chain authorization (`chainId = 0`) blocks by default and only
  passes when `allowUniversalChainAuthorization` is explicitly true.
- Nonce checks bind the authorization tuple nonce to the observed authority
  nonce and the Attestor replay constraint.
- The authorization list must be non-empty, correctly indexed, and the tuple
  must be the last valid occurrence for the authority.
- Delegated execution requires signed target/calldata, value, gas, nonce,
  expiry, and runtime context.
- The delegated EOA handoff keeps runtime execution behind expectations for
  authorization tuple, authority nonce, delegate code, account code state,
  execution path, wallet capability, initialization, sponsorship, recovery, and
  post-execution status.
- Existing tests prove wrong chain blocks, universal chain authorization
  requires opt-in, stale nonce blocks, unsigned call scope blocks, wrong target
  blocks, bad delegate code blocks, unsafe pending transaction posture blocks,
  missing wallet capability pauses execution, and runtime failure blocks.

The finding remains valid in a narrower form.

The current model does not expose a single explicit delegated-scope contract
with fields such as:

```text
delegationScope.maxTransactions
delegationScope.maxCumulativeValue
delegationScope.windowSeconds
delegationScope.scopeDigest
```

Instead, the scope is distributed across intent constraints, policy dimensions,
delegate-code capability assertions, execution evidence, and runtime handoff
expectations. That is useful, but it makes "admit this exact bounded delegated
authority" harder to prove as one machine-readable contract.

## Corrected Finding

F2-AG-3 should not say "EIP-7702 delegation has no scope controls." That is
stale.

It should say:

```text
Attestor has EIP-7702 chain, nonce, authorization-list, delegate-code, call-scope,
and runtime handoff gates. The remaining gap is that delegated authority scope
is distributed across several objects instead of being represented as one
explicit cumulative delegated-scope contract. Before this is fixed, the EIP-7702
path should expose and test a bounded delegation-scope object for transaction
count, cumulative value, validity window, and scope digest.
```

## Remaining Work

Before this can be marked `fixed`, the EIP-7702 path needs a repo-proven
delegation-scope contract with at least:

- maximum transaction count or explicit single-use declaration
- cumulative value ceiling
- validity window tied to the signed call scope
- chain and universal-chain authorization mode
- target/function/calldata class binding
- replay nonce binding
- delegate-code digest and capability binding
- runtime observation or receipt linkage
- failure mode when the delegated scope is missing, too broad, stale, or not
  signed by the authority

Current repo evidence supports `partial`, not `fixed`.

## Tests

Focused test:

```bash
npm run test:f2-eip7702-scope-validation
```

Related tests:

```bash
npm run test:crypto-authorization-core-eip7702-delegation-adapter
npm run test:crypto-execution-admission-delegated-eoa
npm run test:crypto-authorization-core-replay-freshness
npm run test:crypto-authorization-core-policy-scope-binding
```
