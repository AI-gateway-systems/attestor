## Observability Profiles

These profiles turn benchmark data into environment-specific observability tuning packs.

Typical flow:

```powershell
npm run benchmark:ha -- --url=http://127.0.0.1:3700/api/v1/health --duration=30 --concurrency=24 --replicas=3 --output=.attestor/ha-calibration/staging.json
npm run render:observability-profile -- --input=.attestor/ha-calibration/staging.json --profile=ops/observability/profiles/regulated-production.json --output-dir=.attestor/observability/reg-prod
```

The render step produces:

- `summary.json` with measured-vs-target SLO truth
- `recording-rules.generated.yml`
- `alerts.generated.yml`
- `retention.env`
- `README.md`

Renderer boundary:

- Renderers emit generated rules and alerts so operators can review the exact
  Prometheus diff, but the output is not self-applying.
- Do not apply generated files from a failed SLO render unless the operator
  explicitly accepts the measured SLO miss and records the limitation.
- Profiles must keep non-zero error budgets; a target that rounds to a zero
  burn-rate divisor is rejected before files are written.

Shipped profiles:

- `regulated-production.json`
- `lean-production.json`

These are operator defaults, not universal truth. Re-render after large traffic-shape or compliance changes.
