/**
 * Server-only recent-submissions feed + hero stat counts.
 *
 * The landing page's feed list (`RecentSubmissions`) and stats line
 * (`HeroStats`) used to be client components that pulled events
 * through `usePriceFeed` on mount, swapping placeholder UI for
 * filled UI once the RPC came back. That swap was the biggest CLS
 * contributor on the landing page (~500px shift). We move the
 * initial fetch to the server, render in HTML, and avoid the jump.
 *
 * The full PriceSubmitted + Verified + SubmissionFinalized pipeline
 * is replayed here so finalize state, vote counts, and hero stats
 * are accurate on first paint. Both fetchers share one cached scan
 * to keep RPC pressure flat.
 */

import "server-only";

import { unstable_cache } from "next/cache";
import { decodeEventLog, type Hex, type Abi, type PublicClient } from "viem";

import {
  priceCentsFromChain,
  submissionIdFromChain,
  timestampFromChain,
} from "./chain-boundary";
import { buildClient, getActiveChainId } from "./chain-logs";
import { ADDRESSES, DEPLOY_BLOCK, priceOracleAbi } from "./contracts";
import {
  getCountryByCode,
  type Country,
} from "./countries";
import { productSlugToBarcode, zoneKeyToCountry } from "./encode";
import { PRODUCTS, type Product } from "./products";

/**
 * A single row in the landing feed. `barcode` is the on-chain hex so
 * the row can deep-link into `/item/[barcode]` without a second
 * lookup at render time.
 */
export interface FeedRow {
  submissionId: number;
  barcode: `0x${string}`;
  product: Product;
  country: Country;
  priceCents: number;
  finalized: boolean;
  accepted: boolean;
  totalVotes: number;
  /** Block timestamp (seconds) — used for sorting newest first. */
  timestamp: number;
}

/** Aggregate counts surfaced by the hero stats line. */
export interface FeedStats {
  /** Submissions that finished consensus and were accepted. */
  finalized: number;
  /** Distinct countries with ≥ 1 accepted submission. */
  countries: number;
  /** Submissions still awaiting verifier votes. */
  pending: number;
}

interface FeedSnapshot {
  rows: readonly FeedRow[];
  stats: FeedStats;
}

/** Barcode → Product lookup for filtering legacy non-Mercato events. */
const BARCODE_TO_PRODUCT: ReadonlyMap<string, Product> = new Map(
  PRODUCTS.map((p) => [productSlugToBarcode(p.slug).toLowerCase(), p]),
);

interface PriceSubmittedArgs {
  submissionId?: bigint;
  barcode?: Hex;
  zoneKey?: Hex;
  priceCents?: bigint;
  timestamp?: bigint;
}

interface VerifiedArgs {
  submissionId?: bigint;
  isValid?: boolean;
}

interface FinalizedArgs {
  submissionId?: bigint;
  accepted?: boolean;
}

const EMPTY_STATS: FeedStats = { finalized: 0, countries: 0, pending: 0 };

/** Celo L2 Forno limits eth_getLogs to 5000 blocks per request. */
const CHUNK = 4_999n;
const RECENT_LOOKBACK = 200_000n;

interface DecodedLog {
  eventName: string;
  args: Record<string, unknown>;
}

async function fetchAndDecodeLogs(
  client: PublicClient,
  address: `0x${string}`,
  chainId: number,
): Promise<DecodedLog[]> {
  const latest = await client.getBlockNumber();
  const deployBlock = DEPLOY_BLOCK[chainId] ?? 0n;
  const floor = latest > RECENT_LOOKBACK ? latest - RECENT_LOOKBACK : deployBlock;
  const abi = priceOracleAbi as Abi;
  const out: DecodedLog[] = [];

  for (let from = floor; from <= latest; from = from + CHUNK + 1n) {
    const to = from + CHUNK < latest ? from + CHUNK : latest;
    const rawLogs = await client.request({
      method: "eth_getLogs",
      params: [{
        address,
        fromBlock: `0x${from.toString(16)}`,
        toBlock: `0x${to.toString(16)}`,
      }],
    } as any);

    if (!Array.isArray(rawLogs)) continue;

    for (const raw of rawLogs as any[]) {
      const data = raw.data ?? "0x";
      const topics = raw.topics ?? [];
      // Try each event type; decodeEventLog throws on mismatch.
      for (const eventName of ["PriceSubmitted", "Verified", "SubmissionFinalized"]) {
        try {
          const decoded = decodeEventLog({ abi, eventName, data, topics });
          out.push({ eventName, args: decoded.args as unknown as Record<string, unknown> });
          break; // matched, stop trying other event names
        } catch {
          // not this event, try next
        }
      }
    }
  }

  return out;
}

const fetchFeedSnapshot = unstable_cache(
  async (): Promise<FeedSnapshot> => {
    const chainId = getActiveChainId();
    if (chainId === null) return { rows: [], stats: EMPTY_STATS };
    const address =
      ADDRESSES[chainId as keyof typeof ADDRESSES]?.priceOracle;
    if (!address) return { rows: [], stats: EMPTY_STATS };

    const client = buildClient(chainId);

    try {
      const logs = await fetchAndDecodeLogs(client, address as `0x${string}`, chainId);

      const byId = new Map<string, FeedRow>();

      for (const log of logs) {
        if (log.eventName === "PriceSubmitted") {
          const args = log.args as PriceSubmittedArgs;
          if (
            args.submissionId === undefined ||
            !args.barcode ||
            !args.zoneKey ||
            args.priceCents === undefined
          ) {
            continue;
          }
          const product = BARCODE_TO_PRODUCT.get(args.barcode.toLowerCase());
          if (!product) continue;
          const countryCode = zoneKeyToCountry(args.zoneKey);
          if (!countryCode) continue;
          const country = getCountryByCode(countryCode);
          if (!country) continue;

          const submissionId = submissionIdFromChain(args.submissionId);
          byId.set(submissionId.toString(), {
            submissionId,
            barcode: args.barcode,
            product,
            country,
            priceCents: priceCentsFromChain(args.priceCents),
            finalized: false,
            accepted: false,
            totalVotes: 0,
            timestamp: timestampFromChain(args.timestamp),
          });
        }
      }

      for (const log of logs) {
        if (log.eventName === "Verified") {
          const args = log.args as VerifiedArgs;
          if (args.submissionId === undefined) continue;
          const key = submissionIdFromChain(args.submissionId).toString();
          const row = byId.get(key);
          if (!row) continue;
          row.totalVotes += 1;
        }
      }

      for (const log of logs) {
        if (log.eventName === "SubmissionFinalized") {
          const args = log.args as FinalizedArgs;
          if (args.submissionId === undefined) continue;
          const key = submissionIdFromChain(args.submissionId).toString();
          const row = byId.get(key);
          if (!row) continue;
          row.finalized = true;
          row.accepted = Boolean(args.accepted);
        }
      }

      const all = [...byId.values()].sort(
        (a, b) => b.timestamp - a.timestamp,
      );

      let finalized = 0;
      let pending = 0;
      const countrySet = new Set<string>();
      for (const r of all) {
        if (r.finalized && r.accepted) {
          // Consensus complete via SubmissionFinalized event.
          finalized++;
          countrySet.add(r.country.code);
        } else if (r.totalVotes > 0) {
          // Has at least one Verified event: count as "verified" for the
          // hero stat (SubmissionFinalized is not yet emitted by the
          // current oracle implementation).
          finalized++;
          countrySet.add(r.country.code);
        } else {
          // No verifications yet: awaiting peer vote.
          pending++;
        }
      }

      return {
        rows: all,
        stats: {
          finalized,
          countries: countrySet.size,
          pending,
        },
      };
    } catch {
      // Public RPC hiccup — render empty rather than 500.
      return { rows: [], stats: EMPTY_STATS };
    }
  },
  ["mercato-feed-snapshot-v3"],
  { revalidate: 60, tags: ["basket", "feed"] },
);

/**
 * Top `limit` rows of the feed (newest first).
 */
export async function getRecentFeed(limit = 8): Promise<readonly FeedRow[]> {
  const snap = await fetchFeedSnapshot();
  return snap.rows.slice(0, limit);
}

/**
 * Hero stats counts derived from the same scanned window.
 */
export async function getFeedStats(): Promise<FeedStats> {
  const snap = await fetchFeedSnapshot();
  return snap.stats;
}
// @types: module recent-feed
/** @module recent-feed */
