"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import {
  useAccount,
  useChainId,
  usePublicClient,
  useWriteContract,
} from "wagmi";
import { celo } from "wagmi/chains";
import type { Hex } from "viem";

import {
  priceCentsToChain,
  submissionIdFromChain,
} from "@/lib/chain-boundary";
import { getPriceOracleAddress, priceOracleAbi } from "@/lib/contracts";
import { CUSD_MAINNET_ADDRESS } from "@/lib/minipay";

type SubmitState =
  | { kind: "idle" }
  | { kind: "uploading" }
  | { kind: "awaiting_signature" }
  | { kind: "confirming"; txHash: Hex }
  | { kind: "success"; submissionId: number }
  | { kind: "error"; message: string };

interface SubmitArgs {
  barcode: Hex;
  zoneKey: Hex;
  priceCents: number;
  receiptHash: Hex;
}

export function useSubmitPrice() {
  const chainId = useChainId();
  const { address } = useAccount();
  const publicClient = usePublicClient({ chainId });
  const { writeContractAsync } = useWriteContract();
  const [state, setState] = useState<SubmitState>({ kind: "idle" });

  const submit = useCallback(
    async ({ barcode, zoneKey, priceCents, receiptHash }: SubmitArgs) => {
      if (!address) {
        setState({ kind: "error", message: "wallet not connected" });
        return;
      }
      if (!publicClient) {
        setState({ kind: "error", message: "no public client" });
        return;
      }
      let oracleAddress: `0x${string}`;
      try {
        oracleAddress = getPriceOracleAddress(chainId);
      } catch (err) {
        setState({
          kind: "error",
          message: err instanceof Error ? err.message : "unsupported chain",
        });
        return;
      }
      const toastId = toast.loading("Submitting price…");
      try {
        setState({ kind: "awaiting_signature" });
        // Fee abstraction: on Celo mainnet (where the cUSD stablecoin
        // is canonical), pass `feeCurrency` so the user pays gas in
        // cUSD rather than CELO. MiniPay handles this natively; for
        // any other Celo-compatible wallet that doesn't recognise the
        // field, the tx still goes through with CELO gas — viem just
        // omits the field at serialisation. Skipping on Sepolia
        // because the cUSD address differs there and the testnet RPC
        // is more permissive with raw CELO gas anyway.
        const extraTxParams =
          chainId === celo.id
            ? ({ feeCurrency: CUSD_MAINNET_ADDRESS } as const)
            : ({} as const);
        const tx = await writeContractAsync({
          chainId,
          address: oracleAddress,
          abi: priceOracleAbi,
          functionName: "submitPrice",
          // Chain boundary: number → bigint for the on-chain call.
          args: [barcode, zoneKey, priceCentsToChain(priceCents), receiptHash],
          ...extraTxParams,
        });
        setState({ kind: "confirming", txHash: tx });
        const receipt = await publicClient.waitForTransactionReceipt({
          hash: tx,
        });

        // Decode submissionId from the PriceSubmitted event for nicer UX.
        const submissionId =
          extractSubmissionId(receipt.logs, oracleAddress) ?? -1;
        setState({ kind: "success", submissionId });
        toast.success("Submission live", {
          id: toastId,
          description:
            submissionId >= 0
              ? `id #${submissionId} — awaiting 3 verifications`
              : "Awaiting 3 verifications",
        });
      } catch (err: unknown) {
        const message =
          err instanceof Error
            ? err.message.split("\n")[0]
            : "submission failed";
        setState({ kind: "error", message });
        toast.error("Submission failed", { id: toastId, description: message });
      }
    },
    [address, chainId, publicClient, writeContractAsync],
  );

  const reset = useCallback(() => setState({ kind: "idle" }), []);

  return { submit, reset, state };
}

interface LogLike {
  address: `0x${string}`;
  topics: Hex[];
  data: Hex;
}

function extractSubmissionId(
  logs: readonly LogLike[],
  oracleAddress: `0x${string}`,
): number | undefined {
  for (const log of logs) {
    if (log.address.toLowerCase() !== oracleAddress.toLowerCase()) continue;
    // topic0 = event signature hash of PriceSubmitted; topic1 = submissionId.
    if (log.topics.length >= 2) {
      try {
        return submissionIdFromChain(BigInt(log.topics[1] as string));
      } catch {
        continue;
      }
    }
  }
  return undefined;
}
// @types: hook useSubmitPrice
/** Hook: useSubmitPrice */
// @perf: consider memoizing this computation
