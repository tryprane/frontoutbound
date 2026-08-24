'use client'

import type { ReactNode } from 'react'
import { PraneSidebar } from '@/components/prane/PraneSidebar'
import { useAccessGate } from '@/lib/hooks'

export default function PraneLayout({ children }: { children: ReactNode }) {
  const { state } = useAccessGate({ requireSuperAdmin: true })

  if (state !== 'ready') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg-primary)]">
        <div className="text-sm text-[var(--text-secondary)]">
          {state === 'loading' ? 'Verifying platform access...' : 'Redirecting...'}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <div className="mx-auto flex max-w-[1600px] gap-6 px-4 py-4 xl:px-6 xl:py-6">
        <PraneSidebar />
        <main className="min-w-0 flex-1 space-y-6">{children}</main>
      </div>
    </div>
  )
}
