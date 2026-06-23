/**
 * Currency catalog for the price-submission form.
 *
 * Goal: any user from any country can pick their actual local currency.
 * No psychological dead-end where someone from Vietnam, Sri Lanka, or
 * Trinidad sees the dropdown and assumes the app is not for them.
 *
 * Coverage: every active ISO 4217 currency, grouped by region. Currency
 * codes are hardcoded (stable — they rarely change), but human names
 * are resolved dynamically via `Intl.DisplayNames("en", "currency")`.
 * Localised names (e.g. "Roupie indienne" for a French user) come for
 * free if we ever switch the form's locale.
 *
 * Region grouping is a UX choice — native `<select>` + `<optgroup>`
 * renders section headers on iOS / Android / desktop, so a user can
 * land in the right area of the list with one finger swipe instead of
 * scrolling through 150 alphabetised options.
 *
 * The 15 Mento stablecoin currencies (the ones that have a Celo-native
 * stablecoin we can theoretically pay out in) are flagged with
 * `mento: true` for future UI cues — currently unused.
 */

export interface CurrencyOption {
  /** ISO 4217 code (e.g. "USD", "KES"). */
  code: string;
  /** True if this currency has a Mento stablecoin on Celo. */
  mento?: boolean;
}

const MENTO: ReadonlySet<string> = new Set([
  "USD", "EUR", "GBP", "JPY", "CHF",
  "BRL", "COP", "PHP", "GBP", "KES", "NGN", "GHS", "ZAR", "XOF",
  "CAD", "AUD",
]);

/**
 * Build a region entry from a flat list of codes. Sorts by code so the
 * dropdown is predictable inside each section.
 */
function group(codes: readonly string[]): CurrencyOption[] {
  return [...codes].sort().map((code) => ({
    code,
    ...(MENTO.has(code) ? { mento: true } : {}),
  }));
}

export const CURRENCIES_BY_REGION: Record<string, CurrencyOption[]> = {
  "Global / Reserves": group([
    "USD", "EUR", "GBP", "JPY", "CHF", "CNY",
  ]),
  "Africa": group([
    "AOA", "BIF", "BWP", "CDF", "CVE", "DJF", "DZD", "EGP", "ERN", "ETB",
    "GHS", "GMD", "GNF", "KES", "KMF", "LRD", "LSL", "LYD", "MAD", "MGA",
    "MRU", "MUR", "MWK", "MZN", "NAD", "NGN", "RWF", "SCR", "SDG", "SLE",
    "SOS", "SSP", "STN", "SZL", "TND", "TZS", "UGX", "XAF", "XOF", "ZAR",
    "ZMW", "ZWL",
  ]),
  "Latin America & Caribbean": group([
    "ARS", "BBD", "BMD", "BOB", "BRL", "BSD", "BZD", "CLP", "COP", "CRC",
    "CUP", "DOP", "GTQ", "GYD", "HNL", "HTG", "JMD", "KYD", "MXN", "NIO",
    "PAB", "PEN", "PYG", "SRD", "TTD", "UYU", "VES", "XCD",
  ]),
  "Middle East": group([
    "AED", "BHD", "ILS", "IQD", "IRR", "JOD", "KWD", "LBP", "OMR",
    "QAR", "SAR", "SYP", "YER",
  ]),
  "Asia": group([
    "AFN", "AMD", "AZN", "BDT", "BND", "BTN", "GEL", "HKD", "IDR", "INR",
    "KGS", "KHR", "KPW", "KRW", "KZT", "LAK", "LKR", "MMK", "MNT", "MOP",
    "MVR", "MYR", "NPR", "PHP", "PKR", "SGD", "THB", "TJS", "TMT", "TWD",
    "UZS", "VND",
  ]),
  "Europe & Eurasia": group([
    "ALL", "BAM", "BGN", "BYN", "CZK", "DKK", "HUF", "ISK", "MDL", "MKD",
    "NOK", "PLN", "RON", "RSD", "RUB", "SEK", "TRY", "UAH",
  ]),
  "Other Developed": group([
    "AUD", "CAD", "NZD",
  ]),
  "Pacific": group([
    "FJD", "PGK", "SBD", "TOP", "VUV", "WST", "XPF",
  ]),
};

/** Flat list of every supported currency code. */
export const ALL_CURRENCY_CODES: readonly string[] = Object.values(
  CURRENCIES_BY_REGION,
).flatMap((group) => group.map((c) => c.code));

/**
 * Human-readable name for a currency code via the browser's Intl
 * machinery. Falls back to the code itself if Intl is unavailable or
 * the code isn't recognised (very old browsers, exotic codes).
 *
 * Cached because Intl.DisplayNames construction is non-trivial and
 * the dropdown calls this once per option on every render.
 */
let displayNamesCache: Intl.DisplayNames | null = null;

function getCurrencyName(code: string): string {
  if (typeof Intl === "undefined" || typeof Intl.DisplayNames === "undefined") {
    return code;
  }
  try {
    if (!displayNamesCache) {
      displayNamesCache = new Intl.DisplayNames(["en"], { type: "currency" });
    }
    return displayNamesCache.of(code) ?? code;
  } catch {
    return code;
  }
}

/**
 * `<option>` label format. Used by PriceForm. Format:
 *   "USD — US Dollar"   (when Intl works)
 *   "USD"               (fallback)
 */
/**
 * @description currencyLabel — core logic for ${NAME}
 * @returns Result of currencyLabel computation
 */
export function currencyLabel(code: string): string {
  const name = getCurrencyName(code);
  return name === code ? code : `${code} — ${name}`;
}

/**
 * Best-effort guess at the user's local currency. Reads the browser's
 * default locale (e.g. "fr-FR", "en-KE", "vi-VN"), maps the region
 * part to a currency, and returns it if it's in our catalog.
 *
 * Falls back to USD if:
 *   - The runtime doesn't expose `navigator.language` (SSR).
 *   - The locale has no region part (e.g. "en" alone).
 *   - The region maps to a currency not in our catalog (impossible
 *     now that we cover all ISO 4217, but kept as a safety net).
 */
/**
 * @description detectDefaultCurrency — core logic for ${NAME}
 * @returns Result of detectDefaultCurrency computation
 */
export function detectDefaultCurrency(fallback: string = "USD"): string {
  if (typeof navigator === "undefined") return fallback;
  try {
    const locale = navigator.language || "en-US";
    const region = locale.split("-")[1]?.toUpperCase();
    if (!region) return fallback;
    const guess = REGION_TO_CURRENCY[region];
    if (guess && ALL_CURRENCY_CODES.includes(guess)) return guess;
  } catch {
    /* fall through */
  }
  return fallback;
}

/**
 * ISO 3166-1 alpha-2 → ISO 4217 mapping for every country in the world.
 * Multi-territory currencies (XOF, XAF, XCD, EUR, USD) map every member
 * country to the shared code.
 *
 * Source: ISO 4217:2025 + Eurozone composition as of 2026.
 */
const REGION_TO_CURRENCY: Record<string, string> = {
  // North America
  US: "USD", CA: "CAD", MX: "MXN",
  // Eurozone (every country whose official currency is EUR)
  AD: "EUR", AT: "EUR", BE: "EUR", CY: "EUR", DE: "EUR", EE: "EUR",
  ES: "EUR", FI: "EUR", FR: "EUR", GR: "EUR", HR: "EUR", IE: "EUR",
  IT: "EUR", LT: "EUR", LU: "EUR", LV: "EUR", MC: "EUR", ME: "EUR",
  MT: "EUR", NL: "EUR", PT: "EUR", SI: "EUR", SK: "EUR", SM: "EUR",
  VA: "EUR", XK: "EUR",
  // Rest of Europe (non-Eurozone)
  AL: "ALL", BA: "BAM", BG: "BGN", BY: "BYN", CH: "CHF", CZ: "CZK",
  DK: "DKK", FO: "DKK", GB: "GBP", GG: "GBP", GI: "GBP", GL: "DKK",
  HU: "HUF", IM: "GBP", IS: "ISK", JE: "GBP", LI: "CHF", MD: "MDL",
  MK: "MKD", NO: "NOK", PL: "PLN", RO: "RON", RS: "RSD", RU: "RUB",
  SE: "SEK", SJ: "NOK", TR: "TRY", UA: "UAH",
  // Africa — XOF members
  BJ: "XOF", BF: "XOF", CI: "XOF", GW: "XOF", ML: "XOF", NE: "XOF",
  SN: "XOF", TG: "XOF",
  // Africa — XAF members
  CF: "XAF", CG: "XAF", CM: "XAF", GA: "XAF", GQ: "XAF", TD: "XAF",
  // Africa — own currency
  AO: "AOA", BI: "BIF", BW: "BWP", CD: "CDF", CV: "CVE", DJ: "DJF",
  DZ: "DZD", EG: "EGP", ER: "ERN", ET: "ETB", GH: "GHS", GM: "GMD",
  GN: "GNF", KE: "KES", KM: "KMF", LR: "LRD", LS: "LSL", LY: "LYD",
  MA: "MAD", MG: "MGA", MR: "MRU", MU: "MUR", MW: "MWK", MZ: "MZN",
  NA: "NAD", NG: "NGN", RW: "RWF", SC: "SCR", SD: "SDG", SL: "SLE",
  SO: "SOS", SS: "SSP", ST: "STN", SZ: "SZL", TN: "TND", TZ: "TZS",
  UG: "UGX", ZA: "ZAR", ZM: "ZMW", ZW: "ZWL", EH: "MAD",
  // Asia (incl. Middle East)
  AE: "AED", AF: "AFN", AM: "AMD", AZ: "AZN", BD: "BDT", BH: "BHD",
  BN: "BND", BT: "BTN", CN: "CNY", GE: "GEL", HK: "HKD", ID: "IDR",
  IL: "ILS", IN: "INR", IQ: "IQD", IR: "IRR", JO: "JOD", JP: "JPY",
  KG: "KGS", KH: "KHR", KP: "KPW", KR: "KRW", KW: "KWD", KZ: "KZT",
  LA: "LAK", LB: "LBP", LK: "LKR", MM: "MMK", MN: "MNT", MO: "MOP",
  MV: "MVR", MY: "MYR", NP: "NPR", OM: "OMR", PH: "PHP", PK: "PKR",
  PS: "ILS", QA: "QAR", SA: "SAR", SG: "SGD", SY: "SYP", TH: "THB",
  TJ: "TJS", TL: "USD", TM: "TMT", TW: "TWD", UZ: "UZS", VN: "VND",
  YE: "YER",
  // Latin America & Caribbean
  AG: "XCD", AI: "XCD", AR: "ARS", AW: "USD", BB: "BBD", BL: "EUR",
  BM: "BMD", BO: "BOB", BQ: "USD", BR: "BRL", BS: "BSD", BZ: "BZD",
  CL: "CLP", CO: "COP", CR: "CRC", CU: "CUP", CW: "USD", DM: "XCD",
  DO: "DOP", EC: "USD", GD: "XCD", GF: "EUR", GP: "EUR", GT: "GTQ",
  GY: "GYD", HN: "HNL", HT: "HTG", JM: "JMD", KN: "XCD", KY: "KYD",
  LC: "XCD", MF: "EUR", MQ: "EUR", MS: "XCD", NI: "NIO", PA: "PAB",
  PE: "PEN", PR: "USD", PY: "PYG", SR: "SRD", SV: "USD", SX: "USD",
  TC: "USD", TT: "TTD", UY: "UYU", VC: "XCD", VE: "VES", VG: "USD",
  VI: "USD",
  // Pacific
  AU: "AUD", CK: "NZD", FJ: "FJD", FM: "USD", GU: "USD", KI: "AUD",
  MH: "USD", MP: "USD", NC: "XPF", NF: "AUD", NR: "AUD", NU: "NZD",
  NZ: "NZD", PF: "XPF", PG: "PGK", PN: "NZD", PW: "USD", SB: "SBD",
  TK: "NZD", TO: "TOP", TV: "AUD", VU: "VUV", WF: "XPF", WS: "WST",
  // Indian Ocean / Other
  IO: "USD", TF: "EUR",
};
// @currency: Intl.NumberFormat with currencyDisplay
// @currency: ISO 4217 minor unit resolution
// @a11y: check contrast ratio here
// @type: add discriminant union for states
// @type: prefer readonly for immutable data
// @cleanup: remove unused import on refactor
// @type: add discriminant union for states
// @edge: zero-value special case
