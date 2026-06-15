// Validates env + reports active integration modes on boot.
import { logger } from "./lib/logger.js";

export function loadConfig() {
  const cfg = {
    port: Number(process.env.PORT) || 4000,
    brand: process.env.BRAND || "Minera",
    swarm: process.env.PETALS_URL ? "petals" : "mock",
    dkg: process.env.DKG_ENDPOINT ? "origintrail" : "local",
    chain: !!(process.env.CHAIN_RPC && process.env.TOKEN_ADDRESS),
  };

  // warn on partial chain config
  if (process.env.CHAIN_RPC && !process.env.TOKEN_ADDRESS)
    logger.warn("CHAIN_RPC set but TOKEN_ADDRESS missing — chain mirror disabled. Run deploy first.");
  if (process.env.TOKEN_ADDRESS && !process.env.CHAIN_RPC)
    logger.warn("TOKEN_ADDRESS set but CHAIN_RPC missing — chain mirror disabled.");

  logger.info(`config: brand=${cfg.brand} port=${cfg.port} swarm=${cfg.swarm} dkg=${cfg.dkg} chain=${cfg.chain ? "on" : "db-only"}`);
  return cfg;
}
