// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MultiSigAction {
    address public immutable safe;
    uint256 public actionCount;

    event ActionExecuted(uint256 indexed actionId, bytes data, address indexed executor);

    error OnlySafe();

    modifier onlySafe() {
        if (msg.sender != safe) revert OnlySafe();
        _;
    }

    constructor(address _safe) {
        safe = _safe;
    }

    function executeAction(bytes calldata data) external onlySafe returns (uint256 actionId) {
        actionId = actionCount++;
        emit ActionExecuted(actionId, data, msg.sender);
    }

    function getActionCount() external view returns (uint256) {
        return actionCount;
    }
}
