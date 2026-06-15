# Changelog

## 0.1.0 — Full platform build

### Core economy
- MINE token (capped, mint/burn), mining pool check-in/claim
- Insight submit → verify → reward; OriginTrail DKG Knowledge Assets (UAL)
- Knowledge marketplace with 40/35/20/5 royalty split to real accounts
- Eureka Bonds (create 2% fee / mine / award 5% fee)
- Prediction markets (YES/NO stake, settle, 3% fee)
- Subnets (vertical AI nets, 20–30% operator cut)
- Staking (18% APR), DAO governance (balance-weighted)
- Auto buyback-and-burn engine + scheduled burns

### Platform
- Persistent SQLite DB (23 tables), 33 API routes, ~60 endpoints
- Realtime SSE feed + live ticker + global activity page
- Auth + wallets, transactions ledger (filter + pagination)
- Referrals, achievements/badges, profiles + identicons
- Leaderboard, analytics, treasury transparency, network map
- DEX price oracle, presence/heartbeat, notifications + prefs
- Admin console: verifier queue, KPIs, health, multi-sig treasury

### Smart contracts (7)
- MineraToken, MiningPool, InsightVerification, EurekaBond,
  Staking, Governance, InsightMarketplace + Hardhat tests + auto-deploy

### Quality & ops
- 28 passing API tests + contract tests, load test (~726 req/s)
- Security: rate limiting, headers, validation, error handler
- PWA (installable/offline), i18n (EN/ES/FR), accessibility pass
- 3 theme presets + dark/light, keyboard shortcuts, OpenAPI docs
- Docker + compose, GitHub Actions CI, deployment guide
