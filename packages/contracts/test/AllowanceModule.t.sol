// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/AllowanceModule.sol";

contract MockSafe {
    bool public shouldSucceed = true;

    function setShouldSucceed(bool _val) external { shouldSucceed = _val; }

    function execTransactionFromModule(address, uint256, bytes memory, uint8) external view returns (bool) {
        return shouldSucceed;
    }
}

contract AllowanceModuleTest is Test {
    AllowanceModule module;
    MockSafe mockSafe;
    address delegate = address(0x2);
    address recipient = address(0x3);

    event AllowanceSet(address indexed delegate, uint256 amount, uint256 resetPeriod);

    function setUp() public {
        mockSafe = new MockSafe();
        module = new AllowanceModule(address(mockSafe));
    }

    function test_Deploy() public view {
        assertEq(module.safe(), address(mockSafe));
    }

    function test_SetAllowance() public {
        vm.prank(address(mockSafe));
        module.setAllowance(delegate, 1 ether, 1 days);
        assertEq(module.getAvailableAllowance(delegate), 1 ether);
    }

    function test_SetAllowanceOnlySafe() public {
        vm.expectRevert(AllowanceModule.OnlySafe.selector);
        module.setAllowance(delegate, 1 ether, 1 days);
    }

    function test_ExecuteWithinLimit() public {
        vm.prank(address(mockSafe));
        module.setAllowance(delegate, 1 ether, 0);

        vm.prank(delegate);
        module.executeAllowance(recipient, 0.5 ether);
        assertEq(module.getAvailableAllowance(delegate), 0.5 ether);
    }

    function test_ExecuteExceedsLimit() public {
        vm.prank(address(mockSafe));
        module.setAllowance(delegate, 1 ether, 0);

        vm.prank(delegate);
        vm.expectRevert(
            abi.encodeWithSelector(AllowanceModule.ExceedsAllowance.selector, 2 ether, 1 ether)
        );
        module.executeAllowance(recipient, 2 ether);
    }

    function test_ResetAfterPeriod() public {
        vm.prank(address(mockSafe));
        module.setAllowance(delegate, 1 ether, 1 days);

        vm.prank(delegate);
        module.executeAllowance(recipient, 1 ether);
        assertEq(module.getAvailableAllowance(delegate), 0);

        // Advance time past reset period
        vm.warp(block.timestamp + 1 days + 1);
        assertEq(module.getAvailableAllowance(delegate), 1 ether);
    }

    function test_EmitAllowanceSet() public {
        vm.prank(address(mockSafe));
        vm.expectEmit(true, false, false, true);
        emit AllowanceSet(delegate, 1 ether, 1 days);
        module.setAllowance(delegate, 1 ether, 1 days);
    }
}
