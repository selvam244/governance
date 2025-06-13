// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

contract SimpleStorage {
    uint256 private storedValue;

    // Set function to update the value
    function set(uint256 _value) public {
        storedValue = _value;
    }

    // Get function to retrieve the value
    function get() public view returns (uint256) {
        return storedValue;
    }
}
