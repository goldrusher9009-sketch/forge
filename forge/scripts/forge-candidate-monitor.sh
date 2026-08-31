#!/usr/bin/env bash
set -Eeuo pipefail

BASE_DIR="${FORGE_BASE_DIR:-/opt/forge-private-isolated}"
BACKUP_DIR="${FORGE_BACKUP_DIR:-$BASE_DIR/backups}"
MAX_BACKUP_AGE_SECONDS="${FORGE_MAX_BACKUP_AGE_SECONDS:-129600}"
MIN_FREE_BYTES="${FORGE_MIN_FREE_BYTES:-10737418240}"
PLATFORM_CONTAINER="forge-private-isolated-forge-platform-1"
ORCHESTRATOR_CONTAINER="forge-private-isolated-forge-sandbox-orchestrator-1"
GATEWAY_CONTAINER="forge-private-edge-forge-control-plane-tunnel-gateway-1"
DOCKER_CONFIG_DIR=/run/forge-candidate-monitor
failures=()

record_failure() {
  failures+=("$1")
}

emit_failure() {
  local message
  message="$(IFS='; '; printf '%s' "${failures[*]}")"
  if command -v logger >/dev/null 2>&1; then
    logger -t forge-candidate-monitor -- "FAIL $message"
  fi
  printf 'forge candidate monitor: FAIL %s\n' "$message" >&2
  exit 1
}

container_check() {
  local name="$1"
  local state health restarts
  state="$(docker inspect -f '{{.State.Status}}' "$name" 2>/dev/null || true)"
  health="$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' "$name" 2>/dev/null || true)"
  restarts="$(docker inspect -f '{{.RestartCount}}' "$name" 2>/dev/null || true)"
  test "$state" = 'running' || record_failure "$name state=${state:-missing}"
  test "$health" = 'healthy' || record_failure "$name health=${health:-missing}"
  test "$restarts" = '0' || record_failure "$name restarts=${restarts:-missing}"
}

http_check() {
  local label="$1"
  local url="$2"
  local expected="$3"
  local code
  code="$(curl --silent --show-error --output /dev/null --connect-timeout 5 --max-time 15 --write-out '%{http_code}' "$url" 2>/dev/null || true)"
  test "$code" = "$expected" || record_failure "$label http=${code:-failed} expected=$expected"
}

for command_name in awk basename cat cut curl date df docker find head id install logger readlink sha256sum sort stat systemctl; do
  command -v "$command_name" >/dev/null 2>&1 || record_failure "missing command: $command_name"
done
test "${#failures[@]}" -eq 0 || emit_failure
test "${EUID:-$(id -u)}" = '0' || record_failure 'must run as root'
[[ "$MAX_BACKUP_AGE_SECONDS" =~ ^[0-9]+$ ]] || record_failure 'maximum backup age is not an unsigned integer'
[[ "$MIN_FREE_BYTES" =~ ^[0-9]+$ ]] || record_failure 'minimum free bytes is not an unsigned integer'
test "${#failures[@]}" -eq 0 || emit_failure
install -d -m 0700 "$DOCKER_CONFIG_DIR" || record_failure 'isolated Docker configuration directory could not be prepared'
export DOCKER_CONFIG="$DOCKER_CONFIG_DIR"
test "${#failures[@]}" -eq 0 || emit_failure

current_release="$(readlink -f "$BASE_DIR/current" 2>/dev/null || true)"
release_marker=''
if test -n "$current_release" && test -d "$current_release"; then
  release_marker="$(cat "$current_release/.forge-release-sha" 2>/dev/null || true)"
  test "$(basename "$current_release")" = "$release_marker" || record_failure 'current release marker does not match its directory'
else
  record_failure 'current release symlink is missing or invalid'
fi

container_check "$PLATFORM_CONTAINER"
container_check "$ORCHESTRATOR_CONTAINER"
container_check "$GATEWAY_CONTAINER"
http_check 'Forge health' 'http://127.0.0.1:3401/health' '200'
http_check 'Forge readiness' 'http://127.0.0.1:3401/ready' '200'
http_check 'Orchestrator health' 'http://127.0.0.1:3301/health' '200'
test "$(systemctl is-active nginx 2>/dev/null || true)" = 'active' || record_failure 'Nginx is not active'

latest_backup=''
if test -d "$BACKUP_DIR"; then
  latest_backup="$({ find "$BACKUP_DIR" -maxdepth 1 -type f -name 'forge-auto-*.db.gz' -printf '%T@|%p\n' 2>/dev/null | sort -nr | head -n 1 | cut -d'|' -f2-; } || true)"
else
  record_failure 'automated candidate backup directory is missing'
fi
if test -z "$latest_backup"; then
  record_failure 'no automated candidate backup exists'
else
  backup_mtime="$(stat -c %Y "$latest_backup" 2>/dev/null || true)"
  if [[ "$backup_mtime" =~ ^[0-9]+$ ]]; then
    backup_age="$(( $(date +%s) - backup_mtime ))"
    test "$backup_age" -ge 0 || record_failure "latest backup timestamp is ${backup_age#-}s in the future"
    test "$backup_age" -le "$MAX_BACKUP_AGE_SECONDS" || record_failure "latest backup age=${backup_age}s limit=${MAX_BACKUP_AGE_SECONDS}s"
  else
    record_failure 'latest backup modification time is invalid'
  fi
  checksum_file="${latest_backup}.sha256"
  if test -f "$checksum_file"; then
    expected_sha256="$(awk 'NR == 1 {print $1}' "$checksum_file" 2>/dev/null || true)"
    actual_sha256="$(sha256sum "$latest_backup" 2>/dev/null | awk '{print $1}' || true)"
    [[ "$expected_sha256" =~ ^[0-9a-fA-F]{64}$ ]] || record_failure 'latest backup checksum file is invalid'
    test "$actual_sha256" = "$expected_sha256" || record_failure 'latest backup checksum failed'
  else
    record_failure 'latest backup checksum file is missing'
  fi
fi

free_kib="$(df -Pk "$BASE_DIR" 2>/dev/null | awk 'NR == 2 {print $4}' || true)"
free_bytes=0
if [[ "$free_kib" =~ ^[0-9]+$ ]]; then
  free_bytes="$(( free_kib * 1024 ))"
  test "$free_bytes" -ge "$MIN_FREE_BYTES" || record_failure "free storage=${free_bytes} bytes minimum=${MIN_FREE_BYTES}"
else
  record_failure 'free storage could not be measured'
fi

if test "${#failures[@]}" -gt 0; then
  emit_failure
fi

logger -t forge-candidate-monitor -- "PASS release=$release_marker backup=$(basename "$latest_backup") free_bytes=$free_bytes"
printf 'forge candidate monitor: PASS release=%s backup=%s free_bytes=%s\n' "$release_marker" "$(basename "$latest_backup")" "$free_bytes"
