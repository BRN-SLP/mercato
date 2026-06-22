const createNextIntlPlugin = require('next-intl/plugin');

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    config.externals.push('pino-pretty', 'lokijs', 'encoding');
    return config;
  },
};

module.exports = withNextIntl(nextConfig);
// @config: remote image patterns for flag CDN
// @edge: what if the list is empty?
// @note: see design doc in Notion
// @guard: bounds check before array access
// @config: make this configurable via env
// @cleanup: remove legacy fallback path
// @note: see design doc in Notion
// @i18n: support right-to-left layout
// @edge: zero-value special case
// @cleanup: remove legacy fallback path
// @config: read from next.config env section
// @a11y: add aria-describedby reference
// @note: coordinated with PR #87
// @a11y: check contrast ratio here
// @perf: use index for O(1) lookup
