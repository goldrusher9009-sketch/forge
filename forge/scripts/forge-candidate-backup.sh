#!/usr/bin/env bash
set -Eeuo pipefail

BASE_DIR="${FORGE_BASE_DIR:-/opt/forge-private-isolated}"
BACKUP_DIR="${FORGE_BACKUP_DIR:-$BASE_DIR/backups}"
PLATFORM_CONTAINER="${FORGE_PLATFORM_CONTAINER:-forge-private-isolated-forge-platform-1}"
LOCK_FILE="${FORGE_BACKUP_LOCK_FILE:-/run/lock/forge-candidate-backup.lock}"

fail() {
  printf 'forge candidate backup: FAIL %s\n' "$1" >&2
  exit 1
}

test "${EUID:-$(id -u)}" = '0' || fail 'must run as root'
for command_name in awk chmod date dirname docker flock grep gzip id install mv rm sha256sum stat; do
  command -v "$command_name" >/dev/null 2>&1 || fail "required command is missing: $command_name"
done

install -d -m 0700 "$BACKUP_DIR"
install -d -m 0755 "$(dirname "$LOCK_FILE")"
exec 9>"$LOCK_FILE"
if ! flock -n 9; then
  printf 'forge candidate backup: SKIP another verified backup is running\n'
  exit 0
fi

timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
name="forge-auto-${timestamp}.db.gz"
final_path="$BACKUP_DIR/$name"
partial_path="$BACKUP_DIR/.${name}.partial"
checksum_path="${final_path}.sha256"
container_path="/tmp/forge-auto-${timestamp}.db"

case "$final_path" in "$BACKUP_DIR"/forge-auto-*.db.gz) ;; *) fail 'final backup path escaped the backup directory' ;; esac
case "$partial_path" in "$BACKUP_DIR"/.forge-auto-*.db.gz.partial) ;; *) fail 'partial backup path escaped the backup directory' ;; esac
case "$container_path" in /tmp/forge-auto-*.db) ;; *) fail 'container backup path escaped the container tmp directory' ;; esac
test ! -e "$final_path" || fail 'final backup already exists'
test ! -e "$partial_path" || fail 'partial backup already exists'
test ! -e "$checksum_path" || fail 'checksum already exists'

cleanup() {
  docker exec "$PLATFORM_CONTAINER" rm -f -- "$container_path" >/dev/null 2>&1 || true
  rm -f -- "$partial_path"
}
trap cleanup EXIT INT TERM

source_metadata="$({
  docker exec -i "$PLATFORM_CONTAINER" node - "$container_path" <<'NODE'
const Database = require('better-sqlite3');

(async () => {
  const destination = process.argv[2];
  const tables = ['users', 'sandbox_workspaces', 'agent_runs', 'sandbox_artifacts', 'google_drive_transfers'];
  const source = new Database(process.env.DB_PATH, { readonly: true, fileMustExist: true });
  await source.backup(destination);
  source.close();
  const restored = new Database(destination, { readonly: true, fileMustExist: true });
  const counts = Object.fromEntries(tables.map(table => [table, restored.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get().count]));
  const integrity = restored.pragma('integrity_check', { simple: true });
  restored.close();
  console.log(JSON.stringify({ integrity, counts }));
})().catch(error => {
  console.error(error && error.message || error);
  process.exit(1);
});
NODE
} 2>&1)" || fail "application-level SQLite backup failed: $source_metadata"

printf '%s' "$source_metadata" | grep -q '"integrity":"ok"' || fail 'source snapshot integrity verification failed'
docker exec "$PLATFORM_CONTAINER" cat "$container_path" | gzip -9 > "$partial_path"
test -s "$partial_path" || fail 'compressed backup is empty'
gzip -t "$partial_path" || fail 'compressed backup failed gzip verification'

platform_image="$(docker inspect -f '{{.Image}}' "$PLATFORM_CONTAINER")"
test -n "$platform_image" || fail 'running Forge Platform image was not resolved'
restore_metadata="$({
  docker run --rm --network none --read-only \
    --tmpfs /tmp:rw,nosuid,nodev,size=128m \
    --mount "type=bind,source=$partial_path,target=/input.db.gz,readonly" \
    -i "$platform_image" node - <<'NODE'
const fs = require('node:fs');
const zlib = require('node:zlib');
const Database = require('better-sqlite3');

const tables = ['users', 'sandbox_workspaces', 'agent_runs', 'sandbox_artifacts', 'google_drive_transfers'];
fs.writeFileSync('/tmp/restore.db', zlib.gunzipSync(fs.readFileSync('/input.db.gz')));
const restored = new Database('/tmp/restore.db', { readonly: true, fileMustExist: true });
const counts = Object.fromEntries(tables.map(table => [table, restored.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get().count]));
const integrity = restored.pragma('integrity_check', { simple: true });
restored.close();
console.log(JSON.stringify({ integrity, counts }));
NODE
} 2>&1)" || fail "isolated restore verification failed: $restore_metadata"

test "$source_metadata" = "$restore_metadata" || fail 'source and restored key-table evidence differ'
sha256="$(sha256sum "$partial_path" | awk '{print $1}')"
test -n "$sha256" || fail 'backup SHA-256 was not produced'
chmod 0600 "$partial_path"
mv "$partial_path" "$final_path"
printf '%s  %s\n' "$sha256" "$name" > "$checksum_path"
chmod 0600 "$checksum_path"
docker exec "$PLATFORM_CONTAINER" rm -f -- "$container_path"
trap - EXIT INT TERM

printf 'forge candidate backup: PASS file=%s bytes=%s sha256=%s evidence=%s\n' \
  "$name" "$(stat -c %s "$final_path")" "$sha256" "$restore_metadata"
