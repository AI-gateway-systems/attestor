# Attestor HA AWS Provider Overlay

This overlay composes the base HA bundle with an AWS Load Balancer Controller
Ingress. The default `alb-ingress.yaml` is an HTTP bootstrap manifest only. Do
not treat it as a live-shadow HTTPS edge contract.

For live shadow, render or adapt
`alb-ingress.https.example.yaml` with environment-owned values:

- `REPLACE_WITH_ACM_CERTIFICATE_ARN`
- `REPLACE_WITH_AWS_WAFV2_WEB_ACL_ARN`
- the final public hostname

The HTTPS example uses AWS Load Balancer Controller annotations for HTTP and
HTTPS listeners, SSL redirect, ACM certificate binding, SSL policy, and WAFv2
association.

Required live proof before stronger runtime claims:

- `ATTESTOR_LIVE_SHADOW_HTTPS_PROOF=verified`: HTTPS endpoint probed and
  cleartext HTTP redirect / denial confirmed.
- `ATTESTOR_EDGE_WAF_PROOF=verified`: AWS WAFv2 Web ACL or equivalent edge
  policy attached and tested.

No raw ARN, account id, certificate material, or WAF rule body belongs in the
repository. Keep those values in the environment-specific release bundle or
cloud control plane evidence.
