// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/SpendingLimitGuard.sol";

contract SpendingLimitGuardTest is Test {
    SpendingLimitGuard guard;
    address safe = address(0x1);
    address nonSafeCaller = address(0x2);
    uint256 limit = 1 ether;

    event TransactionChecked(address indexed to, uint256 value, bool allowed);
    event SpendingLimitUpdated(uint256 previousLimit, uint256 nextLimit);

    function setUp() public {
        guard = new SpendingLimitGuard(safe, limit);
    }

    function test_Deploy() public view {
        assertEq(guard.safe(), safe);
        assertEq(guard.spendingLimit(), limit);
    }

    function test_UnderLimitPasses() public {
        guard.checkTransaction(
            address(0x2), 0.5 ether, "", 0, 0, 0, 0,
            address(0), payable(address(0)), "", address(this)
        );
    }

    function test_OverLimitReverts() public {
        vm.expectRevert(
            abi.encodeWithSelector(SpendingLimitGuard.ExceedsSpendingLimit.selector, 2 ether, limit)
        );
        guard.checkTransaction(
            address(0x2), 2 ether, "", 0, 0, 0, 0,
            address(0), payable(address(0)), "", address(this)
        );
    }

    function test_ZeroValuePasses() public {
        guard.checkTransaction(
            address(0x2), 0, "", 0, 0, 0, 0,
            address(0), payable(address(0)), "", address(this)
        );
    }

    function test_ExactLimitPasses() public {
        guard.checkTransaction(
            address(0x2), 1 ether, "", 0, 0, 0, 0,
            address(0), payable(address(0)), "", address(this)
        );
    }

    function test_SupportsInterface() public view {
        // ERC165 interface
        assertTrue(guard.supportsInterface(0x01ffc9a7));
        // Should not support random interface
        assertFalse(guard.supportsInterface(0xffffffff));
    }

    function test_EmitEvent() public {
        vm.expectEmit(true, false, false, true);
        emit TransactionChecked(address(0x2), 0.5 ether, true);
        guard.checkTransaction(
            address(0x2), 0.5 ether, "", 0, 0, 0, 0,
            address(0), payable(address(0)), "", address(this)
        );
    }

    function test_SetSpendingLimitOnlySafe() public {
        vm.expectRevert(SpendingLimitGuard.OnlySafe.selector);
        vm.prank(nonSafeCaller);
        guard.setSpendingLimit(0.5 ether);
    }

    function test_SetSpendingLimitUpdatesLimitAndEmitsEvent() public {
        vm.expectEmit(false, false, false, true);
        emit SpendingLimitUpdated(limit, 0.5 ether);
        vm.prank(safe);
        guard.setSpendingLimit(0.5 ether);

        assertEq(guard.spendingLimit(), 0.5 ether);
    }

    function test_UpdatedLimitAffectsChecks() public {
        vm.prank(safe);
        guard.setSpendingLimit(0.5 ether);

        vm.expectRevert(
            abi.encodeWithSelector(
                SpendingLimitGuard.ExceedsSpendingLimit.selector,
                0.75 ether,
                0.5 ether
            )
        );
        guard.checkTransaction(
            address(0x2), 0.75 ether, "", 0, 0, 0, 0,
            address(0), payable(address(0)), "", address(this)
        );
    }
}
