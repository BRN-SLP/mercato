/**
 * On-chain interface for the deployed PriceOracle UUPS proxy. Trimmed to the
 * surface the dApp uses (submit / verify / claim / read).
 */
export const priceOracleAbi = [
  {
    type: "function",
    name: "submitPrice",
    stateMutability: "nonpayable",
    inputs: [
      { name: "barcode", type: "bytes12" },
      { name: "zoneKey", type: "bytes6" },
      { name: "priceCents", type: "uint64" },
      { name: "receiptHash", type: "bytes32" },
    ],
    outputs: [{ name: "id", type: "uint256" }],
  },
  {
    type: "function",
    name: "verify",
    stateMutability: "nonpayable",
    inputs: [
      { name: "id", type: "uint256" },
      { name: "isValid", type: "bool" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "claimRewards",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: [],
  },
  {
    type: "function",
    name: "pendingRewards",
    stateMutability: "view",
    inputs: [{ name: "user", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    // V3 (on-chain support upgrade): record a free, gas-only endorsement with
    // an optional short message. Reverts on the pre-upgrade implementation.
    type: "function",
    name: "support",
    stateMutability: "nonpayable",
    inputs: [{ name: "message", type: "string" }],
    outputs: [],
  },
  {
    // V3: distinct wallets that have ever supported. Reverts pre-upgrade;
    // callers treat a revert as "support not live yet".
    type: "function",
    name: "uniqueSupporters",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    // V3: total support signals (counts repeat supports).
    type: "function",
    name: "supportCount",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    // V3: whether an address has ever recorded support.
    type: "function",
    name: "hasSupported",
    stateMutability: "view",
    inputs: [{ name: "", type: "address" }],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "nextId",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "SUBMITTER_REWARD",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "VERIFIER_REWARD",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "event",
    name: "PriceSubmitted",
    inputs: [
      { name: "submissionId", type: "uint256", indexed: true },
      { name: "barcode", type: "bytes12", indexed: true },
      { name: "zoneKey", type: "bytes6", indexed: true },
      { name: "submitter", type: "address", indexed: false },
      { name: "priceCents", type: "uint64", indexed: false },
      { name: "receiptHash", type: "bytes32", indexed: false },
      { name: "timestamp", type: "uint64", indexed: false },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "Verified",
    inputs: [
      { name: "submissionId", type: "uint256", indexed: true },
      { name: "verifier", type: "address", indexed: true },
      { name: "isValid", type: "bool", indexed: false },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "SubmissionFinalized",
    inputs: [
      { name: "submissionId", type: "uint256", indexed: true },
      { name: "accepted", type: "bool", indexed: false },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "RewardsClaimed",
    inputs: [
      { name: "user", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "Supported",
    inputs: [
      { name: "supporter", type: "address", indexed: true },
      { name: "message", type: "string", indexed: false },
      { name: "at", type: "uint256", indexed: false },
    ],
    anonymous: false,
  },
] as const;

export const erc20Abi = [
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "owner", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "decimals",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
  },
] as const;
// @config: add feature flag toggle
// @type: narrow from string to union
// @todo: audit this for edge case handling
// @config: expose timeout as parameter
// @a11y: verify screen-reader announcement
