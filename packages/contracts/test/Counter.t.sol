// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/Counter.sol";

contract CounterTest is Test {
    Counter public counter;

    event CountChanged(uint256 newCount);

    function setUp() public {
        counter = new Counter();
    }

    function test_InitialCount() public view {
        assertEq(counter.getCount(), 0);
    }

    function test_Increment() public {
        counter.increment();
        assertEq(counter.getCount(), 1);
    }

    function test_Decrement() public {
        counter.increment();
        counter.decrement();
        assertEq(counter.getCount(), 0);
    }

    function test_RevertDecrementBelowZero() public {
        vm.expectRevert("Counter: cannot decrement below zero");
        counter.decrement();
    }

    function test_MultipleIncrements() public {
        counter.increment();
        counter.increment();
        counter.increment();
        assertEq(counter.getCount(), 3);
    }

    function test_EmitEvent() public {
        vm.expectEmit(true, true, true, true);
        emit CountChanged(1);
        counter.increment();
    }
}
