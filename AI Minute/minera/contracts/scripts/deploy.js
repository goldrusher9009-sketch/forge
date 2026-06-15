const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const Token = await hre.ethers.getContractFactory("MineraToken");
  const token = await Token.deploy(); await token.waitForDeployment();
  const tokenAddr = await token.getAddress();

  const Pool = await hre.ethers.getContractFactory("MiningPool");
  const pool = await Pool.deploy(tokenAddr); await pool.waitForDeployment();

  const Insight = await hre.ethers.getContractFactory("InsightVerification");
  const insight = await Insight.deploy(tokenAddr); await insight.waitForDeployment();

  const Bond = await hre.ethers.getContractFactory("EurekaBond");
  const bond = await Bond.deploy(); await bond.waitForDeployment();

  const Staking = await hre.ethers.getContractFactory("Staking");
  const staking = await Staking.deploy(tokenAddr); await staking.waitForDeployment();

  const Gov = await hre.ethers.getContractFactory("Governance");
  const gov = await Gov.deploy(tokenAddr); await gov.waitForDeployment();

  const Market = await hre.ethers.getContractFactory("InsightMarketplace");
  const market = await Market.deploy(deployer.address); await market.waitForDeployment();

  const MINTER = await token.MINTER_ROLE();
  await (await token.grantRole(MINTER, await pool.getAddress())).wait();
  await (await token.grantRole(MINTER, await insight.getAddress())).wait();
  await (await token.grantRole(MINTER, await staking.getAddress())).wait();

  const addrs = {
    TOKEN_ADDRESS: tokenAddr,
    MINING_POOL_ADDRESS: await pool.getAddress(),
    INSIGHT_ADDRESS: await insight.getAddress(),
    BOND_ADDRESS: await bond.getAddress(),
    STAKING_ADDRESS: await staking.getAddress(),
    GOVERNANCE_ADDRESS: await gov.getAddress(),
    MARKETPLACE_ADDRESS: await market.getAddress(),
  };
  console.log("\n=== Deployed ===");
  for (const [k, v] of Object.entries(addrs)) console.log(`${k}=${v}`);

  // auto-write into ../.env (create if missing)
  const envPath = path.join(__dirname, "..", "..", ".env");
  let env = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : fs.readFileSync(path.join(__dirname, "..", "..", ".env.example"), "utf8");
  for (const [k, v] of Object.entries(addrs)) {
    env = env.match(new RegExp(`^${k}=.*$`, "m")) ? env.replace(new RegExp(`^${k}=.*$`, "m"), `${k}=${v}`) : env + `\n${k}=${v}`;
  }
  // ensure CHAIN_RPC points to localhost for the backend mirror
  if (!/^CHAIN_RPC=/m.test(env)) env += "\nCHAIN_RPC=http://127.0.0.1:8545";
  fs.writeFileSync(envPath, env);
  // also write a JSON for the frontend/back to read
  fs.writeFileSync(path.join(__dirname, "..", "deployments.json"), JSON.stringify(addrs, null, 2));
  console.log("\n✓ Addresses written to .env and contracts/deployments.json");
}
main().catch((e) => { console.error(e); process.exitCode = 1; });
