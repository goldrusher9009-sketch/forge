// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./MineraToken.sol";

/// @title Staking — lock MINE, accrue linear APR yield, unstake principal + yield.
contract Staking {
    MineraToken public token;
    uint256 public aprBps = 1800;            // 18% APR
    uint256 public constant YEAR = 365 days;

    struct Position { uint256 amount; uint256 start; bool active; }
    mapping(address => Position[]) public positions;

    event Staked(address indexed user, uint256 id, uint256 amount);
    event Unstaked(address indexed user, uint256 id, uint256 principal, uint256 yieldAmt);

    constructor(address _token) { token = MineraToken(_token); }

    function stake(uint256 amount) external returns (uint256 id) {
        require(amount > 0, "amount=0");
        require(token.transferFrom(msg.sender, address(this), amount), "transfer failed");
        id = positions[msg.sender].length;
        positions[msg.sender].push(Position(amount, block.timestamp, true));
        emit Staked(msg.sender, id, amount);
    }

    function pendingYield(address user, uint256 id) public view returns (uint256) {
        Position memory p = positions[user][id];
        if (!p.active) return 0;
        return (p.amount * aprBps * (block.timestamp - p.start)) / (10000 * YEAR);
    }

    function unstake(uint256 id) external {
        Position storage p = positions[msg.sender][id];
        require(p.active, "inactive");
        uint256 y = pendingYield(msg.sender, id);
        p.active = false;
        token.transfer(msg.sender, p.amount);     // principal
        if (y > 0) token.mint(msg.sender, y);      // yield minted (requires MINTER_ROLE)
        emit Unstaked(msg.sender, id, p.amount, y);
    }
}
