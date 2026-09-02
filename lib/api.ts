/**
 * Typed fetch wrapper for the OutreachOS backend.
 *
 * Requests go to relative `/api/*` paths so the browser treats them as
 * same-origin and sends the next-auth session cookie. `app/api/[...path]/route.ts`
 * forwards those paths to API_ORIGIN, so the backend can live anywhere
 * without any CORS or cookie-domain work.
 *
 * Set NEXT_PUBLIC_API_BASE_URL only if you deliberately want direct
 * cross-origin calls; then the backend must send back
 * `Access-Control-Allow-Credentials` and an explicit origin.
 */

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || '').replace(/\/$/, '')

/** Error codes thrown by the backend's `lib/authz.ts` AccessError. */
export type AccessErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_PROVISIONED'
  | 'HOST_REQUIRED'
  | 'ORG_SUSPENDED'
  | 'CUSTOM_DOMAIN_DISABLED'

export class ApiError extends Error {
  status: number
  code?: string
  payload?: unknown

  constructor(message: string, status: number, code?: string, payload?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.payload = payload
  }

  /** True when the backend rejected this on access-control grounds. */
  get isAccessError() {
    return this.status === 401 || this.status === 403
  }
}

function buildUrl(path: string, query?: Record<string, string | number | boolean | null | undefined>) {
  const normalized = path.startsWith('/') ? path : `/${path}`
  let url = `${API_BASE}${normalized}`

  if (query) {
    const params = new URLSearchParams()
    for (const [key, value] of Object.entries(query)) {
      if (value === null || value === undefined || value === '') continue
      params.set(key, String(value))
    }
    const queryString = params.toString()
    if (queryString) url += `${url.includes('?') ? '&' : '?'}${queryString}`
  }

  return url
}

async function parseBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    const text = await response.text()
    return text || null
  }
  try {
    return await response.json()
  } catch {
    return null
  }
}

export interface ApiRequestOptions extends Omit<RequestInit, 'body' | 'method'> {
  query?: Record<string, string | number | boolean | null | undefined>
  /** Plain object (JSON-encoded) or a FormData/Blob passed through untouched. */
  body?: unknown
  signal?: AbortSignal
}

async function request<T>(
  method: string,
  path: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const { query, body, headers, ...init } = options

  const isFormLike =
    typeof FormData !== 'undefined' && body instanceof FormData

  const response = await fetch(buildUrl(path, query), {
    ...init,
    method,
    // Send the session cookie. Required for cross-origin direct mode and
    // harmless in proxy mode.
    credentials: 'include',
    headers: {
      // Tells the backend to answer with JSON rather than an HTML redirect on
      // the few routes that still support plain <form> posts.
      Accept: 'application/json',
      ...(isFormLike || body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...headers,
    },
    body: body === undefined ? undefined : isFormLike ? (body as FormData) : JSON.stringify(body),
  })

  const payload = await parseBody(response)

  if (!response.ok) {
    const record = (payload && typeof payload === 'object' ? payload : {}) as {
      error?: string
      code?: string
    }
    throw new ApiError(
      record.error || `Request failed with status ${response.status}`,
      response.status,
      record.code,
      payload
    )
  }

  return payload as T
}

export const api = {
  get: <T>(path: string, options?: ApiRequestOptions) => request<T>('GET', path, options),
  post: <T>(path: string, body?: unknown, options?: ApiRequestOptions) =>
    request<T>('POST', path, { ...options, body }),
  patch: <T>(path: string, body?: unknown, options?: ApiRequestOptions) =>
    request<T>('PATCH', path, { ...options, body }),
  put: <T>(path: string, body?: unknown, options?: ApiRequestOptions) =>
    request<T>('PUT', path, { ...options, body }),
  delete: <T>(path: string, options?: ApiRequestOptions) => request<T>('DELETE', path, options),
}

export default api
