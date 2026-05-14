# Privacy Notice Template

Status: customer-adaptable template.

This is not legal advice and not a complete privacy notice. It gives operators a
starting point for describing Attestor's data categories and control boundaries.

Legal anchors:

- [GDPR Regulation (EU) 2016/679](https://eur-lex.europa.eu/eli/reg/2016/679/oj)
- ISO/IEC 27001:2022 privacy and PII protection controls.

## Suggested Notice Language

> We use Attestor to evaluate, prove, and audit whether AI-generated or
> automated actions may proceed before they affect downstream systems. Attestor
> is configured to prefer digests, metadata, policy references, evidence
> references, and redacted review material over raw prompts, raw tool payloads,
> credentials, payment details, wallet material, or private policy thresholds.

## Data Categories

Potential categories, depending on deployment:

- tenant and account identifiers
- admission IDs, decision IDs, policy refs, and proof refs
- action metadata and downstream system identifiers
- digest-bound evidence references
- reviewer or operator references
- audit timestamps and replay keys
- billing or usage records for hosted deployments

## Data The System Should Avoid

Attestor public docs, proof packets, telemetry, and review material should not
include raw prompts, raw model/tool payloads, credentials, provider secrets,
payment details, wallet keys, private thresholds, database URLs, or webhook
secrets.

## Customer-Specific Sections To Add

- controller / processor roles
- legal basis
- retention periods
- subprocessors and regions
- data subject request process
- incident contact
- deletion and export process
- security measures
