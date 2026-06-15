// On-chain bridge. Activates only if CHAIN_RPC + TOKEN_ADDRESS are set in .env.
// Otherwise the app runs DB-only (demo mode) — no crash.
let provider = null, token = null, signer = null, active = false;

const TOKEN_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function totalSupply() view returns (uint256)",
  "function mint(address to, uint256 amount)",
];

export async function initChain() {
  const rpc = process.env.CHAIN_RPC;
  const addr = process.env.TOKEN_ADDRESS;
  if (!rpc || !addr) { console.log("[chain] DB-only mode (no RPC/token configured)"); return; }
  try {
    const { ethers } = await import("ethers");
    provider = new ethers.JsonRpcProvider(rpc);
    if (process.env.VERIFIER_PRIVATE_KEY) signer = new ethers.Wallet(process.env.VERIFIER_PRIVATE_KEY, provider);
    token = new ethers.Contract(addr, TOKEN_ABI, signer || provider);
    await provider.getBlockNumber();
    active = true;
    console.log("[chain] connected:", rpc);
  } catch (e) {
    console.log("[chain] connect failed, staying DB-only:", e.message);
  }
}

export function chainStatus() {
  return { active, rpc: process.env.CHAIN_RPC || null, token: process.env.TOKEN_ADDRESS || null };
}

export async function onchainBalance(address) {
  if (!active) return null;
  try { const { ethers } = await import("ethers");
    const b = await token.balanceOf(address); return Number(ethers.formatEther(b)); }
  catch { return null; }
}

export async function mintReward(address, amount) {
  if (!active || !signer) return { onchain: false };
  try { const { ethers } = await import("ethers");
    const tx = await token.mint(address, ethers.parseEther(String(amount)));
    await tx.wait(); return { onchain: true, hash: tx.hash }; }
  catch (e) { return { onchain: false, error: e.message }; }
}
