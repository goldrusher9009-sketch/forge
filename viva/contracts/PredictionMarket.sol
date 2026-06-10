// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title PredictionMarket
 * @notice Binary prediction markets settled in $VIVA.
 *
 * Flow:
 *   1. Creator calls createMarket(title, resolveAt)
 *   2. Users bet on outcome A or B
 *   3. Oracle (platform oracle role) calls resolve(marketId, winner)
 *   4. Winners call claimWinnings(marketId)
 *
 * Fees: 2% platform, 1% to market creator on resolution.
 */
contract PredictionMarket is Ownable, ReentrancyGuard {
    IERC20 public viva;

    uint256 public constant PLATFORM_FEE_BPS = 200;  // 2%
    uint256 public constant CREATOR_FEE_BPS  = 100;  // 1%

    enum Outcome { None, A, B }
    enum Status  { Open, Resolved, Cancelled }

    struct Market {
        address creator;
        string  title;
        string  outcomeA;
        string  outcomeB;
        uint256 resolveAt;
        Status  status;
        Outcome winner;
        uint256 poolA;
        uint256 poolB;
        uint256 totalFees;
    }

    mapping(uint256 => Market) public markets;
    mapping(uint256 => mapping(address => mapping(Outcome => uint256))) public bets;
    mapping(uint256 => mapping(address => bool)) public claimed;

    uint256 public nextMarketId;
    address public oracle;
    address public treasury;

    event MarketCreated(uint256 indexed id, address creator, string title, uint256 resolveAt);
    event BetPlaced(uint256 indexed id, address bettor, Outcome outcome, uint256 amount);
    event MarketResolved(uint256 indexed id, Outcome winner);
    event WinningsClaimed(uint256 indexed id, address winner, uint256 amount);

    modifier onlyOracle() { require(msg.sender == oracle, "not oracle"); _; }

    constructor(address _viva, address _oracle, address _treasury) Ownable(msg.sender) {
        viva     = IERC20(_viva);
        oracle   = _oracle;
        treasury = _treasury;
    }

    function createMarket(
        string calldata title,
        string calldata outcomeA,
        string calldata outcomeB,
        uint256 resolveAt
    ) external returns (uint256 id) {
        require(resolveAt > block.timestamp, "resolve must be future");
        id = nextMarketId++;
        markets[id] = Market({
            creator: msg.sender,
            title: title,
            outcomeA: outcomeA,
            outcomeB: outcomeB,
            resolveAt: resolveAt,
            status: Status.Open,
            winner: Outcome.None,
            poolA: 0,
            poolB: 0,
            totalFees: 0
        });
        emit MarketCreated(id, msg.sender, title, resolveAt);
    }

    function bet(uint256 marketId, Outcome outcome, uint256 amount) external nonReentrant {
        Market storage m = markets[marketId];
        require(m.status == Status.Open, "market not open");
        require(block.timestamp < m.resolveAt, "market closed");
        require(outcome == Outcome.A || outcome == Outcome.B, "invalid outcome");
        require(amount > 0, "amount=0");

        require(viva.transferFrom(msg.sender, address(this), amount), "transfer failed");

        bets[marketId][msg.sender][outcome] += amount;
        if (outcome == Outcome.A) m.poolA += amount;
        else m.poolB += amount;

        emit BetPlaced(marketId, msg.sender, outcome, amount);
    }

    function resolve(uint256 marketId, Outcome winner) external onlyOracle {
        Market storage m = markets[marketId];
        require(m.status == Status.Open, "already resolved");
        require(block.timestamp >= m.resolveAt, "too early");
        require(winner == Outcome.A || winner == Outcome.B, "invalid winner");

        m.status = Status.Resolved;
        m.winner = winner;

        uint256 total = m.poolA + m.poolB;
        uint256 platformFee = total * PLATFORM_FEE_BPS / 10000;
        uint256 creatorFee  = total * CREATOR_FEE_BPS  / 10000;
        m.totalFees = platformFee + creatorFee;

        require(viva.transfer(treasury, platformFee), "platform fee failed");
        require(viva.transfer(m.creator, creatorFee), "creator fee failed");

        emit MarketResolved(marketId, winner);
    }

    function claimWinnings(uint256 marketId) external nonReentrant {
        Market storage m = markets[marketId];
        require(m.status == Status.Resolved, "not resolved");
        require(!claimed[marketId][msg.sender], "already claimed");

        uint256 userBet = bets[marketId][msg.sender][m.winner];
        require(userBet > 0, "no winning bet");

        uint256 winnerPool = m.winner == Outcome.A ? m.poolA : m.poolB;
        uint256 loserPool  = m.winner == Outcome.A ? m.poolB : m.poolA;
        uint256 netPool    = m.poolA + m.poolB - m.totalFees;
        uint256 payout     = userBet + (userBet * loserPool / winnerPool) * netPool / (m.poolA + m.poolB);

        claimed[marketId][msg.sender] = true;
        require(viva.transfer(msg.sender, payout), "payout failed");

        emit WinningsClaimed(marketId, msg.sender, payout);
    }

    function cancelMarket(uint256 marketId) external onlyOracle {
        Market storage m = markets[marketId];
        require(m.status == Status.Open, "not open");
        m.status = Status.Cancelled;
    }

    // Refund cancelled market bets
    function refund(uint256 marketId) external nonReentrant {
        Market storage m = markets[marketId];
        require(m.status == Status.Cancelled, "not cancelled");
        require(!claimed[marketId][msg.sender], "already refunded");

        uint256 betA = bets[marketId][msg.sender][Outcome.A];
        uint256 betB = bets[marketId][msg.sender][Outcome.B];
        uint256 total = betA + betB;
        require(total > 0, "nothing to refund");

        claimed[marketId][msg.sender] = true;
        require(viva.transfer(msg.sender, total), "refund failed");
    }

    function setOracle(address _oracle) external onlyOwner { oracle = _oracle; }
}
