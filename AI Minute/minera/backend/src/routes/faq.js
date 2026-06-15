import { Router } from "express";
const r = Router();
const FAQ = [
  { q: "What is Minera in one sentence?", a: "A super-brain run by thousands of everyday computers that discovers new, verifiable science — and pays everyone who helped, automatically." },
  { q: "Do I need a powerful computer?", a: "No. Compute Miner and Model Trainer use a GPU, but Prompt Explorer, Data Provider, Validator, Curator and others need no special hardware — some need only a small stake." },
  { q: "How do I actually earn?", a: "Sign in, pick roles, and your idle machine mines. You earn from mining uptime, verified insights, royalties when discoveries are licensed, staking yield, prediction markets, bonds, and referrals." },
  { q: "Where does the money come from?", a: "Companies license verified discoveries and pay for API inference. That revenue is split across contributors (40/35/20/5 for licenses) and a slice is burned to make the token scarcer." },
  { q: "What gets burned and why?", a: "A protocol fee from every revenue stream buys MINE on the market and destroys it forever. Less supply over time = scarcity for holders." },
  { q: "Is it real crypto / on-chain?", a: "The demo runs on a database so it works instantly. Set a chain RPC + deployed contracts and balances mirror on-chain; connect a wallet to read your on-chain MINE." },
  { q: "What's a Knowledge Asset / UAL?", a: "When an insight is verified it's registered on a knowledge graph with a Universal Asset Locator (UAL) and full provenance — who contributed what — so royalties are attributable." },
  { q: "What are Eureka Bonds?", a: "Bounties: an institution escrows a reward for a specific breakthrough. Miners target it; the first verified match wins the payout (minus fees)." },
  { q: "How does staking work?", a: "Lock MINE to earn ~18% APR yield that accrues over time. Unstake any time to get principal + accrued yield back." },
  { q: "How is the network governed?", a: "Token-weighted DAO voting. Anyone can propose; votes are weighted by balance; passed proposals can adjust parameters like reward rates." },
];
r.get("/", (_req, res) => res.json(FAQ));
export default r;
