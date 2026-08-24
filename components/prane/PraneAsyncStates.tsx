'use client'

export function PraneLoading({ label = 'Loading platform data...' }: { label?: string }) {
  return (
    <div className="animate-fade-in py-20 text-center text-sm text-[var(--text-secondary)]">
      {label}
    </div>
  )
}

export function PraneError({ message }: { message?: string | null }) {
  return (
    <div className="animate-fade-in rounded-[24px] border border-[#dc2626]/25 bg-[#fff1f1] px-6 py-5">
      <div className="text-sm font-semibold text-[#a61b1b]">Could not load this view</div>
      <div className="mt-1 text-sm text-[var(--text-secondary)]">
        {message || 'The platform API did not return a result.'}
      </div>
    </div>
  )
}
