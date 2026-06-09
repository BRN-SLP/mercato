// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import {PriceOracleStorageV3} from "./PriceOracleStorageV3.sol";

/// @title PriceOracleV3Support adds a free, public on-chain support signal.
/// @notice Behaviour-identical to V2Rewards (submit, verify, reward, claim) and
///         ADDS `support`: anyone can record a gas-only "I back Mercato" signal,
///         optionally with a short message. Support moves no funds and grants no
///         rights; it is a public endorsement counter.
/// @dev Reimplements the V2Rewards surface over `PriceOracleStorageV3`, mirroring
///      the V1 to V2 migration: the prior functions are non-virtual, so a fresh
///      implementation over the same (append-only) storage layout is the clean,
///      deterministic way to extend behaviour across a UUPS upgrade. The support
///      counters start at zero, so no new initializer is needed; `initialize`
///      stays for the fresh-deploy path and is blocked on upgrades.
/// @custom:oz-upgrades-from PriceOracleV2Rewards
contract PriceOracleV3Support is
    Initializable,
    UUPSUpgradeable,
    OwnableUpgradeable,
    PriceOracleStorageV3
{
    using SafeERC20 for IERC20;

    /// @notice cUSD paid to the submitter of an accepted submission (V2 value).
    uint256 public constant SUBMITTER_REWARD = 5e16;

    /// @notice cUSD paid to each verifier of an accepted submission (V2 value).
    uint256 public constant VERIFIER_REWARD = 1e16;

    /// @notice Number of verifications required to finalize a submission.
    uint8 public constant CONSENSUS_THRESHOLD = 3;

    /// @notice Max bytes for a support message, to bound calldata / log cost.
    uint256 public constant MAX_SUPPORT_MESSAGE_BYTES = 280;

    event PriceSubmitted(
        uint256 indexed submissionId,
        bytes12 indexed barcode,
        bytes6 indexed zoneKey,
        address submitter,
        uint64 priceCents,
        bytes32 receiptHash,
        uint64 timestamp
    );

    event Verified(
        uint256 indexed submissionId,
        address indexed verifier,
        bool isValid
    );

    event SubmissionFinalized(uint256 indexed submissionId, bool accepted);

    event RewardsClaimed(address indexed user, uint256 amount);

    /// @notice Emitted on every `support` call (including repeats).
    event Supported(address indexed supporter, string message, uint256 at);

    error ZeroAddress();
    error UnknownSubmission(uint256 id);
    error AlreadyFinalized(uint256 id);
    error SubmissionLocked(uint256 id);
    error CannotVerifyOwnSubmission();
    error AlreadyVerified();
    error NothingToClaim();
    error InsufficientPoolBalance(uint256 requested, uint256 available);
    error SupportMessageTooLong();

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /// @notice Initial proxy setup for a fresh deploy. Blocked on upgrades by
    ///         the `initializer` modifier, so prior storage carries over.
    function initialize(address owner_, address cUSD_) external initializer {
        if (owner_ == address(0) || cUSD_ == address(0)) revert ZeroAddress();
        __Ownable_init(owner_);
        cUSD = cUSD_;
    }

    function submitPrice(
        bytes12 barcode,
        bytes6 zoneKey,
        uint64 priceCents,
        bytes32 receiptHash
    ) external returns (uint256 id) {
        id = nextId++;
        Submission storage s = submissions[id];
        s.barcode = barcode;
        s.zoneKey = zoneKey;
        s.priceCents = priceCents;
        s.receiptHash = receiptHash;
        s.submitter = msg.sender;
        s.timestamp = uint64(block.timestamp);

        emit PriceSubmitted(
            id,
            barcode,
            zoneKey,
            msg.sender,
            priceCents,
            receiptHash,
            uint64(block.timestamp)
        );
    }

    function verify(uint256 id, bool isValid) external {
        Submission storage s = submissions[id];
        if (s.submitter == address(0)) revert UnknownSubmission(id);
        if (s.finalized) revert AlreadyFinalized(id);
        if (s.verifyCount >= CONSENSUS_THRESHOLD) revert SubmissionLocked(id);
        if (s.submitter == msg.sender) revert CannotVerifyOwnSubmission();
        if (hasVerified[id][msg.sender]) revert AlreadyVerified();

        hasVerified[id][msg.sender] = true;
        s.verifiers[s.verifyCount] = msg.sender;
        s.verifyCount++;
        if (isValid) s.acceptCount++;

        emit Verified(id, msg.sender, isValid);

        if (s.verifyCount == CONSENSUS_THRESHOLD) {
            if (s.acceptCount == CONSENSUS_THRESHOLD) {
                s.finalized = true;
                s.accepted = true;

                uint256 totalNeeded = SUBMITTER_REWARD +
                    uint256(CONSENSUS_THRESHOLD) *
                    VERIFIER_REWARD;
                uint256 available = IERC20(cUSD).balanceOf(address(this));
                if (available < totalNeeded) {
                    revert InsufficientPoolBalance(totalNeeded, available);
                }

                rewards[s.submitter] += SUBMITTER_REWARD;
                for (uint256 i = 0; i < CONSENSUS_THRESHOLD; i++) {
                    rewards[s.verifiers[i]] += VERIFIER_REWARD;
                }
                emit SubmissionFinalized(id, true);
            } else if (s.acceptCount == 0) {
                s.finalized = true;
                s.accepted = false;
                emit SubmissionFinalized(id, false);
            }
        }
    }

    /// @notice Record free, public on-chain support for the project, optionally
    ///         with a short message. Costs only gas; moves no funds. A wallet is
    ///         counted once in `uniqueSupporters`; repeat calls still bump
    ///         `supportCount` and emit a fresh `Supported` event. Pass an empty
    ///         string for no message.
    function support(string calldata message) external {
        if (bytes(message).length > MAX_SUPPORT_MESSAGE_BYTES) {
            revert SupportMessageTooLong();
        }
        if (!hasSupported[msg.sender]) {
            hasSupported[msg.sender] = true;
            unchecked {
                uniqueSupporters += 1;
            }
        }
        unchecked {
            supportCount += 1;
        }
        emit Supported(msg.sender, message, block.timestamp);
    }

    function claimRewards() external {
        uint256 amount = rewards[msg.sender];
        if (amount == 0) revert NothingToClaim();
        rewards[msg.sender] = 0;

        IERC20(cUSD).safeTransfer(msg.sender, amount);
        emit RewardsClaimed(msg.sender, amount);
    }

    function pendingRewards(address user) external view returns (uint256) {
        return rewards[user];
    }

    function ownerWithdraw(address to, uint256 amount) external onlyOwner {
        if (to == address(0)) revert ZeroAddress();
        IERC20(cUSD).safeTransfer(to, amount);
    }

    /// @notice Lightweight version probe; proves the upgrade landed.
    function version() external pure returns (string memory) {
        return "v3";
    }

    function _authorizeUpgrade(address) internal override onlyOwner {}
}
