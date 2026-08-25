/** @type {import('next').NextConfig} */

// Origin of the OutreachOS backend (the `outbound` repo's apps/web deployment).
// Example: https://api.outreachos.example.com
//
// NOTE: this is read at *build* time, because rewrites() are compiled into the
// routes manifest. On Cloudflare it has to be set as a build variable, not a
// runtime secret, or the proxy silently does nothing.
const apiOrigin = (process.env.API_ORIGIN || '').replace(/\/$/, '')

// Only emit .next/standalone when we're actually targeting a Node server or a
// container. The Cloudflare adapter builds its own bundle from the default
// output and does not want a standalone tree.
const standalone = String(process.env.NEXT_STANDALONE || '').toLowerCase() === 'true'

const nextConfig = {
  ...(standalone ? { output: 'standalone' } : {}),
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
