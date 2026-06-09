// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {PriceOracleStorageV3} from "./PriceOracleStorageV3.sol";

/// @title PriceOracleStorageV4 storage for the submitter-reward exemption.
/// @notice Inherits the full V1+V3 layout unchanged and APPENDS the exemption
///         set after it, so every existing slot stays byte-identical and the
///         upgrade is storage-safe. Keep additions append-only.
abstract contract PriceOracleStorageV4 is PriceOracleStorageV3 {
    /// @notice Submitters exempt from SUBMITTER_REWARD. Intended for the
    ///         project's own oracle agent so its submissions do not drain the
    ///         pool with a self-reward. Verifier rewards are unaffected.
    mapping(address => bool) public submitterRewardExempt;

    /// @dev Reserved slots for future V4 additions. Decrement when appending.
    uint256[47] private __gapV4;
}
