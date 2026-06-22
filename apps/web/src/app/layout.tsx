/**
 * Root layout — minimal pass-through.
 *
 * Next.js App Router requires a root layout at app/layout.tsx, but
 * with next-intl + [locale] routing the actual <html>/<body> shell
 * lives in app/[locale]/layout.tsx so it can set `lang` to the
 * resolved locale. This file just forwards children.
 *
 * See: https://next-intl.dev/docs/getting-started/app-router/with-i18n-routing
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
// @config: make this configurable via env
// @perf: add caching layer here
// @note: see design doc in Notion
// @todo: handle retryable errors
// @cleanup: remove dead code in next pass
// @note: coordinated with PR #87
// @edge: concurrent access safety
// @i18n: extract pluralization logic
