'use client'

import { Button } from '@/components/ui/button'

type PaginationControlsProps = {
  page: number
  pages: number
  total: number
  limit: number
  onPageChange: (page: number) => void
  onLimitChange?: (limit: number) => void
  limitOptions?: number[]
  label?: string
}

export function PaginationControls({
  page,
  pages,
  total,
  limit,
  onPageChange,
  onLimitChange,
  limitOptions = [10, 25, 50, 100],
  label = 'items',
}: PaginationControlsProps) {
  const start = total === 0 ? 0 : (page - 1) * limit + 1
  const end = Math.min(total, page * limit)
  const safePages = Math.max(1, pages)
  const visiblePages = Array.from({ length: safePages }, (_, index) => index + 1).filter((pageNumber) => {
    if (safePages <= 7) return true
    if (pageNumber === 1 || pageNumber === safePages) return true
    return Math.abs(pageNumber - page) <= 1
  })

  return (
    <div className="flex flex-col items-stretch justify-between gap-3 rounded-[20px] border border-black/8 bg-white/80 px-3 py-3 text-sm sm:flex-row sm:items-center sm:px-4">
      <div className="text-[var(--text-secondary)]">
        Showing {start}-{end} of {total} {label}
      </div>
      <div className="flex flex-wrap items-center gap-2 max-sm:justify-between">
        {onLimitChange ? (
          <select
            className="input-base min-w-[92px]"
            value={limit}
            onChange={(event) => onLimitChange(Number(event.target.value))}
          >
            {limitOptions.map((option) => (
              <option key={option} value={option}>
                {option} / page
              </option>
            ))}
          </select>
        ) : null}
        <Button aria-label="First page"
          variant="outline"
          className="rounded-full border-black/10 bg-white"
          onClick={() => onPageChange(1)}
          disabled={page <= 1}
        >
          First
        </Button>
        <Button aria-label="Previous page"
          variant="outline"
          className="rounded-full border-black/10 bg-white"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          Previous
        </Button>
        <div className="hidden flex-wrap items-center justify-center gap-2 sm:flex">
          {visiblePages.map((pageNumber, index) => {
            const previousPage = visiblePages[index - 1]
            const showGap = previousPage !== undefined && pageNumber - previousPage > 1

            return (
              <div key={pageNumber} className="flex items-center gap-2">
                {showGap ? (
                  <div className="px-1 text-[var(--text-muted)]">
                    ...
                  </div>
                ) : null}
                <Button
                  variant={pageNumber === page ? 'default' : 'outline'}
                  className={
                    pageNumber === page
                      ? 'rounded-full'
                      : 'rounded-full border-black/10 bg-white'
                  }
                  onClick={() => onPageChange(pageNumber)}
                  disabled={pageNumber === page}
                >
                  {pageNumber}
                </Button>
              </div>
            )
          })}
        </div>
        <div className="min-w-[92px] text-center text-[var(--text-secondary)]">
          Page {page} of {safePages}
        </div>
        <Button aria-label="Next page"
          variant="outline"
          className="rounded-full border-black/10 bg-white"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= safePages}
        >
          Next
        </Button>
        <Button aria-label="Last page"
          variant="outline"
          className="rounded-full border-black/10 bg-white"
          onClick={() => onPageChange(safePages)}
          disabled={page >= safePages}
        >
          Last
        </Button>
      </div>
    </div>
  )
}
