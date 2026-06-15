// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title EurekaBond — institutional bounties for specific discoveries.
contract EurekaBond is AccessControl, ReentrancyGuard {
    bytes32 public constant ARBITER_ROLE = keccak256("ARBITER_ROLE");

    uint256 public constant CREATION_FEE_BPS = 200; // 2%
    uint256 public constant SUCCESS_FEE_BPS  = 500; // 5%

    struct Bond {
        address creator;
        IERC20 rewardToken;
        uint256 rewardAmount;
        string criteria;        // IPFS URI
        uint256 deadline;
        bool claimed;
        address claimer;
        uint256 insightId;
    }

    Bond[] public bonds;

    event BondCreated(uint256 indexed id, address indexed creator, uint256 amount, uint256 deadline);
    event BondClaimed(uint256 indexed id, address indexed claimer, uint256 insightId);
    event BondRefunded(uint256 indexed id);

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ARBITER_ROLE, msg.sender);
    }

    function createBond(
        IERC20 rewardToken,
        uint256 rewardAmount,
        string calldata criteria,
        uint256 durationDays
    ) external returns (uint256 id) {
        require(rewardAmount > 0 && durationDays > 0, "Bad params");
        uint256 fee = (rewardAmount * CREATION_FEE_BPS) / 10000;
        require(rewardToken.transferFrom(msg.sender, address(this), rewardAmount + fee), "Transfer failed");
        id = bonds.length;
        bonds.push(Bond(msg.sender, rewardToken, rewardAmount, criteria, block.timestamp + durationDays * 1 days, false, address(0), 0));
        emit BondCreated(id, msg.sender, rewardAmount, block.timestamp + durationDays * 1 days);
    }

    /// @notice Arbiter confirms a matching insight; pays winner minus success fee.
    function awardBond(uint256 id, address winner, uint256 insightId) external onlyRole(ARBITER_ROLE) nonReentrant {
        Bond storage b = bonds[id];
        require(!b.claimed, "Claimed");
        require(block.timestamp <= b.deadline, "Expired");
        b.claimed = true;
        b.claimer = winner;
        b.insightId = insightId;
        uint256 fee = (b.rewardAmount * SUCCESS_FEE_BPS) / 10000;
        require(b.rewardToken.transfer(winner, b.rewardAmount - fee), "Payout failed");
        emit BondClaimed(id, winner, insightId);
    }

    function refund(uint256 id) external nonReentrant {
        Bond storage b = bonds[id];
        require(msg.sender == b.creator, "Not creator");
        require(!b.claimed && block.timestamp > b.deadline, "Not refundable");
        b.claimed = true;
        require(b.rewardToken.transfer(b.creator, b.rewardAmount), "Refund failed");
        emit BondRefunded(id);
    }

    function getBondCount() external view returns (uint256) { return bonds.length; }
}
