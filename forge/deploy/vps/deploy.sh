#!/usr/bin/env bash
# Deploy the Forge stack on the VPS. Run ON the VPS from /opt/forge-pi (the synced
# copy of the forge/ subfolder). Requires /opt/forge-pi/.env.forge-vps.
set -euo pipefail
cd "$(dirname "$0")/../.."
ENV_FILE=".env.forge-vps"
[ -f "$ENV_FILE" ] || { echo "missing $ENV_FILE" >&2; exit 1; }
export COMPOSE_DOCKER_CLI_BUILD=1 DOCKER_BUILDKIT=1

# Keep the domestic Docker, apt and npm mirrors declared by the source files.
# When building from this host is slow, transfer verified images built locally;
# never rewrite the checked-in dependency sources during a deployment.

echo "== build images"
docker compose --env-file "$ENV_FILE" -f forge-vps.compose.yml --profile runtime-image build sandbox-runtime
docker compose --env-file "$ENV_FILE" -f forge-vps.compose.yml build forge-sandbox-orchestrator forge-pi-worker forge-platform

echo "== start"
docker compose --env-file "$ENV_FILE" -f forge-vps.compose.yml up -d

echo "== wait for /ready"
for i in $(seq 1 60); do
  if docker compose --env-file "$ENV_FILE" -f forge-vps.compose.yml exec -T forge-platform node -e "fetch('http://127.0.0.1:3000/ready').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))" >/dev/null 2>&1; then echo ready; break; fi
  sleep 3
  [ "$i" = 60 ] && { echo "platform not ready" >&2; docker compose --env-file "$ENV_FILE" -f forge-vps.compose.yml logs --tail=100 forge-platform; exit 1; }
done
docker compose --env-file "$ENV_FILE" -f forge-vps.compose.yml ps
