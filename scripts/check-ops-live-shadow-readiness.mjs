#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = process.cwd();

const FILES = Object.freeze({
  kustomization: 'ops/kubernetes/ha/kustomization.yaml',
  apiDeployment: 'ops/kubernetes/ha/api-deployment.yaml',
  workerDeployment: 'ops/kubernetes/ha/worker-deployment.yaml',
  workerServiceAccount: 'ops/kubernetes/ha/worker-serviceaccount.yaml',
  networkPolicy: 'ops/kubernetes/ha/networkpolicy.yaml',
  backendPolicy: 'ops/kubernetes/ha/providers/gke/gcpbackendpolicy.yaml',
  externalSecretsReadme: 'ops/kubernetes/ha/providers/external-secrets/README.md',
  gkeClusterSecretStoreExample: 'ops/kubernetes/ha/providers/external-secrets/clustersecretstore.gke.example.yaml',
  releaseProbe: 'scripts/probe-ha-release-inputs.ts',
  releaseBundle: 'scripts/render-ha-release-bundle.ts',
  remediation: 'docs/audit/ops-sweep-01-live-shadow-remediation.md',
});

const LIVE_PROOF_FLAGS = Object.freeze([
  ['ATTESTOR_LIVE_SHADOW_HTTPS_PROOF', 'HTTPS Gateway/route was applied and probed with an https:// public URL.'],
  ['ATTESTOR_CLUSTER_SECRET_STORE_PROOF', 'ClusterSecretStore backend and ExternalSecret sync were verified.'],
  ['ATTESTOR_NETWORK_POLICY_PROOF', 'NetworkPolicy or equivalent cluster isolation was applied and tested.'],
  ['ATTESTOR_EDGE_WAF_PROOF', 'Cloud Armor or equivalent edge WAF/rate-limit policy was attached and tested.'],
  ['ATTESTOR_GCP_IAM_LEAST_PRIVILEGE_PROOF', 'GCP IAM least-privilege bindings were reviewed and verified.'],
]);

function arg(name, fallback) {
  const prefixed = `--${name}=`;
  const found = process.argv.find((entry) => entry.startsWith(prefixed));
  if (found) return found.slice(prefixed.length);
  return fallback;
}

function read(path) {
  return readFileSync(join(ROOT, path), 'utf8').replace(/\r\n/gu, '\n');
}

function includes(path, expected, issues, message) {
  const body = read(path);
  if (!body.includes(expected)) {
    issues.push(`${path}: ${message}`);
  }
}

function notIncludesNear(path, anchor, forbidden, issues, message) {
  const body = read(path);
  const index = body.indexOf(anchor);
  if (index < 0) {
    issues.push(`${path}: missing ${anchor}`);
    return;
  }
  const window = body.slice(index, index + 260);
  if (window.includes(forbidden)) {
    issues.push(`${path}: ${message}`);
  }
}

function envTruthy(name) {
  return /^(1|true|yes|on|verified)$/iu.test(process.env[name] ?? '');
}

function requireFile(path, issues) {
  if (!existsSync(join(ROOT, path))) {
    issues.push(`${path}: file is missing`);
  }
}

function checkRepoReadiness() {
  const issues = [];
  for (const path of Object.values(FILES)) {
    requireFile(path, issues);
  }
  if (issues.length > 0) return issues;

  includes(FILES.kustomization, 'worker-serviceaccount.yaml', issues, 'worker ServiceAccount must be part of the HA bundle');
  includes(FILES.kustomization, 'networkpolicy.yaml', issues, 'NetworkPolicy must be part of the HA bundle');

  includes(FILES.workerServiceAccount, 'name: attestor-worker-runtime', issues, 'explicit worker ServiceAccount is required');
  includes(FILES.workerServiceAccount, 'automountServiceAccountToken: false', issues, 'worker ServiceAccount token automount must be disabled');
  includes(FILES.workerDeployment, 'serviceAccountName: attestor-worker-runtime', issues, 'worker must not use the default ServiceAccount');
  includes(FILES.workerDeployment, 'automountServiceAccountToken: false', issues, 'worker pod token automount must be disabled');

  includes(FILES.apiDeployment, 'seccompProfile:', issues, 'API pod must declare seccomp profile');
  includes(FILES.workerDeployment, 'seccompProfile:', issues, 'worker pod must declare seccomp profile');
  includes(FILES.apiDeployment, 'allowPrivilegeEscalation: false', issues, 'API containers must disallow privilege escalation');
  includes(FILES.workerDeployment, 'allowPrivilegeEscalation: false', issues, 'worker container must disallow privilege escalation');
  includes(FILES.apiDeployment, 'runAsNonRoot: true', issues, 'API containers must run as non-root');
  includes(FILES.workerDeployment, 'runAsNonRoot: true', issues, 'worker container must run as non-root');
  includes(FILES.apiDeployment, 'drop:\n                - ALL', issues, 'API containers must drop Linux capabilities');
  includes(FILES.workerDeployment, 'drop:\n                - ALL', issues, 'worker container must drop Linux capabilities');

  notIncludesNear(
    FILES.apiDeployment,
    'key: account-mfa-encryption-key',
    'optional: true',
    issues,
    'account MFA encryption key must not be optional in HA API deployment',
  );

  includes(FILES.networkPolicy, 'kind: NetworkPolicy', issues, 'NetworkPolicy resources must be defined');
  includes(FILES.networkPolicy, 'name: attestor-default-deny', issues, 'default-deny NetworkPolicy is required');
  includes(FILES.networkPolicy, 'name: attestor-runtime-egress', issues, 'runtime egress NetworkPolicy is required');
  includes(FILES.networkPolicy, 'port: 4318', issues, 'observability egress must be explicit');
  includes(FILES.networkPolicy, 'port: 3307', issues, 'Cloud SQL proxy egress must be explicit');
  includes(FILES.networkPolicy, 'port: 6379', issues, 'Redis egress must be explicit');

  includes(FILES.backendPolicy, 'securityPolicy: attestor-api-armor-policy', issues, 'active GKE backend policy must reference Cloud Armor');

  includes(FILES.gkeClusterSecretStoreExample, 'kind: ClusterSecretStore', issues, 'GKE ClusterSecretStore example is required');
  includes(FILES.gkeClusterSecretStoreExample, 'gcpsm:', issues, 'GKE ClusterSecretStore example must use Google Secret Manager');
  includes(FILES.gkeClusterSecretStoreExample, 'workloadIdentity:', issues, 'GKE ClusterSecretStore example must use Workload Identity');
  includes(FILES.externalSecretsReadme, 'check:ops-live-shadow', issues, 'External Secrets docs must point to the live-shadow gate');

  includes(FILES.releaseProbe, 'immutable image digest', issues, 'release probe must reject tag-only image refs');
  includes(FILES.releaseBundle, 'immutable image digest', issues, 'release bundle render must reject tag-only image refs in production mode');
  includes(FILES.releaseBundle, 'sectionName: https', issues, 'GKE release bundle render must target HTTPS listener');

  includes(FILES.remediation, 'OPS-02', issues, 'remediation record must account for ClusterSecretStore finding');
  includes(FILES.remediation, 'OPS-04', issues, 'remediation record must account for NetworkPolicy finding');
  includes(FILES.remediation, 'OPS-05', issues, 'remediation record must account for CloudArmor finding');

  return issues;
}

function checkLiveProofs() {
  const issues = checkRepoReadiness();
  for (const [name, description] of LIVE_PROOF_FLAGS) {
    if (!envTruthy(name)) {
      issues.push(`${name}: missing live proof. ${description}`);
    }
  }
  return issues;
}

function main() {
  const mode = arg('mode', 'repo');
  if (!['repo', 'live'].includes(mode)) {
    throw new Error('--mode must be repo or live');
  }

  const issues = mode === 'live' ? checkLiveProofs() : checkRepoReadiness();
  if (issues.length > 0) {
    console.error(`Ops live-shadow ${mode} readiness check failed:`);
    for (const issue of issues) console.error(`- ${issue}`);
    process.exit(1);
  }
  console.log(`Ops live-shadow ${mode} readiness check passed.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
