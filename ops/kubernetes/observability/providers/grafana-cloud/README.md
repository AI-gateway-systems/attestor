# Attestor Observability Grafana Cloud Overlay

This overlay switches the Kubernetes collector gateway from the local LGTM
stack wiring to a managed Grafana Cloud OTLP endpoint.

It assumes:

- you already have the base gateway bundle from `ops/kubernetes/observability/`
- you have generated Grafana Cloud OTLP connection details
- you created the secret values required below through External Secrets or an
  environment-owned Secret

Required secret keys:

- `grafana-cloud-otlp-endpoint`
- `grafana-cloud-otlp-username`
- `grafana-cloud-otlp-token`

Do not apply `secret-template.yaml` directly. It is a shape example with
`REPLACE_WITH_*` placeholders and is intentionally not listed as a kustomize
resource. For managed environments, prefer
`ops/kubernetes/observability/providers/external-secrets/` so rotation stays in
the secret manager path.

This overlay now uses the Collector `basicauth` authenticator pattern instead of
injecting a raw `Authorization` header string. That keeps the wiring closer to
the official OpenTelemetry auth model and makes secret rotation cleaner.

Apply it with:

```powershell
kubectl apply -k ops/kubernetes/observability/providers/external-secrets
kubectl apply -k ops/kubernetes/observability/providers/grafana-cloud
```
