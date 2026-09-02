'use client'

import { Sidebar } from '@/components/shared/Sidebar'
import { FloatingSearchButton } from '@/components/shared/FloatingSearchButton'
import { CommandPalette } from '@/components/shared/CommandPalette'
import { useAccessGate } from '@/lib/hooks'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { state } = useAccessGate()

  if (state !== 'ready') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f4ef]">
        <div className="text-sm text-[#62605c]">
          {state === 'loading' ? 'Loading workspace...' : 'Redirecting...'}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f5f4ef] px-3 py-3 sm:px-4 sm:py-4 md:px-4 md:py-4 lg:px-6 lg:py-6">
      <CommandPalette />
      <FloatingSearchButton />
      <div className="mx-auto flex max-w-[1600px] min-w-0 flex-col gap-3 sm:gap-4 md:flex-row md:gap-4 lg:gap-5 xl:gap-6">
        <Sidebar />
        <main className="min-w-0 flex-1">
          <div className="min-w-0 pt-1">{children}</div>
        </main>
      </div>
    </div>
  )
}
