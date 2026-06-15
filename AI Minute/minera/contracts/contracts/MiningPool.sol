// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./MineraToken.sol";

/// @title MiningPool — proof-of-uptime check-ins accrue MINE rewards.
contract MiningPool is Ownable {
    MineraToken public token;

    uint256 public rewardPerSecond = 1e18;            // 1 MINE / sec (adjustable)
    uint256 public constant MAX_REWARD_PER_SECOND = 10e18;

    mapping(address => uint256) public lastCheckIn;
    mapping(address => uint256) public pendingRewards;
    mapping(address => uint256) public totalEarned;

    event CheckIn(address indexed miner, uint256 timestamp);
    event RewardsClaimed(address indexed miner, uint256 amount);

    constructor(address _token) Ownable(msg.sender) {
        token = MineraToken(_token);
    }

    function checkIn() external {
        uint256 last = lastCheckIn[msg.sender];
        if (last != 0) {
            pendingRewards[msg.sender] += (block.timestamp - last) * rewardPerSecond;
        }
        lastCheckIn[msg.sender] = block.timestamp;
        emit CheckIn(msg.sender, block.timestamp);
    }

    function claimRewards() external {
        uint256 reward = getPendingRewards(msg.sender);
        require(reward > 0, "No rewards");
        pendingRewards[msg.sender] = 0;
        lastCheckIn[msg.sender] = block.timestamp;
        totalEarned[msg.sender] += reward;
        token.mint(msg.sender, reward);
        emit RewardsClaimed(msg.sender, reward);
    }

    function getPendingRewards(address miner) public view returns (uint256) {
        uint256 pending = pendingRewards[miner];
        if (lastCheckIn[miner] != 0) {
            pending += (block.timestamp - lastCheckIn[miner]) * rewardPerSecond;
        }
        return pending;
    }

    function setRewardPerSecond(uint256 _r) external onlyOwner {
        require(_r <= MAX_REWARD_PER_SECOND, "Too high");
        rewardPerSecond = _r;
    }
}
