// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/SpendingLimitGuard.sol";

contract SpendingLimitGuardScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envOr(
            "PRIVATE_KEY",
            uint256(0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80)
        );
        address safe = vm.envOr("SAFE_ADDRESS", address(0x1));
        uint256 spendingLimit = vm.envOr("SPENDING_LIMIT", uint256(1 ether));

        vm.startBroadcast(deployerPrivateKey);
        new SpendingLimitGuard(safe, spendingLimit);
        vm.stopBroadcast();
    }
}
