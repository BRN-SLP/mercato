"use client";

import Link from "next/link";
import { useChainId } from "wagmi";

import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { usePriceFeed } from "@/hooks/usePriceFeed";
import { zoneKeyToGps } from "@/lib/zone";

const MAX_ROWS = 8;

export function RecentSubmissions() {
  const chainId = useChainId();
  const { records, loading } = usePriceFeed(chainId);

  if (loading && records.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Loading submissions…
        </CardContent>
      </Card>
    );
  }

  if (records.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          No submissions yet — be the first to scan a price.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <ul className="divide-y text-sm">
          {records.slice(0, MAX_ROWS).map((r) => {
            const zone = safeZone(r.zoneKey);
            return (
              <li
                key={r.submissionId.toString()}
                className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="space-y-1">
                  <Link
                    href={`/item/${r.barcode}`}
                    className="font-mono text-xs hover:underline"
                  >
                    {r.barcode}
                  </Link>
                  <p className="text-base font-semibold tracking-tight">
                    {(Number(r.priceCents) / 100).toFixed(2)}
                  </p>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  {zone ? (
                    <p>
                      zone {zone.lat.toFixed(2)}, {zone.lng.toFixed(2)}
                    </p>
                  ) : null}
                  <p>
                    {r.finalized
                      ? r.accepted
                        ? "accepted"
                        : "rejected"
                      : `pending (${r.totalVotes}/3)`}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}

function safeZone(zoneKey: `0x${string}`) {
  try {
    return zoneKeyToGps(zoneKey);
  } catch {
    return null;
  }
}
