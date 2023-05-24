pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Lockup {
    ERC20 private token;
    uint256 private releaseTime;
    mapping(address => uint256) private deposits;

    constructor(address tokenAddress, uint256 releaseTimestamp) {
        token = ERC20(tokenAddress);
        releaseTime = releaseTimestamp;
    }

    function deposit(uint256 amount) external {
        require(amount > 0, "Deposit amount must be greater than zero");

        // Transfer tokens from sender to the contract
        require(token.transferFrom(msg.sender, address(this), amount), "Token transfer failed");

        // Update the deposit balance for the sender
        deposits[msg.sender] += amount;
    }

    function withdraw() external {
        require(block.timestamp >= releaseTime, "Release time has not yet arrived");
        uint256 amount = deposits[msg.sender];
        require(amount > 0, "No tokens to withdraw");

        // Clear the deposit balance for the sender
        delete deposits[msg.sender];

        // Transfer tokens to the sender
        require(token.transfer(msg.sender, amount), "Token transfer failed");
    }

    function getLockedTokenBalance() external view returns (uint256) {
        return deposits[msg.sender];
    }
}
