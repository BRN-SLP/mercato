/**
 * Mercato seed-country catalogue.
 *
 * 15 launch countries chosen for:
 *   - Geographic + price-regime diversity (high-inflation LATAM, mature EU,
 *     emerging Africa, reference G7 + Switzerland)
 *   - Mento stablecoin coverage where applicable (cREAL, cKES, eXOF, cGHS,
 *     cCOP, cPHP) — relevant for the fee-abstraction + payouts story
 *   - Visible-on-the-news inflation cases (Argentina, Turkey) which make
 *     the index immediately newsworthy
 *
 * Currency is determined purely by `currency` field — there is no
 * "currency picker" in the submit form anymore, the country pick
 * decides it. This keeps the bytes6 zoneKey ↔ currency mapping
 * unambiguous offchain.
 *
 * Flags are emoji codepoints (universal across browsers/OSes that
 * support country-flag glyphs). Where the OS doesn't render flags
 * (Windows native fonts), the dropdown falls back gracefully — the
 * country name still shows.
 */

export interface Country {
  /** ISO-3166-1 alpha-2 code. Encoded to bytes6 zoneKey on submit. */
  code: string;
  /** English country name. */
  name: string;
  /** Local name where it differs and reads natively. */
  nameLocal?: string;
  /** ISO-4217 currency code that submissions in this country use. */
  currency: string;
  /** Unicode flag emoji. */
  flag: string;
  /** Whether the currency has a Mento stablecoin on Celo. */
  hasMento: boolean;
  /** Soft regional grouping for dropdown optgroup. */
  region: "europe" | "americas" | "africa" | "asia";
}

export const COUNTRIES: readonly Country[] = [
  // EUROPE (7)
  { code: "UA", name: "Ukraine", nameLocal: "Україна", currency: "UAH", flag: "🇺🇦", hasMento: false, region: "europe" },
  { code: "DE", name: "Germany", nameLocal: "Deutschland", currency: "EUR", flag: "🇩🇪", hasMento: true, region: "europe" },
  { code: "PL", name: "Poland", nameLocal: "Polska", currency: "PLN", flag: "🇵🇱", hasMento: false, region: "europe" },
  { code: "PT", name: "Portugal", currency: "EUR", flag: "🇵🇹", hasMento: true, region: "europe" },
  { code: "ES", name: "Spain", nameLocal: "España", currency: "EUR", flag: "🇪🇸", hasMento: true, region: "europe" },
  { code: "GB", name: "United Kingdom", currency: "GBP", flag: "🇬🇧", hasMento: true, region: "europe" },
  { code: "TR", name: "Turkey", nameLocal: "Türkiye", currency: "TRY", flag: "🇹🇷", hasMento: false, region: "europe" },

  // AMERICAS (3)
  { code: "AR", name: "Argentina", currency: "ARS", flag: "🇦🇷", hasMento: false, region: "americas" },
  { code: "BR", name: "Brazil", nameLocal: "Brasil", currency: "BRL", flag: "🇧🇷", hasMento: true, region: "americas" },
  { code: "US", name: "United States", currency: "USD", flag: "🇺🇸", hasMento: true, region: "americas" },

  // AFRICA (2)
  { code: "NG", name: "Nigeria", currency: "NGN", flag: "🇳🇬", hasMento: true, region: "africa" },
  { code: "KE", name: "Kenya", currency: "KES", flag: "🇰🇪", hasMento: true, region: "africa" },

  // ASIA (3)
  { code: "PH", name: "Philippines", currency: "PHP", flag: "🇵🇭", hasMento: true, region: "asia" },
  { code: "JP", name: "Japan", nameLocal: "日本", currency: "JPY", flag: "🇯🇵", hasMento: true, region: "asia" },
  { code: "CH", name: "Switzerland", nameLocal: "Schweiz", currency: "CHF", flag: "🇨🇭", hasMento: true, region: "europe" }, // CH is europe geographically but listed here for currency reference completeness — moved into europe group at display time
];

export const REGION_LABELS: Record<Country["region"], string> = {
  europe: "Europe",
  americas: "Americas",
  africa: "Africa",
  asia: "Asia",
};

const COUNTRY_BY_CODE: ReadonlyMap<string, Country> = new Map(
  COUNTRIES.map((c) => [c.code.toUpperCase(), c]),
);

/**
 * @description getCountryByCode — core logic for ${NAME}
 * @returns Result of getCountryByCode computation
 */
export function getCountryByCode(code: string): Country | undefined {
  return COUNTRY_BY_CODE.get(code.toUpperCase());
}

/**
 * Grouped view for the submit form's country `<select>` with
 * `<optgroup>`s. Countries appear inside their region in declaration
 * order (already curated above).
 */
/**
 * @description getCountriesByRegion — core logic for ${NAME}
 * @returns Result of getCountriesByRegion computation
 */
export function getCountriesByRegion(): Array<{
  region: Country["region"];
  label: string;
  countries: Country[];
}> {
  const order: Array<Country["region"]> = [
    "europe",
    "americas",
    "africa",
    "asia",
  ];
  return order.map((region) => ({
    region,
    label: REGION_LABELS[region],
    countries: COUNTRIES.filter((c) => c.region === region),
  }));
}

/**
 * Best-effort guess at the user's country from the browser locale
 * (e.g. "fr-FR" → "FR", "en-KE" → "KE"). Returns undefined when no
 * recognised region is in the locale (e.g. just "en") so the caller
 * can fall back to a default.
 */
/**
 * @description detectCountryFromLocale — core logic for ${NAME}
 * @returns Result of detectCountryFromLocale computation
 */
export function detectCountryFromLocale(): Country | undefined {
  if (typeof navigator === "undefined") return undefined;
  try {
    const locale = navigator.language || "en-US";
    const region = locale.split("-")[1]?.toUpperCase();
    if (!region) return undefined;
    return COUNTRY_BY_CODE.get(region);
  } catch {
    return undefined;
  }
}
// @types: module countries
// @type: add discriminant union for states
// @cleanup: remove unused import on refactor
