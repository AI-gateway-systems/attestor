# No-Go Condition Ledger

The no-go condition ledger is a deterministic hold-state contract for consequence admission.

If a fraud hold, legal hold, compliance hold, security hold, privacy hold, risk hold, production freeze, or customer-defined no-go is active, Attestor must block the action. Natural-language rationale from an AI, customer email, chat message, tool output, or summary cannot override the hold.

## Why It Exists

NIST AI RMF treats AI risk management as lifecycle governance with escalation, monitoring, and risk response. High-impact agentic systems need interrupt and block controls when policy or operational state says the action must not proceed. Legal, fraud, compliance, and security holds are not model-quality questions; they are authority and workflow boundaries.

The invariant is:

> A no-go hold dominates natural-language intent.

## Contract

Code:

- `src/consequence-admission/no-go-condition-ledger.ts`

Tests:

- `tests/no-go-condition-ledger.test.ts`
- `npm run test:no-go-condition-ledger`

Failure mode binding:

- `no-go-hold-bypass`
- invariant: `no-go-hold-overrides-natural-language`
- invariant: `review-or-block-cannot-auto-promote`
- invariant: `human-review-packet-must-highlight-risk`

## Hold Kinds

The ledger recognizes:

- fraud hold
- legal hold
- compliance hold
- security hold
- privacy hold
- risk hold
- production freeze
- customer-defined hold

## Outcomes

- `pass`: a supplied ledger has no active or pending hold, and no natural-language bypass attempt is present.
- `review`: a hold is pending review, source provenance is untrusted, owner/authority/validity evidence is missing, or hold timestamps are malformed.
- `block`: the ledger is missing, any no-go condition is active, or a natural-language bypass attempt is present.

## Stored Evidence

The ledger is digest-first:

- ledger reference digest
- bypass attempt reference digest
- condition reference digest
- source reference digest
- owner reference digest
- owner authority digest
- scope digest
- release digest
- state and kind
- reason codes

It does not serialize raw hold references, private case identifiers, customer messages, reviewer identifiers, or natural-language bypass text.

## Limitation

This ledger evaluates supplied hold records. It does not independently connect to every customer fraud, legal, compliance, security, privacy, risk, or production-freeze system. Production use still requires customer-owned source-of-truth integrations and downstream enforcement adoption.
