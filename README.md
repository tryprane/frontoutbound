# frontoutbound

Standalone Next.js frontend for **OutreachOS**. This repo contains only the UI —
every page fetches its data from the OutreachOS backend (the `outbound` repo's
`apps/web` deployment) over HTTP. There is no database client, no queue worker,
and no mail transport in here.

## How it talks to the backend

Two modes, selected by env vars:

### 1. Proxy mode (recommended)

Set `API_ORIGIN` to the backend origin. `next.config.js` rewrites every
`/api/*` request to that host:

```
API_ORIGIN=https://api.example.com
```

The browser only ever sees this frontend's own origin, so:

- the next-auth session cookie stays **first-party** (no `SameSite=None`)
- there is **no CORS** handshake and no cookie-domain configuration
- `fetch('/api/...')` works unchanged in every component

### 2. Direct mode

Set `NEXT_PUBLIC_API_BASE_URL` instead and the browser calls the backend
directly. This requires the backend to allow this origin with credentials — add
it to `CORS_ALLOWED_ORIGINS` in the `outbound` deployment. Cross-site cookies
also need `SameSite=None; Secure`, so proxy mode is the lower-friction option.

## Environment

Copy `.env.example` to `.env.local`:

| Variable | Required | Purpose |
| --- | --- | --- |
| `API_ORIGIN` | proxy mode | Backend origin that `/api/*` is rewritten to |
| `NEXT_PUBLIC_API_BASE_URL` | direct mode | Absolute backend base URL used by `lib/api.ts` |
| `NEXT_PUBLIC_SITE_URL` | no | Public URL of this frontend, used for absolute metadata URLs |

No secrets belong in this repo. `NEXTAUTH_SECRET`, the database URL, Redis, and
all provider credentials live only in the backend.

## Develop

```bash
npm install
npm run dev      # http://localhost:3000
```

```bash
npm run build    # next build (output: 'standalone')
npm start
```

## Architecture notes

- **All data-fetching pages are client components.** The server-rendered pages
  from the monolith were converted to `'use client'` + `useEffect`; the markup is
  otherwise unchanged.
- **`lib/api.ts`** is the typed fetch wrapper. It always sends
  `credentials: 'include'`, passes `FormData` through untouched, and raises
  `ApiError` with the backend's `code` field so callers can branch on
  `NOT_PROVISIONED` / `HOST_REQUIRED` / `FORBIDDEN`.
- **`lib/hooks.ts`** holds the two hooks that replace the server-side guards:
  - `useAccessGate({ requireSuperAdmin })` calls `GET /api/me` and performs the
    same redirects `requireActiveOrganization` / `requireSuperAdmin` used to do.
  - `useApiResource<T>(path)` fetches on mount and exposes `reload()`.
- **`lib/types.ts`** mirrors the JSON shape of every backend endpoint this app
  consumes. When a backend route's payload changes, update it here.
- **There is no `middleware.ts`.** Middleware would need `NEXTAUTH_SECRET` to
  read the session token, which this repo deliberately does not have. Access
  control is enforced by the backend on every request; the client gate only
  decides what to render while that happens.

## Endpoints consumed

| Page | Endpoint |
| --- | --- |
| `(dashboard)/layout` | `GET /api/me` |
| `(dashboard)/dashboard` | `GET /api/dashboard/stats` |
| `(dashboard)/csv/[id]` | `GET /api/csv/[id]/detail` |
| `prane/layout` | `GET /api/me` |
| `prane` | `GET /api/prane/overview` |
| `prane/organizations` | `GET /api/prane/organizations` |
| `prane/users` | `GET /api/prane/users`, `GET /api/prane/organizations` |
| `prane/alerts` | `GET /api/prane/alerts` |
| `prane/audit-log` | `GET /api/prane/audit-log` |
| `prane/queues` | `GET /api/prane/queues` |
| `prane/deployments` | `GET /api/prane/deployments` |
| `prane/scaling-actions` | `GET /api/prane/scaling-actions` |
| `prane/warmup-pool` | `GET /api/prane/warmup-pool` |
| `prane/access-codes` | `GET /api/prane/access-codes` |
| `prane/servers` | `GET /api/prane/servers` |
| `prane/mail-proxy` | `GET /api/prane/mail-proxy` |

Every other page already fetched its data over `/api/*` in the monolith and was
copied across unchanged.
