# Attestor HA KEDA Overlay

This overlay replaces the base CPU/memory-only HPAs with workload-aware KEDA
scalers:

- API scale-out from Prometheus request-rate telemetry
- worker scale-out from BullMQ Redis waiting-list backlog

It assumes:

- KEDA is already installed in the cluster
- Prometheus is reachable from the KEDA operator
- the runtime secret contains Redis scaler keys:
  - `redis-address`
  - `redis-password`
  - optionally `redis-username` for ACL deployments

Security boundary:

- The worker Redis scaler's `enableTLS` value must match the deployed runtime
  Redis endpoint. The default manifest keeps `enableTLS: "false"` for local or
  private plaintext Redis endpoints; use
  [worker-scaledobject.tls.example.yaml](worker-scaledobject.tls.example.yaml)
  as the TLS-on patch pattern when Redis is exposed over TLS.
- Record the selected Redis scaler posture with
  `ATTESTOR_KEDA_REDIS_TLS_PROOF=verified` before treating KEDA worker scaling
  as live-shadow-ready.
- The API Prometheus scaler is intentionally a separate trust boundary. If
  Prometheus query access requires bearer, TLS, basic, or cloud identity auth,
  wire a `TriggerAuthentication` like
  [api-prometheus-triggerauthentication.example.yaml](api-prometheus-triggerauthentication.example.yaml)
  and record `ATTESTOR_KEDA_PROMETHEUS_AUTH_PROOF=verified`.
- Cross-namespace Prometheus access should be backed by NetworkPolicy or an
  equivalent platform policy. Do not infer that the scaler is authenticated
  just because it can reach `:9090`.

Apply it with:

```powershell
kubectl apply -k ops/kubernetes/ha/providers/keda
```
