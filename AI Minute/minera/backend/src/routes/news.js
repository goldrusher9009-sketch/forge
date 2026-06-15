import { Router } from "express";
const r = Router();
// curated release notes (kept in sync with CHANGELOG.md)
const NEWS = [
  { v: "0.1.0", date: "2026-06", items: [
    "Full economy: token, mining, insights, marketplace, bonds, prediction markets",
    "Staking (18% APR), DAO governance, subnets, auto buyback-burn",
    "Realtime SSE feed, activity, leaderboard, analytics, treasury, network map",
    "Referrals, achievements, profiles, faucet, notifications + prefs",
    "Admin: verifier queue, KPIs, health, multi-sig treasury, backup",
    "7 smart contracts + Hardhat tests; on-chain mirror + event indexer",
    "PWA, i18n (EN/ES/FR), a11y, 3 theme presets, keyboard shortcuts",
    "Observability: metrics, webhooks, status page, OpenAPI docs",
    "33 passing API tests, load-tested ~726 req/s, Docker + CI",
  ]},
];
r.get("/", (_req, res) => res.json(NEWS));
export default r;
