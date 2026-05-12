"use client";

import { useCallback, useState } from "react";
import {
  useChainId,
  usePublicClient,
  useWriteContract,
} from "wagmi";
import type { Hex } from "viem";

import { getPriceOracleAddress, priceOracleAbi } from "@/lib/contracts";

type VerifyState =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "confirming"; txHash: Hex }
  | { kind: "success"; submissionId: bigint }
  | { kind: "error"; message: string };

export function useVerify() {
  const chainId = useChainId();
  const publicClient = usePublicClient({ chainId });
  const { writeContractAsync } = useWriteContract();
  const [state, setState] = useState<VerifyState>({ kind: "idle" });

  const verify = useCallback(
    async (submissionId: bigint, isValid: boolean) => {
      if (!publicClient) {
        setState({ kind: "error", message: "no public client" });
        return;
      }
      let oracleAddress: Hex;
      try {
        oracleAddress = getPriceOracleAddress(chainId);
      } catch (err) {
        setState({
          kind: "error",
          message: err instanceof Error ? err.message : "unsupported chain",
        });
        return;
      }
      try {
        setState({ kind: "submitting" });
        const tx = await writeContractAsync({
          chainId,
          address: oracleAddress,
          abi: priceOracleAbi,
          functionName: "verify",
          args: [submissionId, isValid],
        });
        setState({ kind: "confirming", txHash: tx });
        await publicClient.waitForTransactionReceipt({ hash: tx });
        setState({ kind: "success", submissionId });
      } catch (err: unknown) {
        setState({
          kind: "error",
          message:
            err instanceof Error
              ? err.message.split("\n")[0]
              : "verify failed",
        });
      }
    },
    [chainId, publicClient, writeContractAsync],
  );

  const reset = useCallback(() => setState({ kind: "idle" }), []);

  return { verify, reset, state };
}
