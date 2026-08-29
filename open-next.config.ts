import { defineCloudflareConfig } from '@opennextjs/cloudflare'

// No cache/queue overrides are configured, so the adapter falls back to its
// "dummy" incrementalCache, tagCache and queue implementations.
//
// That is the correct choice for this app: every data-bearing page is a client
// component that fetches from the backend at runtime, so there is no ISR and
// nothing to revalidate. Adding an R2 incremental cache would also require a
// WORKER_SELF_REFERENCE service binding in wrangler.jsonc, which is why neither
// is present.
//
// If a route ever adopts `revalidate` or `updateTag`, wire up
// `incrementalCache: r2IncrementalCache` here and add the bucket + self
// reference to wrangler.jsonc at the same time.
export default {
  ...defineCloudflareConfig({}),
  buildCommand: 'npm run build:next',
}
