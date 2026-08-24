/** @type {import('next').NextConfig} */

// Origin of the OutreachOS backend (the `outbound` repo's apps/web deployment).
// Example: https://api.outreachos.example.com
const apiOrigin = (process.env.API_ORIGIN || '').replace(/\/$/, '')

const nextConfig = {
  output: 'standalone',
  env: {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || '',
  },
  async rewrites() {
    // Proxy mode (recommended): the browser only ever talks to this origin, so
    // session cookies stay first-party and no CORS handshake is involved.
    // Leave API_ORIGIN unset to run against a backend mounted on this origin.
    if (!apiOrigin) return []
    return [
      { source: '/api/:path*', destination: `${apiOrigin}/api/:path*` },
    ]
  },
}

module.exports = nextConfig
