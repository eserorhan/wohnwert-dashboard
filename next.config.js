/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optimiert für Vercel Deployment
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  // Performance für 17k Immobilien
  experimental: {
    optimizeCss: true,
    optimizeServerReact: true
  },
  // CORS für API Calls
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' }
        ]
      }
    ]
  }
}

module.exports = nextConfig
