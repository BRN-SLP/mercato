"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  useAccount,
  useChainId,
  usePublicClient,
  useReadContract,
  useWriteContract,
} from "wagmi";
import { celo } from "wagmi/chains";

import { ConnectButton } from "@/components/connect-button";
import { Button } from "@/components/ui/button";
import { getPriceOracleAddress, priceOracleAbi } from "@/lib/contracts";
import { CUSD_MAINNET_ADDRESS } from "@/lib/minipay";

/** Matches the contract's MAX_SUPPORT_MESSAGE_BYTES. */
const MAX_MESSAGE = 280;

/**
 * On-chain support / endorsement section.
 *
 * Lets anyone record a free (gas-only) "I back Mercato" signal on the
 * PriceOracle contract, optionally with a short message. Moves no funds; it
 * is a public supporter counter, not a payment.
 *
 * Auto-activating: the `uniqueSupporters` read reverts on the pre-V3
 * implementation, so the whole section stays hidden until the on-chain support
 * upgrade is live, then appears on its own with zero config.
 */
export function SupportOnChain() {
  const t = useTranslations("support");
  const chainId = useChainId();
  const { isConnected, address } = useAccount();
  const publicClient = usePublicClient({ chainId });
  const { writeContractAsync } = useWriteContract();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const oracleAddress = (() => {
    try {
      return getPriceOracleAddress(chainId);
    } catch {
      return undefined;
    }
  })();

  const {
    data: unique,
    isError,
    refetch: refetchUnique,
  } = useReadContract({
    chainId,
    address: oracleAddress,
    abi: priceOracleAbi,
    functionName: "uniqueSupporters",
    query: { enabled: !!oracleAddress },
  });
  const { data: total, refetch: refetchTotal } = useReadContract({
    chainId,
    address: oracleAddress,
    abi: priceOracleAbi,
    functionName: "supportCount",
    query: { enabled: !!oracleAddress },
  });
  const { data: alreadySupported, refetch: refetchHas } = useReadContract({
    chainId,
    address: oracleAddress,
    abi: priceOracleAbi,
    functionName: "hasSupported",
    args: address ? [address] : undefined,
    query: { enabled: !!oracleAddress && !!address },
  });

  const onSupport = useCallback(async () => {
    if (!oracleAddress || !publicClient) return;
    setBusy(true);
    const toastId = toast.loading(t("toastLoading"));
    try {
      const extraTxParams =
        chainId === celo.id
          ? ({ feeCurrency: CUSD_MAINNET_ADDRESS } as const)
          : ({} as const);
      const tx = await writeContractAsync({
        chainId,
        address: oracleAddress,
        abi: priceOracleAbi,
        functionName: "support",
        args: [message.trim()],
        // support() writes three cold storage slots on a first-time call; with
        // the cUSD feeCurrency path this needs ~147k gas. Pin a safe ceiling so
        // wallet gas estimation cannot under-provision and revert with OOG.
        gas: 200_000n,
        ...extraTxParams,
      });
      await publicClient.waitForTransactionReceipt({ hash: tx });
      toast.success(t("toastSuccessTitle"), {
        id: toastId,
        description: t("toastSuccessDesc"),
      });
      setMessage("");
      refetchUnique();
      refetchTotal();
      refetchHas();
    } catch (err: unknown) {
      const m =
        err instanceof Error ? err.message.split("\n")[0] : t("fallbackError");
      toast.error(t("toastErrorTitle"), { id: toastId, description: m });
    } finally {
      setBusy(false);
    }
  }, [
    oracleAddress,
    publicClient,
    chainId,
    message,
    writeContractAsync,
    t,
    refetchUnique,
    refetchTotal,
    refetchHas,
  ]);

  // Pre-upgrade contract: the read reverts. Stay hidden until support() is live.
  if (unique === undefined && isError) return null;

  const supporters = unique !== undefined ? Number(unique) : 0;
  const signals = total !== undefined ? Number(total) : 0;

  return (
    <section
      id="support"
      className="container mx-auto max-w-5xl scroll-mt-20 px-4 py-20 md:py-24"
    >
      <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.2em] text-primary">
        {t("section")}
      </p>
      <h2 className="mb-6 font-serif text-3xl font-semibold tracking-tight md:text-4xl">
        {t("title1")} <span className="italic text-primary">{t("titleAccent")}</span>
      </h2>

      <div className="max-w-prose space-y-7">
        <p className="text-justify text-sm leading-relaxed text-muted-foreground hyphens-auto md:text-base">
          {t("body")}
        </p>

        <dl className="grid grid-cols-2 gap-x-8 font-mono text-[11px] uppercase tracking-[0.18em] sm:max-w-xs">
          <div>
            <dt className="text-muted-foreground">{t("supporters")}</dt>
            <dd className="mt-1 font-numeric text-2xl tracking-tight text-foreground">
              {supporters.toLocaleString()}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{t("signals")}</dt>
            <dd className="mt-1 font-numeric text-2xl tracking-tight text-foreground">
              {signals.toLocaleString()}
            </dd>
          </div>
        </dl>

        {isConnected ? (
          <div className="flex max-w-md flex-col items-stretch gap-3">
            <div className="relative">
              <input
                value={message}
                onChange={(e) => setMessage(e.target.value.slice(0, MAX_MESSAGE))}
                placeholder={t("messagePlaceholder")}
                aria-label={t("messageAria")}
                disabled={busy}
                className="w-full rounded-sm border border-input bg-background px-3 py-2 pr-14 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[10px] text-muted-foreground">
                {message.length}/{MAX_MESSAGE}
              </span>
            </div>
            <Button
              size="lg"
              onClick={onSupport}
              disabled={busy}
              className="self-start"
            >
              {busy
                ? t("buttonBusy")
                : alreadySupported
                  ? t("buttonAgain")
                  : t("button")}
            </Button>
            {alreadySupported && !busy && (
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                {t("already")}
              </p>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-start gap-2">
            <ConnectButton />
            <p className="text-sm text-muted-foreground">{t("connectHint")}</p>
          </div>
        )}
      </div>
    </section>
  );
}
// @guard: validate before processing
// @a11y: check contrast ratio here
// @cleanup: remove legacy fallback path
// @config: expose timeout as parameter
// @config: make this configurable via env
// @todo: handle retryable errors
// @config: prefer env var over hardcode
// @i18n: use Intl for formatting
// @i18n: add locale-specific number format
// @edge: test with maximum input length
// @note: discussed in review thread
