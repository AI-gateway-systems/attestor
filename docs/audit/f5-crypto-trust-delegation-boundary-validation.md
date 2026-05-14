# F5 Crypto Trust Delegation Boundary Validation

Status: `accepted-limitation`

This validation closes F5-B1 as an explicit claim boundary. It does not add a
new wallet verifier, chain reader, bundler, custody adapter, or settlement
oracle. It records what current Attestor code can prove and what must still be
provided by trusted crypto integration adapters.

## Finding

The crypto authorization core is deterministic and policy-bound, but it is not
chain-authoritative by itself. The source code already states this in two core
places:

- `src/crypto-authorization-core/eip712-authorization-envelope.ts` defines typed
  payload and digest coverage only. It does not perform wallet signing,
  secp256k1 recovery, or ERC-1271 validation.
- `src/crypto-authorization-core/replay-freshness-rules.ts` turns validity,
  nonce, expiry, and revocation observations into a fail-closed control plan. It
  does not read chain state or wallet registries.

The remaining risk was language drift: product docs could imply that Attestor
itself verifies on-chain execution truth when current repo evidence shows that
wallet, contract, chain, bundler, custody, facilitator, and solver truth comes
from adapter observations.

## Repository Evidence

The crypto first-integration docs now include a dedicated "Crypto Trust
Delegation Boundary" section.

It states that Attestor can bind a proposed programmable-money consequence to
policy scope, release evidence, replay/freshness posture, nonce requirements,
adapter readiness, and an admission plan.

It also states that Attestor does not independently:

- recover secp256k1 signatures
- call ERC-1271 `isValidSignature`
- read ERC-4337 EntryPoint nonce state
- validate EIP-7702 authorization tuples on chain
- inspect Safe guard or module state
- verify custody policy state
- prove x402 settlement

Those facts require verifiable adapter observation evidence. Without that
evidence, the result remains simulation or admission guidance, not proof that a
downstream crypto action was valid or settled.

## Research Anchors

- EIP-712 defines typed structured data hashing and signing and explicitly does
  not provide replay protection by itself:
  <https://eips.ethereum.org/EIPS/eip-712>
- ERC-1271 defines contract signature validation through
  `isValidSignature(hash, signature)` and requires the magic value on valid
  signatures:
  <https://eips.ethereum.org/EIPS/eip-1271>
- ERC-4337 defines `UserOperation`, EntryPoint validation, nonce handling, and
  bundler validation expectations:
  <https://eips.ethereum.org/EIPS/eip-4337>
- EIP-7702 defines authorization tuples and EOA code delegation behavior:
  <https://eips.ethereum.org/EIPS/eip-7702>
- Safe's February 2025 statement on the Bybit incident describes a disguised
  malicious transaction and emphasizes transaction verifiability as an
  ecosystem challenge:
  <https://safe.global/blog/safe-ecosystem-foundation-statement>

## Accepted Limitation

F5-B1 is not a code exploit in the crypto authorization core. It is a boundary
claim that must remain explicit:

- Attestor can make deterministic admission decisions from supplied crypto
  evidence.
- Attestor can require fail-closed next actions when required adapter evidence
  is missing.
- Attestor cannot claim independent chain-state, wallet-signature, custody, or
  settlement verification unless the integration provides verifiable adapter
  evidence for that fact.

This is not production readiness, not external audit evidence, and not a claim
that every crypto adapter is trustworthy. It is a repo-side claim alignment
control that prevents overclaiming.

## Validation

Run:

```bash
npm run test:f5-crypto-trust-delegation-boundary-validation
npm run test:audit-remediation-tracker
```

The validation checks the source-level trust-delegation comments, the public
integration docs, the remediation tracker status, and the package script.
