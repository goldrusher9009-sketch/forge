// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title YouToken
 * @notice Personal bonding-curve ERC-20 per VIVA user.
 *
 * Bonding curve: price = RESERVE_RATIO * (totalSupply / INITIAL_SUPPLY)^2
 * Buy  → price goes up   (holder's value rises)
 * Sell → price goes down
 *
 * Creator receives 5% of every buy/sell.
 * Platform treasury receives 2%.
 */
contract YouToken is ReentrancyGuard {
    string  public name;
    string  public symbol;
    uint8   public constant decimals = 18;

    address public creator;
    address public treasury;
    IERC20  public viva;

    uint256 public totalSupply;
    uint256 public reserveBalance;   // $VIVA held in bonding curve

    uint256 public constant CREATOR_FEE_BPS  = 500;   // 5%
    uint256 public constant TREASURY_FEE_BPS = 200;   // 2%
    uint256 public constant INITIAL_PRICE    = 1e15;  // 0.001 VIVA per token at genesis

    mapping(address => uint256) public balanceOf;

    event Bought(address indexed buyer, uint256 vivaIn, uint256 tokensOut, uint256 newPrice);
    event Sold(address indexed seller, uint256 tokensIn, uint256 vivaOut, uint256 newPrice);

    constructor(
        string memory _name,
        string memory _symbol,
        address _creator,
        address _treasury,
        address _viva
    ) {
        name     = _name;
        symbol   = _symbol;
        creator  = _creator;
        treasury = _treasury;
        viva     = IERC20(_viva);
    }

    /**
     * @notice Buy YouTokens with $VIVA.
     * @param vivaAmount Amount of $VIVA to spend (before fees).
     */
    function buy(uint256 vivaAmount) external nonReentrant {
        require(vivaAmount > 0, "amount=0");

        uint256 creatorFee  = vivaAmount * CREATOR_FEE_BPS  / 10000;
        uint256 treasuryFee = vivaAmount * TREASURY_FEE_BPS / 10000;
        uint256 netViva     = vivaAmount - creatorFee - treasuryFee;

        require(viva.transferFrom(msg.sender, address(this), netViva), "transfer failed");
        require(viva.transferFrom(msg.sender, creator,   creatorFee),  "creator fee failed");
        require(viva.transferFrom(msg.sender, treasury,  treasuryFee), "treasury fee failed");

        uint256 tokensOut = _buyTokensForViva(netViva);
        reserveBalance += netViva;
        totalSupply    += tokensOut;
        balanceOf[msg.sender] += tokensOut;

        emit Bought(msg.sender, vivaAmount, tokensOut, currentPrice());
    }

    /**
     * @notice Sell YouTokens back for $VIVA.
     * @param tokenAmount Amount of YouTokens to sell.
     */
    function sell(uint256 tokenAmount) external nonReentrant {
        require(balanceOf[msg.sender] >= tokenAmount, "insufficient balance");

        uint256 vivaOut = _vivaForTokens(tokenAmount);
        balanceOf[msg.sender] -= tokenAmount;
        totalSupply            -= tokenAmount;
        reserveBalance         -= vivaOut;

        uint256 creatorFee  = vivaOut * CREATOR_FEE_BPS  / 10000;
        uint256 treasuryFee = vivaOut * TREASURY_FEE_BPS / 10000;
        uint256 netViva     = vivaOut - creatorFee - treasuryFee;

        require(viva.transfer(msg.sender, netViva),   "transfer failed");
        require(viva.transfer(creator, creatorFee),   "creator fee failed");
        require(viva.transfer(treasury, treasuryFee), "treasury fee failed");

        emit Sold(msg.sender, tokenAmount, vivaOut, currentPrice());
    }

    function currentPrice() public view returns (uint256) {
        if (totalSupply == 0) return INITIAL_PRICE;
        return reserveBalance * 2 / totalSupply;  // simplified linear bonding curve
    }

    // ---- Internal curve math ----

    function _buyTokensForViva(uint256 vivaIn) internal view returns (uint256) {
        if (totalSupply == 0) return vivaIn / INITIAL_PRICE;
        // tokens = sqrt(2 * vivaIn / k + S^2) - S  where k = reserveBalance/totalSupply^2
        uint256 k = reserveBalance * 1e18 / (totalSupply * totalSupply);
        if (k == 0) return vivaIn / INITIAL_PRICE;
        uint256 s2 = totalSupply * totalSupply;
        uint256 inner = 2 * vivaIn * 1e18 / k + s2;
        return _sqrt(inner) - totalSupply;
    }

    function _vivaForTokens(uint256 tokensIn) internal view returns (uint256) {
        if (totalSupply == 0) return 0;
        return reserveBalance * tokensIn / totalSupply;
    }

    function _sqrt(uint256 x) internal pure returns (uint256 y) {
        uint256 z = (x + 1) / 2;
        y = x;
        while (z < y) { y = z; z = (x / z + z) / 2; }
    }
}

/**
 * @title YouTokenFactory
 * @notice Deploys a YouToken for each VIVA user on first creator action.
 */
contract YouTokenFactory is Ownable {
    IERC20  public viva;
    address public treasury;

    mapping(address => address) public youTokenOf;    // user → contract
    address[] public allTokens;

    event YouTokenCreated(address indexed creator, address token, string symbol);

    constructor(address _viva, address _treasury) Ownable(msg.sender) {
        viva     = IERC20(_viva);
        treasury = _treasury;
    }

    function create(string calldata username) external returns (address token) {
        require(youTokenOf[msg.sender] == address(0), "already exists");
        string memory sym = string(abi.encodePacked("$", username));
        YouToken t = new YouToken(
            string(abi.encodePacked(username, " Token")),
            sym,
            msg.sender,
            treasury,
            address(viva)
        );
        token = address(t);
        youTokenOf[msg.sender] = token;
        allTokens.push(token);
        emit YouTokenCreated(msg.sender, token, sym);
    }

    function totalTokens() external view returns (uint256) { return allTokens.length; }
}
