// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @title Governance — token-weighted proposals and voting.
contract Governance {
    IERC20 public token;

    struct Proposal { string title; uint256 yes; uint256 no; uint256 ends; bool executed; address creator; }
    Proposal[] public proposals;
    mapping(uint256 => mapping(address => bool)) public voted;

    event ProposalCreated(uint256 indexed id, address creator, string title);
    event Voted(uint256 indexed id, address voter, bool support, uint256 weight);
    event Executed(uint256 indexed id, bool passed);

    constructor(address _token) { token = IERC20(_token); }

    function propose(string calldata title, uint256 durationDays) external returns (uint256 id) {
        id = proposals.length;
        proposals.push(Proposal(title, 0, 0, block.timestamp + durationDays * 1 days, false, msg.sender));
        emit ProposalCreated(id, msg.sender, title);
    }

    function vote(uint256 id, bool support) external {
        Proposal storage p = proposals[id];
        require(block.timestamp <= p.ends, "ended");
        require(!voted[id][msg.sender], "voted");
        uint256 w = token.balanceOf(msg.sender);
        require(w > 0, "no weight");
        voted[id][msg.sender] = true;
        if (support) p.yes += w; else p.no += w;
        emit Voted(id, msg.sender, support, w);
    }

    function execute(uint256 id) external returns (bool passed) {
        Proposal storage p = proposals[id];
        require(block.timestamp > p.ends, "not ended");
        require(!p.executed, "executed");
        p.executed = true;
        passed = p.yes >= p.no;
        emit Executed(id, passed);
    }

    function proposalCount() external view returns (uint256) { return proposals.length; }
}
