/**
 * Server-only basket aggregation.
 *
 * Reads `PriceSubmitted` events from the active chain's PriceOracle and
 * folds them into a country-by-country snapshot of the Mercato basket.
 *
 * Pipeline:
 *   1. Identify which chain has a configured PriceOracle address.
 *   2. Pull the COMPLETE PriceSubmitted history from the proxy deploy
 *      block (paginated in chain-logs.ts), so submissions never roll
 *      out of a block window as the chain advances.
 *   3. Filter:
 *        - drop submissions whose barcode doesn't match any canonical
 *          Mercato product (legacy non-Mercato EAN-13 submissions from
 *          earlier experiments live in the same event log)
 *        - drop submissions whose zoneKey isn't Mercato-format
 *          (legacy GPS-encoded zones from earlier experiments)
 *   4. Group by (country, product) and compute the median priceCents.
 *      Median > mean here because the launch sample is small and a
 *      single outlier (mistyped digit, currency confusion) would
 *      wreck a mean.
 *   5. Sum median product prices into per-country basket totals.
 *
 * Cached with `unstable_cache` (60s revalidate) so the landing and
 * `/basket` dashboard don't hit Forno on every request.
 */

import "server-only";

import { unstable_cache } from "next/cache";
import {
  priceCentsFromChain,
  timestampFromChain,
} from "./chain-boundary";
import { fetchAllEvents, getActiveChainId } from "./chain-logs";
import { ADDRESSES } from "./contracts";
import {
  COUNTRIES,
  getCountryByCode,
  type Country,
} from "./countries";
import { productSlugToBarcode, zoneKeyToCountry } from "./encode";
import { PRODUCTS, getProductBySlug, type Product } from "./products";

/**
 * Median price for a single product in a single country.
 *
 * Note: cent values are `number`, not `bigint`. See `chain-boundary.ts`
 * for the rationale — max realistic price ≈ 10^8 cents, well within
 * `Number.MAX_SAFE_INTEGER` (~9 × 10^15).
 */
export interface ProductPriceSummary {
  product: Product;
  /** Median price in the country's local currency, expressed in cents. */
  medianCents: number;
  /** Number of accepted submissions feeding this median. */
  sampleSize: number;
  /** Block timestamp (seconds) of the most recent contributing submission. */
  lastUpdated: number;
}

/** Aggregated cost-of-living snapshot for one country. */
export interface CountryBasket {
  country: Country;
  /** Sum of medianCents across all products with at least one submission. */
  totalLocalCents: number;
  /** Number of products with >= 1 submission (max = PRODUCTS.length). */
  coverage: number;
  /** Most recent contributing submission's block timestamp. */
  lastUpdated: number;
  /** Per-product breakdown, in PRODUCTS-declaration order. */
  prices: ProductPriceSummary[];
}

/** Full snapshot returned by `getBasketSnapshot`. */
export interface BasketSnapshot {
  countries: CountryBasket[];
  /** Unix seconds when the snapshot was assembled. */
  generatedAt: number;
  /** chainId the snapshot was sourced from. */
  chainId: number;
}

/**
 * Pre-compute the bytes12 barcode for every canonical product so we can
 * filter incoming submissions in O(1). The map is barcode → product so
 * a matching event resolves to its product slug without re-hashing.
 */
const BARCODE_TO_PRODUCT: ReadonlyMap<string, Product> = new Map(
  PRODUCTS.map((p) => [productSlugToBarcode(p.slug).toLowerCase(), p]),
);

interface RawSubmission {
  product: Product;
  country: Country;
  priceCents: number;
  blockTimestamp: number;
}

/** Median of an array of numbers. Modifies a copy, not the input.
 *  Result is rounded to an integer (we work in cents — sub-cent
 *  precision is meaningless for a consumer-price index). */
function median(values: readonly number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return Math.round((sorted[mid - 1] + sorted[mid]) / 2);
  }
  return sorted[mid];
}

/**
 * Inner cached fetch — assembles the full snapshot from on-chain events
 * and returns it. Cache key is constant; we don't allow per-caller
 * filtering inside the cache because that would shard the cache and
 * defeat the point.
 */
const fetchBasketSnapshot = unstable_cache(
  async (): Promise<BasketSnapshot> => {
    const chainId = getActiveChainId();
    if (chainId === null) {
      return {
        countries: [],
        generatedAt: Math.floor(Date.now() / 1000),
        chainId: 0,
      };
    }
    const address =
      ADDRESSES[chainId as keyof typeof ADDRESSES]?.priceOracle;
    if (!address) {
      return {
        countries: [],
        generatedAt: Math.floor(Date.now() / 1000),
        chainId,
      };
    }

    let submissions: RawSubmission[] = [];
    try {
      const logs = await fetchAllEvents({
        chainId,
        address,
        eventName: "PriceSubmitted",
      });

      submissions = logs.flatMap((log) => {
        const args = log.args as {
          barcode?: `0x${string}`;
          zoneKey?: `0x${string}`;
          priceCents?: bigint;
          timestamp?: bigint;
        };
        const { barcode, zoneKey, priceCents, timestamp } = args;
        if (!barcode || !zoneKey || priceCents === undefined) return [];
        const product = BARCODE_TO_PRODUCT.get(barcode.toLowerCase());
        if (!product) return [];
        const countryCode = zoneKeyToCountry(zoneKey);
        if (!countryCode) return [];
        const country = getCountryByCode(countryCode);
        if (!country) return [];
        // Chain boundary: bigint → number for cents + timestamp.
        return [
          {
            product,
            country,
            priceCents: priceCentsFromChain(priceCents),
            blockTimestamp: timestampFromChain(timestamp),
          } satisfies RawSubmission,
        ];
      });
    } catch {
      // Public RPC hiccup — return an empty snapshot rather than 500.
      submissions = [];
    }

    const countries = aggregateByCountry(submissions);
    return {
      countries,
      generatedAt: Math.floor(Date.now() / 1000),
      chainId,
    };
  },
  // v1 → v2: snapshot shape switched cent fields from bigint to
  // number. v2 → v3: scan switched from a rolling 1M-block window to
  // the full deploy-block history, so cached v2 snapshots are
  // incomplete and must not be served after deploy.
  ["mercato-basket-snapshot-v3"],
  { revalidate: 60, tags: ["basket"] },
);

/**
 * Fold raw submissions into per-country baskets. Iterates `COUNTRIES`
 * declaration order so the dashboard renders deterministically (and
 * empty countries still appear in the list).
 */
function aggregateByCountry(
  submissions: readonly RawSubmission[],
): CountryBasket[] {
  // First bucket by countryCode → productSlug → number[]
  const byCountry: Map<string, Map<string, number[]>> = new Map();
  const lastSeen: Map<string, Map<string, number>> = new Map();

  for (const sub of submissions) {
    const cc = sub.country.code;
    const slug = sub.product.slug;
    let perProduct = byCountry.get(cc);
    if (!perProduct) {
      perProduct = new Map();
      byCountry.set(cc, perProduct);
      lastSeen.set(cc, new Map());
    }
    const arr = perProduct.get(slug);
    if (arr) arr.push(sub.priceCents);
    else perProduct.set(slug, [sub.priceCents]);
    const lastMap = lastSeen.get(cc)!;
    const prev = lastMap.get(slug) ?? 0;
    if (sub.blockTimestamp > prev) lastMap.set(slug, sub.blockTimestamp);
  }

  return COUNTRIES.map((country): CountryBasket => {
    const perProduct = byCountry.get(country.code);
    const tsMap = lastSeen.get(country.code);
    const prices: ProductPriceSummary[] = PRODUCTS.map((product) => {
      const samples = perProduct?.get(product.slug) ?? [];
      return {
        product,
        medianCents: median(samples),
        sampleSize: samples.length,
        lastUpdated: tsMap?.get(product.slug) ?? 0,
      };
    });
    const totalLocalCents = prices.reduce(
      (acc, p) => acc + (p.sampleSize > 0 ? p.medianCents : 0),
      0,
    );
    const coverage = prices.filter((p) => p.sampleSize > 0).length;
    const lastUpdated = prices.reduce(
      (acc, p) => (p.lastUpdated > acc ? p.lastUpdated : acc),
      0,
    );
    return {
      country,
      totalLocalCents,
      coverage,
      lastUpdated,
      prices,
    };
  });
}

/**
 * Public accessor — returns the cached snapshot. Cheap to call on
 * every page render thanks to `unstable_cache`.
 */
/**
 * @description getBasketSnapshot — core logic for ${NAME}
 * @returns Result of getBasketSnapshot computation
 */
/** getBasketSnapshot - performs core operation */
/** @returns result of the operation */
/** @param params - input parameters */
export async function getBasketSnapshot(): Promise<BasketSnapshot> {
  return fetchBasketSnapshot();
}

/**
 * Just the basket for one country (or null if the country isn't in our
 * launch list). Reads from the same cached snapshot so this composes
 * cheaply with `getBasketSnapshot`.
 */
/**
 * @description getCountryBasket — core logic for ${NAME}
 * @returns Result of getCountryBasket computation
 */
export async function getCountryBasket(
  countryCode: string,
): Promise<CountryBasket | null> {
  const snapshot = await fetchBasketSnapshot();
  const upper = countryCode.toUpperCase();
  return (
    snapshot.countries.find((b) => b.country.code === upper) ?? null
  );
}

/**
 * Look up a Product by its bytes12 barcode (the same hash that's used
 * on-chain). Useful for resolving event logs to product names in the
 * activity feed.
 */
/**
 * @description getProductByBarcode — core logic for ${NAME}
 * @returns Result of getProductByBarcode computation
 */
export function getProductByBarcode(barcode: string): Product | undefined {
  return BARCODE_TO_PRODUCT.get(barcode.toLowerCase());
}

// Re-export so consumers don't import from products.ts separately.
export { getProductBySlug };
// @types: module aggregate
/** @module aggregate */
// @imports: grouped by external → internal
// @a11y: focus management on route change
// @note: see RFC-42 for rationale
// @cleanup: consolidate with sibling file
// @a11y: ensure keyboard navigation works
// @type: narrow the generic constraint
// @type: narrow from string to union
// @note: discussed in review thread
// @guard: bounds check before array access
// @config: prefer env var over hardcode
// @note: see issue tracker for context
// @config: add feature flag toggle
// @i18n: use Intl for formatting
// @type: export the inner parameter type
// @type: narrow the generic constraint
