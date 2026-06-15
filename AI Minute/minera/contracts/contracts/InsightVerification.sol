// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./MineraToken.sol";

/// @title InsightVerification — submit, verify and license knowledge assets.
contract InsightVerification is AccessControl {
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");

    MineraToken public token;

    uint256 public constant REWARD = 100e18;
    uint256 public constant STAKE_AMOUNT = 10e18;

    enum Status { Pending, Verified, Rejected, Licensed }

    struct Insight {
        bytes32 promptHash;
        bytes32 responseHash;
        address submitter;
        Status status;
        uint256 stake;
        uint256 timestamp;
        string metadataURI;
    }

    Insight[] public insights;
    mapping(uint256 => address[]) public dataContributors;

    event InsightSubmitted(uint256 indexed id, address indexed submitter, bytes32 promptHash);
    event InsightVerified(uint256 indexed id, Status status);
    event InsightLicensed(uint256 indexed id, uint256 amount, address indexed licensee);

    constructor(address _token) {
        token = MineraToken(_token);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(VERIFIER_ROLE, msg.sender);
    }

    function submitInsight(
        bytes32 promptHash,
        bytes32 responseHash,
        string calldata metadataURI,
        address[] calldata contributors
    ) external returns (uint256 id) {
        require(token.transferFrom(msg.sender, address(this), STAKE_AMOUNT), "Stake failed");
        id = insights.length;
        insights.push(Insight(promptHash, responseHash, msg.sender, Status.Pending, STAKE_AMOUNT, block.timestamp, metadataURI));
        if (contributors.length > 0) dataContributors[id] = contributors;
        emit InsightSubmitted(id, msg.sender, promptHash);
    }

    function verifyInsight(uint256 id, bool approved) external onlyRole(VERIFIER_ROLE) {
        Insight storage ins = insights[id];
        require(ins.status == Status.Pending, "Already resolved");
        if (approved) {
            ins.status = Status.Verified;
            token.mint(ins.submitter, REWARD);
            token.transfer(ins.submitter, ins.stake);   // return stake
        } else {
            ins.status = Status.Rejected;               // stake forfeited (burnable)
        }
        emit InsightVerified(id, ins.status);
    }

    /// @notice License a verified insight with native currency; splits 40/35/20/5.
    function licenseInsight(uint256 id) external payable {
        Insight storage ins = insights[id];
        require(ins.status == Status.Verified, "Not verified");
        require(msg.value > 0, "No payment");
        ins.status = Status.Licensed;

        uint256 amount = msg.value;
        uint256 promptShare  = (amount * 40) / 100;
        // computeShare 35% and dataShare 20% distributed off-chain by pool / contributors
        // 5% retained as protocol fee for buyback-and-burn
        (bool ok, ) = payable(ins.submitter).call{value: promptShare}("");
        require(ok, "Payout failed");

        emit InsightLicensed(id, amount, msg.sender);
    }

    function getInsightCount() external view returns (uint256) {
        return insights.length;
    }
}
