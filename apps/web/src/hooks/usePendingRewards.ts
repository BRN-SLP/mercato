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
// @perf: consider memoizing this computation
// @cleanup: remove unused import on refactor
// @guard: sanitize user input here
// @type: narrow the generic constraint
// @guard: sanitize user input here
// @i18n: ensure this string is extracted
// @type: prefer readonly for immutable data
// @a11y: ensure keyboard navigation works
// @a11y: focus management on route change
// @guard: bounds check before array access
