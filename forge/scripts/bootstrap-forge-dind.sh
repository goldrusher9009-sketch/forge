#!/bin/sh
set -eu

runtime_source=${FORGE_SANDBOX_RUNTIME_SOURCE:-/src/runtime}
orchestrator_source=${FORGE_SANDBOX_ORCHESTRATOR_SOURCE:-/src/orchestrator}
runtime_image=${FORGE_SANDBOX_RUNTIME_IMAGE:-forge-sandbox-runtime:local}
orchestrator_image=${FORGE_SANDBOX_ORCHESTRATOR_IMAGE:-forge-sandbox-orchestrator:local}
internal_network=${FORGE_SANDBOX_NETWORK:-forge-sandbox-internal}
egress_network=${FORGE_SANDBOX_EGRESS_NETWORK:-forge-sandbox-egress}
proxy_name=${FORGE_SANDBOX_PROXY_CONTAINER:-forge-sandbox-egress}

wait_for_docker() {
  attempts=0
  until docker info >/dev/null 2>&1; do
    attempts=$((attempts + 1))
    if [ "$attempts" -ge 60 ]; then
      echo "Dedicated Forge Docker daemon did not become ready" >&2
      exit 1
    fi
    sleep 2
  done
}

ensure_network() {
  network_name=$1
  internal_flag=$2
  if docker network inspect "$network_name" >/dev/null 2>&1; then
    return
  fi
  if [ "$internal_flag" = "true" ]; then
    docker network create \
      --driver bridge \
      --internal \
      --label com.forge.managed=sandbox-v1 \
      "$network_name" >/dev/null
  else
    docker network create \
      --driver bridge \
      --label com.forge.managed=sandbox-v1 \
      "$network_name" >/dev/null
  fi
}

wait_for_proxy() {
  attempts=0
  until docker exec "$proxy_name" node -e \
    "require('node:net').connect(8787,'127.0.0.1').once('connect',function(){this.end();process.exit(0)}).once('error',()=>process.exit(1))"; do
    attempts=$((attempts + 1))
    if [ "$attempts" -ge 30 ]; then
      docker logs "$proxy_name" >&2 || true
      echo "Forge sandbox egress proxy did not become ready" >&2
      exit 1
    fi
    sleep 2
  done
}

wait_for_docker

docker build --pull \
  --label com.forge.managed=sandbox-runtime-v1 \
  --tag "$runtime_image" \
  "$runtime_source"

docker build --pull \
  --label com.forge.managed=sandbox-orchestrator-v1 \
  --tag "$orchestrator_image" \
  "$orchestrator_source"

ensure_network "$internal_network" true
ensure_network "$egress_network" false

docker rm --force "$proxy_name" >/dev/null 2>&1 || true
docker run --detach \
  --name "$proxy_name" \
  --restart unless-stopped \
  --user 10002:10002 \
  --read-only \
  --tmpfs /tmp:rw,nosuid,nodev,size=16m \
  --cap-drop ALL \
  --security-opt no-new-privileges:true \
  --label com.forge.managed=sandbox-egress-v1 \
  --network "$internal_network" \
  --env PORT=8787 \
  --env "FORGE_SANDBOX_EGRESS_ALLOWLIST=${FORGE_SANDBOX_EGRESS_ALLOWLIST:-}" \
  "$orchestrator_image" \
  node src/proxy.js >/dev/null

docker network connect "$egress_network" "$proxy_name"
wait_for_proxy

echo "Dedicated Forge Docker daemon bootstrap complete"
