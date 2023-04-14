// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TestERC20 is ERC20, AccessControl {
    uint256 private constant MAX_Supply = 500000000 * (10 ** 18);
    uint256 public constant INITIAL_SUPPLY = 100000000 * (10 ** 18);
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    uint256 private _mintLimit = 10000 * (10 ** 18);  // 하루 mint 허용량
    uint256 private _lastMinted;  // 마지막 mint 시간
    uint256 private _dailyMintedAmount;  // 하루 mint된 양

    constructor(string memory name_, string memory symbol_) ERC20(name_, symbol_) {
        _mint(msg.sender, INITIAL_SUPPLY);
        _lastMinted = block.timestamp;
        _dailyMintedAmount = 0;
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(MINTER_ROLE, msg.sender);
    }

    function mint(uint256 amount) public onlyRole(MINTER_ROLE) {
        // 현재 시간과 마지막 mint 시간의 차이 계산
        uint256 timePassed = block.timestamp - _lastMinted;

        // 현재 시간이 다음 날인 경우 하루 mint 평균을 초기화
        if (timePassed >= 1 days) {
            _dailyMintedAmount = 0;
            _lastMinted = block.timestamp;
        }

        // 하루 mint 최대량을 초과할 경우 에러 반환
        require(_dailyMintedAmount + amount <= _mintLimit, "Daily mint limit exceeded");

        // mint 수행
        _mint(msg.sender, amount);
        _dailyMintedAmount += amount;
        require(totalSupply() <= MAX_Supply, "Token issuance limit reached");
    }

    function burn(uint256 amount) public onlyRole(DEFAULT_ADMIN_ROLE) {
        _burn(msg.sender, amount);
    }

    // Minter Role 관리 함수
    function grantMinterRole(address account) public onlyRole(DEFAULT_ADMIN_ROLE) {
        require(!hasRole(MINTER_ROLE, account), "Account already has minter role");
        grantRole(MINTER_ROLE, account);
    }

    function revokeMinterRole(address account) public onlyRole(DEFAULT_ADMIN_ROLE) {
        require(hasRole(MINTER_ROLE, account), "Account does not have minter role");
        revokeRole(MINTER_ROLE, account);
    }

    function renounceMinterRole() public {
        renounceRole(MINTER_ROLE, msg.sender);
    }
}
