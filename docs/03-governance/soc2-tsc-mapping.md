# SOC 2 TSC Engineering Anchor Mapping

Status: engineering-anchor mapping for Attestor controls.

This is not a SOC 2 report, not a Type I or Type II audit, and not external
assurance. It maps repository evidence to the AICPA Trust Services Criteria so
an auditor, customer security team, or internal reviewer can see what exists and
what remains organizational or deployment work.

Official anchor: [AICPA 2017 Trust Services Criteria with revised points of
focus, 2022](https://www.aicpa-cima.com/resources/download/2017-trust-services-criteria-with-revised-points-of-focus-2022).

## Scope

Attestor can provide evidence for controls that are represented in code,
configuration, docs, tests, signed artifacts, or runtime records. It cannot
complete entity-level SOC 2 criteria by itself. Hiring, training, board
oversight, vendor review process, legal notices, customer communication, and
live operational sampling remain organization-owned.

## Mapping

| SOC 2 area | Repository anchor | Status |
|---|---|---|
| CC1 control environment | Security posture and no-overclaim rules in `SECURITY.md`, `README.md`, and this governance folder. | Partial; organization-owned evidence still required. |
| CC2 communication and information | Public docs, OpenAPI contracts, architecture docs, audit tracker, and research provenance ledger. | Strong repository anchor. |
| CC3 risk assessment | `failure-mode-registry.ts`, guard coverage docs, and F1-F9 remediation tracker entries. | Strong repository anchor. |
| CC4 monitoring | Health/readiness/startup contracts, production rehearsal tests, observability docs, and F8 validation. | Repository anchor; live monitoring remains deployment proof. |
| CC5 control activities | Consequence-admission guards, release enforcement plane, signing validation, downstream contracts, and focused tests. | Strong repository anchor. |
| CC6 logical access | Tenant isolation, account sessions, MFA, passkeys, SAML/OIDC, tenant API keys, and admin route boundaries. | Repository anchor; live identity provider setup remains external. |
| CC7 system operations | Dead-letter handling, webhook signature tests, incident/degraded-mode docs, readiness gates, and audit logs. | Partial; incident process remains organizational. |
| CC8 change management | PR-driven tracker, validation docs, signed release artifacts, and package-surface tests. | Strong repository anchor. |
| CC9 risk mitigation | Supply-chain guard, provider inventory, shared-responsibility matrix, and runtime no-go boundaries. | Partial; vendor due diligence process remains organizational. |
| Availability | HA/DR compose files, Kubernetes probes, production rehearsal docs, backup/restore DR doc. | Partial; live RTO/RPO drills remain deployment proof. |
| Processing integrity | Deterministic admission decisions, evidence packs, release decisions, replay ledgers, and tamper-evident history. | Strong repository anchor. |
| Confidentiality | Data minimization policy, secret-safe output tests, secret envelope, no-raw-payload docs. | Strong repository anchor; customer retention/access policy remains external. |
| Privacy | Data minimization, privacy notice template, and GDPR boundary docs. | Partial; notice, DPA, data-subject process, and legal basis remain organizational. |

## Evidence Boundary

The existing `audit-evidence-export` surface is AI-decision evidence. It is not
a SOC 2 Type II evidence pack by itself. SOC 2 review still needs sampled access
logs, change approvals, incident records, vendor review records, control-owner
attestations, and live monitoring evidence for the audit period.

## Recommended Auditor Packet

For a SOC 2-oriented review, start with:

- `docs/audit/attestor-audit-remediation-tracker.md`
- `docs/research/attestor-research-provenance-ledger.md`
- `docs/03-governance/shared-responsibility-matrix.md`
- `docs/03-governance/segregation-of-duties.md`
- `docs/03-governance/third-party-providers.md`
- `docs/03-governance/security-testing.md`
- `docs/03-governance/retention-policy.md`
- `docs/03-governance/cryptography-policy.md`
