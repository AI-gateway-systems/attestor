#!/bin/sh
set -eu

source_path="$1"
wal_file="$2"
archive_dir="${ATTESTOR_PG_WAL_ARCHIVE_DIR:-/var/lib/postgresql/archive}"
offsite_dir="${ATTESTOR_PG_WAL_OFFSITE_ARCHIVE_DIR:-}"
offsite_required="${ATTESTOR_PG_WAL_OFFSITE_REQUIRED:-false}"

if [ "$offsite_required" = "true" ] && [ -z "$offsite_dir" ]; then
  echo "ATTESTOR_PG_WAL_OFFSITE_ARCHIVE_DIR is required when ATTESTOR_PG_WAL_OFFSITE_REQUIRED=true" >&2
  exit 1
fi

mkdir -p "$archive_dir"

target="${archive_dir}/${wal_file}"
checksum="${target}.sha256"

if [ -f "$target" ]; then
  if [ -f "$checksum" ]; then
    (cd "$archive_dir" && sha256sum -c "${wal_file}.sha256" >/dev/null)
  else
    (cd "$archive_dir" && sha256sum "$wal_file" > "${wal_file}.sha256")
  fi
else
  tmp="${target}.tmp.$$"
  cp "$source_path" "$tmp"
  mv "$tmp" "$target"
  (cd "$archive_dir" && sha256sum "$wal_file" > "${wal_file}.sha256")
fi

if [ -n "$offsite_dir" ]; then
  mkdir -p "$offsite_dir"
  cp "$target" "${offsite_dir}/${wal_file}"
  cp "$checksum" "${offsite_dir}/${wal_file}.sha256"
fi
