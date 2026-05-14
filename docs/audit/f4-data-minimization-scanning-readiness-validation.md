# F4-LLM02 Data Minimization Scanning And Readiness Validation

Status:

- F4-LLM02-A: repository-side `fixed`.
- F4-LLM02-B: `accepted-limitation`.

Source report:

- F4-LLM02-A said data-minimization evaluation depended on caller-supplied
  `exposedRawClasses`.
- F4-LLM02-B said the policy did not activate as a production-ready enforcement
  claim.

Repository finding:

- The central material scanner already existed, but the artifact evaluator did
  not call it directly.
- The policy intentionally reports `productionReady: false`; that is the right
  public claim boundary for repo-side evaluation code.

Remediation:

- `evaluateConsequenceDataMinimizationArtifact(...)` now accepts optional
  material and runs `consequenceDataMinimizationMaterialSafetyFindings(...)`
  during evaluation.
- Unsafe material fails closed with stable reason codes.
- The evaluator does not echo raw sensitive marker text in decision reason
  codes.

Validation:

- `npm run test:f4-data-minimization-scanning-readiness-validation`
- `npm run test:data-minimization-redaction-policy`
- `npm run test:audit-remediation-tracker`
- `npm run test:package-script-runner`

Claim boundary:

- This closes the repository-side operator-driven scanning gap for callers that
  pass material into the evaluator.
- It does not prove live production traffic, retention, access control, DPA,
  encryption, customer deployment, or external audit readiness.
