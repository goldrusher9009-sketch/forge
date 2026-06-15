require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config({ path: "../.env" });

const { RPC_URL, PRIVATE_KEY } = process.env;

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: { version: "0.8.20", settings: { optimizer: { enabled: true, runs: 200 } } },
  networks: {
    localhost: { url: "http://127.0.0.1:8545" },
    amoy: {
      url: RPC_URL || "https://rpc-amoy.polygon.technology",
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    },
  },
};
