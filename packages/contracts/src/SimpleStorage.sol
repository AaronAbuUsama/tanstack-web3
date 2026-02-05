// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract SimpleStorage {
    mapping(string => string) private store;

    event ValueSet(string indexed key, string value, address indexed setter);

    function set(string calldata key, string calldata value) external {
        store[key] = value;
        emit ValueSet(key, value, msg.sender);
    }

    function get(string calldata key) external view returns (string memory) {
        return store[key];
    }
}
