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
    name: "pendingRewards",
    stateMutability: "view",
    inputs: [{ name: "user", type: "address" }],
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
] as const;
