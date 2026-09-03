'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[Dashboard Error Boundary]', error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#fee2e2] text-[#dc2626] shadow-sm mb-4">
        <AlertTriangle className="h-8 w-8" />
      </div>
      <h2 className="text-xl font-bold text-[#121316]">
        Something went wrong loading this view
      </h2>
      <p className="mt-2 text-sm text-[#62605c] max-w-md">
        {error?.message || 'An unexpected error occurred while updating the workspace metrics.'}
      </p>
      <div className="mt-6 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="inline-flex items-center gap-2 rounded-full bg-[#121316] px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-[#2c323d] active:scale-95 transition"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Reload View</span>
        </button>
        <Link
          href="/campaigns"
          className="inline-flex items-center gap-2 rounded-full border border-[#121316]/10 bg-white px-5 py-2.5 text-xs font-semibold text-[#121316] shadow-sm hover:bg-[#faf8f4] active:scale-95 transition"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Campaigns</span>
        </Link>
      </div>
    </div>
  )
}
