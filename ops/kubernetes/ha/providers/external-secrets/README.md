# Attestor HA External Secrets Overlay

This overlay replaces hand-managed runtime secrets with External Secrets
Operator resources.

It assumes:

- External Secrets Operator is installed
- a `ClusterSecretStore` exists and is reachable by the cluster
- on GKE, the store uses Workload Identity rather than static cloud keys
- this overlay is the selected TLS material source when it projects
  `attestor-tls`

Do not apply this TLS ExternalSecret together with the cert-manager overlay.
Both paths write the same `attestor-tls` Secret; live shadow must choose exactly
one source and record that choice with
`ATTESTOR_TLS_MATERIAL_SOURCE_PROOF=verified` before treating the TLS boundary
as proven.

Before applying it, replace:

- `platform-secrets`
- the remote secret keys in both resources
- the placeholders in
  [clustersecretstore.gke.example.yaml](/C:/Users/thedi/attestor/ops/kubernetes/ha/providers/external-secrets/clustersecretstore.gke.example.yaml)
  or the rendered `ha-clustersecretstore.yaml`

Apply it with:

```powershell
kubectl apply -k ops/kubernetes/ha/providers/external-secrets
```

Renderer-assisted flow:

```powershell
npm run render:ha-credentials -- --provider=gke --output-dir=.attestor/ha/credentials
```

That bundle can emit environment-specific `runtime-secrets.external-secret.yaml`
and `tls.external-secret.yaml` manifests with the right secret-store name, prefix,
and hostname/TLS wiring before you copy the final values into this overlay.

The renderer also supports lifecycle tuning without hand-editing the manifests:

- `ATTESTOR_HA_EXTERNAL_SECRET_STORE_KIND`
- `ATTESTOR_HA_EXTERNAL_SECRET_REFRESH_INTERVAL`
- `ATTESTOR_HA_EXTERNAL_SECRET_CREATION_POLICY`
- `ATTESTOR_HA_EXTERNAL_SECRET_DELETION_POLICY`

Recommended bootstrap:

```powershell
npm run render:secret-manager-bootstrap -- --provider=<aws|gke|all> --output-dir=.attestor/secret-bootstrap
```

That bundle emits provider-ready `ClusterSecretStore` manifests plus the exact
remote secret names expected by this HA overlay.

Live-shadow gate:

- do not apply this overlay for live shadow until the generated or hand-edited
  `ClusterSecretStore` has been applied and the ExternalSecret status shows a
  successful sync from the managed backend
- use `npm run check:ops-live-shadow -- --mode=live` to require an explicit
  operator proof flag before treating the secret-store boundary as verified
