// Stub contract listener. In production: ethers provider + contract.on(...)
export function startChainListener() {
  console.log("[chain] listener stub active (no RPC connected in demo mode)");
  // Example wiring:
  // const provider = new ethers.JsonRpcProvider(process.env.CHAIN_RPC);
  // const insight = new ethers.Contract(addr, abi, provider);
  // insight.on("InsightSubmitted", (id, submitter) => { ...verify... });
}
