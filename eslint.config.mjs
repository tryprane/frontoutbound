// Flat config. Next 16 removed the `next lint` command and `@next/eslint-plugin-next`
// now ships flat config by default, so `npm run lint` calls the ESLint CLI directly.
// The default export of eslint-config-next is already a Linter.Config[] and it
// ignores .next/**, out/**, build/** and next-env.d.ts for us.
import next from 'eslint-config-next'

const config = [
  ...next,
  {
    // The Cloudflare adapter's bundle. eslint-config-next ignores .next/** but
    // knows nothing about .open-next/**, and linting generated code reports
    // rules-of-hooks and no-assign-module-variable violations against Next's own
    // minified runtime.
    ignores: ['.open-next/**', '.wrangler/**'],
  },
  {
    rules: {
      // Every data-bearing page in this repo is a client component that fetches
      // on mount — that is the whole point of the split from the monolith, where
      // these pages were server components. eslint-plugin-react-hooks v6 flags
      // the fetch-then-setState shape this requires. Kept visible as a warning
      // rather than silenced, so a genuinely accidental cascade still shows up.
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
]

export default config
