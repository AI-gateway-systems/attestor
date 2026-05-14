# Shared Responsibility Matrix

Status: customer / Attestor responsibility split for evaluation and deployment.

This is the complementary-user-control view: what Attestor can provide, what a
customer must operate, and what remains joint work. It is modeled after the
industry shared-responsibility pattern, not as a contract.

Reference anchor: [AWS Shared Responsibility Model](https://aws.amazon.com/compliance/shared-responsibility-model/).

| Area | Attestor repository provides | Customer / operator owns | Status |
|---|---|---|---|
| TLS termination | NGINX/Kubernetes examples and edge docs. | Certificates, domains, managed ingress, renewal, cipher policy. | Joint. |
| Tenant identity | Tenant API key model, account sessions, MFA/passkey/SAML/OIDC hooks. | Identity provider setup, account lifecycle, access reviews. | Joint. |
| Tenant isolation | Tenant context propagation, API key hashing, release-token tenant binding, RLS helper. | Production data-store topology and live isolation proof. | Joint. |
| Signing and verification | Ed25519 signing, PKI trust binding, CA pin enforcement, verification docs. | Trust-root distribution, key custody choice, verifier rollout. | Joint. |
| Release enforcement | Reference PEPs, middleware, downstream contracts, receipts. | Non-bypassable deployment at every protected downstream system. | Customer-owned deployment. |
| Shadow mode | Shadow events, simulations, activation gates, receipts, readiness checks. | Which workflows enter shadow, operator review, activation approvals. | Joint. |
| Retention | Retention classes, docs, replay-window settings, export surfaces. | Legal retention schedule, WORM/SIEM, deletion workflow, DPA terms. | Customer-owned policy. |
| Backups and DR | Snapshot tooling, PITR bundle, rehearsal docs, F8 validation. | Managed backups, RTO/RPO approval, restore drills in target infra. | Joint. |
| Incident response | Degraded-mode grants, dead-letter records, alerting evidence shape. | Incident commander, communication, escalation, postmortem. | Customer-owned process. |
| Vendor risk | Provider inventory template and supply-chain guard. | Vendor due diligence, contracts, DPAs, ongoing review. | Customer-owned process. |
| Compliance mapping | Engineering-anchor docs and evidence exports. | Audit scope, control owners, auditor engagement, final assertions. | Customer-owned assurance. |

## Deployment Rule

Repo-side readiness is not live production readiness. A customer-operated
deployment needs target-specific environment configuration, restart proof,
readiness probes, webhook smoke tests, storage backups, observability delivery,
and operational review before production claims are defensible.
