# ISO/IEC 42001:2023 Engineering Anchor Mapping

Status: AI-management-system engineering anchor mapping.

This is not an ISO/IEC 42001 certification claim. It shows where Attestor's
AI-governance runtime already creates evidence that is relevant to an AI
management system, and where organizational controls remain outside the repo.

Official anchor: [ISO/IEC 42001:2023](https://www.iso.org/standard/81230.html).
Supporting public anchor: [NIST AI RMF](https://www.nist.gov/itl/ai-risk-management-framework).

## Why ISO/IEC 42001 Fits Attestor

Attestor is not an AI model provider. Its job is to decide, prove, and audit
AI-generated actions before they change real systems. That maps naturally to AI
governance evidence: risk classification, control objectives, lifecycle gates,
data minimization, transparency packets, and deployment responsibility splits.

## Annex A Objective Mapping

| ISO/IEC 42001 objective area | Repository anchor | Status |
|---|---|---|
| A.2 AI policies | Failure-mode registry, protected principles, policy and no-go docs. | Strong repository anchor. |
| A.3 AI roles and responsibilities | Control-plane roles, reviewer queue, customer gate, SoD policy. | Repository anchor; customer org adoption remains external. |
| A.4 Resources for AI systems | Data minimization policy, evidence packs, policy foundry workflow, release layers. | Strong repository anchor. |
| A.5 AI impact assessment | Consequence taxonomy, risk classes, scope-explosion guard, recipient/tenant boundary. | Strong repository anchor. |
| A.6 AI system lifecycle | Shadow ladder, activation gates, release policy control plane, guard activation readiness. | Strong repository anchor. |
| A.7 Data for AI systems | Digest-first evidence, redaction policy, tool-result poisoning guard, no raw prompt storage boundary. | Strong repository anchor. |
| A.8 Information for interested parties | External review packet, audit evidence export, dashboards, public docs. | Partial; customer notices remain external. |
| A.9 Use of AI systems | Downstream enforcement contract, execution receipt, customer gate, release enforcement plane. | Partial; customer PEP deployment remains external. |
| A.10 Third-party relationships | Third-party provider doc, agentic supply-chain guard, provider evidence boundaries. | Partial; vendor due-diligence process remains organizational. |

## Explicit Non-Claims

Attestor does not certify that an upstream model is safe, unbiased, lawful, or
fit for purpose. It also does not replace the deployer's AI impact assessment,
human oversight program, privacy notice, incident process, vendor review, or
legal review. It gives those processes better evidence.

## Best Starting Evidence

- `docs/03-governance/shared-responsibility-matrix.md`
- `docs/03-governance/ai-accessibility-bias-boundary.md`
- `docs/02-architecture/failure-mode-runtime-extensions.md`
- `docs/02-architecture/data-minimization-redaction-policy.md`
- `docs/audit/attestor-audit-remediation-tracker.md`
- `docs/research/attestor-research-provenance-ledger.md`
