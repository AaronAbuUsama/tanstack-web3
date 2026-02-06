// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/MultiSigAction.sol";

contract MultiSigActionScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envOr(
            "PRIVATE_KEY",
            uint256(0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80)
        );
        address safeAddress = vm.envAddress("SAFE_ADDRESS");
        vm.startBroadcast(deployerPrivateKey);

        MultiSigAction multiSigAction = new MultiSigAction(safeAddress);

        vm.stopBroadcast();
    }
}
