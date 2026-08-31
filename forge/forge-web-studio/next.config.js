/** @type {import('next').NextConfig} */ // v6.87
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_API_BASE_URL: '/api',
    NEXT_PUBLIC_BUILD_VERSION: '6.87',
  },
  headers: async () => [
    {
      source: '/:path*',
      headers: [
        { key: 'X-Build-Version', value: '6.87' },
      ],
    },
  ],
};

module.exports = nextConfig;
