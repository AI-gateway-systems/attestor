#!/bin/sh
set -eu

wal_file="$1"
destination="$2"
archive_dir="${ATTESTOR_PG_WAL_ARCHIVE_DIR:-/var/lib/postgresql/archive}"
require_checksum="${ATTESTOR_PG_WAL_REQUIRE_CHECKSUM:-true}"
source_file="${archive_dir}/${wal_file}"
checksum_file="${archive_dir}/${wal_file}.sha256"

if [ ! -f "$source_file" ]; then
  exit 1
fi

if [ -f "$checksum_file" ]; then
  (cd "$archive_dir" && sha256sum -c "${wal_file}.sha256" >/dev/null)
elif [ "$require_checksum" = "true" ]; then
  echo "Missing WAL checksum for ${wal_file}" >&2
  exit 1
fi

cp "$source_file" "$destination"
