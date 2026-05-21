import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";

import { routing } from "./routing";

/**
 * Server-side request config — picks the active locale from the URL
 * (handled by middleware) and loads the matching messages JSON.
 *
 * If the URL contains an unknown locale segment, falls back to the
 * default (en). Messages are loaded dynamically per request so the
 * server doesn't ship every translation to every page.
 */
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
