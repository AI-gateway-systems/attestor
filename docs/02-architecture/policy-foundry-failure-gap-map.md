# Policy Foundry Failure Gap Map

The Policy Foundry failure gap map turns Attestor's failure-mode registry into an onboarding control checklist.

It answers:

> For each known AI-action failure mode, which control, evidence, authority, audit record, or replay proof is still missing?

This is failure mode -> control -> evidence -> authority -> audit -> replay coverage. It is not a production readiness claim and does not activate enforcement.

## Why It Exists

Policy Foundry already produces readiness, coverage, replay, and policy-candidate artifacts. The gap map connects those artifacts to Attestor's central failure-mode registry so onboarding can focus on the missing controls that matter most.

The intent is practical:

- show which known failure modes are covered
- show which are partially covered
- show which are missing
- show which blocker-severity gaps prevent rollout
- identify the next safe step for each gap

## Contract

Code:

- `src/consequence-admission/policy-foundry-failure-gap-map.ts`

Tests:

- `tests/policy-foundry-failure-gap-map.test.ts`
- `npm run test:policy-foundry-failure-gap-map`

Inputs:

- covered control ids
- present evidence ids
- present authority ids
- present audit record ids
- passed replay failure-mode ids
- optional Policy Foundry coverage digest
- optional Policy Foundry readiness digest

Outputs:

- one entry per failure mode
- status: `covered`, `partial`, or `missing`
- missing controls
- missing evidence
- missing authority
- missing audit records
- replay required / replay passed
- blocker gap count
- next safe step

## Safety Properties

The map is review material only:

- approval required
- no auto-enforcement
- no production readiness claim
- no raw payload storage
- no enforcement activation

The map should make onboarding easier without fabricating coverage. If a customer has not supplied evidence, the output says missing. It does not infer coverage from prose.

## Limitation

This map normalizes supplied evidence. It does not prove live customer workflow integration, downstream verifier adoption, production traffic safety, or reviewer authority. Those must remain separate runtime and customer-environment checks.
