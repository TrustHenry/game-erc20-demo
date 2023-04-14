# Solidity API

## TestERC20

_ERC20 token with daily mint limit and access control._

### INITIAL_SUPPLY

```solidity
uint256 INITIAL_SUPPLY
```

### MINTER_ROLE

```solidity
bytes32 MINTER_ROLE
```

### constructor

```solidity
constructor(string name_, string symbol_) public
```

_constructor function that sets the initial state of the contract._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| name_ | string | The name of the token. |
| symbol_ | string | The symbol of the token. |

### mint

```solidity
function mint(uint256 amount) public
```

_Function to mint new tokens._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| amount | uint256 | The amount of tokens to mint. |

### burn

```solidity
function burn(uint256 amount) public
```

_Function to burn tokens._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| amount | uint256 | The amount of tokens to burn. |

### grantMinterRole

```solidity
function grantMinterRole(address account) public
```

_Function to grant minter role to an account._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | The account to grant the minter role to. |

### revokeMinterRole

```solidity
function revokeMinterRole(address account) public
```

_Function to revoke minter role from an account._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | The account to revoke the minter role from. |

### renounceMinterRole

```solidity
function renounceMinterRole() public
```

_Function to renounce minter role._

