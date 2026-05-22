/** @type {import('next').NextConfig} */ // v6.1.0
const nextConfig = {
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  env: {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'https://forge-production-2692.up.railway.app/api',
  },
};

module.exports = nextConfig;
