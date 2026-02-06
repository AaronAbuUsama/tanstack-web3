// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/SimpleStorage.sol";

contract SimpleStorageTest is Test {
    event ValueSet(string indexed key, string value, address indexed setter);

    SimpleStorage public store;

    function setUp() public {
        store = new SimpleStorage();
    }

    function test_SetAndGet() public {
        store.set("name", "Alice");
        assertEq(store.get("name"), "Alice");
    }

    function test_OverwriteValue() public {
        store.set("key", "value1");
        store.set("key", "value2");
        assertEq(store.get("key"), "value2");
    }

    function test_EmptyDefault() public view {
        assertEq(store.get("nonexistent"), "");
    }

    function test_EmitEvent() public {
        vm.expectEmit(false, true, false, true);
        emit ValueSet("mykey", "myvalue", address(this));
        store.set("mykey", "myvalue");
    }

    function test_MultipleKeys() public {
        store.set("a", "1");
        store.set("b", "2");
        store.set("c", "3");
        assertEq(store.get("a"), "1");
        assertEq(store.get("b"), "2");
        assertEq(store.get("c"), "3");
    }
}
