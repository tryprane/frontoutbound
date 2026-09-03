'use client'

import React from 'react'
import { Mail } from 'lucide-react'

export interface MailboxAccountLike {
  id?: string
  type?: string
  email?: string
  displayName?: string
  zohoAccountId?: string | null
  zohoRegion?: string | null
  microsoftConnectionStatus?: string | null
}

export function getMailboxProvider(account: MailboxAccountLike): 'gmail' | 'zoho' | 'outlook' | 'custom' {
  const type = (account.type || '').toLowerCase()
  const email = (account.email || '').toLowerCase()

  if (
    type === 'gmail' ||
    email.endsWith('@gmail.com') ||
    email.endsWith('@googlemail.com')
  ) {
    return 'gmail'
  }

  if (
    type === 'zoho' ||
    Boolean(account.zohoAccountId) ||
    Boolean(account.zohoRegion) ||
    email.includes('zoho')
  ) {
    return 'zoho'
  }

  if (
    type === 'outlook' ||
    Boolean(account.microsoftConnectionStatus) ||
    email.endsWith('@outlook.com') ||
    email.endsWith('@hotmail.com') ||
    email.endsWith('@live.com') ||
    email.endsWith('@msn.com')
  ) {
    return 'outlook'
  }

  return 'custom'
}

/**
 * Official Google Gmail 4-color "M" logo
 */
export function GmailLogo({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 512 512"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Gmail logo"
      role="img"
    >
      <path d="m76 190v171q0 30 30 30h52V190" fill="#4285F4" />
      <path d="m354 190v201h52q30 0 30-30V190" fill="#34A853" />
      <path d="m350 255V149l28-21c24-18 58 2 58 30v32" fill="#FBBC04" />
      <path d="m154 249V143l102 77 98-74v106l-98 74" fill="#EA4335" />
      <path d="m76 190v-32c0-29 34-48 58-30l24 18v106" fill="#C5221F" />
    </svg>
  )
}

/**
 * Official Zoho 4-blocks corporate logo (Red Z, Green O, Blue H, Yellow O)
 * rendered using crisp pure SVG vector paths for razor-sharp rendering on all devices.
 */
export function ZohoLogo({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 200"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Zoho logo"
      role="img"
    >
      {/* Red Z block */}
      <rect x="10" y="10" width="84" height="84" rx="18" fill="#E42528" />
      <path
        d="M32 34h38v9.5L46 64.5h24v9.5H30v-9.5l24-21H32V34z"
        fill="#FFFFFF"
      />

      {/* Green O block */}
      <rect x="106" y="10" width="84" height="84" rx="18" fill="#089949" />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M148 32c-12.7 0-23 10.3-23 23s10.3 23 23 23 23-10.3 23-23-10.3-23-23-23zm0 35c-6.6 0-12-5.4-12-12s5.4-12 12-12 12 5.4 12 12-5.4 12-12 12z"
        fill="#FFFFFF"
      />

      {/* Blue H block */}
      <rect x="10" y="106" width="84" height="84" rx="18" fill="#226DB4" />
      <path
        d="M32 128h11v14h18v-14h11v48H61v-15H43v15H32v-48z"
        fill="#FFFFFF"
      />

      {/* Yellow O block */}
      <rect x="106" y="106" width="84" height="84" rx="18" fill="#F9B21D" />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M148 128c-12.7 0-23 10.3-23 23s10.3 23 23 23 23-10.3 23-23-10.3-23-23-23zm0 35c-6.6 0-12-5.4-12-12s5.4-12 12-12 12 5.4 12 12-5.4 12-12 12z"
        fill="#FFFFFF"
      />
    </svg>
  )
}

/**
 * Official Zoho Mail stylized yellow and blue envelope logo (from Zoho Mail design assets)
 */
export function ZohoMailEnvelopeLogo({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 300 300"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Zoho Mail logo"
      role="img"
    >
      <path
        fill="#F9B21D"
        d="M235.4 198.6c-4.7 0-8.5-3.8-8.5-8.5v-46.2c0-4.8-3.9-8.7-8.7-8.7H82.6c-4.8 0-8.7 3.9-8.7 8.7v9.7c0 4.7-3.8 8.5-8.5 8.5-4.7 0-8.5-3.8-8.5-8.5v-9.7c0-14.1 11.5-25.7 25.7-25.7h135.6c14.1 0 25.7 11.5 25.7 25.7v46.2c0 4.7-3.8 8.5-8.5 8.5z"
      />
      <path
        fill="#226DB4"
        d="M269.7 292.9H31.1c-14.1 0-25.7-11.5-25.7-25.7v-67.8c0-4.7 3.8-8.5 8.5-8.5s8.5 3.8 8.5 8.5v67.8c0 4.8 3.9 8.7 8.7 8.7h238.6c4.8 0 8.7-3.9 8.7-8.7V123.4c0-2.7-1.2-5.1-3.3-6.8L155.8 21.9c-3.2-2.5-7.6-2.5-10.8 0L25.7 116.6c-2.1 1.6-3.3 4.1-3.3 6.8v29.1c0 3.2 1.8 6.1 4.6 7.7l119.3 63.5c2.6 1.4 5.6 1.4 8.2 0l76.9-41c4.1-2.2 9.3-0.6 11.5 3.5 2.2 4.1.6 9.3-3.5 11.5l-76.9 41c-7.6 4-16.6 4-24.1 0L19 175.1c-8.4-4.5-13.6-13.2-13.6-22.7v-29.1c0-7.9 3.6-15.2 9.7-20.1L134.4 8.6c4.5-3.6 10.2-5.6 16-5.6s11.4 2 16 5.6l119.3 94.7c6.2 4.9 9.7 12.2 9.7 20.1v143.9c0 14.2-11.5 25.7-25.7 25.7z"
      />
    </svg>
  )
}

/**
 * Microsoft Outlook logo
 */
export function OutlookLogo({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Outlook logo"
      role="img"
    >
      <path
        fill="#0078D4"
        d="M1 5.5A2.5 2.5 0 0 1 3.5 3h10A2.5 2.5 0 0 1 16 5.5v13a2.5 2.5 0 0 1-2.5 2.5h-10A2.5 2.5 0 0 1 1 18.5v-13z"
      />
      <path fill="#28A8EA" d="M16 7.5l7 3.5v8l-7 3.5V7.5z" opacity="0.9" />
      <path fill="#50D9FF" d="M16 11.5l7-3.5v-3l-7 3.5v3z" />
      <path fill="#004C87" d="M16 19.5l7-3.5v3l-7 3.5v-3z" opacity="0.6" />
      <circle cx="8.5" cy="12" r="4.5" fill="#FFFFFF" opacity="0.2" />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8.5 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7zm0 5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z"
        fill="#FFFFFF"
      />
    </svg>
  )
}

/**
 * MailboxAvatar - Displays official provider brand logos (Gmail, Zoho, Outlook)
 * in an elegant, crisp white circle container with soft border & elevation.
 */
export function MailboxAvatar({
  account,
  className = '',
  size = 'md',
}: {
  account: MailboxAccountLike
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}) {
  const provider = getMailboxProvider(account)
  const initialLetter = (account.displayName || account.email || 'M').charAt(0).toUpperCase()

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-13 h-13',
    xl: 'w-16 h-16',
  }[size]

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6.5 h-6.5',
    xl: 'w-8 h-8',
  }[size]

  const fontSizes = {
    sm: 'text-xs',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
  }[size]

  if (provider === 'gmail') {
    return (
      <div
        title={`Gmail (${account.email || ''})`}
        className={`${sizeClasses} rounded-full bg-white border border-gray-200/90 shadow-2xs flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${className}`}
      >
        <GmailLogo className={`${iconSizes} shrink-0`} />
      </div>
    )
  }

  if (provider === 'zoho') {
    return (
      <div
        title={`Zoho Mail (${account.email || ''})`}
        className={`${sizeClasses} rounded-full bg-white border border-gray-200/90 shadow-2xs flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${className}`}
      >
        <ZohoLogo className={`${iconSizes} shrink-0`} />
      </div>
    )
  }

  if (provider === 'outlook') {
    return (
      <div
        title={`Outlook (${account.email || ''})`}
        className={`${sizeClasses} rounded-full bg-white border border-gray-200/90 shadow-2xs flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${className}`}
      >
        <OutlookLogo className={`${iconSizes} shrink-0`} />
      </div>
    )
  }

  return (
    <div
      title={`Custom SMTP (${account.email || ''})`}
      className={`${sizeClasses} rounded-full bg-gray-100 border border-gray-200 text-gray-700 font-bold ${fontSizes} flex items-center justify-center shrink-0 shadow-2xs transition-transform group-hover:scale-105 ${className}`}
    >
      {initialLetter}
    </div>
  )
}
