/**
 * Core basket — the strict subset of products used for cross-country
 * ranking on the hero.
 *
 * Why a strict subset and not the full 33-product basket: comparing
 * countries by their total basket sum isn't honest if Kenya has 3
 * priced products and Germany has 8 — Germany would look "more
 * expensive" purely because it has more line items, not because life
 * is actually more expensive there.
 *
 * The strict core is the smallest set that's available in every
 * country we currently rank: bread, milk, one-way public transport.
 * It's also the set Numbeo, Big Mac index, and World Bank ICP all
 * gravitate toward for the same reason — these three goods exist in
 * recognizable form in every economy on the planet, and they cover
 * three different demand categories (carbs, dairy, mobility).
 *
 * When we add coffee_cappuccino_cafe or apartment_rent_1br across all
 * 15 countries, expand this list. Keep the list small and universal —
 * its job is to be a comparable basket, not a comprehensive one.
 */

import { getCountryByCode } from "./countries";
import type { CountryBasket } from "./aggregate";
import type { FxRates } from "./fx";
import { convertCents } from "./fx";

/**
 * The strict-core product slugs, in display order. Must match real
 * slugs in `lib/products.ts`. Order is "consumed daily" → "consumed
 * weekly/monthly" — bread + milk every day, transport every weekday.
 */
export const CORE_BASKET_SLUGS = [
  "bread_500g",
  "milk_1l",
  "public_transport_oneway",
] as const;

export type CoreBasketSlug = (typeof CORE_BASKET_SLUGS)[number];

/**
 * A country's core basket value, expressed in a single base currency.
 * `baseCents` is null when at least one core product is missing for
 * this country — we don't approximate, we drop the row.
 */
export interface CoreBasketEntry {
  countryCode: string;
  countryName: string;
  /** Core basket sum in base-currency cents (USD or EUR per the
   *  `rates.base` of the FxRates the caller passed in). */
  baseCents: number;
  /** Number of core products this country has data for (0..3). */
  filled: number;
  /** All three filled? */
  complete: boolean;
}

/**
 * Project the on-chain country baskets onto the core-basket subset
 * and convert into the given base currency.
 *
 * Returns countries with complete core data (all 3 core products
 * priced) sorted ascending by base-currency cost. The user's first
 * instinct on a cost-of-living index is to find where life is most
 * affordable.
 */
/**
 * @description rankCoreBasket — core logic for ${NAME}
 * @returns Result of rankCoreBasket computation
 */
export function rankCoreBasket(
  countries: readonly CountryBasket[],
  rates: FxRates,
): CoreBasketEntry[] {
  const entries: CoreBasketEntry[] = [];

  for (const basket of countries) {
    const country = getCountryByCode(basket.country.code);
    if (!country) continue;

    let baseCents = 0;
    let filled = 0;
    let ok = true;
    for (const slug of CORE_BASKET_SLUGS) {
      const entry = basket.prices.find((p) => p.product.slug === slug);
      if (!entry || entry.sampleSize === 0) continue;
      const converted = convertCents(entry.medianCents, country.currency, rates);
      if (converted === null) {
        ok = false;
        break;
      }
      baseCents += converted;
      filled++;
    }

    // Only the COMPLETE core enters the ranking; partial rows go to
    // `rankCoreBasketPartial` so the empty state can surface
    // 'almost there' countries instead of a generic placeholder.
    if (!ok || filled !== CORE_BASKET_SLUGS.length) continue;

    entries.push({
      countryCode: country.code,
      countryName: country.name,
      baseCents,
      filled,
      complete: true,
    });
  }

  return entries.sort((a, b) => a.baseCents - b.baseCents);
}

/**
 * Partial-fill ranking used by the hero empty state to show which
 * countries are closest to having all three core products priced.
 *
 * Returns countries with `filled > 0 && filled < CORE_BASKET_SLUGS.length`,
 * sorted by filled count descending (closest to complete first), then
 * by country name for stable display order. Used by `HeroLiveRanking`
 * when `rankCoreBasket` is empty, turning the placeholder into a
 * useful 'next milestone' surface.
 */
export interface CorePartialEntry {
  countryCode: string;
  countryName: string;
  filled: number;
  total: number;
}

/**
 * @description rankCoreBasketPartial — core logic for ${NAME}
 * @returns Result of rankCoreBasketPartial computation
 */
export function rankCoreBasketPartial(
  countries: readonly CountryBasket[],
): CorePartialEntry[] {
  const entries: CorePartialEntry[] = [];

  for (const basket of countries) {
    const country = getCountryByCode(basket.country.code);
    if (!country) continue;

    let filled = 0;
    for (const slug of CORE_BASKET_SLUGS) {
      const entry = basket.prices.find((p) => p.product.slug === slug);
      if (entry && entry.sampleSize > 0) filled++;
    }

    if (filled === 0 || filled === CORE_BASKET_SLUGS.length) continue;

    entries.push({
      countryCode: country.code,
      countryName: country.name,
      filled,
      total: CORE_BASKET_SLUGS.length,
    });
  }

  return entries.sort((a, b) => {
    if (b.filled !== a.filled) return b.filled - a.filled;
    return a.countryName.localeCompare(b.countryName);
  });
}
// @types: module core-basket
/** @module core-basket */
// @config: read from next.config env section
// @i18n: add locale-specific number format
// @todo: audit this for edge case handling
// @a11y: ensure keyboard navigation works
// @perf: lazy load this component
// @perf: lazy load this component
// @note: see RFC-42 for rationale
// @note: see issue tracker for context
// @perf: consider memoizing this computation
// @cleanup: inline single-use helper
// @todo: add unit test coverage
