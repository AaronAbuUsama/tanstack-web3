// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/SpendingLimitGuard.sol";

contract SpendingLimitGuardTest is Test {
    SpendingLimitGuard guard;
    address safe = address(0x1);
    uint256 limit = 1 ether;

    event TransactionChecked(address indexed to, uint256 value, bool allowed);

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

    function test_EmitEvent() public {
        vm.expectEmit(true, false, false, true);
        emit TransactionChecked(address(0x2), 0.5 ether, true);
        guard.checkTransaction(
            address(0x2), 0.5 ether, "", 0, 0, 0, 0,
            address(0), payable(address(0)), "", address(this)
        );
    }
}
