pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title Token Lockup
 * @dev A smart contract that allows users to deposit ERC20 tokens and lock them up until a specified release time.
 */

contract Lockup {
    ERC20 private token;
    uint256 private releaseTime;
    mapping(address => uint256) private deposits;

    /**
     * @dev Constructor function
     * @param tokenAddress The address of the ERC20 token contract
     * @param releaseTimestamp The timestamp when the locked tokens can be withdrawn
     */
    constructor(address tokenAddress, uint256 releaseTimestamp) {
        token = ERC20(tokenAddress);
        releaseTime = releaseTimestamp;
    }

    /**
     * @dev Deposits ERC20 tokens into the contract and locks them up.
     * @param beneficiary_address Address to be the beneficiary of the token
     * @param amount The amount of tokens to deposit
     */
    function deposit(address beneficiary_address, uint256 amount) external {
        require(amount > 0, "Deposit amount must be greater than zero");

        // Transfer tokens from sender to the contract
        require(token.transferFrom(msg.sender, address(this), amount), "Token transfer failed");

        // Update the deposit balance for the sender
        deposits[beneficiary_address] += amount;
    }

    /**
     * @dev Withdraws the locked tokens if the release time has arrived.
     */
    function withdraw() external {
        require(block.timestamp >= releaseTime, "Release time has not yet arrived");
        uint256 amount = deposits[msg.sender];
        require(amount > 0, "No tokens to withdraw");

        // Clear the deposit balance for the sender
        delete deposits[msg.sender];

        // Transfer tokens to the sender
        require(token.transfer(msg.sender, amount), "Token transfer failed");
    }

    /**
     * @dev Gets the balance of locked tokens for the calling user.
     * @param beneficiary_address Address to be the beneficiary of the token
     * @return The balance of locked tokens
     */
    function getLockedTokenBalance(address beneficiary_address) external view returns (uint256) {
        return deposits[beneficiary_address];
    }
}
