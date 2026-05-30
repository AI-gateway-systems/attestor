# Contributing

Attestor changes should make high-risk AI-prepared actions safer before they
reach a real service.

Good contributions:

- docs and examples that make the first integration clearer
- tests that lock `admit`, `narrow`, `review`, or `block` behavior
- reason-code, evidence, redaction, replay, or route-contract fixes
- narrow refactors that keep runtime behavior unchanged

Out of scope:

- generic chat, agent-runtime, or workflow-orchestration features
- wallet, custody, payment-processing, or model-provider features
- production, compliance, or live-enforcement claims without live evidence
- broad rewrites without a tracker, tests, and reviewable slices

Before opening a PR:

1. Start from current `origin/master`.
2. Keep the change small enough to review.
3. State the trust surface and protected principle when behavior, security,
   provenance, billing, crypto, privacy, or production readiness is touched.
4. Run the narrowest checks that prove the changed surface.
5. Keep raw prompts, payloads, secrets, payment details, wallet material,
   customer identifiers, and private thresholds out of public artifacts.

## Workflow Permission Discipline

GitHub Actions workflows should default to the narrowest token authority that
can run the job. For repository reads, use:

```yaml
permissions:
  contents: read
```

Additional write scopes require an explicit PR justification, CODEOWNER review,
and a workflow-local reason. Do not add broad `write-all`, `contents: write`,
or unrelated write permissions for convenience.

Allowed elevated scopes in the current repository are intentionally narrow:

- `attestations: write` and `id-token: write` are limited to the release
  provenance workflow because GitHub artifact attestation requires provenance
  publication and OIDC token minting.
- `security-events: write` is limited to the CodeQL workflow because CodeQL
  uploads code-scanning results.

If a future workflow needs a new write scope, document why `contents: read` is
insufficient, name the protected principle, update the closest audit or
readiness index when posture changes, and add or update a regression check
that prevents the permission from spreading to unrelated workflows.

## CODEOWNERS Surface Ownership

The current CODEOWNERS map intentionally uses the repository-wide
`@AI-gateway-systems` owner for trust-sensitive surfaces. Do not add
placeholder per-surface team slugs.

Before splitting CODEOWNERS by surface, the operator must create visible GitHub
teams, grant each team explicit write access to this repository, and document
the team membership policy for the affected trust surface. GitHub will not
assign a code owner for a team that does not exist, is not visible, or lacks
repository write access, so invented team names would weaken review routing
rather than harden it.

After the teams and membership policy exist, update `.github/CODEOWNERS`, this
guide, the branch governance tests, and the audit indexes in the same PR.
