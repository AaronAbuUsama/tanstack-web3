// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/MultiSigAction.sol";

contract MultiSigActionTest is Test {
    event ActionExecuted(uint256 indexed actionId, bytes data, address indexed executor);

    MultiSigAction public action;
    address public safeAddr = makeAddr("safe");

    function setUp() public {
        action = new MultiSigAction(safeAddr);
    }

    function test_SafeAddress() public view {
        assertEq(action.safe(), safeAddr);
    }

    function test_InitialActionCount() public view {
        assertEq(action.getActionCount(), 0);
    }

    function test_ExecuteAction() public {
        vm.prank(safeAddr);
        uint256 id = action.executeAction(hex"1234");
        assertEq(id, 0);
        assertEq(action.getActionCount(), 1);
    }

    function test_MultipleActions() public {
        vm.startPrank(safeAddr);
        action.executeAction(hex"01");
        action.executeAction(hex"02");
        action.executeAction(hex"03");
        vm.stopPrank();
        assertEq(action.getActionCount(), 3);
    }

    function test_RevertNonSafe() public {
        vm.expectRevert(MultiSigAction.OnlySafe.selector);
        action.executeAction(hex"1234");
    }

    function test_EmitEvent() public {
        vm.prank(safeAddr);
        vm.expectEmit(true, true, false, true);
        emit ActionExecuted(0, hex"abcd", safeAddr);
        action.executeAction(hex"abcd");
    }
}
