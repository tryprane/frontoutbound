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
| `NEXT_STANDALONE` | no | Set to `true` to emit `.next/standalone` for a Node server or container |

All four are read at **build** time. `API_ORIGIN` in particular is compiled into
the routes manifest by `rewrites()`, so on a hosted builder it must be set as a
build variable — a runtime-only secret leaves the proxy doing nothing.

No secrets belong in this repo. `NEXTAUTH_SECRET`, the database URL, Redis, and
all provider credentials live only in the backend.

## Deploying

### Cloudflare Workers

Built with [`@opennextjs/cloudflare`](https://opennext.js.org/cloudflare). The
config is committed, so Cloudflare does not have to auto-detect anything:

- `wrangler.jsonc` — `nodejs_compat`, the compatibility date, and the
  `.open-next/worker.js` / `.open-next/assets` output paths
- `open-next.config.ts` — `defineCloudflareConfig({})`

Build command:

```bash
npm run cf:build      # opennextjs-cloudflare build
npm run cf:preview    # build, then serve locally in the workerd runtime
npm run cf:deploy     # build, then deploy
```

Set `API_ORIGIN` in the project's **build** environment variables (not as a
runtime secret). `public/_headers` already marks `/_next/static/*` immutable.

#### Cloudflare project settings

Two settings have to line up, and the defaults Wrangler detects do not:

| Setting | Value | Why |
| --- | --- | --- |
| Build command | `npm run cf:build` | Plain `next build` only writes `.next`. `wrangler.jsonc` deploys `.open-next/worker.js`, which only `opennextjs-cloudflare build` produces. |
| Deploy command | `npx wrangler deploy` | Reads the committed `wrangler.jsonc`. |

Because `wrangler.jsonc` declares `main` and `assets`, `wrangler deploy` skips
framework auto-detection entirely. Without it, Wrangler tries to *automatically
configure* the project as a Next.js app and fails on the version check before it
deploys anything:

```
Detected Project Settings:
 - Framework: Next.js
 - Build Command: npm run build
 - Output Directory: .next
✘ [ERROR] The version of Next.js used in the project (...) cannot be
  automatically configured.
```

Node is pinned by `.node-version` to 24. The build image's default is already
newer than Next 16's 20.9 floor, but Cloudflare refreshes that default
regularly, so the pin keeps builds reproducible.

#### Version constraints, and why Next is on 16

Three separate version gates apply, and the first two are what earlier builds
tripped over:

1. **Wrangler's Next.js autoconfiguration** refuses anything below `14.2.35`.
2. **The adapter enforces the [Next.js support policy](https://nextjs.org/support-policy)** —
   majors are supported for two years from release. Next 14 shipped 2023-10-26,
   so it went out of support on 2025-10-26 and the build fails with
   `Next.js version 14.2.35 is not supported by the Next.js team`. Next 15
   shipped 2024-10-21 and goes out of support on **2026-10-21**, so it was never
   a durable answer. Next 16 shipped 2025-10-21 and is supported to 2027-10-21.
3. **`@opennextjs/cloudflare@1.20.x` peers `next: ">=15.5.21 <16 || >=16.2.11"`** —
   Next 14 sits entirely outside the adapter's supported range, so
   `--dangerouslyUseUnsupportedNextVersion` would have run an untested
   combination rather than merely accepting known CVEs.

Next 16.1+ additionally needs `wrangler >= 4.59.2` for a workerd `setImmediate`
fix; this repo pins `wrangler ^4.125.0`.

`output: 'standalone'` is deliberately *not* set by default. The adapter forces
standalone mode itself during `opennextjs-cloudflare build`, so the
`NEXT_STANDALONE` flag exists only for the plain Node/container path below.

#### Caching

`open-next.config.ts` uses the adapter's default `dummy` incremental cache, tag
cache and queue. Nothing here uses ISR — every data-bearing page is a client
component fetching at runtime — so there is no R2 bucket and no
`WORKER_SELF_REFERENCE` service binding. Adding `revalidate` or `updateTag` to a
route means wiring up all three together.

#### Auth behind the proxy

`signIn()` posts to `/api/auth/...`, which the rewrite forwards to the backend.
The backend's `Set-Cookie` comes back through this origin, so the session cookie
lands as first-party on the frontend domain — provided the backend does **not**
pin an explicit `Domain=` on it. The backend's `NEXTAUTH_URL` must be set to this
frontend's public origin, or next-auth will build callback URLs and CSRF checks
against the wrong host.

### Node / container

```bash
NEXT_STANDALONE=true npm run build
node .next/standalone/server.js
```


## Develop

```bash
npm install
npm run dev      # http://localhost:3000
npm run lint     # eslint (next lint was removed in Next 16)
```

```bash
npm run build
npm start
```

For `npm run cf:preview`, create a `.dev.vars` (gitignored) containing
`NEXTJS_ENV=development` so Next loads your local `.env` files rather than
production ones.

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
  decides what to render while that happens. Two things make adding one awkward
  anyway: Next 16 renamed the convention to `proxy.ts` and fixed it to the
  Node.js runtime, and `opennextjs-cloudflare build` exits with
  `Node.js middleware is not currently supported` when it finds one.

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
