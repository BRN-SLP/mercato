"use client";

import { useEffect, useMemo, useState } from "react";
import { usePublicClient, useWatchContractEvent } from "wagmi";
import type { Hex, Log } from "viem";

import {
  priceCentsFromChain,
  submissionIdFromChain,
  timestampFromChain,
} from "@/lib/chain-boundary";
import { getAllContractEvents } from "@/lib/client-logs";
import { getPriceOracleAddress, priceOracleAbi } from "@/lib/contracts";

/**
 * Submission record as stored in app state. All cent-domain and
 * counter-domain fields use `number`; see `chain-boundary.ts` for
 * the rationale.
 */
export interface SubmissionRecord {
  submissionId: number;
  barcode: Hex;
  zoneKey: Hex;
  submitter: `0x${string}`;
  priceCents: number;
  receiptHash: Hex;
  timestamp: number;
  finalized: boolean;
  accepted: boolean;
  acceptVotes: number;
  rejectVotes: number;
  totalVotes: number;
}

interface PriceFeedOptions {
  /** Optional barcode filter. When omitted, returns the whole feed. */
  barcode?: Hex;
}

/**
 * Aggregate PriceSubmitted + Verified + SubmissionFinalized events into a
 * coherent list of submissions with current vote state. Sorted newest first.
 */
export function usePriceFeed(
  chainId: number | undefined,
  options: PriceFeedOptions = {},
) {
  const publicClient = usePublicClient({ chainId });
  const oracleAddress = useMemo(() => {
    if (chainId === undefined) return undefined;
    try {
      return getPriceOracleAddress(chainId);
    } catch {
      return undefined;
    }
  }, [chainId]);

  const [records, setRecords] = useState<Map<string, SubmissionRecord>>(
    new Map(),
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!publicClient || !oracleAddress) {
        setLoading(false);
        return;
      }
      try {
        // Scan the COMPLETE history from the deploy block (paginated in
        // client-logs.ts) so an item's price history never rolls out of a
        // block window as the chain advances. PriceSubmitted is filtered by
        // the indexed barcode, so the per-item scan stays cheap.
        // `useWatchContractEvent` below picks up anything newer in real time.
        const [submittedLogs, verifiedLogs, finalizedLogs] = await Promise.all([
          getAllContractEvents({
            client: publicClient,
            chainId,
            address: oracleAddress,
            abi: priceOracleAbi,
            eventName: "PriceSubmitted",
            args: options.barcode ? { barcode: options.barcode } : undefined,
          }),
          getAllContractEvents({
            client: publicClient,
            chainId,
            address: oracleAddress,
            abi: priceOracleAbi,
            eventName: "Verified",
          }),
          getAllContractEvents({
            client: publicClient,
            chainId,
            address: oracleAddress,
            abi: priceOracleAbi,
            eventName: "SubmissionFinalized",
          }),
        ]);
        if (cancelled) return;

        const map = new Map<string, SubmissionRecord>();
        for (const log of submittedLogs as PriceSubmittedLog[]) {
          const rec = recordFromSubmitted(log);
          if (rec) map.set(rec.submissionId.toString(), rec);
        }
        for (const log of verifiedLogs as VerifiedLog[]) {
          applyVerified(map, log);
        }
        for (const log of finalizedLogs as FinalizedLog[]) {
          applyFinalized(map, log);
        }
        setRecords(map);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [publicClient, oracleAddress, options.barcode]);

  useWatchContractEvent({
    address: oracleAddress,
    abi: priceOracleAbi,
    eventName: "PriceSubmitted",
    args: options.barcode ? { barcode: options.barcode } : undefined,
    enabled: !!oracleAddress,
    onLogs(logs) {
      setRecords((prev) => {
        const next = new Map(prev);
        for (const log of logs as PriceSubmittedLog[]) {
          const rec = recordFromSubmitted(log);
          if (rec) next.set(rec.submissionId.toString(), rec);
        }
        return next;
      });
    },
  });

  useWatchContractEvent({
    address: oracleAddress,
    abi: priceOracleAbi,
    eventName: "Verified",
    enabled: !!oracleAddress,
    onLogs(logs) {
      setRecords((prev) => {
        const next = new Map(prev);
        for (const log of logs as VerifiedLog[]) applyVerified(next, log);
        return next;
      });
    },
  });

  useWatchContractEvent({
    address: oracleAddress,
    abi: priceOracleAbi,
    eventName: "SubmissionFinalized",
    enabled: !!oracleAddress,
    onLogs(logs) {
      setRecords((prev) => {
        const next = new Map(prev);
        for (const log of logs as FinalizedLog[]) applyFinalized(next, log);
        return next;
      });
    },
  });

  const sorted = useMemo(
    () => [...records.values()].sort((a, b) => b.timestamp - a.timestamp),
    [records],
  );

  return { records: sorted, loading };
}

type PriceSubmittedLog = Log & {
  args?: {
    submissionId?: bigint;
    barcode?: Hex;
    zoneKey?: Hex;
    submitter?: `0x${string}`;
    priceCents?: bigint;
    receiptHash?: Hex;
    timestamp?: bigint;
  };
};

type VerifiedLog = Log & {
  args?: {
    submissionId?: bigint;
    verifier?: `0x${string}`;
    isValid?: boolean;
  };
};

type FinalizedLog = Log & {
  args?: {
    submissionId?: bigint;
    accepted?: boolean;
  };
};

function recordFromSubmitted(log: PriceSubmittedLog): SubmissionRecord | null {
  if (log.args?.submissionId === undefined) return null;
  // Chain boundary: convert all bigint fields to app-model number.
  return {
    submissionId: submissionIdFromChain(log.args.submissionId),
    barcode: log.args.barcode as Hex,
    zoneKey: log.args.zoneKey as Hex,
    submitter: log.args.submitter as `0x${string}`,
    priceCents: priceCentsFromChain(log.args.priceCents),
    receiptHash: log.args.receiptHash as Hex,
    timestamp: timestampFromChain(log.args.timestamp),
    finalized: false,
    accepted: false,
    acceptVotes: 0,
    rejectVotes: 0,
    totalVotes: 0,
  };
}

function applyVerified(
  map: Map<string, SubmissionRecord>,
  log: VerifiedLog,
): void {
  const id = log.args?.submissionId;
  if (id === undefined) return;
  const rec = map.get(submissionIdFromChain(id).toString());
  if (!rec) return;
  rec.totalVotes += 1;
  if (log.args?.isValid) rec.acceptVotes += 1;
  else rec.rejectVotes += 1;
}

function applyFinalized(
  map: Map<string, SubmissionRecord>,
  log: FinalizedLog,
): void {
  const id = log.args?.submissionId;
  if (id === undefined) return;
  const rec = map.get(submissionIdFromChain(id).toString());
  if (!rec) return;
  rec.finalized = true;
  rec.accepted = Boolean(log.args?.accepted);
}
// @types: hook usePriceFeed
/** Hook: usePriceFeed */
// @cleanup: cancel subscriptions on unmount
// @i18n: extract pluralization logic
// @a11y: verify screen-reader announcement
// @cleanup: remove unused import on refactor
// @i18n: ensure this string is extracted
// @cleanup: inline single-use helper
// @edge: concurrent access safety
// @i18n: add locale-specific number format
// @perf: lazy load this component
// @cleanup: inline single-use helper
// @i18n: add locale-specific number format
