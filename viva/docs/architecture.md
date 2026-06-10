# VIVA System Architecture

## Overview

VIVA is a Life Operating System — a unified super-app combining messenger, social feed, marketplace, dating, health, AI twin, prediction markets, and tokenized identity on a single blockchain-native platform.

```
┌──────────────────────────────────────────────────────────────────┐
│                     VIVA Mobile (React Native)                   │
│  HomeCanvas │ Feed │ Chat │ Market │ Wallet │ Dating │ Rooms     │
└─────────────────────────────┬────────────────────────────────────┘
                              │ HTTPS / WebSocket
┌─────────────────────────────▼────────────────────────────────────┐
│              API Gateway  (Rust/Actix-web, 892K req/s)           │
│  JWT Auth │ Rate Limit (Redis) │ V-Score Inject │ WS Upgrade     │
└──┬──┬──┬──┬──┬──┬──┬──┬──┬───────────────────────────────────────┘
   │  │  │  │  │  │  │  │  │   gRPC / HTTP/2 internal
   ▼  ▼  ▼  ▼  ▼  ▼  ▼  ▼  ▼
┌────────────────────────────────────────────────────────────────┐
│                     Microservices                              │
│                                                                │
│  messenger   (Go/Gin  :3001)  WebSocket Hub, Redis pub-sub    │
│  social      (Go/Chi  :3002)  Feed, NFT mint, Ad slots        │
│  marketplace (Rust    :3003)  Listings, Orders, Escrow        │
│  finance     (Rust    :3004)  Wallet, YouToken, Predictions   │
│  vscore      (Python  :3005)  GNN, ZK-proof, Rings            │
│  twin        (Python  :3006)  HyperAgent, Task executor       │
│  health      (Python  :3007)  ZK biometrics, Ring scores      │
│  dating      (Go/Chi  :3008)  ML matching, pgvector           │
│  rooms       (Go/Chi  :3009)  LiveKit audio, Staking gate     │
│  notifs      (Python  :3010)  FCM, APNs, push workers         │
└────────────────────────────────────────────────────────────────┘
          │                              │
          ▼                              ▼
┌──────────────────┐          ┌──────────────────────────┐
│   PostgreSQL 15  │          │   Base L2 (EVM chain)    │
│   + TimescaleDB  │          │                          │
│   + pgvector     │          │  VIVAToken.sol           │
│   + Redis Cluster│          │  YouTokenFactory.sol     │
└──────────────────┘          │  PredictionMarket.sol    │
                              │  AdMarketplace.sol       │
                              │  ZKSBT.sol               │
                              └──────────────────────────┘
          │
          ▼
┌──────────────────────────────┐
│  Storage                     │
│  IPFS  — mutable content     │
│  Arweave — permanent NFTs    │
│  On-device — raw biometrics  │
└──────────────────────────────┘
```

## Technology Stack

| Layer            | Technology                         | Why                                      |
|------------------|------------------------------------|------------------------------------------|
| Mobile           | React Native + Expo SDK 52         | Cross-platform, OTA updates              |
| Module federation| Re.Pack (Webpack 5)                | Micro-frontend, per-feature bundles      |
| State            | Zustand + persist                  | Lightweight, offline-first               |
| API Gateway      | Rust/Actix-web                     | 892K req/s, 2.1ms P99 latency           |
| Messenger        | Go/Gin + WebSocket                 | High-concurrency WS connections          |
| Social           | Go/Chi                             | Fast HTTP, clean routing                 |
| Marketplace      | Rust/Actix-web                     | Memory-safe, fast escrow logic           |
| Finance          | Rust/Actix-web                     | Correctness-critical, no GC pauses       |
| V-Score          | Python/FastAPI + PyTorch GNN       | ML inference flexibility                 |
| AI Twin          | Python/FastAPI + OpenAI            | LLM integration, agent loops             |
| Health           | Python/FastAPI                     | ZK-proof integration (iden3)             |
| Dating           | Go/Chi + pgvector                  | ML embedding similarity search           |
| Rooms            | Go/Chi + LiveKit                   | Low-latency WebRTC audio                 |
| Notifications    | Python/FastAPI + FCM/APNs          | Push notification fan-out                |
| Primary DB       | PostgreSQL 15 + TimescaleDB        | Time-series + hypertables for events     |
| Vector search    | pgvector                           | ML embeddings for dating + feed          |
| Cache            | Redis Cluster                      | Pub-sub, rate-limit, session cache       |
| Blockchain       | Base L2 (Solidity)                 | Low fees, EVM compatible                 |
| ZK proofs        | Iden3 (Groth16)                    | Health data privacy                      |
| Identity         | World ID + Dynamic.xyz             | Proof-of-human + embedded wallets        |
| Storage          | IPFS + Arweave                     | Decentralized, permanent NFTs            |
| Audio rooms      | LiveKit                            | Scalable WebRTC SFU                      |

## V-Score Architecture

```
12 Input Factors → Graph Neural Network → Score 0-1000 → Tier

Factors:
  Social:    post engagement, follower quality, room participation
  Wealth:    $VIVA balance, YouToken market cap, transaction volume
  Activity:  steps, active minutes (ZK-attested from device)
  Sleep:     duration, quality score (ZK-attested from device)
  Nutrition: calorie tracking, meal quality (ZK-attested from device)
  Marketplace: seller rating, on-time delivery
  Predictions: accuracy rate over 90 days
  Identity:    World ID verification, account age
  Referrals:   quality of referred users' scores
  AI Twin:     tasks completed, earn rate
  Dating:      match rate, response rate (privacy-preserved)
  Governance:  proposal participation

Tiers:
  Seed       0–199    Basic access
  Rising   200–399    Unlock dating, extended rooms
  Stable   400–649    Distance filters, premium matching
  Guardian 650–849    Creator monetization, governance voting
  Sovereign  850+     Protocol-level privileges, max earn rates
```

## AI Twin Architecture

```
User Request / Schedule Trigger
        │
        ▼
   MetaAgent (orchestrator)
   - Reads user preferences (vector DB)
   - Plans task across domains
   - Self-improves via feedback loop
        │
        ▼
   TaskAgent (executor)
   Domains: commerce | dating | food | freelance | finance | health
   Autonomy: suggest → semi-auto → full-auto
        │
        ▼
   Action (marketplace buy, dating message, food order, etc.)
        │
        ▼
   Result + $VIVA earned → user wallet
        │
        ▼
   MetaAgent learns from outcome
```

## Earn Mechanics

| Source               | Mechanism                             | Rate               |
|----------------------|---------------------------------------|--------------------|
| Attention            | Watch 100% of post → reward           | Shared from ad pool|
| Ad Revenue           | Creator 70% of ad slot revenue        | Per impression     |
| AI Twin Task         | Twin completes a domain action        | Varies by domain   |
| Referral             | Both sides on successful join         | $5 each in $VIVA   |
| Marketplace Sale     | 97% to seller (3% platform)           | Per sale           |
| Health Streak        | 7-day streak of logged biometrics     | Bonus $VIVA        |
| Room Host            | Listeners × time × rate               | Per room session   |
| Dating Match         | V-Score quality multiplier            | On mutual match    |
| YouToken Appreciation| Creator's token price rises           | Passive            |
| Prediction Win       | Correct outcome × pool share          | Per market         |
| Staking Yield        | Lock $VIVA for access/governance      | APY on stake       |
