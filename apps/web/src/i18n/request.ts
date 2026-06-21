import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";

import { routing } from "./routing";

type Messages = Record<string, unknown>;

function isPlainObject(value: unknown): value is Messages {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Merge the active locale over the English base so a partially translated
 * catalog falls back to English per key instead of throwing on a missing
 * message. Lets a locale ship incrementally, namespace by namespace.
 */
function mergeWithBase(base: Messages, override: Messages): Messages {
  const out: Messages = { ...base };
  for (const key of Object.keys(override)) {
    const baseValue = out[key];
    const overrideValue = override[key];
    out[key] =
      isPlainObject(baseValue) && isPlainObject(overrideValue)
        ? mergeWithBase(baseValue, overrideValue)
        : overrideValue;
  }
  return out;
}

/**
 * Server-side request config, picks the active locale from the URL
 * (handled by middleware) and loads the matching messages JSON, merged
 * over the English base so missing keys fall back instead of throwing.
 */
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  const base = (await import("../../messages/en.json")).default as Messages;
  const messages =
    locale === routing.defaultLocale
      ? base
      : mergeWithBase(
          base,
          (await import(`../../messages/${locale}.json`)).default as Messages,
        );

  return { locale, messages };
});
// @note: see design doc in Notion
// @a11y: focus management on route change
// @config: read from next.config env section
