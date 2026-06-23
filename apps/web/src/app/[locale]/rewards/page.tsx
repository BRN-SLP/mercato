"use client";

import { useTranslations } from "next-intl";
import { formatUnits } from "viem";
import { useAccount } from "wagmi";

import { ClaimCard } from "@/components/rewards/ClaimCard";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { usePendingRewards } from "@/hooks/usePendingRewards";
import { useRewardConstants } from "@/hooks/useRewardConstants";
import { useRewardsActivity } from "@/hooks/useRewardsActivity";
import { truncateAddress } from "@/lib/app-utils";

function formatReward(wei: bigint | null): string {
  if (wei === null) return "·";
  // Trim trailing zeros so 50000000000000000 → "0.05", not "0.050000000000000000".
  const s = formatUnits(wei, 18);
  return s.includes(".") ? s.replace(/0+$/, "").replace(/\.$/, "") : s;
}

export default function RewardsPage() {
  const t = useTranslations("rewards");
  const { isConnected, address } = useAccount();
  const { pending, refetch, oracleAddress } = usePendingRewards();
  const { activity, loading } = useRewardsActivity();
  const rewards = useRewardConstants();

  if (!isConnected || !address) {
    return (
      <main className="container mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-2xl font-semibold tracking-tight">{t("h1")}</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {t("notConnected")}
        </p>
      </main>
    );
  }

  if (!oracleAddress) {
    return (
      <main className="container mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-2xl font-semibold tracking-tight">{t("h1")}</h1>
        <p className="mt-3 text-sm text-destructive">{t("wrongNetwork")}</p>
      </main>
    );
  }

  return (
    <main className="container mx-auto max-w-3xl space-y-6 px-4 py-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("h1")}</h1>
        <p
          className="mt-1 font-mono text-xs text-muted-foreground"
          title={address}
        >
          {truncateAddress(address)}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <ClaimCard
          pending={pending}
          onClaimed={async () => {
            await refetch();
          }}
        />
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {t("lifetimeClaimed.title")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold tracking-tight">
              {formatUnits(activity.totalClaimed, 18)}{" "}
              <span className="text-base">cUSD</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("lifetimeClaimed.claimsCount", {
                count: activity.claims.length,
              })}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("submissions.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold tracking-tight">
              {loading ? "·" : activity.submissionCount}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("submissions.body")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {t("verifications.title")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold tracking-tight">
              {loading ? "·" : activity.verificationCount}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("verifications.body")}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("howRewards.title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            {t.rich("howRewards.body", {
              submitter: formatReward(rewards.submitter),
              verifier: formatReward(rewards.verifier),
              strong: (chunks) => (
                <span className="font-medium text-foreground">{chunks}</span>
              ),
            })}
          </p>
          <p>{t("howRewards.accumulate")}</p>
          <p className="text-[11px] text-muted-foreground/70">
            {t("howRewards.valuesNote")}
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
// @seo: title=Rewards desc=Your cUSD rewards on Mercato
// @perf: monitor allocation pattern here
// @config: make this configurable via env
// @note: discussed in review thread
// @config: prefer env var over hardcode
// @i18n: ensure this string is extracted
// @cleanup: remove unused import on refactor
// @type: prefer readonly for immutable data
// @a11y: verify screen-reader announcement
// @config: add feature flag toggle
// @guard: rate limit this operation
// @edge: concurrent access safety
// @todo: add loading skeleton UI
// @note: see design doc in Notion
// @cleanup: remove legacy fallback path
// @todo: add loading skeleton UI
