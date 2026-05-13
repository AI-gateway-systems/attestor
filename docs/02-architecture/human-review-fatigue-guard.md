# Human Review Fatigue Guard

The human review fatigue guard is a deterministic review-packet hygiene contract for Attestor review surfaces.

It does not certify human performance, measure live reviewer capacity, or claim production readiness. It checks whether a review packet is compact enough, prioritized enough, and explicit enough that a reviewer is not forced to hunt for no-go states, missing evidence, or the next safe step. It can also evaluate aggregate reviewer-behavior signals when a review surface supplies them.

## Why It Exists

Human review is not automatically safe. In NIST AI 600-1, the Human-AI Configuration risk includes automation bias, over-reliance, and inappropriate trust in generative AI outputs. Microsoft agent governance guidance also treats human oversight, escalation paths, logging, and lifecycle monitoring as explicit operational controls rather than informal review habits.

For Attestor, that means a review packet must not be a long undifferentiated dump of findings. The packet must surface:

- no-go states
- missing evidence
- reviewer focus areas
- the next safe step
- digest-bound evidence cards
- an explicit approval requirement

The review workflow also needs aggregate behavior signals once there is enough review history. A queue with a visible approval step is not enough evidence by itself if the reviewer population is concentrated, approval rate is unusually high, or decision latency suggests rubber-stamping.

## Contract

Code:

- `src/consequence-admission/human-review-fatigue-guard.ts`

Tests:

- `tests/human-review-fatigue-guard.test.ts`
- `npm run test:human-review-fatigue-guard`

Failure mode binding:

- `human-review-fatigue`
- invariant: `human-review-packet-must-highlight-risk`
- invariant: `trusted-evidence-required`
- invariant: `no-go-hold-overrides-natural-language`

## Outcomes

- `pass`: the review packet is compact, digest-first, approval-gated, and highlights no-go / missing-evidence / focus / next-step state.
- `review`: the packet is not unsafe, but is too noisy, missing a focus area, missing a missing-evidence summary, missing the next safe step, exceeds review-load thresholds, lacks aggregate behavior telemetry after enough decisions, or shows high approval rate, very low decision latency, reviewer concentration, or a long consecutive approval run.
- `block`: the packet is missing, hides no-go state, stores raw payload, requests auto-enforcement, removes approval, or fails to put blockers first.

## Default Thresholds

The guard uses conservative defaults:

- max review items: 12
- max low-priority ratio: 0.5
- max reviewer instruction count: 5
- max estimated review minutes: 12
- min review decisions before behavior signals are evaluated: 10
- max approval ratio: 0.95
- min median decision seconds: 8
- min distinct reviewers: 2
- max consecutive approvals: 20

These thresholds are not universal human-factors constants. They are safe defaults for deterministic packet hygiene and reviewer-behavior anomaly detection. Customer environments should tune them with live reviewer telemetry before claiming operational capacity.

## What Is Stored

The guard stores digest-first evidence:

- review packet reference digest
- item counts
- low-priority ratio
- blocker / no-go / missing-evidence counts
- focus area count
- evidence card count
- reviewer instruction count
- estimated review time
- threshold values
- reason codes
- review decision count
- approved decision count and derived approval ratio
- distinct reviewer count
- median and minimum decision seconds
- consecutive approval count
- whether reviewer-behavior telemetry was supplied

It does not serialize raw packet references, raw reviewer notes, raw prompts, raw payloads, or private reviewer identity.

## Sources

- NIST AI 600-1, Artificial Intelligence Risk Management Framework: Generative Artificial Intelligence Profile: Human-AI Configuration risk, automation bias, over-reliance, and information integrity.
- NIST AI RMF 1.0: govern, map, measure, and manage AI risks across lifecycle context.
- Microsoft Copilot Studio agentic AI governance guidance: human oversight, escalation paths, logging, monitoring, and risk-based agent governance.
- Automation bias systematic-review literature: automated decision support can increase inappropriate reliance unless review workflows are designed and monitored.

## Limitation

This guard makes review-packet quality and aggregate reviewer-behavior signals machine-checkable. It does not prove that a reviewer read the packet, had enough domain expertise, had enough time, or made the correct business decision.

Live production readiness still requires customer workflow integration, reviewer authority, reviewer capacity evidence, escalation ownership, and operational telemetry.
