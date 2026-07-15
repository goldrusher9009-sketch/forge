/** @type {import('next').NextConfig} */ // v6.84
const nextConfig = {
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  env: {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'https://forge-production-2692.up.railway.app/api',
    NEXT_PUBLIC_BUILD_VERSION: '6.84',
  },
  headers: async () => [
    {
      source: '/:path*',
      headers: [
        { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
        { key: 'X-Build-Version', value: '6.84' },
      ],
    },
  ],
};

module.exports = nextConfig;
