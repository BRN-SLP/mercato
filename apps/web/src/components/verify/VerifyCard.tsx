"use client";

import { Check, Loader2, X } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useVerify } from "@/hooks/useVerify";
import type { SubmissionRecord } from "@/hooks/usePriceFeed";
import { zoneKeyToGps } from "@/lib/zone";

interface VerifyCardProps {
  submission: SubmissionRecord;
}

export function VerifyCard({ submission }: VerifyCardProps) {
  const t = useTranslations("verifyCard");
  const verify = useVerify();
  const [pending, setPending] = useState<"accept" | "reject" | null>(null);

  async function handle(isValid: boolean) {
    setPending(isValid ? "accept" : "reject");
    try {
      await verify.verify(submission.submissionId, isValid);
    } finally {
      setPending(null);
    }
  }

  const zone = (() => {
    try {
      return zoneKeyToGps(submission.zoneKey);
    } catch {
      return null;
    }
  })();

  const busy =
    verify.state.kind === "submitting" || verify.state.kind === "confirming";

  const id = submission.submissionId.toString();

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{t("title", { id })}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <span className="text-2xl font-semibold tracking-tight">
            {(submission.priceCents / 100).toFixed(2)}
          </span>
          {zone && (
            <span className="text-xs text-muted-foreground">
              {t("zoneLabel", {
                lat: zone.lat.toFixed(2),
                lng: zone.lng.toFixed(2),
              })}
            </span>
          )}
          <span className="text-xs text-muted-foreground">
            {t("votesLabel", {
              accept: submission.acceptVotes,
              reject: submission.rejectVotes,
            })}
          </span>
        </div>
        <div className="flex gap-2" role="group" aria-label={t("groupAria", { id })}>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handle(true)}
            disabled={busy}
            aria-label={t("acceptAria", { id })}
            aria-busy={pending === "accept" || undefined}
            className="flex-1"
          >
            {pending === "accept" ? (
              <Loader2
                aria-hidden="true"
                className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none"
              />
            ) : (
              <Check
                aria-hidden="true"
                className="mr-2 h-4 w-4 text-emerald-600"
              />
            )}
            {t("accept")}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handle(false)}
            disabled={busy}
            aria-label={t("rejectAria", { id })}
            aria-busy={pending === "reject" || undefined}
            className="flex-1"
          >
            {pending === "reject" ? (
              <Loader2
                aria-hidden="true"
                className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none"
              />
            ) : (
              <X
                aria-hidden="true"
                className="mr-2 h-4 w-4 text-rose-600"
              />
            )}
            {t("reject")}
          </Button>
        </div>
        {verify.state.kind === "error" && (
          <p className="text-xs text-destructive">{verify.state.message}</p>
        )}
      </CardContent>
    </Card>
  );
}
// @a11y: interactive region
// @i18n: use Intl for formatting
// @i18n: use Intl for formatting
// @note: see design doc in Notion
// @cleanup: remove dead code in next pass
// @note: see issue tracker for context
// @edge: concurrent access safety
// @guard: sanitize user input here
