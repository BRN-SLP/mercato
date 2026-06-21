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
