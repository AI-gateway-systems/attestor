# F4-LLM01-A Trust Class PKI Proof Validation

Status: repository-side `fixed` for the scoped finding.

Source report:

- F4-LLM01-A: indirect prompt injection could still abuse operator-asserted
  trust labels if `signed-attestation` or `signed-authority` was accepted from
  caller-provided booleans instead of verified proof.

Repository finding:

- The concern was valid after the earlier F3 guard pass. The repo rejected raw
  trust-class promotion and required `signatureVerified`, but that still left a
  caller-asserted verification state.

Remediation:

- `tool-result-poisoning-guard` now requires `signed-attestation` claims to
  carry PKI verification input that passes `verifyPkiBoundCertificate`.
- `approval-provenance-guard` now requires `signed-authority` claims to carry
  PKI verification input that passes `verifyPkiBoundCertificate`.
- A caller-supplied `signatureVerified: true` is no longer enough for signed
  tool results or signed approvals.
- The observed decision records whether PKI verification passed, without
  storing raw tool output or raw approval text.

Validation:

- `npm run test:f4-trust-class-pki-proof-validation`
- `npm run test:tool-result-poisoning-guard`
- `npm run test:approval-provenance-guard`
- `npm run test:pki-trust-binding`

Claim boundary:

- This closes the repository guard contract gap for signed trust classes.
- It does not prove every customer adapter supplies trustworthy certificate,
  trust-chain, CA pin, or key material at runtime.
