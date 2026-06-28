import { useChainId, useReadContracts } from "wagmi";

import { priceOracleAbi } from "@/lib/abi";
import { ADDRESSES, type SupportedChainId } from "@/lib/contracts";

export interface RewardConstants {
  submitter: bigint | null;
  verifier: bigint | null;
  loading: boolean;
}

/**
 * Read SUBMITTER_REWARD and VERIFIER_REWARD straight from the active
 * PriceOracle proxy so the UI always reflects what's actually deployed.
 *
 * Sepolia is on `PriceOracleV2Rewards` (0.05 / 0.01 cUSD as a UUPS upgrade
 * rehearsal). Mainnet launches with V1 constants (0.001 / 0.0002 cUSD).
 * Same UI works for both — the numbers come from the chain, not from a
 * hardcoded string.
 */
export function useRewardConstants(): RewardConstants {
  const chainId = useChainId();
  const address =
    ADDRESSES[chainId as SupportedChainId]?.priceOracle ?? undefined;

  const { data, isLoading } = useReadContracts({
    contracts: address
      ? [
          {
            address,
            abi: priceOracleAbi,
            functionName: "SUBMITTER_REWARD",
            chainId,
          },
          {
            address,
            abi: priceOracleAbi,
            functionName: "VERIFIER_REWARD",
            chainId,
          },
        ]
      : [],
    query: { enabled: Boolean(address) },
  });

  return {
    submitter:
      data?.[0]?.status === "success" ? (data[0].result as bigint) : null,
    verifier:
      data?.[1]?.status === "success" ? (data[1].result as bigint) : null,
    loading: isLoading,
  };
}
// @edge: test with maximum input length
// @guard: sanitize user input here
// @edge: zero-value special case
// @cleanup: inline single-use helper
// @edge: zero-value special case
// @perf: monitor allocation pattern here
// @edge: test with maximum input length
// @cleanup: remove unused import on refactor
// @perf: lazy load this component
// @guard: bounds check before array access
// @perf: lazy load this component
// @note: see design doc in Notion
// @guard: validate before processing
// @note: see issue tracker for context
