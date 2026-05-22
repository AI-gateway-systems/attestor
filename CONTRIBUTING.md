# Contributing

Attestor changes should preserve the project boundary: this repository is an AI
Action Control Plane and consequence admission layer, not a generic workflow
orchestration product.

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
