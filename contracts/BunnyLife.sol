// SPDX-License-Identifier: Unlicensed
pragma solidity ^0.8.19;

contract BunnyItems {
    // Enum to represent different item types
    enum ItemType { Carrot, GoldenCarrot, BunnyHouse, MagicWand, Ball }

    // Mapping from user address to a mapping of item type to balance
    mapping(address => mapping(ItemType => uint256)) public itemBalances;

    // Event to emit when items are added or removed
    event ItemBalanceChanged(address indexed user, ItemType itemType, uint256 newBalance);

    // Function to add items to a user's balance
    function addItems(ItemType _itemType, uint256 _amount) public {
        itemBalances[msg.sender][_itemType] += _amount;
        emit ItemBalanceChanged(msg.sender, _itemType, itemBalances[msg.sender][_itemType]);
    }

    // Function to remove items from a user's balance
    function removeItems(ItemType _itemType, uint256 _amount) public {
        require(itemBalances[msg.sender][_itemType] >= _amount, "Insufficient balance");
        itemBalances[msg.sender][_itemType] -= _amount;
        emit ItemBalanceChanged(msg.sender, _itemType, itemBalances[msg.sender][_itemType]);
    }

    // Function to get the balance of a specific item for a user
    function getItemBalance(address _user, ItemType _itemType) public view returns (uint256) {
        return itemBalances[_user][_itemType];
    }
}