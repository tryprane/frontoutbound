/** @type {import('next').NextConfig} */

// Only emit .next/standalone when we're actually targeting a Node server or a
// container. The Cloudflare adapter builds its own bundle from the default
// output and does not want a standalone tree.
const standalone = String(process.env.NEXT_STANDALONE || '').toLowerCase() === 'true'

const nextConfig = {
  ...(standalone ? { output: 'standalone' } : {}),
  env: {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || '',
  },
  // NOTE: /api/* is deliberately *not* a rewrite.
  //
  // A rewrite to an external origin is served by the OpenNext Cloudflare
  // adapter's fetch proxy, which follows redirects inside the Worker and hands
  // the browser the final 200 instead of the backend's 3xx — that breaks every
  // OAuth flow. app/api/[...path]/route.ts forwards those requests instead,
  // with redirect: 'manual', and reads API_ORIGIN at runtime.
  //
  // Re-adding a rewrite here would shadow that handler, because afterFiles
  // rewrites resolve before dynamic routes.
}

module.exports = nextConfig
