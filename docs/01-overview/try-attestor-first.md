# Try Attestor First

Use this when you want the shortest local run before reading the deeper architecture docs.

```bash
npm ci
npm run demo:golden-refund
```

The demo renders the current Golden Path: Refund as Markdown by default. It
uses safe local refund examples and shows the basic path:

```text
proposed refund -> Attestor decision -> proof refs -> downstream gate shape
```

This is a local safety example: no refund is executed and no external service
is called. Live deployment is separate.

To see the machine-readable form, run:

```bash
npm run demo:golden-refund -- --json
```

To see the decision-relevant determinism check, run:

```bash
npm run demo:golden-refund -- --determinism-check
```

To try one strict, local reviewer-supplied refund input, run:

```bash
npm run demo:golden-refund -- --scenario fixtures/golden-refund-reviewer-sandbox.example.json
```

To see the smaller admission example behind that path, run:

```bash
npm run example:admission
```

The demo shows two refund outcomes:

- one is admitted and allowed to proceed
- one is blocked fail-closed before the downstream action happens

In both cases, the shape is the same:

```text
proposed consequence -> Attestor admission decision -> proof refs -> downstream gate
```

## What You Should See

The Golden Path output is grouped into practical parts:

- **Decision trail:** what was proposed, what was checked, why it was allowed or held, and which proof references were used.
- **Scenario coverage:** 8 synthetic refund scenarios across normal, missing evidence, stale evidence, repeated refund, approval-required, instruction-like evidence text, external risk signal, and over-policy amount.
- **Checks and reasons:** gate order, derived metrics, reason codes, and digest stability.
- **Reviewer input:** one schema-bound local refund JSON input through the same shadow-only path.
- **Safety boundary:** no target-system call, policy activation, or auto-enforcement.
- **Pilot readiness:** whether the local path is ready for a shadow pilot.

This is the simplest way to see Attestor's role: proof first, action second.

To see the stronger customer-side shape after that, run:

```bash
npm run example:non-bypassable-gateway
```

That demo shows a payment adapter whose dispatch function is only reachable after the verifier helper allows the Attestor admission.

To see how an agent can retry a held action without probing the gateway, run:

```bash
npm run example:agent-retry-wrapper
```

That demo shows model-safe feedback, retry attempt binding, retry budget evaluation, and attempt-ledger duplicate handling.

To start from a safe OpenAPI description, run:

```bash
npm run example:action-surface-onboarding
```

That example turns existing API metadata into review material: possible actions,
draft integration files, missing controls, and next onboarding steps. It does
not deploy a gateway or activate enforcement.

To render the fuller local review package from that same OpenAPI example, run:

```bash
npm run example:action-surface-integration-kit
```

That package adds the machine summary, artifact manifest, approval template,
OpenAPI/Envoy/MCP drafts, and no-bypass probe definitions. It prepares review
files; applying infrastructure and proving the customer gate are separate steps.

## Boundary

This page is for local examples. Hosted API calls, generated integration files,
crypto or wallet paths, and domain selection are covered by their own docs.
Customer systems still choose the relevant Attestor path explicitly.

## Where To Go Next

- Need the shared admission vocabulary? Read [Consequence Admission Quickstart](consequence-admission-quickstart.md).
- Need to wire the decision into your own app? Read [Customer admission gate](customer-admission-gate.md).
- Need to see the no-bypass adapter shape? Read [Non-bypassable gateway demo](non-bypassable-gateway-demo.md).
- Need bounded agent retries? Read [Agent retry wrapper demo](agent-retry-wrapper-demo.md).
- Need to start from existing API metadata? Run `npm run example:action-surface-onboarding` and read [Action surface onboarding packet](../02-architecture/action-surface-onboarding-packet.md).
- Need the review package? Run `npm run example:action-surface-integration-kit` and read [Action surface integration kit buildout](../02-architecture/action-surface-integration-kit-buildout.md).
- Need the first hosted call after signup? Read [First hosted API call](hosted-first-api-call.md).
- Need current package/adapter boundaries? Read [Finance and crypto first integrations](finance-and-crypto-first-integrations.md).
- Need pricing, evaluation, or hosted trial details? Read [Commercial packaging, pricing, and evaluation](product-packaging.md).
