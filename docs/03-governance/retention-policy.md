# Retention Policy Boundary

Status: default repository guidance and customer-controlled retention boundary.

Attestor includes retention classes, replay-window settings, and export
surfaces. It does not impose a universal legal retention schedule. The customer
or operating organization must approve retention based on sector, jurisdiction,
customer contract, and downstream system of record.

Legal anchors:

- [GDPR Regulation (EU) 2016/679](https://eur-lex.europa.eu/eli/reg/2016/679/oj)
- ISO/IEC 27001:2022 records, logging, and data lifecycle controls.

## Repository Defaults And Classes

| Surface | Repository anchor | Retention stance |
|---|---|---|
| Replay/idempotency records | Presentation replay ledger, retry ledger, admin idempotency store. | Short-lived operational retention, configured by runtime settings. |
| Evidence packs | Release evidence pack retention class. | Risk-class-derived: ephemeral, standard, or regulated. |
| Shadow state | Shadow persistence docs and production storage path. | Evaluation file store has no production-retention claim; shared production store must define retention. |
| Billing and usage | Usage ledger and billing event ledger. | Customer billing/accounting retention required. |
| Audit history | Tamper-evident history and audit export. | Internal audit evidence; WORM/SIEM retention is external. |
| Observability | Collector/Loki/Tempo/Prometheus profiles. | Profile-based defaults; live backend retention is external. |

## Minimum Production Questions

Before production use, answer:

1. Which records are legal records of consequence decisions?
2. Which records are operational-only replay controls?
3. Which records contain personal data or customer-confidential data?
4. Which exports must be retained in WORM/SIEM storage?
5. What deletion or anonymization process applies after the retention window?

## Non-Claim

The repository's retention classes do not prove GDPR compliance, SOC 2 privacy
criteria, ISO/IEC 27001 records management, or customer contractual retention.
They provide control hooks for the operator's policy.
