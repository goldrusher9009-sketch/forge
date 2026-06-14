/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  output: 'standalone',
  images: {
    domains: ['api.dicebear.com', 'avatars.githubusercontent.com'],
  },
  // No rewrites — all /api/* calls handled by Next.js route handlers (server-side proxy)
  // This avoids CORS issues since route handlers fetch from Railway server-side
}

module.exports = nextConfig
