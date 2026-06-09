// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {PriceOracleStorage} from "./PriceOracleStorage.sol";

/// @title PriceOracleStorageV3 storage layer for the on-chain support upgrade.
/// @notice Inherits the full V1 layout unchanged and APPENDS the public
///         support / endorsement counters after it, so every existing slot
///         stays byte-identical and the upgrade is storage-safe. Keep additions
///         append-only and never reorder earlier fields.
abstract contract PriceOracleStorageV3 is PriceOracleStorage {
    /// @notice Total support signals recorded (counts repeat supports too).
    uint256 public supportCount;

    /// @notice Distinct wallets that have ever recorded support.
    uint256 public uniqueSupporters;

    /// @notice Whether an address has ever recorded support (dedup source).
    mapping(address => bool) public hasSupported;

    /// @dev Reserved slots for future V3 additions. Decrement when appending.
    uint256[47] private __gapV3;
}
