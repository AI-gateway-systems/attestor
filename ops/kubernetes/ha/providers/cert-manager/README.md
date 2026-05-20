# Attestor HA cert-manager Overlay

This overlay adds certificate automation for the Gateway/API entrypoint using
cert-manager.

It assumes:

- cert-manager is already installed
- a `ClusterIssuer` exists in the cluster
- this overlay is the selected TLS material source for `attestor-tls`

Do not apply this overlay together with the External Secrets TLS overlay. Both
paths write the same `attestor-tls` Secret; live shadow must choose exactly one
source and record that choice with `ATTESTOR_TLS_MATERIAL_SOURCE_PROOF=verified`
before treating the TLS boundary as proven.

Before applying it, replace:

- `letsencrypt-prod`
- `attestor.example.com`
- `ops@example.com` inside [clusterissuer.example.yaml](/C:/Users/thedi/attestor/ops/kubernetes/ha/providers/cert-manager/clusterissuer.example.yaml)

The `clusterissuer.example.yaml` file is intentionally not part of this
kustomization because issuer email, ACME account material, and Gateway solver
details are environment-owned. Apply a real `ClusterIssuer` first, or render
one through `render:gke-domain-cutover`.

Apply it with:

```powershell
kubectl apply -k ops/kubernetes/ha/providers/cert-manager
```

Renderer-assisted flow:

```powershell
npm run render:ha-credentials -- --provider=gke --output-dir=.attestor/ha/credentials
```

When `ATTESTOR_TLS_MODE=cert-manager`, the renderer emits a ready-to-edit
`cert-manager.certificate.yaml` manifest with the chosen hostname, secret name,
and `ClusterIssuer`.

Gateway API HTTP-01 note:

- cert-manager does not edit your Gateway
- keep an HTTP listener on port `80`
- apply a real `ClusterIssuer` before the `Certificate`
- [clusterissuer.example.yaml](/C:/Users/thedi/attestor/ops/kubernetes/ha/providers/cert-manager/clusterissuer.example.yaml) shows the `gatewayHTTPRoute.parentRefs` form that reuses the `attestor` Gateway for ACME solving
- this repo-guided path is now live-proven on GKE with a static global address, `<ip>.sslip.io`, Gateway HTTP-01 solving, and cert-manager issuance of `attestor-tls`

Final-domain renderer note:

- `npm run render:gke-domain-cutover -- --hostname=<final-domain> --dns-target-ip=<gateway-ip>` emits a ready-to-apply `ClusterIssuer` + `Certificate` pair for the delegated hostname alongside the matching Gateway and HTTPRoute manifests
