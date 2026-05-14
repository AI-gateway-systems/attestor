# F2-AG-9 Constraint Kind Registry Validation

Status: repository-side `fixed` after introducing a machine-readable constraint
kind registry. This is not a production downstream-enforcement guarantee.

Source report:

- F2-AG-9: `narrow` decisions carried free-text constraints, so downstream
  acknowledgement was not tied to a stable machine-readable constraint type.

Repository finding:

- The finding was valid before this remediation. `ConsequenceAdmissionConstraint`
  had only `id`, `summary`, and `enforcedBy`.
- The downstream enforcement contract already avoided leaking raw constraint
  text by exporting digest-only `constraintRefs`, but those refs did not expose
  a stable constraint kind.

Remediation:

- `CONSEQUENCE_ADMISSION_CONSTRAINT_KINDS` now defines the canonical constraint
  kind registry:
  `max-amount`, `recipient-allowlist`, `record-scope`, `time-window`,
  `tool-allowlist`, `policy-ref`, `release-token`,
  `customer-approved-scope`, and `custom`.
- Admission response creation normalizes every constraint into:
  `id`, `kind`, `summary`, `enforcedBy`, and `parameterDigest`.
- Older callers that only provide `id`, `summary`, and `enforcedBy` are
  normalized into a kind by deterministic id inference.
- `parameterDigest` is either `null` or a `sha256:` digest, so private
  thresholds, allowlists, and policy parameters do not need to be exposed as raw
  text in downstream decisions.
- Downstream decisions now carry digest-only `constraintRefs` with `kind` and
  `parameterDigest`, while still omitting raw constraint ids and summaries.

Validation:

- `npm run test:f2-constraint-kind-registry-validation`
- `npm run test:downstream-enforcement-contract`
- `npm run test:consequence-admission-contract`
- `npm run typecheck`
- `npm run typecheck:hygiene`

Remaining limitation:

- This closes the repository contract gap. It does not prove that every customer
  enforcement point actually enforces each constraint kind at runtime.
