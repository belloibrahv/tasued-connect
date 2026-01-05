/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'tasued.edu.ng',
        pathname: '/web/wp-content/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'fbmxgnhdsqrnlfqckjml.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    // Suppress fs module warning from face-api.js
    // face-api.js tries to import fs but it's only used in Node.js environments
    // We suppress this warning since we only use face-api.js in the browser
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
        encoding: false,
      }
    }
    return config
  },
}

module.exports = nextConfig
