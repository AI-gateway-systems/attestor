# CI Artifact, Approval, And Redaction Boundary Validation - 2026-06-01

## Recent Fixes Chain-Effect Check

- Current source of truth: `origin/master` at
  `8e8deea9acc0ab195d4c351fe7c52ab85fcbd398`.
- The immediately prior Policy Foundry readiness/idempotency remediation does
  not overlap runtime behavior here, but it reinforces the same rule: caller or
  workflow-supplied metadata is not proof by itself.
- This slice touches CI artifact packaging, production go/no-go approval
  provenance, release-provenance artifact disclosure checks, and the matching
  docs/tests.

## Validation Frame

Scope: production rehearsal workflow, production-promotion candidate packager,
production go/no-go packet renderer, release-provenance workflow, and public
artifact redaction scanner.

Protected principles: data minimization and redaction, proof integrity,
customer authority, no overclaim, release provenance, and operational
boundedness.

External anchors:

- GitHub deployment environments can require reviewers, and can prevent the
  user who initiated a deployment from approving that same protected deployment:
  <https://docs.github.com/en/actions/reference/workflows-and-actions/deployments-and-environments>.
- GitHub workflow artifacts persist files produced by workflow runs, so upload
  scope must be treated as a disclosure boundary:
  <https://docs.github.com/en/actions/concepts/workflows-and-actions/workflow-artifacts>.
- GitHub artifact attestations are verified as provenance/integrity evidence,
  not as a claim that archive contents are safe to disclose:
  <https://docs.github.com/en/actions/how-tos/secure-your-work/use-artifact-attestations/use-artifact-attestations>.
- SLSA provenance describes where and how an artifact was produced and treats
  external build parameters as untrusted policy inputs:
  <https://slsa.dev/spec/v0.2/provenance>.
- OWASP path traversal guidance calls out `..` segments and absolute paths as
  ways to access files outside the intended directory:
  <https://owasp.org/www-community/attacks/Path_Traversal>.

## Inspected Files

- `.github/workflows/production-rehearsal.yml`
- `.github/workflows/release-provenance.yml`
- `scripts/ops/package-production-promotion-candidate.ts`
- `scripts/render/render-production-go-no-go-packet.ts`
- `scripts/check/check-public-artifacts-redaction.mjs`
- `docs/08-deployment/production-rehearsal-manifest.example.json`
- `docs/08-deployment/production-go-no-go-packet.md`
- `docs/08-deployment/artifact-attestation-plan.md`
- matching tests under `tests/`

## Findings

| Finding | State | Evidence | Remediation |
|---|---|---|---|
| OPS-211 production-promotion artifact path boundary | closed repo-side / live-proof-only | The packager previously accepted manifest artifact paths without a repository evidence-root allowlist and would copy existing referenced files into the uploaded rehearsal bundle. | The packager now rejects absolute paths, parent traversal, paths outside `.attestor/rehearsal`, `.attestor/production-readiness`, or `.attestor/release-provenance`, and symlink artifacts. `summary.json` records `artifactPathBoundary` and denied artifact metadata. |
| OPS-212 production go/no-go approval provenance | closed repo-side / operator-proof-needed | The workflow previously passed `$GITHUB_ACTOR` plus current time as approval metadata, and the packet accepted actor/timestamp alone. | The packet now requires `approvalSource` stronger than `workflow-actor` plus an approval evidence reference. Customer-enforcement scope requires `signed-approval`. The workflow consumes explicit approval env/secret inputs instead of promoting the dispatcher actor. |
| OPS-213 generated release-provenance redaction coverage | closed repo-side / context-review-needed | Release provenance generated proof/showcase/SBOM output and uploaded the archive; the scanner previously covered committed public roots only. | The scanner now includes `.attestor/proof-surface/latest`, `.attestor/showcase/latest`, and `.attestor/release-provenance`, and the release-provenance workflow runs the scan before packaging/upload. |

## Chain Reactions

- A malicious or mistaken manifest can no longer turn arbitrary local files into
  production-promotion evidence unless they are under the explicit evidence
  roots.
- A go/no-go packet can no longer become `go` from workflow dispatcher identity
  plus a timestamp alone.
- Generated proof/showcase release artifacts now share the same redaction guard
  before upload; attestation remains provenance evidence, not disclosure safety.

## Verification

- `npm run test:production-rehearsal-promotion-bundle`
- `npm run test:production-go-no-go-packet`
- `npm run test:production-rehearsal-workflow`
- `npm run test:security-baseline-docs`
- `npm run test:hosted-release-provenance-slsa-alignment`
- `npm run test:public-artifacts-redaction`
- `npm run test:production-readiness-secret-safe-output`

## Remaining Boundary

Repo-side hardening is closed for this slice. Live protected-environment
configuration, signed approval artifact issuance, release artifact review in a
real generated run, production deployment, customer PEP no-bypass, KMS/HSM, and
enterprise readiness remain unproven/live-proof-only.

## Verdict

No repo-proven P0/P1 remains in this scoped validation. OPS-211, OPS-212, and
OPS-213 are repo-side closed with targeted regression tests. Production and
enterprise readiness are not claimed.

