#!/usr/bin/env bash
set -euo pipefail

MODE="${1:-internal}"
BASE_DIR="${FORGE_BASE_DIR:-/opt/forge-private-isolated}"
EDGE_ENV_FILE="${FORGE_EDGE_ENV_FILE:-$BASE_DIR/shared/forge-edge.env}"
FORGE_ENV_FILE="${FORGE_ENV_FILE:-$BASE_DIR/shared/forge.env}"
EDGE_RELEASE="${FORGE_EDGE_RELEASE:-$(readlink -f "$BASE_DIR/edge-current" 2>/dev/null || true)}"
EDGE_COMPOSE_FILE="${FORGE_EDGE_COMPOSE_FILE:-$EDGE_RELEASE/forge-vps-cloudflare-tunnel.compose.yml}"
PLATFORM_CONTAINER="forge-private-isolated-forge-platform-1"
ORCHESTRATOR_CONTAINER="forge-private-isolated-forge-sandbox-orchestrator-1"
GATEWAY_CONTAINER="forge-private-edge-forge-control-plane-tunnel-gateway-1"
CLOUDFLARED_CONTAINER="forge-private-edge-forge-cloudflared-1"

fail() {
  printf 'forge edge readiness: FAIL %s\n' "$1" >&2
  exit 1
}

require_command() {
  command -v "$1" >/dev/null 2>&1 || fail "required command is missing: $1"
}

container_state() {
  docker inspect "$1" --format '{{.State.Status}}' 2>/dev/null || true
}

container_health() {
  docker inspect "$1" --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' 2>/dev/null || true
}

container_restarts() {
  docker inspect "$1" --format '{{.RestartCount}}' 2>/dev/null || printf 'unknown'
}

http_code() {
  curl --silent --show-error --output /dev/null --connect-timeout 10 --max-time 30 --write-out '%{http_code}' "$@"
}

case "$MODE" in
  internal|public) ;;
  *) fail 'mode must be internal or public' ;;
esac

for command_name in awk curl docker jq readlink sha256sum stat sudo systemctl; do
  require_command "$command_name"
done

test -f "$EDGE_ENV_FILE" || fail "edge environment is missing: $EDGE_ENV_FILE"
test "$(stat -c %a "$EDGE_ENV_FILE")" = '600' || fail 'edge environment mode must be 0600'
test -f "$FORGE_ENV_FILE" || fail "Forge environment is missing: $FORGE_ENV_FILE"
test "$(stat -c %a "$FORGE_ENV_FILE")" = '600' || fail 'Forge environment mode must be 0600'
test -f "$EDGE_COMPOSE_FILE" || fail "edge Compose file is missing: $EDGE_COMPOSE_FILE"

set -a
# These files are controlled root-owned deployment inputs, not user content.
# shellcheck disable=SC1090
. "$FORGE_ENV_FILE"
# shellcheck disable=SC1090
. "$EDGE_ENV_FILE"
set +a

[[ "${FORGE_CONTROL_PLANE_GATEWAY_SECRET:-}" =~ ^[0-9a-fA-F]{64,}$ ]] || fail 'gateway secret is missing or invalid'
test -n "${CLOUDFLARE_TUNNEL_TOKEN_FILE:-}" || fail 'Tunnel token-file path is missing'
[[ "$CLOUDFLARE_TUNNEL_TOKEN_FILE" == /* ]] || fail 'Tunnel token-file path must be absolute'
[[ "${FRONTEND_URL:-}" == https://* ]] || fail 'FRONTEND_URL must be HTTPS'
expected_redirect="${FRONTEND_URL%/}/api/google-drive/oauth/callback"
test "${GOOGLE_DRIVE_REDIRECT_URI:-}" = "$expected_redirect" || fail 'Google redirect URI does not match FRONTEND_URL'

if test -n "${FORGE_EXPECTED_FRONTEND_ORIGIN:-}"; then
  test "${FRONTEND_URL%/}" = "${FORGE_EXPECTED_FRONTEND_ORIGIN%/}" || fail 'FRONTEND_URL does not match the expected final origin'
fi

docker compose --env-file "$EDGE_ENV_FILE" -f "$EDGE_COMPOSE_FILE" config --quiet

test "$(container_state "$PLATFORM_CONTAINER")" = 'running' || fail 'Forge Platform is not running'
test "$(container_health "$PLATFORM_CONTAINER")" = 'healthy' || fail 'Forge Platform is not healthy'
test "$(container_state "$ORCHESTRATOR_CONTAINER")" = 'running' || fail 'Sandbox Orchestrator is not running'
test "$(container_health "$ORCHESTRATOR_CONTAINER")" = 'healthy' || fail 'Sandbox Orchestrator is not healthy'
test "$(container_state "$GATEWAY_CONTAINER")" = 'running' || fail 'internal Tunnel gateway is not running'
test "$(container_health "$GATEWAY_CONTAINER")" = 'healthy' || fail 'internal Tunnel gateway is not healthy'

test "$(http_code http://127.0.0.1:3401/health)" = '200' || fail 'Forge /health failed'
test "$(http_code http://127.0.0.1:3401/ready)" = '200' || fail 'Forge /ready failed'
test "$(http_code http://127.0.0.1:3301/health)" = '200' || fail 'Orchestrator /health failed'
test "$(http_code http://127.0.0.1:4001/health)" = '200' || fail 'ProjectHash backend health failed'
test "$(http_code http://127.0.0.1:8080/)" = '200' || fail 'ProjectHash frontend health failed'
test "$(docker inspect projecthash-db --format '{{.State.Status}}/{{.State.Health.Status}}')" = 'running/healthy' || fail 'ProjectHash database is not healthy'

test "$(docker port "$PLATFORM_CONTAINER" 3000/tcp)" = '127.0.0.1:3401' || fail 'Forge Platform port is not loopback-only'
test "$(docker port "$ORCHESTRATOR_CONTAINER" 3001/tcp)" = '127.0.0.1:3301' || fail 'Orchestrator port is not loopback-only'
test -z "$(docker port "$GATEWAY_CONTAINER")" || fail 'internal Tunnel gateway publishes a host port'

gateway_networks="$(docker inspect "$GATEWAY_CONTAINER" | jq -r '.[0].NetworkSettings.Networks | keys | sort | join(",")')"
test "$gateway_networks" = 'forge-private-edge,forge-sandbox-control' || fail "unexpected gateway networks: $gateway_networks"

nginx_state="$(systemctl is-active nginx 2>/dev/null || true)"
test "$nginx_state" = 'active' || fail 'existing Nginx is not active'
nginx_hash="$(sudo nginx -T 2>/dev/null | sha256sum | awk '{print $1}')"
test -n "${FORGE_EXPECTED_NGINX_CONFIG_SHA256:-}" || fail 'expected Nginx configuration hash is not configured'
test "$nginx_hash" = "$FORGE_EXPECTED_NGINX_CONFIG_SHA256" || fail 'existing Nginx configuration changed'

login_payload="$(jq -nc --arg email "$ADMIN_EMAIL" --arg password "$ADMIN_PASSWORD" '{email:$email,password:$password}')"
login_response="$(printf '%s' "$login_payload" | curl --fail --silent --show-error --header 'content-type: application/json' --data-binary @- http://127.0.0.1:3401/api/auth/login)"
access_token="$(printf '%s' "$login_response" | jq -er '.accessToken')"
google_config="$(printf 'header = "authorization: Bearer %s"\n' "$access_token" | curl --fail --silent --show-error --config - http://127.0.0.1:3401/api/google-drive/config)"
test -n "${GOOGLE_DRIVE_CLIENT_SECRET:-}" || fail 'Google Drive client secret is missing'
printf '%s' "$google_config" | jq -e --arg secret "$GOOGLE_DRIVE_CLIENT_SECRET" '
  .configured == true and
  .pickerConfigured == true and
  .picker.scope == "https://www.googleapis.com/auth/drive.file" and
  (.picker.clientId | type == "string" and length > 10) and
  (.picker.developerKey | type == "string" and length > 10) and
  (tostring | contains($secret) | not)
' >/dev/null || fail 'Google Drive production configuration failed'
unset login_payload login_response access_token google_config

cloudflared_state="$(container_state "$CLOUDFLARED_CONTAINER")"
token_present='no'
if test -s "$CLOUDFLARE_TUNNEL_TOKEN_FILE"; then token_present='yes'; fi

if test "$MODE" = 'public'; then
  test "$token_present" = 'yes' || fail 'named Tunnel token file is missing or empty'
  test "$(stat -c %a "$CLOUDFLARE_TUNNEL_TOKEN_FILE")" = '400' || fail 'Tunnel token mode must be 0400'
  test "$(stat -c %u:%g "$CLOUDFLARE_TUNNEL_TOKEN_FILE")" = '65532:65532' || fail 'Tunnel token owner must be 65532:65532'
  test "$cloudflared_state" = 'running' || fail 'cloudflared is not running'
  cloudflared_networks="$(docker inspect "$CLOUDFLARED_CONTAINER" | jq -r '.[0].NetworkSettings.Networks | keys | sort | join(",")')"
  test "$cloudflared_networks" = 'forge-private-edge' || fail "unexpected cloudflared networks: $cloudflared_networks"

  public_origin="${FORGE_CONTROL_PLANE_PUBLIC_ORIGIN:-}"
  [[ "$public_origin" == https://* ]] || fail 'FORGE_CONTROL_PLANE_PUBLIC_ORIGIN must be HTTPS in public mode'
  [[ "$public_origin" != *'?'* && "$public_origin" != *'#'* ]] || fail 'public origin must not contain a query or fragment'
  public_origin="${public_origin%/}"
  test "$(http_code "$public_origin/")" = '404' || fail 'public non-API path is not fail-closed'
  test "$(http_code "$public_origin/api/health")" = '404' || fail 'public API accepted a missing gateway secret'
  test "$(http_code --header 'X-Forge-Gateway-Secret: wrong' "$public_origin/api/health")" = '404' || fail 'public API accepted an incorrect gateway secret'
  correct_public_code="$(printf 'header = "X-Forge-Gateway-Secret: %s"\n' "$FORGE_CONTROL_PLANE_GATEWAY_SECRET" | curl --silent --show-error --output /dev/null --connect-timeout 10 --max-time 30 --write-out '%{http_code}' --config - "$public_origin/api/health")"
  test "$correct_public_code" = '200' || fail 'public API rejected the correct gateway secret'
fi

printf 'forge edge readiness: PASS mode=%s forge=%s/%s/%s orchestrator=%s/%s/%s gateway=%s/%s/%s cloudflared=%s token_present=%s nginx_sha256=%s\n' \
  "$MODE" \
  "$(container_state "$PLATFORM_CONTAINER")" "$(container_health "$PLATFORM_CONTAINER")" "$(container_restarts "$PLATFORM_CONTAINER")" \
  "$(container_state "$ORCHESTRATOR_CONTAINER")" "$(container_health "$ORCHESTRATOR_CONTAINER")" "$(container_restarts "$ORCHESTRATOR_CONTAINER")" \
  "$(container_state "$GATEWAY_CONTAINER")" "$(container_health "$GATEWAY_CONTAINER")" "$(container_restarts "$GATEWAY_CONTAINER")" \
  "${cloudflared_state:-absent}" "$token_present" "$nginx_hash"
