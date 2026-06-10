// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title AdMarketplace
 * @notice Permissioned ad slot marketplace on-chain.
 *
 * Creators open an ad slot on a post.
 * Advertisers bid $VIVA.
 * Creator approves/rejects.
 * On approve → 70% to creator, 30% split: 20% platform treasury, 10% post viewers (attention pool).
 */
contract AdMarketplace is Ownable, ReentrancyGuard {
    IERC20  public viva;
    address public treasury;

    uint256 public constant CREATOR_SHARE   = 7000;  // 70%
    uint256 public constant TREASURY_SHARE  = 2000;  // 20%
    uint256 public constant ATTENTION_SHARE = 1000;  // 10%

    struct AdSlot {
        address creator;
        bytes32 postId;        // off-chain post ID (hashed)
        address advertiser;
        uint256 bidViva;
        bool    approved;
        bool    settled;
        address attentionPool; // contract to distribute viewer rewards
    }

    mapping(bytes32 => AdSlot) public slots;  // postId → slot
    mapping(bytes32 => uint256) public attentionPools;  // postId → pooled VIVA

    event SlotOpened(bytes32 indexed postId, address creator);
    event BidPlaced(bytes32 indexed postId, address advertiser, uint256 amount);
    event AdApproved(bytes32 indexed postId, uint256 creatorPayout, uint256 treasuryPayout);
    event AdRejected(bytes32 indexed postId, address advertiser, uint256 refund);
    event AttentionClaimed(bytes32 indexed postId, address viewer, uint256 amount);

    constructor(address _viva, address _treasury) Ownable(msg.sender) {
        viva     = IERC20(_viva);
        treasury = _treasury;
    }

    /**
     * @notice Creator opens ad slot for a post.
     * @param postId Keccak256 hash of off-chain post UUID.
     */
    function openSlot(bytes32 postId) external {
        require(slots[postId].creator == address(0), "slot exists");
        slots[postId] = AdSlot({
            creator:       msg.sender,
            postId:        postId,
            advertiser:    address(0),
            bidViva:       0,
            approved:      false,
            settled:       false,
            attentionPool: address(0)
        });
        emit SlotOpened(postId, msg.sender);
    }

    /**
     * @notice Advertiser places a bid on an open slot.
     * @param postId Post to advertise on.
     * @param amount $VIVA bid amount.
     */
    function placeBid(bytes32 postId, uint256 amount) external nonReentrant {
        AdSlot storage slot = slots[postId];
        require(slot.creator != address(0), "slot not open");
        require(!slot.approved && !slot.settled, "slot taken");
        require(amount > slot.bidViva, "bid too low");

        // Refund previous bidder if exists
        if (slot.advertiser != address(0)) {
            require(viva.transfer(slot.advertiser, slot.bidViva), "refund failed");
        }

        require(viva.transferFrom(msg.sender, address(this), amount), "transfer failed");
        slot.advertiser = msg.sender;
        slot.bidViva    = amount;

        emit BidPlaced(postId, msg.sender, amount);
    }

    /**
     * @notice Creator approves the ad. Funds distributed.
     */
    function approveAd(bytes32 postId) external nonReentrant {
        AdSlot storage slot = slots[postId];
        require(msg.sender == slot.creator, "not creator");
        require(slot.advertiser != address(0), "no bid");
        require(!slot.settled, "already settled");

        slot.approved = true;
        slot.settled  = true;

        uint256 total        = slot.bidViva;
        uint256 creatorPay   = total * CREATOR_SHARE   / 10000;
        uint256 treasuryPay  = total * TREASURY_SHARE  / 10000;
        uint256 attentionPay = total * ATTENTION_SHARE / 10000;

        require(viva.transfer(slot.creator, creatorPay),  "creator pay failed");
        require(viva.transfer(treasury, treasuryPay),     "treasury pay failed");

        // Accumulate attention reward in pool for viewers
        attentionPools[postId] += attentionPay;

        emit AdApproved(postId, creatorPay, treasuryPay);
    }

    /**
     * @notice Creator rejects. Bid refunded to advertiser.
     */
    function rejectAd(bytes32 postId) external nonReentrant {
        AdSlot storage slot = slots[postId];
        require(msg.sender == slot.creator, "not creator");
        require(!slot.settled, "already settled");

        address adv = slot.advertiser;
        uint256 amt = slot.bidViva;
        slot.advertiser = address(0);
        slot.bidViva    = 0;
        slot.settled    = true;

        if (adv != address(0)) {
            require(viva.transfer(adv, amt), "refund failed");
        }

        emit AdRejected(postId, adv, amt);
    }

    /**
     * @notice Platform distributes attention rewards to verified viewers.
     *         Called by backend oracle after ZK-proof of watch time.
     */
    function distributeAttention(
        bytes32 postId,
        address[] calldata viewers,
        uint256[] calldata amounts
    ) external onlyOwner nonReentrant {
        require(viewers.length == amounts.length, "length mismatch");
        uint256 total;
        for (uint i; i < amounts.length; i++) total += amounts[i];
        require(total <= attentionPools[postId], "exceeds pool");

        attentionPools[postId] -= total;
        for (uint i; i < viewers.length; i++) {
            if (amounts[i] > 0) {
                require(viva.transfer(viewers[i], amounts[i]), "transfer failed");
                emit AttentionClaimed(postId, viewers[i], amounts[i]);
            }
        }
    }

    function poolBalance(bytes32 postId) external view returns (uint256) {
        return attentionPools[postId];
    }
}
