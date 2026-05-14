# ISO/IEC 27001:2022 Engineering Anchor Mapping

Status: repository control mapping for ISO/IEC 27001:2022 alignment.

This is not an ISO/IEC 27001 certification claim and not an ISMS by itself. It
maps Attestor evidence to the control themes that a customer or auditor would
ask for when evaluating an information-security management system.

Official anchor: [ISO/IEC 27001:2022](https://www.iso.org/standard/27001).

## Scope

ISO/IEC 27001 is an organization-level management system standard. Attestor can
support technical controls, control evidence, and deployment guidance. The
customer or operating organization still owns the ISMS, risk treatment plan,
statement of applicability, internal audit, management review, supplier review,
HR process, physical security, and certification audit.

## Annex A Theme Mapping

| Theme | Repository anchor | Status |
|---|---|---|
| A.5 Organizational controls | Governance docs, shared responsibility matrix, provider inventory, regulatory alignment, incident/degraded-mode docs, change tracker. | Partial; many controls are process-owned. |
| A.6 People controls | No repository control can prove hiring, screening, training, disciplinary process, or offboarding. | Out of scope. |
| A.7 Physical controls | No repository control can prove office, datacenter, media, or facility security. | Out of scope. |
| A.8 Technological controls | Tenant isolation, authentication, cryptography, secure logging, backup/restore, secure development tests, data minimization, deployment hardening, supply-chain checks. | Strong repository anchor. |

## Selected Control Anchors

| ISO/IEC 27001:2022 area | Attestor evidence |
|---|---|
| Information security roles and responsibilities | `segregation-of-duties.md`, `control-plane-roles.ts`, account role tests. |
| Segregation of duties | Shadow high-risk two-person activation, break-glass hardening, SoD policy doc. |
| Supplier relationships | `third-party-providers.md`, agentic supply-chain guard, package/security tests. |
| Information transfer and data residency | `data-residency.md`, tenant isolation, data minimization policy. |
| ICT readiness for business continuity | `backup-restore-dr.md`, production rehearsal docs, F8 validation. |
| Identity management and access control | Tenant API key store, account sessions, MFA, passkeys, SAML/OIDC. |
| Data leakage prevention | Data-minimization scanner, secret-safe output tests, forbidden raw classes. |
| Logging and monitoring | Audit logs, tamper-evident history, observability docs, runtime health contract. |
| Use of cryptography | `cryptography-policy.md`, signing validation, PKI trust binding, certificate tests. |
| Secure development and testing | Package runner, typecheck, hygiene checks, security tests, remediation tracker. |

## Open Organizational Evidence

Before claiming ISO/IEC 27001 conformity, the operating organization needs at
least these non-repository artifacts:

- scoped ISMS and statement of applicability
- risk assessment and risk treatment records
- management review and internal audit records
- security awareness and HR lifecycle evidence
- physical/environmental controls
- supplier due-diligence records
- customer-facing incident communication process
- live backup, restore, access-review, and monitoring samples
