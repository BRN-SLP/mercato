import { defineRouting } from "next-intl/routing";

/**
 * i18n routing config.
 *
 * Locales chosen to match Mercato's launch country list — every
 * locale here corresponds to at least one country in the basket
 * that we have on-chain data for or plan to seed soon.
 *
 *   en    — base. Fallback for everything.
 *   uk    — Ukrainian. Active UA submissions.
 *   es    — Spanish. AR/ES core market.
 *   pt-BR — Brazilian Portuguese. BR core market (Mento BRLm).
 *   de    — German. DE benchmark country.
 *   fr    — French. Francophone Africa + FR/CH coverage.
 *
 * Asian languages (ja/zh/tr/fil/sw) are intentionally skipped at v1
 * — most users in those regions read English fluently as a second
 * language, and adding more locales without a real audience would
 * just bloat the bundle. Re-evaluate after we see actual traffic.
 *
 * Prefix strategy: 'as-needed'. The default (en) is served from `/`,
 * other locales get a prefix (`/uk`, `/es`, ...). This keeps clean
 * URLs for the most common case while making non-English routes
 * explicit.
 */
export const routing = defineRouting({
  locales: ["en", "uk", "es", "pt-BR", "de", "fr", "pl", "ro", "it", "tr", "et", "lt"],
  defaultLocale: "en",
  localePrefix: "as-needed",
});

export type Locale = (typeof routing.locales)[number];
