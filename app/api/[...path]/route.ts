/**
 * Reverse proxy for every `/api/*` request, forwarding to the OutreachOS
 * backend (the `outbound` repo's apps/web deployment).
 *
 * This replaces the `/api/:path*` entry that used to live in next.config.js
 * `rewrites()`. An external rewrite is served by the OpenNext Cloudflare
 * adapter's proxy override, which calls fetch() with fetch's default
 * `redirect: 'follow'` — so every 3xx the backend returns was followed *inside*
 * the Worker and the browser received the final 200 with no Location header.
 * That silently broke every OAuth flow (Gmail, Zoho, Outlook, Google Drive) and
 * any next-auth provider sign-in, because those are nothing but redirects.
 *
 * Forwarding here instead pins `redirect: 'manual'`, so the backend's status and
 * Location reach the browser untouched.
 *
 * This handler must stay the *only* thing bound to /api/*: `afterFiles`
 * rewrites resolve before dynamic routes, so re-adding the rewrite would
 * shadow it and reintroduce the bug.
 */
import type { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

/**
 * Backend origin, read at *runtime*. Nothing is compiled into the build any
 * more, so on Cloudflare this has to be a Worker variable or secret — a
 * build-only variable no longer reaches the proxy.
 */
function resolveApiOrigin() {
  const raw = (process.env.API_ORIGIN || '').trim().replace(/\/+$/, '')
  if (!raw) return null

  // Validated here so a typo surfaces as the 502 below rather than as a throw
  // from new URL() further down.
  try {
    new URL(raw)
  } catch {
    return null
  }
  return raw
}

/** Hop-by-hop and transport headers that must not be forwarded verbatim. */
const STRIP_REQUEST_HEADERS = new Set([
  'connection',
  'keep-alive',
  'proxy-authorization',
  'proxy-connection',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
  // Recomputed by fetch() once the body is handed over as a stream.
  'content-length',
  // Ask the backend for an identity encoding: the runtime decodes compressed
  // subresponses itself, so a forwarded content-encoding would end up
  // describing a body that is no longer encoded.
  'accept-encoding',
  // Set by the platform on the outgoing subrequest; overriding it is rejected.
  'cf-connecting-ip',
])

/** Same, for the response travelling back to the browser. */
const STRIP_RESPONSE_HEADERS = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
  'content-encoding',
  'content-length',
])

/**
 * Public origin this request arrived on, as the browser sees it. Taken from the
 * forwarded headers rather than request.url, because the runtime in front of
 * Next may normalise that (a request to 127.0.0.1 comes through as localhost).
 */
function resolveSelfOrigin(request: NextRequest) {
  const url = new URL(request.url)
  const host = (request.headers.get('x-forwarded-host') || request.headers.get('host') || '')
    .split(',')[0]
    .trim()
  if (!host) return url.origin

  const proto =
    request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim() || url.protocol.replace(':', '')
  return `${proto}://${host}`
}

function buildForwardHeaders(request: NextRequest, selfOrigin: string) {
  const headers: Record<string, string> = {}
  request.headers.forEach((value, key) => {
    if (!STRIP_REQUEST_HEADERS.has(key)) {
      headers[key] = value
    }
  })

  // The backend builds absolute URLs (OAuth returnTo, per-organization login
  // hostnames) from x-forwarded-host, falling back to host — see
  // lib/organizationDomains.ts in the outbound repo. Both have to describe
  // *this* origin, never the backend's, and fetch() overwrites the Host header
  // with the target's, so x-forwarded-* is the only channel that survives.
  const self = new URL(selfOrigin)
  headers['x-forwarded-host'] = self.host
  headers['x-forwarded-proto'] = self.protocol.replace(':', '')

  const clientIp = request.headers.get('cf-connecting-ip')
  if (clientIp && !headers['x-forwarded-for']) {
    headers['x-forwarded-for'] = clientIp
  }

  return headers
}

/**
 * Backend redirects normally point at this frontend's public origin (its
 * NEXTAUTH_URL, or the forwarded host). A few fall back to the origin of the
 * request they saw, which through this proxy is the backend host — that would
 * send the browser off to an internal hostname. Map only that case back onto
 * this origin, and leave every other Location (Google, Zoho and Microsoft
 * consent screens, relative paths) exactly as the backend wrote it.
 */
function rewriteLocation(location: string, apiOrigin: string, selfOrigin: string) {
  let parsed: URL
  try {
    parsed = new URL(location, selfOrigin)
  } catch {
    return null
  }

  if (parsed.host !== new URL(apiOrigin).host) return null
  return `${selfOrigin}${parsed.pathname}${parsed.search}${parsed.hash}`
}

async function proxy(request: NextRequest) {
  const apiOrigin = resolveApiOrigin()
  if (!apiOrigin) {
    return Response.json(
      {
        error:
          'API_ORIGIN is not set to a valid absolute URL on this deployment, so /api requests cannot be forwarded to the backend.',
        code: 'API_ORIGIN_MISSING',
      },
      { status: 502 }
    )
  }

  const incoming = new URL(request.url)
  const selfOrigin = resolveSelfOrigin(request)
  const hasBody = request.method !== 'GET' && request.method !== 'HEAD'

  const init: RequestInit & { duplex?: 'half' } = {
    method: request.method,
    headers: buildForwardHeaders(request, selfOrigin),
    // The entire point of this file: hand the backend's 3xx to the browser
    // rather than following it here.
    redirect: 'manual',
    cache: 'no-store',
  }

  if (hasBody && request.body) {
    // Streamed rather than buffered, so CSV uploads do not have to fit in
    // memory. Node's fetch requires duplex to be declared; workerd ignores it.
    init.body = request.body
    init.duplex = 'half'
  }

  let upstream: Response
  try {
    upstream = await fetch(`${apiOrigin}${incoming.pathname}${incoming.search}`, init)
  } catch (error) {
    console.error('[api proxy]', request.method, incoming.pathname, error)
    return Response.json(
      {
        error: 'The OutreachOS backend could not be reached.',
        code: 'API_UNREACHABLE',
      },
      { status: 502 }
    )
  }

  const headers = new Headers()
  upstream.headers.forEach((value, key) => {
    if (!STRIP_RESPONSE_HEADERS.has(key) && key !== 'set-cookie') {
      headers.set(key, value)
    }
  })

  // Headers.forEach folds duplicate Set-Cookie values into one comma-joined
  // string that browsers reject. getSetCookie() keeps them separate, which is
  // what lets the next-auth session cookie survive this hop.
  for (const cookie of upstream.headers.getSetCookie()) {
    headers.append('set-cookie', cookie)
  }

  const location = headers.get('location')
  if (location) {
    const rewritten = rewriteLocation(location, apiOrigin, selfOrigin)
    if (rewritten) headers.set('location', rewritten)
  }

  const isBodyless = upstream.status === 204 || upstream.status === 205 || upstream.status === 304

  return new Response(isBodyless ? null : upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers,
  })
}

export const GET = proxy
export const HEAD = proxy
export const POST = proxy
export const PUT = proxy
export const PATCH = proxy
export const DELETE = proxy
export const OPTIONS = proxy
