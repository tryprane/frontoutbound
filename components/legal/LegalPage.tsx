import Link from 'next/link'
import { BrandLogo } from '@/components/shared/BrandLogo'

/**
 * Shared chrome for the public legal pages (privacy policy, terms). These are
 * reachable without a session because Google's OAuth verification requires the
 * privacy policy to be publicly accessible from the app's home page.
 */
export function LegalPage({
  title,
  effectiveDate,
  children,
}: {
  title: string
  effectiveDate: string
  children: React.ReactNode
}) {
  return (
    <main className="landing-page">
      <nav className="landing-nav" aria-label="Main navigation">
        <BrandLogo href="/" size="md" />
        <div className="landing-nav-links">
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/login">Log in</Link>
        </div>
      </nav>

      <article className="legal-shell">
        <h1>{title}</h1>
        <p className="legal-effective">Effective {effectiveDate}</p>
        {children}
      </article>

      <footer className="landing-footer">
        <BrandLogo href="/" size="sm" showTagline={true} />
        <div>Campaigns, sender health, warmup, and replies.</div>
        <div className="landing-footer-links">
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/login">Log in</Link>
        </div>
      </footer>
    </main>
  )
}
