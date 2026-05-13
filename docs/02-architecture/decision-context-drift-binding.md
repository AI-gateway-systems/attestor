# Decision Context Drift Binding

The decision context drift binding checks whether a decision proof still matches the active model, tool, policy, config, prompt, verifier, and simulation context supplied to Attestor.

It is not a model evaluation. It does not claim that a model is safe, accurate, or production-ready. It only proves whether the decision context that was evaluated is still the context being used.

## Why It Exists

Agent behavior can change when a model default changes, a tool schema is edited, a policy bundle is replaced, a verifier changes, or a prompt/config update alters action selection. NIST AI RMF describes AI risk management as continuous across the lifecycle, including production monitoring, risk tracking, and change management. OpenAI agent guidance similarly treats versioned workflows and evals as part of reliable agent deployment.

For Attestor, the safe invariant is:

> A decision proof cannot authorize action if the active model/tool/policy/config context no longer matches the evaluated context.

When drift is detected, Attestor should require review or a fresh simulation. It should not silently reuse old proof.

## Contract

Code:

- `src/consequence-admission/decision-context-drift-binding.ts`

Tests:

- `tests/decision-context-drift-binding.test.ts`
- `npm run test:decision-context-drift-binding`

Failure mode binding:

- `model-tool-config-drift`
- invariant: `decision-context-version-must-be-bound`
- invariant: `trusted-evidence-required`
- invariant: `review-or-block-cannot-auto-promote`

## Required Context

The guard requires these minimum fields:

- model version
- tool schema digest
- policy version
- config digest

It can also bind:

- tool manifest digest
- policy digest
- prompt digest
- verifier digest
- simulation digest
- evaluation timestamp
- expiry timestamp

## Outcomes

- `pass`: bound and current contexts match, required fields are present, context is not expired, and simulation evidence is present when required.
- `review`: a bound context exists, but model/tool/policy/config/prompt/verifier/simulation context drifted, the proof expired, the age budget is exceeded, or a fresh simulation is required.
- `block`: the bound or current context is missing, or required model/tool/policy/config fields are absent.

## Stored Evidence

The output is digest-first:

- bound context digest
- current context digest
- drift dimensions
- missing dimensions
- context age
- threshold values
- reason codes

Raw model versions, policy versions, prompt text, config values, tool definitions, and verifier identifiers are not serialized.

## Sources

- NIST AI RMF 1.0: production monitoring, risk tracking, change management, and lifecycle risk management.
- NIST AI 600-1: generative AI risks vary by lifecycle stage, use context, and system integration.
- OWASP Top 10 for LLM Applications 2025: supply chain, data/model poisoning, excessive agency, and improper output handling motivate version-bound controls around models, tools, data, and application context.
- OpenAI agent/evals guidance: reliable agent workflows require versioned workflows, datasets, trace grading, and evals rather than untracked prompt/model/tool changes.

## Limitation

This binding checks supplied context evidence. It does not independently discover every customer runtime, scan every tool schema, or evaluate model quality. Production use still needs runtime inventory, CI/CD change hooks, trace/eval execution, and customer-owned policy for when drift requires review, new simulation, or block.
