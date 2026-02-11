// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC165 {
    function supportsInterface(bytes4 interfaceId) external view returns (bool);
}

/// @notice Minimal Guard interface matching Safe v1.3.0's Guard (for ERC165 interface ID)
interface IGuard {
    function checkTransaction(
        address to, uint256 value, bytes memory data,
        uint8 operation, uint256 safeTxGas, uint256 baseGas,
        uint256 gasPrice, address gasToken, address payable refundReceiver,
        bytes memory signatures, address msgSender
    ) external;
    function checkAfterExecution(bytes32 hash, bool success) external;
}

/// @title SpendingLimitGuard - Transaction guard that limits ETH transfer amounts
/// @notice Implements ITransactionGuard to block ETH transfers exceeding a configured limit
interface ITransactionGuard {
    function checkTransaction(
        address to, uint256 value, bytes memory data,
        uint8 operation, uint256 safeTxGas, uint256 baseGas,
        uint256 gasPrice, address gasToken, address payable refundReceiver,
        bytes memory signatures, address msgSender
    ) external;
    function checkAfterExecution(bytes32 hash, bool success) external;
    function checkModuleTransaction(
        address to, uint256 value, bytes memory data,
        uint8 operation, address module
    ) external returns (bytes32);
    function checkAfterModuleExecution(bytes32 hash, bool success) external;
}

contract SpendingLimitGuard is ITransactionGuard, IERC165 {
    address public immutable safe;
    uint256 public spendingLimit;

    error ExceedsSpendingLimit(uint256 value, uint256 limit);
    error OnlySafe();

    event TransactionChecked(address indexed to, uint256 value, bool allowed);
    event SpendingLimitUpdated(uint256 previousLimit, uint256 nextLimit);

    modifier onlySafe() {
        if (msg.sender != safe) revert OnlySafe();
        _;
    }

    constructor(address _safe, uint256 _spendingLimit) {
        safe = _safe;
        spendingLimit = _spendingLimit;
    }

    function setSpendingLimit(uint256 nextLimit) external onlySafe {
        uint256 previousLimit = spendingLimit;
        spendingLimit = nextLimit;
        emit SpendingLimitUpdated(previousLimit, nextLimit);
    }

    function checkTransaction(
        address to, uint256 value, bytes memory,
        uint8, uint256, uint256, uint256,
        address, address payable, bytes memory, address
    ) external override {
        if (value > spendingLimit) {
            revert ExceedsSpendingLimit(value, spendingLimit);
        }
        emit TransactionChecked(to, value, true);
    }

    function checkAfterExecution(bytes32, bool) external override {}

    function checkModuleTransaction(
        address, uint256 value, bytes memory,
        uint8, address
    ) external override returns (bytes32) {
        if (value > spendingLimit) {
            revert ExceedsSpendingLimit(value, spendingLimit);
        }
        return bytes32(0);
    }

    function checkAfterModuleExecution(bytes32, bool) external override {}

    function supportsInterface(bytes4 interfaceId) external pure override returns (bool) {
        return interfaceId == type(IGuard).interfaceId
            || interfaceId == type(IERC165).interfaceId;
    }
}
