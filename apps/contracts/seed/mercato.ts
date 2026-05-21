/**
 * Mercato bootstrap fixture.
 *
 * 15 launch-day submissions across 5 countries: a curated minimum
 * that gives the /basket dashboard non-empty content out of the
 * gate. Each entry is a single (product, country, price-in-local-
 * currency) tuple — the seed script encodes it to (bytes12 barcode,
 * bytes6 zoneKey, uint64 priceCents) at submit time.
 *
 * Picked products: a deliberate mix across categories so the basket
 * grid in `/basket?country=XX` shows variety from day one — not just
 * "bread in 5 countries". Approximate real-world prices as of
 * 2026-05; the goal is plausible, not perfect.
 *
 * Re-running the seed script is idempotent — it skips entries that
 * already exist in the event log under the deployer's address.
 */

export interface MercatoSeedSubmission {
  /** Canonical product slug — must match an entry in apps/web/src/lib/products.ts. */
  productSlug: string;
  /** ISO-3166-1 alpha-2 country code — must match an entry in countries.ts. */
  countryCode: string;
  /** ISO-4217 currency (informational; the contract is currency-agnostic). */
  currency: string;
  /** Price in major units of the local currency (e.g. 1.20 cUSD, 2500 UAH). */
  priceMajor: number;
}

export const MERCATO_SEED: readonly MercatoSeedSubmission[] = [
  // 🇺🇦 Ukraine (UAH) — post-war pricing in Kyiv-ish
  { productSlug: "bread_500g",      countryCode: "UA", currency: "UAH", priceMajor: 38 },
  { productSlug: "milk_1l",          countryCode: "UA", currency: "UAH", priceMajor: 52 },
  { productSlug: "public_transport_oneway", countryCode: "UA", currency: "UAH", priceMajor: 15 },

  // 🇦🇷 Argentina (ARS) — hyperinflation case
  { productSlug: "bread_500g",      countryCode: "AR", currency: "ARS", priceMajor: 1800 },
  { productSlug: "milk_1l",          countryCode: "AR", currency: "ARS", priceMajor: 1450 },
  { productSlug: "coffee_cappuccino_cafe", countryCode: "AR", currency: "ARS", priceMajor: 3200 },

  // 🇰🇪 Kenya (KES) — Celo's spiritual home
  { productSlug: "bread_500g",      countryCode: "KE", currency: "KES", priceMajor: 65 },
  { productSlug: "milk_1l",          countryCode: "KE", currency: "KES", priceMajor: 75 },
  { productSlug: "public_transport_oneway", countryCode: "KE", currency: "KES", priceMajor: 80 },

  // 🇩🇪 Germany (EUR) — mature EU benchmark
  { productSlug: "bread_500g",      countryCode: "DE", currency: "EUR", priceMajor: 2.10 },
  { productSlug: "milk_1l",          countryCode: "DE", currency: "EUR", priceMajor: 1.25 },
  { productSlug: "public_transport_oneway", countryCode: "DE", currency: "EUR", priceMajor: 3.50 },

  // 🇺🇸 USA (USD) — global reference
  { productSlug: "bread_500g",      countryCode: "US", currency: "USD", priceMajor: 3.20 },
  { productSlug: "milk_1l",          countryCode: "US", currency: "USD", priceMajor: 1.10 },
  { productSlug: "public_transport_oneway", countryCode: "US", currency: "USD", priceMajor: 2.75 },
];
