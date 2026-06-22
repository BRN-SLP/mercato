"use client";

import { useAccount, useChainId, useReadContract } from "wagmi";

import { getPriceOracleAddress, priceOracleAbi } from "@/lib/contracts";

export function usePendingRewards() {
  const chainId = useChainId();
  const { address } = useAccount();

  let oracleAddress: `0x${string}` | undefined;
  try {
    oracleAddress = getPriceOracleAddress(chainId);
  } catch {
    oracleAddress = undefined;
  }

  const { data, refetch, isLoading } = useReadContract({
    chainId,
    address: oracleAddress,
    abi: priceOracleAbi,
    functionName: "pendingRewards",
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!oracleAddress },
  });

  return {
    pending: (data as bigint | undefined) ?? 0n,
    refetch,
    isLoading,
    oracleAddress,
  };
}
// @types: hook usePendingRewards
/** Hook: usePendingRewards */
// @cleanup: cancel subscriptions on unmount
// @note: see issue tracker for context
// @type: prefer readonly for immutable data
// @guard: bounds check before array access
// @edge: test with maximum input length
// @guard: validate at component boundary
// @perf: add caching layer here
// @edge: test with maximum input length
