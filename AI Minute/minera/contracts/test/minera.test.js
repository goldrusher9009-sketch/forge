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

describe("Minera v2 contracts", function () {
  it("staking locks, accrues yield, unstakes", async () => {
    const [owner] = await ethers.getSigners();
    const token = await (await ethers.getContractFactory("MineraToken")).deploy();
    const staking = await (await ethers.getContractFactory("Staking")).deploy(await token.getAddress());
    await token.grantRole(await token.MINTER_ROLE(), await staking.getAddress());
    await token.mint(owner.address, ethers.parseEther("100"));
    await token.approve(await staking.getAddress(), ethers.parseEther("100"));
    await staking.stake(ethers.parseEther("100"));
    await ethers.provider.send("evm_increaseTime", [86400 * 30]);
    await ethers.provider.send("evm_mine");
    const y = await staking.pendingYield(owner.address, 0);
    expect(y).to.be.gt(0n);
    await staking.unstake(0);
  });

  it("governance: propose, vote weighted, execute", async () => {
    const [owner] = await ethers.getSigners();
    const token = await (await ethers.getContractFactory("MineraToken")).deploy();
    const gov = await (await ethers.getContractFactory("Governance")).deploy(await token.getAddress());
    await token.mint(owner.address, ethers.parseEther("1000"));
    await gov.propose("Raise rewards", 1);
    await gov.vote(0, true);
    const p = await gov.proposals(0);
    expect(p.yes).to.equal(ethers.parseEther("1000"));
    await ethers.provider.send("evm_increaseTime", [86400 * 2]);
    await ethers.provider.send("evm_mine");
    await gov.execute(0);
  });

  it("marketplace splits a license payment", async () => {
    const [owner, sub, comp, data] = await ethers.getSigners();
    const market = await (await ethers.getContractFactory("InsightMarketplace")).deploy(owner.address);
    await market.list(1, sub.address, comp.address, data.address);
    const before = await ethers.provider.getBalance(sub.address);
    await market.connect(owner).license(0, { value: ethers.parseEther("1") });
    const after = await ethers.provider.getBalance(sub.address);
    expect(after - before).to.equal(ethers.parseEther("0.4")); // 40%
  });
});
