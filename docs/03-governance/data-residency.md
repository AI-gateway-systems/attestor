# Data Residency Posture

Status: deployment boundary, not a built-in region pinning guarantee.

Attestor's repository does not implement per-tenant regional pinning by itself.
Region, database location, object storage location, queue location, log backend,
and vendor subprocessor location are deployment choices owned by the operator.

Legal anchors:

- [GDPR Regulation (EU) 2016/679](https://eur-lex.europa.eu/eli/reg/2016/679/oj)
- [EU AI Act Regulation (EU) 2024/1689](https://eur-lex.europa.eu/eli/reg/2024/1689/oj)

## Repository Posture

| Data surface | Repository behavior | Residency boundary |
|---|---|---|
| Admission and decision records | Digest-first contracts and data-minimization controls. | Stored where the operator deploys the backing store. |
| Shadow events | Redaction and witness fields; production-shared storage gates. | Region follows chosen shared store. |
| Audit evidence | Exportable evidence packets and review artifacts. | Export destination and retention are operator-owned. |
| Logs and telemetry | Secret-safe output and observability bundles. | Collector/backend region is operator-owned. |
| LLM calls | Optional OpenAI wrapper. | Provider data processing region/policy must be approved separately. |
| Payment webhooks | Stripe webhook verification. | Stripe account/provider geography is operator-owned. |

## Claim Boundary

Safe wording:

> Attestor supports data-minimized, digest-first evidence and can run inside a
> customer-selected deployment region.

Unsafe wording:

> Attestor guarantees EU-only processing or per-tenant regional pinning.

That stronger claim requires deployment evidence, provider terms, configured
regions, and tests over the live environment.
