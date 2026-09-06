#!/usr/bin/env bash
# Deploy the Forge stack on the VPS. Run ON the VPS from /opt/forge (the synced
# copy of the forge/ subfolder). Requires /opt/forge/.env.forge-vps.
set -euo pipefail
cd "$(dirname "$0")/../.."
ENV_FILE=".env.forge-vps"
[ -f "$ENV_FILE" ] || { echo "missing $ENV_FILE" >&2; exit 1; }
export COMPOSE_DOCKER_CLI_BUILD=1 DOCKER_BUILDKIT=1

echo "== build images"
docker compose --env-file "$ENV_FILE" -f forge-vps.compose.yml --profile runtime-image build sandbox-runtime
docker compose --env-file "$ENV_FILE" -f forge-vps.compose.yml build forge-sandbox-orchestrator forge-pi-worker forge-platform

echo "== start"
docker compose --env-file "$ENV_FILE" -f forge-vps.compose.yml up -d --remove-orphans

echo "== wait for /ready"
for i in $(seq 1 60); do
  if curl -fsS http://127.0.0.1:${FORGE_VPS_BACKEND_PORT:-3400}/ready >/dev/null 2>&1; then echo ready; break; fi
  sleep 3
  [ "$i" = 60 ] && { echo "platform not ready" >&2; docker compose --env-file "$ENV_FILE" -f forge-vps.compose.yml logs --tail=100 forge-platform; exit 1; }
done
docker compose --env-file "$ENV_FILE" -f forge-vps.compose.yml ps
docker image prune -f >/dev/null
