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
    default: 'OutreachOS | The Operating System for Outbound',
    template: '%s | OutreachOS',
  },
  description: 'Campaigns, connected mailboxes, warmup, sender health, and reply handling for focused cold email outreach.',
  icons: {
    icon: [
      { url: '/brand/logo-icon.svg', type: 'image/svg+xml' },
      { url: '/brand/logo-icon.png', type: 'image/png' },
    ],
    shortcut: '/brand/logo-icon.svg',
    apple: '/brand/logo-icon.png',
  },
  openGraph: {
    title: 'OutreachOS | The Operating System for Outbound',
    description: 'Run campaigns, protect sender health, and work replies from one focused outbound workspace.',
    type: 'website',
    images: ['/brand/logo-full.png'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${instrumentSerif.variable} ${plusJakartaSans.variable}`}>
      <head>
        <link rel="icon" href="/brand/logo-icon.svg" type="image/svg+xml" />
        <link rel="alternate icon" href="/brand/logo-icon.png" type="image/png" />
        <link rel="apple-touch-icon" href="/brand/logo-icon.png" />
      </head>
      <body className={`${plusJakartaSans.className} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}

