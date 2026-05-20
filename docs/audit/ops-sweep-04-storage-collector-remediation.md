# OPS-SWEEP-04 Storage And Collector Remediation

## Scope

- Source report scope: PostgreSQL PITR, Redis recovery, Kubernetes
  observability collector deployment, and Sweep 03 chain effects.
- Validation source of truth: `origin/master`
- Validation HEAD before remediation:
  `300a6cda236e6d85d858b3a6eae3ebb1f7262e5b`
- Protected principles: runtime readiness, operational boundedness, replay and
  idempotency safety, data minimization and redaction, release provenance,
  auditability, no overclaim.

## Repository Remediation

| Finding | State | Repo evidence | Remaining limitation |
|---|---|---|---|
| OPS-38 OTel collector `:latest` image | stale/closed | Current `ops/kubernetes/observability/deployment.yaml` and `docker-compose.observability.yml` already use `otel/opentelemetry-collector-contrib:0.152.0@sha256:...`. `tests/kubernetes-observability-bundle.test.ts` locks this. | No further repo action. Live pull/admission policy remains cluster proof. |
| OPS-39 Redis no auth / protected-mode disabled | closed for shipped DR bundle | `ops/redis/redis-recovery.conf` now keeps `protected-mode yes`, uses `aclfile /run/redis/users.acl`, disables high-risk admin commands, and `docker-compose.dr.yml` generates an authenticated `attestor` user with the default user disabled. | Does not prove live Redis network isolation, managed Redis ACL policy, or password rotation. Those remain live ops proof. |
| OPS-40 PostgreSQL WAL archive local-only | partial / live-proof-only | `ops/postgres/pitr/archive-wal.sh` supports an operator-mounted offsite WAL archive path and fail-closed `ATTESTOR_PG_WAL_OFFSITE_REQUIRED=true`; docs and readiness checks require the offsite proof to remain explicit. | Does not prove production PITR, offsite object-store durability, encryption-at-rest, base backup scheduling, or restore drill success. |
| OPS-41 OTel collector no securityContext | closed | `ops/kubernetes/observability/deployment.yaml` now adds pod/container security context: non-root, RuntimeDefault seccomp, no privilege escalation, read-only root filesystem, and dropped Linux capabilities. | Live cluster Pod Security Admission and runtime behavior remain target-environment proof. |
| OPS-42 WAL restore script no integrity verification | closed for shipped bundle | `archive-wal.sh` writes SHA-256 sidecars and `restore-wal.sh` verifies them by default before copying WAL into place. | Does not prove external tamper evidence or object-store immutability. |
| OPS-43 PostgreSQL `listen_addresses = '*'` | accepted limitation | Unchanged. The file is a DR/self-hosted PostgreSQL reference bundle and network reachability must be bounded by compose/Kubernetes/network policy. | Live exposure and TLS policy remain deployment-specific. |
| OPS-44 OTel backend namespace mismatch | closed for base bundle | Base deployment endpoints now use `tempo.attestor-observability.svc.cluster.local` and `loki.attestor-observability.svc.cluster.local`; README explains how to override for shared `monitoring` namespaces or managed backends. | Any environment-specific namespace override must be included in live proof. |
| OPS-45 OTel collector ServiceAccount token automount | accepted / documented | `automountServiceAccountToken: true` is explicit because the Kubernetes attributes processor uses read-only Kubernetes metadata RBAC. | A managed backend path without Kubernetes metadata collection may disable it separately. |
| OPS-46 metrics-secret local fallback | accepted limitation | Unchanged. The fallback is local/dev only; production/live shadow still needs the metrics token file and secret proof from OPS-SWEEP-03. | Live token rotation remains ops proof. |
| OPS-47 Redis RDB/AOF save thresholds | accepted limitation | Unchanged durability defaults. | Per-environment Redis persistence policy remains live proof. |
| OPS-48 PostgreSQL PITR TLS/encryption config absence | live-proof-only | Docs now keep offsite archive and restore proof explicit; TLS/encryption are deployment-specific PostgreSQL/network/storage controls. | Live DB TLS and storage encryption remain ops proof. |

## Chain-Effect Checks

- The Redis auth change updates the recovery config, DR compose URL,
  healthcheck, README, and DR bundle tests so the config is not hardened without
  a caller path.
- The PostgreSQL PITR change updates archive command, restore command, compose
  mounts, README, DR docs, and tests so checksum/offsite behavior is wired
  through the shipped bundle.
- The OTel securityContext change keeps the ServiceAccount token dependency
  explicit instead of hiding it; this avoids breaking the `k8sattributes`
  processor while still hardening the container.
- The namespace alignment change updates the base manifest, release-bundle
  renderer defaults, README, and tests so the default local path does not drift
  away from namespace-scoped proof.

## Verification

Targeted checks:

- `npm run test:ops-sweep-04-storage-collector-remediation`
- `npm run test:dr-bundle`
- `npm run test:kubernetes-observability-bundle`
- `npm run test:observability-release-bundle-render`
- `npm run test:ops-live-shadow-readiness`
- `npm run check:ops-live-shadow`

Broad checks should include TypeScript, hygiene, evidence-system, and
supply-chain gates before merge.

## What This Does Not Prove

- It does not prove production PITR, offsite archive durability, base backup
  scheduling, or a successful restore drill.
- It does not prove live Redis network isolation, managed Redis ACL policy, or
  secret rotation.
- It does not prove live Kubernetes Pod Security Admission enforcement.
- It does not prove live observability backend reachability, auth, storage, or
  mTLS.
