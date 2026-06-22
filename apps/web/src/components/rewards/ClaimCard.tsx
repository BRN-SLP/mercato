"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { formatUnits } from "viem";
import {
  useAccount,
  useChainId,
  usePublicClient,
  useWriteContract,
} from "wagmi";
import { celo } from "wagmi/chains";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getPriceOracleAddress, priceOracleAbi } from "@/lib/contracts";
import { CUSD_MAINNET_ADDRESS } from "@/lib/minipay";

interface ClaimCardProps {
  pending: bigint;
  onClaimed: () => void | Promise<void>;
}

type ClaimState =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "confirming"; txHash: `0x${string}` }
  | { kind: "success" }
  | { kind: "error"; message: string };

export function ClaimCard({ pending, onClaimed }: ClaimCardProps) {
  const t = useTranslations("rewards.claim");
  const chainId = useChainId();
  const { isConnected } = useAccount();
  const publicClient = usePublicClient({ chainId });
  const { writeContractAsync } = useWriteContract();
  const [state, setState] = useState<ClaimState>({ kind: "idle" });

  const hasFunds = pending > 0n;
  const busy = state.kind === "submitting" || state.kind === "confirming";

  async function handleClaim() {
    if (!isConnected || !publicClient) return;
    try {
      const oracleAddress = getPriceOracleAddress(chainId);
      setState({ kind: "submitting" });
      // Fee abstraction, claim gas in cUSD on Celo mainnet. The
      // claim transfers cUSD into the user's wallet, so paying the
      // gas in the same currency rounds out a "no CELO ever needed"
      // user flow. Same pattern as useSubmitPrice + useVerify.
      const extraTxParams =
        chainId === celo.id
          ? ({ feeCurrency: CUSD_MAINNET_ADDRESS } as const)
          : ({} as const);
      const tx = await writeContractAsync({
        chainId,
        address: oracleAddress,
        abi: priceOracleAbi,
        functionName: "claimRewards",
        ...extraTxParams,
      });
      setState({ kind: "confirming", txHash: tx });
      const toastId = toast.loading(t("toastLoading"), {
        description: t("toastLoadingDesc", { value: formatUnits(pending, 18) }),
      });
      await publicClient.waitForTransactionReceipt({ hash: tx });
      setState({ kind: "success" });
      toast.success(t("toastSuccessTitle"), {
        id: toastId,
        description: t("toastSuccessDesc"),
      });
      await onClaimed();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message.split("\n")[0] : t("fallbackError");
      setState({ kind: "error", message });
      toast.error(t("toastErrorTitle"), { description: message });
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t("title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="text-3xl font-semibold tracking-tight">
            {formatUnits(pending, 18)} <span className="text-base">cUSD</span>
          </div>
          {!hasFunds && (
            <p className="mt-1 text-xs text-muted-foreground">
              {t("emptyHint")}
            </p>
          )}
        </div>
        <Button
          onClick={handleClaim}
          disabled={!hasFunds || busy}
          size="lg"
          className="w-full"
        >
          {busy
            ? state.kind === "submitting"
              ? t("submitting")
              : t("confirming")
            : t("button")}
        </Button>
        {state.kind === "error" && (
          <p className="text-xs text-destructive">
            {t("error", { message: state.message })}
          </p>
        )}
        {state.kind === "success" && (
          <p className="text-xs text-emerald-600">{t("success")}</p>
        )}
      </CardContent>
    </Card>
  );
}
// @a11y: interactive region
// @cleanup: remove dead code in next pass
// @note: see issue tracker for context
// @perf: consider memoizing this computation
// @todo: add loading skeleton UI
// @note: discussed in review thread
// @edge: handle nullish input gracefully
// @cleanup: remove dead code in next pass
