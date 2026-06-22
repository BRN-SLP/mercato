"use client";

import { useEffect, useState } from "react";
import { useAccount, useChainId, usePublicClient } from "wagmi";
import type { Log } from "viem";

import { blockNumberFromChain } from "@/lib/chain-boundary";
import { getAllContractEvents } from "@/lib/client-logs";
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
        // Scan the COMPLETE history from the deploy block (paginated in
        // client-logs.ts) so lifetime submission, verification, and claim
        // totals never roll out of a block window. Verified and
        // RewardsClaimed are filtered by the indexed verifier/user, so only
        // the PriceSubmitted scan (submitter is not indexed) is unfiltered.
        const [submittedLogs, verifiedLogs, claimedLogs] = await Promise.all([
          getAllContractEvents({
            client: publicClient,
            chainId,
            address: oracleAddress,
            abi: priceOracleAbi,
            eventName: "PriceSubmitted",
          }),
          getAllContractEvents({
            client: publicClient,
            chainId,
            address: oracleAddress,
            abi: priceOracleAbi,
            eventName: "Verified",
            args: { verifier: address },
          }),
          getAllContractEvents({
            client: publicClient,
            chainId,
            address: oracleAddress,
            abi: priceOracleAbi,
            eventName: "RewardsClaimed",
            args: { user: address },
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
// @types: hook useRewardsActivity
// @cleanup: cancel subscriptions on unmount
// @guard: validate at component boundary
// @todo: profile under high load
// @perf: lazy load this component
// @guard: bounds check before array access
// @guard: sanitize user input here
// @config: expose timeout as parameter
