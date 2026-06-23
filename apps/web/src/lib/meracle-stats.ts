/**
 * Server-only meRacle attribution stats.
 *
 * Reads the active chain's PriceOracle PriceSubmitted events,
 * filters them to the meRacle operational hot wallet, and returns
 * the live counts surfaced by `<MeracleAttribution />` on the
 * landing page: distinct products in the catalog, distinct
 * countries covered, and a unix timestamp of the most recent
 * meRacle submission so the cadence row reads as a real heartbeat
 * instead of the hardcoded "Daily on chain" label.
 *
 * The lookback window matches `recent-feed.ts` and `aggregate.ts`
 * so all three landing-page sections see the same on-chain window
 * and Forno only has to serve the same range once per minute.
 */

import "server-only";

import { unstable_cache } from "next/cache";
import { type Hex } from "viem";

import { timestampFromChain } from "./chain-boundary";
import { fetchAllEvents, getActiveChainId } from "./chain-logs";
import { ADDRESSES } from "./contracts";
import { productSlugToBarcode, zoneKeyToCountry } from "./encode";
import { PRODUCTS, type Product } from "./products";

/**
 * meRacle's operational hot wallet, the only address that submits
 * AI-attributed observations to the oracle. Lowercased for case-
 * insensitive equality against viem's event args.
 */
const MERACLE_SUBMITTER =
  "0x1B94d56f723d8939661D94eD1f899C5c27136b2c".toLowerCase();

export interface MeracleStats {
  /** Distinct canonical product slugs meRacle has ever submitted. */
  staples: number;
  /** Distinct country codes meRacle has submitted in. */
  countries: number;
  /** Block timestamp of the most recent meRacle submission, or 0. */
  lastSyncTs: number;
}

const EMPTY: MeracleStats = { staples: 0, countries: 0, lastSyncTs: 0 };

/** Barcode → Product so we only count submissions for canonical SKUs. */
const BARCODE_TO_PRODUCT: ReadonlyMap<string, Product> = new Map(
  PRODUCTS.map((p) => [productSlugToBarcode(p.slug).toLowerCase(), p]),
);

interface PriceSubmittedArgs {
  submitter?: Hex;
  barcode?: Hex;
  zoneKey?: Hex;
  timestamp?: bigint;
}

const fetchMeracleStats = unstable_cache(
  async (): Promise<MeracleStats> => {
    const chainId = getActiveChainId();
    if (chainId === null) return EMPTY;
    const address =
      ADDRESSES[chainId as keyof typeof ADDRESSES]?.priceOracle;
    if (!address) return EMPTY;

    try {
      const logs = await fetchAllEvents({
        chainId,
        address,
        eventName: "PriceSubmitted",
      });

      const barcodes = new Set<string>();
      const countries = new Set<string>();
      let lastSyncTs = 0;

      for (const log of logs) {
        const args = log.args as PriceSubmittedArgs;
        if (!args.submitter) continue;
        if (args.submitter.toLowerCase() !== MERACLE_SUBMITTER) continue;
        if (!args.barcode || !args.zoneKey) continue;

        const product = BARCODE_TO_PRODUCT.get(args.barcode.toLowerCase());
        if (!product) continue;

        barcodes.add(product.slug);
        const cc = zoneKeyToCountry(args.zoneKey);
        if (cc) countries.add(cc);

        const ts = timestampFromChain(args.timestamp);
        if (ts > lastSyncTs) lastSyncTs = ts;
      }

      return {
        staples: barcodes.size,
        countries: countries.size,
        lastSyncTs,
      };
    } catch {
      // Forno hiccup, render nothing rather than 500.
      return EMPTY;
    }
  },
  ["mercato-meracle-stats-v2"],
  { revalidate: 60, tags: ["basket", "feed", "meracle"] },
);

export async function getMeracleStats(): Promise<MeracleStats> {
  return fetchMeracleStats();
}
// @types: module meracle-stats
/** @module meracle-stats */
// @imports: grouped by external → internal
// @todo: add unit test coverage
// @config: prefer env var over hardcode
