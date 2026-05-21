"use client";

import { useEffect, useState } from "react";
import { useAccount, useChainId, usePublicClient } from "wagmi";
import type { Log } from "viem";

import { blockNumberFromChain } from "@/lib/chain-boundary";
import { getPriceOracleAddress, priceOracleAbi } from "@/lib/contracts";

/**
 * Per-user activity summary. Note that reward amounts stay `bigint`
 * (10^17 wei = 0.1 CELO exceeds Number.MAX_SAFE_INTEGER's safe range
 * for wei-precision math); block numbers use `number` per the
 * convention in `chain-boundary.ts`.
 */
export interface RewardsActivity {
  submissionCount: number;
  verificationCount: number;
  claims: Array<{ amount: bigint; blockNumber: number }>;
  totalClaimed: bigint;
}

const EMPTY: RewardsActivity = {
  submissionCount: 0,
  verificationCount: 0,
  claims: [],
  totalClaimed: 0n,
};

/**
 * Fetch per-user activity for the rewards dashboard: how many submissions and
 * verifications they have on record and the running sum of cUSD they have
 * already claimed.
 */
export function useRewardsActivity() {
  const chainId = useChainId();
  const { address } = useAccount();
  const publicClient = usePublicClient({ chainId });
  const [activity, setActivity] = useState<RewardsActivity>(EMPTY);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!publicClient || !address) {
        setActivity(EMPTY);
        return;
      }
      let oracleAddress: `0x${string}`;
      try {
        oracleAddress = getPriceOracleAddress(chainId);
      } catch {
        setActivity(EMPTY);
        return;
      }
      setLoading(true);
      try {
        // Same RPC-timeout safeguard as usePriceFeed: scanning from
        // block 0 over Celo Mainnet exceeds Forno's single-call budget
        // and the three calls below would all return empty, hiding the
        // user's actual reward history. Bound to the last ~200k blocks
        // (~11 days), which covers the realistic lifetime of a session
        // in the V1 deployment.
        const latestBlock = await publicClient.getBlockNumber();
        const LOOKBACK = 200_000n;
        const fromBlock =
          latestBlock > LOOKBACK ? latestBlock - LOOKBACK : 0n;
        const [submittedLogs, verifiedLogs, claimedLogs] = await Promise.all([
          publicClient.getContractEvents({
            address: oracleAddress,
            abi: priceOracleAbi,
            eventName: "PriceSubmitted",
            fromBlock,
            toBlock: "latest",
          }),
          publicClient.getContractEvents({
            address: oracleAddress,
            abi: priceOracleAbi,
            eventName: "Verified",
            args: { verifier: address },
            fromBlock,
            toBlock: "latest",
          }),
          publicClient.getContractEvents({
            address: oracleAddress,
            abi: priceOracleAbi,
            eventName: "RewardsClaimed",
            args: { user: address },
            fromBlock,
            toBlock: "latest",
          }),
        ]);
        if (cancelled) return;

        const submissionCount = (submittedLogs as SubmittedLog[]).filter(
          (l) => l.args?.submitter?.toLowerCase() === address.toLowerCase(),
        ).length;

        const verificationCount = (verifiedLogs as VerifiedLog[]).length;

        const claims = (claimedLogs as ClaimedLog[])
          .map((l) => ({
            // amount stays bigint — wei amount, exceeds Number safety.
            amount: l.args?.amount ?? 0n,
            // blockNumber → number via chain-boundary.
            blockNumber: blockNumberFromChain(l.blockNumber ?? undefined),
          }))
          .filter((c) => c.amount > 0n);

        const totalClaimed = claims.reduce((acc, c) => acc + c.amount, 0n);

        setActivity({
          submissionCount,
          verificationCount,
          claims,
          totalClaimed,
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [publicClient, chainId, address]);

  return { activity, loading };
}

type SubmittedLog = Log & {
  args?: { submitter?: `0x${string}` };
};

type VerifiedLog = Log & {
  args?: { verifier?: `0x${string}`; isValid?: boolean };
};

type ClaimedLog = Log & {
  args?: { user?: `0x${string}`; amount?: bigint };
};
