// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title Lockup Contract
 * @dev A contract that allows users to deposit ERC20 tokens and lock them up until a specified release time.
 */
contract Lockup {
    ERC20 private token;
    mapping(address => DepositLock) private deposits;

    struct DepositLock {
        uint256 releaseTime;
        uint256 amount;
    }

    /**
     * @dev Initializes the Lockup contract.
     * @param tokenAddress The address of the ERC20 token to be used.
     */
    constructor(address tokenAddress) {
        token = ERC20(tokenAddress);
    }

    /**
     * @dev Allows a user to deposit ERC20 tokens and lock them up until the specified release time.
     * @param beneficiary_address The address of the beneficiary who will receive the tokens after the release time.
     * @param amount The amount of tokens to be deposited.
     * @param releaseTime The timestamp indicating when the tokens can be released.
     */
    function deposit(address beneficiary_address, uint256 amount, uint256 releaseTime) external {
        require(amount > 0, "Deposit amount must be greater than zero");
        require(deposits[beneficiary_address].amount == 0, "Deposit can only be made once per address.");
        require(releaseTime >= block.timestamp, "ReleaseTime must be equal to or greater than block timestamp.");
        // Transfer tokens from sender to the contract
        require(token.transferFrom(msg.sender, address(this), amount), "Token transfer failed");

        // Save the deposit balance and release time for the sender
        deposits[beneficiary_address].amount = amount;
        deposits[beneficiary_address].releaseTime = releaseTime;
    }

    /**
     * @dev Allows a user to withdraw their locked tokens after the release time has passed.
     */
    function withdraw() external {
        require(block.timestamp >= deposits[msg.sender].releaseTime, "Release time has not yet arrived");
        uint256 amount = deposits[msg.sender].amount;
        require(amount > 0, "No tokens to withdraw");

        // Clear the deposit balance for the sender
        delete deposits[msg.sender];

        // Transfer tokens to the sender
        require(token.transfer(msg.sender, amount), "Token transfer failed");
    }

    /**
     * @dev Returns the locked token balance for a given beneficiary address.
     * @param beneficiary_address The address of the beneficiary.
     * @return The amount of locked tokens.
     */
    function getLockedTokenBalance(address beneficiary_address) external view returns (uint256) {
        return deposits[beneficiary_address].amount;
    }

    /**
     * @dev Returns the release time for the locked tokens of a given beneficiary address.
     * @param beneficiary_address The address of the beneficiary.
     * @return The release time timestamp.
     */
    function getLockedTokenReleaseTime(address beneficiary_address) external view returns (uint256) {
        return deposits[beneficiary_address].releaseTime;
    }
}
