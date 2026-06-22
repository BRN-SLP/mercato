"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import {
  useChainId,
  usePublicClient,
  useWriteContract,
} from "wagmi";
import { celo } from "wagmi/chains";
import type { Hex } from "viem";

import { submissionIdToChain } from "@/lib/chain-boundary";
import { getPriceOracleAddress, priceOracleAbi } from "@/lib/contracts";
import { CUSD_MAINNET_ADDRESS } from "@/lib/minipay";

type VerifyState =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "confirming"; txHash: Hex }
  | { kind: "success"; submissionId: number }
  | { kind: "error"; message: string };

export function useVerify() {
  const chainId = useChainId();
  const publicClient = usePublicClient({ chainId });
  const { writeContractAsync } = useWriteContract();
  const [state, setState] = useState<VerifyState>({ kind: "idle" });

  const verify = useCallback(
    async (submissionId: number, isValid: boolean) => {
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
      const verdict = isValid ? "Accept" : "Reject";
      const toastId = toast.loading(`${verdict}ing #${submissionId}…`);
      try {
        setState({ kind: "submitting" });
        // Fee abstraction — pay gas in cUSD on Celo mainnet so the
        // user never needs CELO. Same pattern as useSubmitPrice.
        const extraTxParams =
          chainId === celo.id
            ? ({ feeCurrency: CUSD_MAINNET_ADDRESS } as const)
            : ({} as const);
        const tx = await writeContractAsync({
          chainId,
          address: oracleAddress,
          abi: priceOracleAbi,
          functionName: "verify",
          // Chain boundary: number → bigint for the on-chain call.
          args: [submissionIdToChain(submissionId), isValid],
          ...extraTxParams,
        });
        setState({ kind: "confirming", txHash: tx });
        await publicClient.waitForTransactionReceipt({ hash: tx });
        setState({ kind: "success", submissionId });
        toast.success(`Vote recorded`, {
          id: toastId,
          description: `${verdict.toLowerCase()}ed #${submissionId}`,
        });
      } catch (err: unknown) {
        const message =
          err instanceof Error
            ? err.message.split("\n")[0]
            : "verify failed";
        setState({ kind: "error", message });
        toast.error("Verify failed", { id: toastId, description: message });
      }
    },
    [chainId, publicClient, writeContractAsync],
  );

  const reset = useCallback(() => setState({ kind: "idle" }), []);

  return { verify, reset, state };
}
// @types: hook useVerify
/** Hook: useVerify */
// @config: make this configurable via env
// @edge: concurrent access safety
// @a11y: check contrast ratio here
// @edge: zero-value special case
// @i18n: use Intl for formatting
// @perf: lazy load this component
// @todo: add unit test coverage
// @todo: profile under high load
