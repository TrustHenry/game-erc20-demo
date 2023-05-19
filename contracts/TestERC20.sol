// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title TestERC20
 * @dev ERC20 token with daily mint limit and access control.
 */
contract TestERC20 is ERC20, AccessControl {

    // Maximum supply of tokens
    uint256 private constant MAX_Supply = 10000 * (10 ** 18);

    // Initial supply of tokens
    uint256 public constant INITIAL_SUPPLY = 10000 * (10 ** 18);

    // Role for minters
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    // Maximum amount of tokens that can be minted daily
    uint256 private _mintLimit = 100 * (10 ** 18);

    // Timestamp of the last minted token
    uint256 private _lastMinted;

    // Amount of tokens minted in the current day
    uint256 private _dailyMintedAmount;

    /**
     * @dev constructor function that sets the initial state of the contract.
     * @param name_ The name of the token.
     * @param symbol_ The symbol of the token.
     */
    constructor(string memory name_, string memory symbol_) ERC20(name_, symbol_) {
        _mint(msg.sender, INITIAL_SUPPLY);
        _lastMinted = block.timestamp;
        _dailyMintedAmount = 0;
        _setRoleAdmin(DEFAULT_ADMIN_ROLE, DEFAULT_ADMIN_ROLE);
        _setRoleAdmin(MINTER_ROLE, DEFAULT_ADMIN_ROLE);
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(MINTER_ROLE, msg.sender);
    }

    /**
     * @dev Function to mint new tokens.
     * @param amount The amount of tokens to mint.
     */
    function mint(uint256 amount) public onlyRole(MINTER_ROLE) {
        // Calculate time passed since last minting
        uint256 nowDay = block.timestamp / 86400;

        // If a day has passed, reset daily minted amount and timestamp
        if (nowDay != _lastMinted) {
            _dailyMintedAmount = 0;
            _lastMinted = nowDay;
        }

        // Check if daily mint limit has been exceeded
        require(_dailyMintedAmount + amount <= _mintLimit, "Daily mint limit exceeded");

        // Mint new tokens and update daily minted amount
        _mint(msg.sender, amount);
        _dailyMintedAmount += amount;

        // Check if maximum supply limit has been reached
        require(totalSupply() <= MAX_Supply, "Token issuance limit reached");
    }

    /**
     * @dev Function to burn tokens.
     * @param amount The amount of tokens to burn.
     */
    function burn(uint256 amount) public onlyRole(DEFAULT_ADMIN_ROLE) {
        _burn(msg.sender, amount);
    }
}
