// Contract event indexer. Subscribes to on-chain events when chain is active,
// mirrors them into chain_events + emits to the live feed. No-op in db-only mode.
import { db } from "../database/db.js";
import { emit } from "../lib/bus.js";
import { chainStatus } from "./chain.js";

const INSIGHT_ABI = [
  "event InsightSubmitted(uint256 indexed id, address indexed submitter, bytes32 promptHash)",
  "event InsightVerified(uint256 indexed id, uint8 status)",
];

function record(name, args, ev) {
  db.prepare("INSERT INTO chain_events (name,args,tx_hash,block,ts) VALUES (?,?,?,?,?)")
    .run(name, JSON.stringify(args), ev?.log?.transactionHash || null, ev?.log?.blockNumber || null, Date.now());
  emit("chain-event", { name, args });
}

export async function startIndexer() {
  const status = chainStatus();
  if (!status.active || !status.token) { console.log("[indexer] db-only, not subscribing"); return; }
  try {
    const { ethers } = await import("ethers");
    const provider = new ethers.JsonRpcProvider(process.env.CHAIN_RPC);
    if (process.env.INSIGHT_ADDRESS) {
      const c = new ethers.Contract(process.env.INSIGHT_ADDRESS, INSIGHT_ABI, provider);
      c.on("InsightSubmitted", (id, submitter, _h, ev) => record("InsightSubmitted", { id: id.toString(), submitter }, ev));
      c.on("InsightVerified", (id, st, ev) => record("InsightVerified", { id: id.toString(), status: Number(st) }, ev));
      console.log("[indexer] subscribed to InsightVerification events");
    }
  } catch (e) { console.log("[indexer] failed:", e.message); }
}
