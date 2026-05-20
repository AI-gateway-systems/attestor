# Ops Storage Recovery Readiness Anchors

These sources support the OPS-SWEEP-04 remediation. They are engineering
anchors only; they do not certify a live environment.

| Source | Why it applies | No-overclaim boundary | Affected control |
|---|---|---|---|
| Kubernetes image and security context documentation | Kubernetes supports immutable image references by digest and pod/container security context fields such as non-root execution, seccomp, privilege escalation, read-only root filesystems, and dropped capabilities. | This proves the manifest shape, not live Pod Security Admission enforcement or node runtime behavior. | OPS-38, OPS-41, OTel collector deployment hardening |
| Redis security documentation | Redis protected mode, ACLs, disabled default users, and command restrictions are documented defense-in-depth controls when Redis is network reachable. | This proves the reference config shape, not live network isolation or managed Redis policy. | OPS-39, Redis recovery auth boundary |
| PostgreSQL continuous archiving and PITR documentation | PostgreSQL PITR depends on base backups plus continuous WAL archive and restore commands. | This proves the PITR mechanism, not successful target-environment base backup, offsite storage, encryption, or restore drill. | OPS-40, OPS-42, PITR archive/restore boundary |
| OpenTelemetry Collector deployment/configuration documentation | Collector gateways are deployment-time components whose image, runtime permissions, exporters, and backend endpoints are part of the telemetry trust boundary. | This proves repository deployment intent, not live telemetry delivery, backend auth, or mTLS. | OPS-41, OPS-44, observability collector boundary |

Primary URLs:

- <https://kubernetes.io/docs/concepts/containers/images/>
- <https://kubernetes.io/docs/tasks/configure-pod-container/security-context/>
- <https://redis.io/docs/latest/operate/oss_and_stack/management/security/>
- <https://www.postgresql.org/docs/current/continuous-archiving.html>
- <https://opentelemetry.io/docs/collector/configuration/>
