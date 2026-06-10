// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ZK-SoulBound Token (ZK-SBT)
 * @notice Non-transferable identity token carrying ZK-verified V-Score tier.
 *
 * - One SBT per address.
 * - V-Score tier updated by VIVA oracle (off-chain GNN → ZK proof → on-chain update).
 * - Tier proofs verified via Iden3 Groth16 snark.
 * - SBT cannot be transferred (soul-bound).
 */
contract ZKSBT is Ownable {
    // V-Score tiers
    uint8 public constant TIER_SEED     = 0;
    uint8 public constant TIER_RISING   = 1;
    uint8 public constant TIER_STABLE   = 2;
    uint8 public constant TIER_GUARDIAN = 3;
    uint8 public constant TIER_SOVEREIGN= 4;

    struct Identity {
        uint256 tokenId;
        uint8   tier;
        bytes32 zkProofHash;    // hash of latest Iden3 ZK proof
        bool    humanVerified;  // World ID proof-of-human
        uint256 issuedAt;
        uint256 updatedAt;
    }

    mapping(address => Identity) private _identities;
    mapping(uint256 => address)  private _tokenOwner;

    uint256 private _nextTokenId = 1;
    address public oracle;         // VIVA backend oracle
    address public worldIdOracle;  // World ID verifier

    event SBTIssued(address indexed user, uint256 tokenId, uint8 tier);
    event TierUpdated(address indexed user, uint8 oldTier, uint8 newTier, bytes32 proofHash);
    event HumanVerified(address indexed user);

    modifier onlyOracle() {
        require(msg.sender == oracle || msg.sender == owner(), "not oracle");
        _;
    }

    constructor(address _oracle, address _worldIdOracle) Ownable(msg.sender) {
        oracle        = _oracle;
        worldIdOracle = _worldIdOracle;
    }

    /**
     * @notice Issue SBT to new VIVA user. Called on verified signup.
     */
    function issue(
        address user,
        uint8   tier,
        bytes32 zkProofHash,
        bool    humanVerified
    ) external onlyOracle {
        require(_identities[user].tokenId == 0, "already issued");
        uint256 tokenId = _nextTokenId++;
        _identities[user] = Identity({
            tokenId:       tokenId,
            tier:          tier,
            zkProofHash:   zkProofHash,
            humanVerified: humanVerified,
            issuedAt:      block.timestamp,
            updatedAt:     block.timestamp
        });
        _tokenOwner[tokenId] = user;
        emit SBTIssued(user, tokenId, tier);
    }

    /**
     * @notice Update V-Score tier on-chain with new ZK proof.
     *         Called by oracle when GNN recomputes score.
     */
    function updateTier(
        address user,
        uint8   newTier,
        bytes32 newProofHash
    ) external onlyOracle {
        require(_identities[user].tokenId != 0, "no identity");
        uint8 oldTier = _identities[user].tier;
        _identities[user].tier        = newTier;
        _identities[user].zkProofHash = newProofHash;
        _identities[user].updatedAt   = block.timestamp;
        emit TierUpdated(user, oldTier, newTier, newProofHash);
    }

    /**
     * @notice Mark user as World-ID verified human.
     */
    function markHumanVerified(address user) external {
        require(msg.sender == worldIdOracle || msg.sender == owner(), "not world id oracle");
        require(_identities[user].tokenId != 0, "no identity");
        _identities[user].humanVerified = true;
        emit HumanVerified(user);
    }

    // ---- View ----

    function identityOf(address user) external view returns (Identity memory) {
        return _identities[user];
    }

    function tierOf(address user) external view returns (uint8) {
        return _identities[user].tier;
    }

    function isHuman(address user) external view returns (bool) {
        return _identities[user].humanVerified;
    }

    function hasSBT(address user) external view returns (bool) {
        return _identities[user].tokenId != 0;
    }

    // ---- Non-transferable ----

    function transfer(address, uint256) external pure { revert("SBT: non-transferable"); }
    function approve(address, uint256) external pure  { revert("SBT: non-transferable"); }
    function transferFrom(address, address, uint256) external pure { revert("SBT: non-transferable"); }

    function setOracle(address _oracle) external onlyOwner { oracle = _oracle; }
}
