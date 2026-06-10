/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  images: {
    domains: ['api.dicebear.com', 'avatars.githubusercontent.com'],
  },
}

module.exports = nextConfig
