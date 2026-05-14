# F10 Customer Escape-Hatch Abuse Validation

Status: repository-side validation for the project-owner supplied F10 report.

This record is not a production assurance claim. It rechecks the report against
current `origin/master`, closes stale items with repository evidence, and adds
small code hooks where the escape hatch was real but under-instrumented.

## Source Anchors

- OWASP API Security Top 10 2023: API3, API5, API8.
- NIST SP 800-53 Rev. 5: AC-3, AC-6, AC-17, AU-2, CM-6, CM-7, IR-4.
- NIST SP 800-92: security log management.
- SOC 2 TSC / ISO/IEC 27001 / ISO/IEC 42001 are engineering evidence anchors
  only; this validation does not assert certification or Type II evidence.

## Validation Result

| Finding | Status | Repository evidence | Remaining boundary |
|---|---|---|---|
| F10-E1 legacy flat verify lacks reason | `fixed` | `verify-cli.ts` now requires `--allow-legacy-verify <reason>` and exits with `LEGACY_REASON_REQUIRED` when the reason is missing. | Legacy mode still exists for intentional pre-PKI kit checks. |
| F10-E2 `requireProof: false` lacks telemetry | `fixed` | `customer-gate.ts` adds `proofSkippedByCaller` and `customer-gate-proof-skipped-by-caller`. | Caller still owns downstream enforcement. |
| F10-E3 break-glass rollout lacks distinct gate | `fixed` | F7 break-glass hardening already requires secondary approver, expiry, justification, and reconciliation. | Live operator use remains external evidence. |
| F10-E4 natural-language bypass is caller-asserted | `partial` | `no-go-condition-ledger.ts` now includes `detectConsequenceNoGoNaturalLanguageBypass()` and stores only digests/counts. | Upstream integrations must pass relevant text fields into the scanner. |
| F10-E5 OIDC insecure HTTP production gate | `fixed` | `hostedOidcAllowsInsecureRequests()` rejects explicit and localhost HTTP OIDC paths in production-like runtimes. | Live OIDC provider config remains deployment evidence. |
| F10-E6 shared `accept-the-risk` string | `accepted-limitation` | Current code keeps the shared phrase as operator friction, not as a secret. Production gates still apply around the risky paths. | Future hardening can use per-override phrases if operational confusion appears. |
| F10-E7 auth fallback key-source visibility | `fixed` | `/api/v1/health` now reports MFA/OIDC/SAML key-source labels: `dedicated`, `local-admin-fallback`, or `not-configured`. | Operators must monitor the health payload. |
| F10-E8 local-dev profile on production host | `invalid-as-stated` | Existing runtime-profile tests and production-readiness docs prove production-like envs require explicit `ATTESTOR_RUNTIME_PROFILE`. | Misconfigured hosts with no production-like signal remain outside code detection. |
| F10-E9 exported `resetKeylessCa` | `fixed` | Generic reset export is removed; tests use `resetKeylessCaForTesting(reason)` and package exports still do not expose signing internals. | Internal test helper remains for isolated tests. |
| F10-E10 degraded-mode TTL escape | `fixed` | F8 already proved `createDegradedModeGrant()` rejects TTLs above `maxTtlSeconds`. | Exact grant expiry remains intentionally strict. |
| F10-E11 `requireSharedCounter` default | `partial` | Prior F4 shared velocity validation and production storage gates keep this as a production-claim boundary. | Pure policy normalization still defaults to single-process compatibility. |
| F10-E12 aggregate escape-hatch usage view | `partial` | `escape-hatch-telemetry.ts` adds a digest-only catalog, usage event, and summary builder for the 12 escape-hatch classes. | Persisted admin route / SIEM export is future integration work. |

## Code Changes In This Slice

- `src/signing/verify-cli.ts`
  - requires a reason for legacy flat Ed25519 kit verification.
- `src/consequence-admission/customer-gate.ts`
  - records proof-skipped decisions distinctly.
- `src/consequence-admission/no-go-condition-ledger.ts`
  - adds a digest-only natural-language bypass detector.
- `src/consequence-admission/escape-hatch-telemetry.ts`
  - introduces the escape-hatch catalog and summary contract.
- `src/service/account-oidc.ts`
  - rejects insecure OIDC discovery in production-like runtimes.
- `src/service/http/routes/core-routes.ts`
  - exposes nonsecret account auth key-source labels on health.
- `src/signing/keyless-signer.ts`
  - removes the generic `resetKeylessCa` export in favor of a test-only reset function with a reason.

## Verification Commands

```bash
npm run test:f10-escape-hatch-validation
npm run test:consequence-admission-customer-gate
npm run test:no-go-condition-ledger
npm run test:account-oidc-linking-policy
npm run test:service-core-routes
npm run test:f5-keyless-ca-injection-boundary-validation
npm run test:f8-operational-resilience-validation
npm run test:audit-remediation-tracker
npm run test:research-provenance-ledger
npm run test:package-script-runner
npm run typecheck
npm run typecheck:hygiene
```

## Closure Statement

F10 is closed for planned repository-side work in this slice. Four items remain
explicit boundaries rather than open repository bugs: upstream text extraction
for the bypass scanner, per-override magic-string granularity, production-shared
counter defaults in pure policy models, and persisted/admin escape-hatch usage
reporting. Those are documented as partial or accepted limitations, not claimed
as solved live production behavior.
