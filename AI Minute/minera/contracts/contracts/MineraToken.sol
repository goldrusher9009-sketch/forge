// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/// @title MineraToken (MINE) — capped, mintable by the protocol, burnable for deflation.
contract MineraToken is ERC20, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");

    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 1e18;
    uint256 public totalMinted;

    event TokensBurned(uint256 amount, address indexed burner);

    constructor() ERC20("Minera", "MINE") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(BURNER_ROLE, msg.sender);
    }

    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) {
        require(totalMinted + amount <= MAX_SUPPLY, "Exceeds max supply");
        totalMinted += amount;
        _mint(to, amount);
    }

    function burn(uint256 amount) external onlyRole(BURNER_ROLE) {
        _burn(msg.sender, amount);
        emit TokensBurned(amount, msg.sender);
    }

    function burnFrom(address from, uint256 amount) external onlyRole(BURNER_ROLE) {
        _spendAllowance(from, msg.sender, amount);
        _burn(from, amount);
        emit TokensBurned(amount, from);
    }
}
