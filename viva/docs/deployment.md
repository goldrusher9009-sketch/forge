# VIVA Deployment Guide

## Infrastructure Overview

```
Cloud: AWS (primary) + Cloudflare (CDN/DDoS)

┌─────────────────────────────────────────────────────────┐
│  Cloudflare (DNS, DDoS, CDN, WebSocket proxying)        │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│  AWS EKS (Kubernetes cluster)                           │
│                                                         │
│  api-gateway     3 replicas    (2 CPU, 2GB RAM each)    │
│  messenger       3 replicas    (1 CPU, 1GB RAM)         │
│  social          3 replicas    (1 CPU, 1GB RAM)         │
│  marketplace     2 replicas    (1 CPU, 1GB RAM)         │
│  finance         2 replicas    (2 CPU, 2GB RAM)         │
│  vscore          2 replicas    (4 CPU, 8GB RAM, GPU opt)│
│  twin            2 replicas    (4 CPU, 8GB RAM)         │
│  health          2 replicas    (1 CPU, 1GB RAM)         │
│  dating          2 replicas    (2 CPU, 2GB RAM)         │
│  rooms           2 replicas    (1 CPU, 1GB RAM)         │
│  notifications   2 replicas    (1 CPU, 1GB RAM)         │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│  AWS RDS (PostgreSQL 15 + TimescaleDB)                  │
│  db.r6g.2xlarge — Multi-AZ                              │
│  Read replicas: 2 (for analytics/social queries)        │
├─────────────────────────────────────────────────────────┤
│  AWS ElastiCache (Redis Cluster)                        │
│  cache.r6g.large — 3 nodes                              │
├─────────────────────────────────────────────────────────┤
│  LiveKit Cloud (audio rooms)                            │
│  IPFS (Pinata) + Arweave (permanent)                    │
│  Base L2 RPC (Alchemy / QuickNode)                      │
└─────────────────────────────────────────────────────────┘
```

## Prerequisites

```bash
# Required tools
node >= 20
go >= 1.22
rust >= 1.77
python >= 3.11
docker >= 24
kubectl >= 1.28
helm >= 3.12
foundry (for contracts)
```

## Local Development

### 1. Start infrastructure
```bash
cd viva
docker-compose up -d   # PostgreSQL + TimescaleDB + Redis
```

### 2. Run database migrations
```bash
psql $DATABASE_URL -f database/migrations/001_init.sql
psql $DATABASE_URL -f database/migrations/002_marketplace_finance.sql
psql $DATABASE_URL -f database/migrations/003_health_dating_rooms.sql
```

### 3. Start services
```bash
# API Gateway (Rust)
cd backend/api-gateway && cargo run

# Messenger (Go)
cd backend/messenger && go run ./src

# Social (Go)
cd backend/social && go run ./src

# V-Score (Python)
cd backend/vscore && pip install -r requirements.txt && python src/main.py

# Twin (Python)
cd backend/twin && python src/main.py

# Finance (Rust)
cd backend/finance && cargo run

# Health (Python)
cd backend/health && python src/main.py

# Dating (Go)
cd backend/dating && go run ./src

# Rooms (Go)
cd backend/rooms && go run ./src

# Notifications (Python)
cd backend/notifications && python src/main.py
```

### 4. Start mobile
```bash
cd apps/mobile
npm install
npx expo start
```

## Environment Variables

### API Gateway
```env
PORT=8080
REDIS_URL=redis://localhost:6379
JWT_SECRET=<256-bit secret>
MESSENGER_URL=http://localhost:3001
SOCIAL_URL=http://localhost:3002
MARKETPLACE_URL=http://localhost:3003
FINANCE_URL=http://localhost:3004
VSCORE_URL=http://localhost:3005
TWIN_URL=http://localhost:3006
HEALTH_URL=http://localhost:3007
DATING_URL=http://localhost:3008
ROOMS_URL=http://localhost:3009
NOTIFICATIONS_URL=http://localhost:3010
```

### Finance Service
```env
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
BASE_RPC_URL=https://mainnet.base.org
VIVA_TOKEN_ADDRESS=0x...
AD_MARKETPLACE_ADDRESS=0x...
PREDICTION_MARKET_ADDRESS=0x...
YOUTOKEN_FACTORY_ADDRESS=0x...
TREASURY_ADDRESS=0x...
```

### V-Score Service
```env
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
GNN_MODEL_PATH=models/vscore_gnn.pt
PORT=3005
```

### Twin Service
```env
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
OPENAI_API_KEY=sk-...
META_AGENT_MODEL=models/meta_agent_v2.pt
PORT=3006
```

### Mobile
```env
EXPO_PUBLIC_API_URL=https://api.viva.app
EXPO_PUBLIC_WS_URL=wss://api.viva.app
EXPO_PUBLIC_BASE_RPC=https://mainnet.base.org
EXPO_PUBLIC_DYNAMIC_ENV_ID=<dynamic.xyz env id>
EXPO_PUBLIC_WORLD_APP_ID=<world id app>
```

## Contract Deployment (Base L2)

```bash
cd contracts

# Install Foundry deps
forge install OpenZeppelin/openzeppelin-contracts

# Deploy (Base mainnet)
forge script script/Deploy.s.sol:DeployAll \
  --rpc-url https://mainnet.base.org \
  --broadcast \
  --verify \
  --etherscan-api-url https://api.basescan.org/api \
  --etherscan-api-key $BASESCAN_KEY

# Output: saves addresses to deployments/base-mainnet.json
```

## Kubernetes Deployment

```bash
# Build + push images
docker build -t viva/api-gateway:latest backend/api-gateway
# ... repeat for each service

# Apply Helm chart
helm upgrade --install viva ./helm \
  --namespace viva \
  --values helm/values.prod.yaml \
  --set image.tag=latest
```

## Health Checks

All services expose `GET /health` → `200 OK`.  
Kubernetes readiness probe: `/health`  
Kubernetes liveness probe: `/health`

## Scaling Rules (HPA)

| Service       | Min | Max | CPU trigger |
|---------------|-----|-----|-------------|
| api-gateway   | 3   | 20  | 60%         |
| messenger     | 3   | 15  | 70%         |
| social        | 3   | 15  | 70%         |
| vscore        | 2   | 8   | 80%         |
| twin          | 2   | 8   | 80%         |
| finance       | 2   | 10  | 60%         |

## Monitoring

- Metrics: Prometheus + Grafana
- Traces: OpenTelemetry → Jaeger
- Logs: Loki
- Alerts: PagerDuty (P1: latency >500ms, error rate >1%)
- On-chain: Tenderly (contract monitoring)
