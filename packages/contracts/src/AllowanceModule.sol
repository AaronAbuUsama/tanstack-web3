// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title AllowanceModule - Allows delegates to spend from a Safe without multi-sig
/// @notice Safe module that enables spending allowances with automatic reset periods

interface ISafe {
    function execTransactionFromModule(
        address to, uint256 value, bytes memory data, uint8 operation
    ) external returns (bool);
}

contract AllowanceModule {
    address public immutable safe;

    struct Allowance {
        uint256 amount;
        uint256 spent;
        uint256 resetPeriod;
        uint256 lastReset;
    }

    mapping(address => Allowance) public allowances;

    error OnlySafe();
    error ExceedsAllowance(uint256 requested, uint256 available);
    error TransferFailed();

    event AllowanceSet(address indexed delegate, uint256 amount, uint256 resetPeriod);
    event AllowanceUsed(address indexed delegate, address indexed to, uint256 value);

    modifier onlySafe() {
        if (msg.sender != safe) revert OnlySafe();
        _;
    }

    constructor(address _safe) {
        safe = _safe;
    }

    function setAllowance(address delegate, uint256 amount, uint256 resetPeriod) external onlySafe {
        allowances[delegate] = Allowance({
            amount: amount,
            spent: 0,
            resetPeriod: resetPeriod,
            lastReset: block.timestamp
        });
        emit AllowanceSet(delegate, amount, resetPeriod);
    }

    function executeAllowance(address to, uint256 value) external {
        Allowance storage allowance = allowances[msg.sender];

        // Reset if period has elapsed
        if (allowance.resetPeriod > 0 && block.timestamp >= allowance.lastReset + allowance.resetPeriod) {
            allowance.spent = 0;
            allowance.lastReset = block.timestamp;
        }

        uint256 available = allowance.amount > allowance.spent ? allowance.amount - allowance.spent : 0;
        if (value > available) {
            revert ExceedsAllowance(value, available);
        }

        allowance.spent += value;

        bool success = ISafe(safe).execTransactionFromModule(to, value, "", 0);
        if (!success) revert TransferFailed();

        emit AllowanceUsed(msg.sender, to, value);
    }

    function getAvailableAllowance(address delegate) external view returns (uint256) {
        Allowance memory allowance = allowances[delegate];
        if (allowance.resetPeriod > 0 && block.timestamp >= allowance.lastReset + allowance.resetPeriod) {
            return allowance.amount;
        }
        return allowance.amount > allowance.spent ? allowance.amount - allowance.spent : 0;
    }
}
