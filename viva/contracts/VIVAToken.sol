// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title VIVAToken
 * @notice $VIVA ERC-20 on Base L2
 * @dev 10B max supply. 40% community rewards via MINTER_ROLE.
 *
 * Supply breakdown:
 *   40% = 4,000,000,000  Community Rewards (minted over time by RewardDistributor)
 *   25% = 2,500,000,000  Team + Advisors (2-year vest, 6-month cliff)
 *   20% = 2,000,000,000  Ecosystem Fund
 *   10% = 1,000,000,000  Investors
 *    5% =   500,000,000  Liquidity Bootstrap
 */
contract VIVAToken is ERC20, ERC20Burnable, AccessControl, Pausable {
    bytes32 public constant MINTER_ROLE  = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE  = keccak256("PAUSER_ROLE");
    bytes32 public constant BURNER_ROLE  = keccak256("BURNER_ROLE");

    uint256 public constant MAX_SUPPLY   = 10_000_000_000 ether; // 10B

    // Earn categories (for on-chain attribution)
    enum EarnSource {
        Attention, AdRevenue, TwinTask, Referral,
        MarketplaceSale, HealthStreak, RoomHost, DatingMatch,
        Staking, Governance
    }

    event Minted(address indexed to, uint256 amount, EarnSource source);
    event FeeBurned(uint256 amount);

    constructor(address multisig) ERC20("VIVA", "VIVA") {
        _grantRole(DEFAULT_ADMIN_ROLE, multisig);
        _grantRole(MINTER_ROLE, multisig);
        _grantRole(PAUSER_ROLE, multisig);

        // Mint non-community allocations upfront to multisig for vesting contracts
        uint256 upfront = MAX_SUPPLY * 60 / 100;   // 6B
        _mint(multisig, upfront);
    }

    /**
     * @notice Mint community rewards. Called by RewardDistributor.
     */
    function mint(address to, uint256 amount, EarnSource source)
        external onlyRole(MINTER_ROLE)
    {
        require(totalSupply() + amount <= MAX_SUPPLY, "VIVA: max supply exceeded");
        _mint(to, amount);
        emit Minted(to, amount, source);
    }

    /**
     * @notice Burn tokens collected as platform fees.
     */
    function burnFee(uint256 amount) external onlyRole(BURNER_ROLE) {
        _burn(msg.sender, amount);
        emit FeeBurned(amount);
    }

    // Pause transfers in emergency
    function pause()   external onlyRole(PAUSER_ROLE) { _pause(); }
    function unpause() external onlyRole(PAUSER_ROLE) { _unpause(); }

    function _beforeTokenTransfer(address from, address to, uint256 amount)
        internal override whenNotPaused
    {
        super._beforeTokenTransfer(from, to, amount);
    }
}
