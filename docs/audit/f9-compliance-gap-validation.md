# F9 Compliance Gap Validation

Status: closure record for the project-owner supplied F9 compliance gap
analysis.

Baseline: current `origin/master` at the time of this validation slice.

This document closes the repository-side documentation queue for SOC 2,
ISO/IEC 27001:2022, and ISO/IEC 42001:2023 alignment. It is not external
assurance, not a SOC 2 report, not an ISO management-system audit, and not proof
of a live production control environment.

## Scope

F9 covers compliance-facing documentation gaps:

- framework mappings for SOC 2 TSC, ISO/IEC 27001:2022, and ISO/IEC 42001:2023
- evidence boundary between AI-decision artifacts and formal auditor evidence
- data residency, retention, cryptography, privacy, vendor, and testing posture
- segregation of duties and shared responsibility
- business-continuity / DR documentation evidence
- accessibility and bias boundary for AI governance

Primary repository evidence:

- `docs/03-governance/soc2-tsc-mapping.md`
- `docs/03-governance/iso27001-2022-annex-a-mapping.md`
- `docs/03-governance/iso42001-2023-annex-a-mapping.md`
- `docs/03-governance/compliance-evidence-boundary.md`
- `docs/03-governance/shared-responsibility-matrix.md`
- `docs/03-governance/segregation-of-duties.md`
- `docs/03-governance/third-party-providers.md`
- `docs/03-governance/data-residency.md`
- `docs/03-governance/retention-policy.md`
- `docs/03-governance/security-testing.md`
- `docs/03-governance/cryptography-policy.md`
- `docs/03-governance/privacy-notice-template.md`
- `docs/03-governance/ai-accessibility-bias-boundary.md`
- `docs/08-deployment/backup-restore-dr.md`
- `tests/f9-compliance-gap-validation.test.ts`

## Standards Anchors

- AICPA SOC 2 Trust Services Criteria: engineering evidence can support a SOC 2
  review, but the report and audit period remain external.
- ISO/IEC 27001:2022: Attestor can anchor technological controls and selected
  organizational evidence; the ISMS remains organization-owned.
- ISO/IEC 42001:2023: Attestor aligns strongly with AI lifecycle, risk,
  transparency, and evidence-management objectives, but does not certify
  upstream model behavior.
- GDPR and EU AI Act: Attestor supports data minimization and evidence
  traceability, while legal basis, notices, transfer mechanisms, and use-case
  classification remain deployment/legal work.
- NIST SP 800-115 and NIST AI RMF: used as security-testing and AI-risk
  orientation anchors.

## Validation Summary

| F9 ID | Report claim | Repository status | Validation result |
|---|---|---|---|
| F9-C1 | `regulatory-alignment.md` lacks SOC 2 / ISO 27001 / ISO 42001 mappings. | New dedicated mapping docs exist and are linked from `regulatory-alignment.md`. | `fixed` |
| F9-C2 | `audit-evidence-export` label could imply SOC 2 Type II evidence. | `soc2-tsc-mapping.md` and `compliance-evidence-boundary.md` state the existing export is AI-decision evidence, not a SOC 2 evidence pack. | `accepted-limitation` |
| F9-C3 | No data residency or regional pinning posture. | `data-residency.md` documents deployment-owned region pinning and safe/unsafe claims. | `fixed` |
| F9-C4 | No explicit retention/disposal policy. | `retention-policy.md` documents repository retention classes, operational retention, and external legal retention ownership. | `fixed` |
| F9-C5 | Segregation-of-duties policy missing. | `segregation-of-duties.md` defines roles, two-person high-risk activation, and break-glass boundaries. | `fixed` |
| F9-C6 | Vendor / third-party risk management for upstream providers missing. | `third-party-providers.md` lists provider classes, OpenAI boundary, and required provider evidence. | `fixed` |
| F9-C7 | Business continuity / DR policy needs RTO/RPO posture. | Existing `backup-restore-dr.md` already includes RPO / RTO guidance and current DR boundaries; F9 test now asserts it. | `fixed` |
| F9-C8 | Accessibility and bias posture missing. | `ai-accessibility-bias-boundary.md` separates Attestor consequence evidence from upstream model fairness/accessibility proof. | `fixed` |
| F9-C9 | Penetration/security-testing posture undocumented. | `security-testing.md` maps local tests, audit validation, and external pentest/drill expectations. | `fixed` |
| F9-C10 | Cryptographic policy / key-management doc gap. | `cryptography-policy.md` records signing, trust root, canonicalization, transparency-log, and KMS/HSM boundaries. | `fixed` |
| F9-C11 | Public privacy notice / data-flow template missing. | `privacy-notice-template.md` provides customer-adaptable notice language and data categories. | `fixed` |
| F9-C12 | Shared-responsibility model implicit. | `shared-responsibility-matrix.md` splits Attestor repository evidence from customer/operator responsibilities. | `fixed` |

## Corrected F9 Queue

The F9 queue is closed for planned repository documentation work in this slice.

Closed outright:

1. F9-C1 framework mappings.
2. F9-C3 data residency posture.
3. F9-C4 retention policy boundary.
4. F9-C5 segregation of duties.
5. F9-C6 third-party provider inventory.
6. F9-C7 BC/DR documentation validation.
7. F9-C8 AI accessibility and bias boundary.
8. F9-C9 security-testing posture.
9. F9-C10 cryptography policy.
10. F9-C11 privacy notice template.
11. F9-C12 shared responsibility matrix.

Closed as an explicit limitation:

1. F9-C2: the repository evidence export is AI-decision evidence. SOC 2 Type II
   auditor evidence still needs external audit-period logs, access reviews,
   incident records, change approvals, and control-owner evidence.

## Go / No-Go

| Claim | Verdict |
|---|---|
| Attestor is SOC 2 Type II audited | Do not claim. |
| Attestor is ISO/IEC 27001 or ISO/IEC 42001 audited | Do not claim. |
| Attestor has SOC 2 / ISO engineering-anchor mappings | Holds for repository docs. |
| Attestor has a shared-responsibility matrix | Holds for repository docs. |
| Attestor has a privacy notice template | Holds for repository docs. |
| Attestor has a data-residency guarantee | Do not claim. Deployment evidence required. |
| Attestor has a complete vendor-risk program | Do not claim. Provider inventory exists; due diligence remains organizational. |
| Attestor has a complete SOC 2 Type II evidence pack | Do not claim. AI-decision evidence is not full auditor evidence. |

## Validation

- `npm run test:f9-compliance-gap-validation`
- `npm run test:audit-remediation-tracker`
- `npm run test:research-provenance-ledger`
