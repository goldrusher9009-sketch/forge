const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Minera core", function () {
  let token, pool, insight, owner, miner;

  beforeEach(async () => {
    [owner, miner] = await ethers.getSigners();
    token = await (await ethers.getContractFactory("MineraToken")).deploy();
    pool = await (await ethers.getContractFactory("MiningPool")).deploy(await token.getAddress());
    insight = await (await ethers.getContractFactory("InsightVerification")).deploy(await token.getAddress());
    const MINTER = await token.MINTER_ROLE();
    await token.grantRole(MINTER, await pool.getAddress());
    await token.grantRole(MINTER, await insight.getAddress());
  });

  it("mints within cap and burns", async () => {
    await token.mint(owner.address, ethers.parseEther("100"));
    expect(await token.balanceOf(owner.address)).to.equal(ethers.parseEther("100"));
    await token.burn(ethers.parseEther("40"));
    expect(await token.balanceOf(owner.address)).to.equal(ethers.parseEther("60"));
  });

  it("accrues mining rewards over time", async () => {
    await pool.connect(miner).checkIn();
    await ethers.provider.send("evm_increaseTime", [10]);
    await ethers.provider.send("evm_mine");
    expect(await pool.getPendingRewards(miner.address)).to.be.gt(0n);
  });

  it("submits then verifies an insight", async () => {
    await token.mint(miner.address, ethers.parseEther("10"));
    await token.connect(miner).approve(await insight.getAddress(), ethers.parseEther("10"));
    await insight.connect(miner).submitInsight(
      ethers.id("prompt"), ethers.id("response"), "ipfs://meta", []
    );
    await insight.verifyInsight(0, true);
    const ins = await insight.insights(0);
    expect(ins.status).to.equal(1); // Verified
  });
});
