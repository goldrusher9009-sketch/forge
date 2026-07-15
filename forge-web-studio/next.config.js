/** @type {import('next').NextConfig} */ // v6.83
const nextConfig = {
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  swcMinify: false,
  webpack: (config, { dev }) => {
    if (!dev) {
      config.optimization.minimize = false;
    }
    return config;
  },
  env: {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'https://forge-production-2692.up.railway.app/api',
    NEXT_PUBLIC_BUILD_VERSION: '6.83',
  },
  headers: async () => [
    {
      source: '/:path*',
      headers: [
        { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
        { key: 'X-Build-Version', value: '6.83' },
      ],
    },
  ],
};

module.exports = nextConfig;
