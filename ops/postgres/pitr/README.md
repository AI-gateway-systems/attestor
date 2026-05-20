# PostgreSQL PITR Bundle

This bundle adds a PostgreSQL continuous-archiving and restore reference for Attestor.

Files:

- `postgresql-pitr.conf` - enables WAL archiving and PITR restore hooks
- `archive-wal.sh` - archives WAL files, writes SHA-256 sidecar checksums, and
  can mirror archives to an operator-mounted offsite path
- `restore-wal.sh` - container-side restore command used by PostgreSQL
- `../../../docker-compose.dr.yml` - reference topology wiring API, worker, Redis, and PostgreSQL together

## WAL archive boundary

The default archive directory remains `/var/lib/postgresql/archive` for local
DR rehearsal. For live shadow or stronger environments, mount an offsite or
object-store-backed path and set:

```bash
ATTESTOR_PG_WAL_OFFSITE_ARCHIVE_DIR=/mounted/offsite/wal
ATTESTOR_PG_WAL_OFFSITE_REQUIRED=true
```

`archive-wal.sh` refuses to archive when `ATTESTOR_PG_WAL_OFFSITE_REQUIRED=true`
but the offsite path is missing. Each archived WAL segment gets a
`<wal>.sha256` sidecar. `restore-wal.sh` verifies the checksum by default before
copying a WAL segment into place.

## Base backup

Take a physical base backup from the running PostgreSQL primary:

```bash
pg_basebackup \
  -d "$ATTESTOR_PG_PITR_URL" \
  -D /var/lib/postgresql/base-backups/attestor-$(date +%Y%m%d%H%M%S) \
  -Fp -Xs -P
```

## Restore drill

1. Restore the chosen base backup into an empty PostgreSQL data directory.
2. Ensure the archived WAL files and `.sha256` sidecars are available in
   `/var/lib/postgresql/archive`.
3. Create `recovery.signal` in the PostgreSQL data directory.
4. Start PostgreSQL with `postgresql-pitr.conf` mounted as the active config.
5. Validate Attestor control-plane and billing schemas before reconnecting API/worker.

## Boundary

This is a shipped operator bundle and runbook, not managed failover:

- no automated replica promotion
- no cross-region replication policy
- no backup scheduling daemon inside Attestor
- no production PITR claim without live evidence that the offsite archive,
  base backup, encryption, and restore drill passed in the target environment
