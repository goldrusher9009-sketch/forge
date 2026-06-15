// Dependency-free wallet connector using the injected EIP-1193 provider (MetaMask etc).
import { ADDRESSES } from "./contracts/abis.js";

export function hasWallet() { return typeof window !== "undefined" && !!window.ethereum; }

export async function connectWallet() {
  if (!hasWallet()) throw new Error("No browser wallet found (install MetaMask)");
  const accts = await window.ethereum.request({ method: "eth_requestAccounts" });
  return accts[0];
}

// read on-chain MINE balance via raw eth_call (balanceOf(address))
export async function onchainBalance(address) {
  if (!hasWallet() || !ADDRESSES.token) return null;
  // function selector for balanceOf(address) = 0x70a08231
  const data = "0x70a08231" + address.replace(/^0x/, "").padStart(64, "0");
  try {
    const hex = await window.ethereum.request({ method: "eth_call", params: [{ to: ADDRESSES.token, data }, "latest"] });
    const wei = BigInt(hex || "0x0");
    return Number(wei / 10n ** 14n) / 1e4; // 18 decimals → 4dp
  } catch { return null; }
}

export function onAccountChange(cb) {
  if (hasWallet()) window.ethereum.on?.("accountsChanged", (a) => cb(a[0] || null));
}
