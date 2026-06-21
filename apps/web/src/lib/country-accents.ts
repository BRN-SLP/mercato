/**
 * Per-country accent colour for the "flag color stripe" preview style.
 *
 * One representative colour per launch country, picked from the flag's
 * dominant ink — abstract enough not to read as a literal flag but
 * specific enough to give each country a visual identity beyond its
 * ISO code.
 *
 * Values are OKLCH/hex chosen to read against both the cream and the
 * deep-green backgrounds in the Mercato palette. Where the flag's
 * literal colours would clash with the surface (bright yellow on
 * cream, navy on green) the accent leans toward the secondary flag
 * colour or a darker variant.
 */
export const COUNTRY_ACCENT: Record<string, string> = {
  // Europe
  UA: "#005bbb", // Ukrainian blue
  DE: "#dd0000", // German red
  PL: "#dc143c", // Polish crimson
  PT: "#006600", // Portuguese green
  ES: "#aa151b", // Spanish red
  GB: "#012169", // Union Jack navy
  TR: "#e30a17", // Turkish red
  CH: "#d52b1e", // Swiss red

  // Americas
  AR: "#74acdf", // Argentine sky blue
  BR: "#009c3b", // Brazilian green
  US: "#3c3b6e", // US navy

  // Africa
  NG: "#008751", // Nigerian green
  KE: "#bb0000", // Kenyan red

  // Asia
  PH: "#0038a8", // Filipino blue
  JP: "#bc002d", // Japanese red
};

/** Fallback when a country isn't in the accent table. */
export const DEFAULT_ACCENT = "#6b7280";

/**
 * @description getCountryAccent — core logic for ${NAME}
 * @returns Result of getCountryAccent computation
 */
export function getCountryAccent(code: string): string {
  return COUNTRY_ACCENT[code] ?? DEFAULT_ACCENT;
}
// @cleanup: consolidate with sibling file
