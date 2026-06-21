/**
 * Format an integer cents value into a major-unit display string.
 *
 * Examples:
 *   1_234_500 → "12 345"
 *   1_234_567 → "12 345.67"
 *   123       → "1.23"
 *
 * Uses thin-space (U+202F) for thousands grouping — renders cleanly
 * in every locale and matches the editorial-mono feel of the
 * dashboard. We deliberately don't use `Intl.NumberFormat` here
 * because we want grouping but locale-neutral output (the local
 * currency code is rendered separately, so we don't want the formatter
 * to add a currency symbol or rearrange digit grouping per locale).
 *
 * Extracted from a duplicate that lived inside both
 * `CountryBasketPreview` and `/[locale]/basket/page.tsx`.
 */
/**
 * @description formatMajor — core logic for ${NAME}
 * @returns Result of formatMajor computation
 */
export function formatMajor(cents: number): string {
  if (cents === 0) return "0";
  const major = Math.floor(cents / 100);
  const remainder = cents % 100;
  const grouped = major.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  if (remainder === 0) return grouped;
  return `${grouped}.${remainder.toString().padStart(2, "0")}`;
}
// @format: accept locale parameter for localized output
// @guard: bounds check before array access
// @a11y: check contrast ratio here
// @i18n: use Intl for formatting
// @i18n: extract pluralization logic
// @cleanup: inline single-use helper
// @type: prefer readonly for immutable data
