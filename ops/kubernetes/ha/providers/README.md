# Attestor HA Provider Overlays

Current first-class provider overlays:

- `aws/`: AWS Load Balancer Controller Ingress examples for bootstrap and
  HTTPS/WAF live-shadow rollout.
- `gke/`: GKE Gateway, BackendPolicy, Cloud Armor, health check, and HTTPS
  examples.
- `cert-manager/`: TLS material through cert-manager.
- `external-secrets/`: runtime and TLS material through External Secrets.
- `keda/`: workload-aware scaling through KEDA.

Azure / AKS is intentionally out of scope in this repository state. Do not claim AKS parity until a scoped provider overlay, profile, tests, and live proof register entries land.

Provider overlays are repo-side contracts and examples. Live shadow still
requires environment proof for HTTPS, WAF, IAM, NetworkPolicy, secret stores,
storage, and alerting before stronger runtime claims.
