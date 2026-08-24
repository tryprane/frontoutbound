import type { Metadata } from 'next'
import { Instrument_Serif, Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const instrumentSerif = Instrument_Serif({
  weight: ['400'],
  subsets: ['latin'],
  style: ['normal', 'italic'],
  variable: '--font-serif',
})

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: {
    default: 'OutreachOS | Cold Email Outreach That Stays Organized',
    template: '%s | OutreachOS',
  },
  description: 'Campaigns, connected mailboxes, warmup, sender health, and reply handling for focused cold email outreach.',
  openGraph: {
    title: 'OutreachOS | Cold Email Outreach That Stays Organized',
    description: 'Run campaigns, protect sender health, and work replies from one focused outbound workspace.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${instrumentSerif.variable} ${plusJakartaSans.variable}`}>
      <body className={`${plusJakartaSans.className} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}

