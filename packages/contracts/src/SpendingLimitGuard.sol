// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

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

contract SpendingLimitGuard is ITransactionGuard {
    address public immutable safe;
    uint256 public spendingLimit;

    error ExceedsSpendingLimit(uint256 value, uint256 limit);

    event TransactionChecked(address indexed to, uint256 value, bool allowed);

    constructor(address _safe, uint256 _spendingLimit) {
        safe = _safe;
        spendingLimit = _spendingLimit;
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
}
