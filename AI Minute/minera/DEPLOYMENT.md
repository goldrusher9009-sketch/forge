# Minera — Deployment Guide

## 0. Prerequisites
- Node.js 22+
- (optional) Docker + Docker Compose
- (optional) a Polygon Amoy/test RPC + funded key for on-chain mode

## 1. Local dev (fastest)
```bash
cd minera
npm install
# terminal A
npm run dev:backend     # http://localhost:4000
# terminal B
npm run dev:frontend    # http://localhost:5173
```
Or just double-click **START.bat** (Windows).

## 2. Run tests
```bash
cd backend && npm install && npm test       # 28 API tests
cd ../contracts && npm install && npm test   # contract tests (needs OZ)
```

## 3. Docker
```bash
cd minera
docker compose up --build
# frontend → http://localhost:8080
# backend  → http://localhost:4000
```

## 4. Smart contracts (optional, enables on-chain mirror)
```bash
cd contracts
npm install
npx hardhat node               # terminal A: local chain
npm run deploy:local           # terminal B: deploys 7 contracts,
                               # auto-writes addresses to ../.env
```
Deploys: MineraToken, MiningPool, InsightVerification, EurekaBond,
Staking, Governance, InsightMarketplace.

For testnet: set `RPC_URL` + `PRIVATE_KEY` in `.env`, then `npm run deploy:amoy`.

## 5. Environment toggles (.env)
| Var | Effect when set |
|-----|-----------------|
| `PETALS_URL` | real swarm inference (else mock) |
| `DKG_ENDPOINT` | real OriginTrail publish (else local UAL) |
| `CHAIN_RPC` + `TOKEN_ADDRESS` | on-chain balance mirror + reward mint + event indexer |
| `PORT` | backend port (default 4000) |

## 6. Production build
```bash
cd frontend && npm run build    # static bundle in dist/
# serve dist/ behind any static host or the provided nginx Dockerfile
```

## 7. Useful scripts
- `npm run seed` — demo data
- `npm run digest` — daily summary
- `npm run loadtest` — throughput check
