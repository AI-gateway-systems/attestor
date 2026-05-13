# F3-R4 Human Review Fatigue Behavior Telemetry

This audit record captures the F3-R4 follow-up from the cross-cutting agentic guard audit.

It is not complete production enforcement, not an external audit, not a certification, and not a production readiness claim.

## Finding Addressed

The F3 cross-cutting audit found that the human review fatigue guard checked review-packet quality but did not detect reviewer behavior patterns that can make review ineffective.

The concrete risk was treating the presence of a human approval step as enough evidence even when aggregate behavior suggests rubber-stamping:

```text
review packet exists + approval step exists
  !=
effective human oversight
```

## Implemented Control

F3-R4 adds digest-first, aggregate reviewer-behavior telemetry to the existing human review fatigue guard:

- review decision count
- approved decision count
- derived approval ratio
- distinct reviewer count
- median and minimum decision seconds
- consecutive approval count
- explicit reviewer-behavior telemetry presence flag

The guard now routes to `review` when there are enough review decisions and behavior telemetry is missing, or when supplied telemetry shows high approval rate, very low median decision time, reviewer concentration, or a long consecutive approval run.

## Protected Principles

- customer authority
- no overclaim
- auditability
- fail-closed boundary

## Repository Evidence

Code evidence:

- `src/consequence-admission/human-review-fatigue-guard.ts`

Test evidence:

- `tests/human-review-fatigue-guard.test.ts`
- package script: `npm run test:human-review-fatigue-guard`

Documentation evidence:

- `docs/02-architecture/human-review-fatigue-guard.md`
- this audit record

## Status

Status: repository-side guard hardening implemented.

Not complete:

- This does not prove live reviewer capacity.
- This does not prove reviewer intent or domain expertise.
- This does not activate production enforcement.
- This does not collect private reviewer identities or raw reviewer notes.
- Customer review systems must still supply truthful aggregate telemetry before this signal is meaningful.

Next required hardening: integrate this signal into hosted review surfaces and any customer review queue that claims fatigue/rubber-stamp monitoring.
