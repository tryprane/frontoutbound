'use client'

import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { FileSpreadsheet, Plus, ArrowLeft, ExternalLink } from 'lucide-react'
import { describeColumnMapping, type ColumnMapping } from '@/lib/csv-parser/column-detector'
import { useApiResource } from '@/lib/hooks'
import type { CsvDetail } from '@/lib/types'

const PAGE_SIZE = 50

function pageHref(id: string, page: number) {
  return `/csv/${encodeURIComponent(id)}?page=${page}`
}

export default function CsvDetailPage() {
  const routeParams = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const id = String(routeParams?.id ?? '')

  const parsedPage = Number.parseInt(searchParams.get('page') || '1', 10)
  const requestedPage = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1

  const { data, loading, error } = useApiResource<CsvDetail>(
    id ? `/api/csv/${encodeURIComponent(id)}/detail?page=${requestedPage}&limit=${PAGE_SIZE}` : null
  )

  if (loading && !data) {
    return (
      <div className="animate-fade-in py-20 text-center text-sm text-[#62605c]">
        Loading dataset...
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="animate-fade-in py-20 text-center">
        <div className="text-sm font-semibold text-[#ee382b]">Could not load this CSV file</div>
        <div className="mt-1 text-sm text-[#62605c]">{error || 'Not found'}</div>
        <Link href="/csv" className="mt-4 inline-block text-sm font-semibold text-[#121316] hover:underline">
          Back to CSV files
        </Link>
      </div>
    )
  }

  // Names below mirror the server-rendered version so the markup is unchanged.
  const csvFile = {
    originalName: data.csvFile.originalName,
    rows: data.rows,
    _count: { campaigns: data.csvFile.campaignCount },
  }
  const { totalRows, rowsWithEmail, rowsWithPhone, emailPct, phonePct } = data.stats
  const { page, totalPages, pageStart, pageEnd } = data.pagination
  const columnMap = data.columnMap as ColumnMapping
  const visiblePages = Array.from({ length: totalPages }, (_, index) => index + 1).filter((pageNumber) => {
    if (totalPages <= 7) return true
    if (pageNumber === 1 || pageNumber === totalPages) return true
    return Math.abs(pageNumber - page) <= 1
  })

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Card */}
      <header className="uneevo-card p-6 md:p-7 flex flex-col md:flex-row md:items-center justify-between gap-5 shadow-[0_10px_30px_rgba(0,0,0,0.03)]">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] bg-[#121316] text-white shadow-xs">
            <FileSpreadsheet className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link href="/csv" className="text-xs font-bold text-[#62605c] hover:text-[#121316] uppercase tracking-wider flex items-center gap-1">
                <ArrowLeft className="h-3 w-3" />
                CSV FILES
              </Link>
              <span className="text-[#8a8780]">/</span>
              <span className="text-xs font-bold tracking-widest text-[#ee382b] uppercase">
                DATASET DETAIL
              </span>
            </div>
            <h1 className="zoho-puvi-headline text-2xl sm:text-3xl font-bold tracking-tight text-[#121316]">
              {csvFile.originalName}
            </h1>
            <p className="text-xs sm:text-sm text-[#62605c] mt-0.5">
              Associated with {csvFile._count.campaigns} active campaign{csvFile._count.campaigns !== 1 ? 's' : ''} in this workspace.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/campaigns/new"
            className="inline-flex items-center gap-2 rounded-full bg-[#ee382b] px-6 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-[0_6px_20px_rgba(238,56,43,0.22)] transition-all hover:bg-[#d92b1f] hover:shadow-[0_10px_28px_rgba(238,56,43,0.32)]"
          >
            <Plus className="h-4 w-4" />
            <span>Use in Campaign</span>
          </Link>
        </div>
      </header>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="uneevo-card p-6 rounded-[24px] border border-[#121316]/08 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.03)]">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#62605c] block mb-1">
            Total Prospects
          </span>
          <div className="font-mono text-3xl font-bold text-[#121316] tabular-nums">
            {totalRows.toLocaleString()}
          </div>
          <div className="text-xs text-[#62605c] mt-1">Verified lead records</div>
        </div>

        <div className="uneevo-card p-6 rounded-[24px] border border-[#121316]/08 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#62605c]">
              Email Coverage
            </span>
            <span className="text-xs font-mono font-bold text-[#0f8a5f] bg-[#0f8a5f]/10 px-2 py-0.5 rounded-full">
              {emailPct}%
            </span>
          </div>
          <div className="font-mono text-3xl font-bold text-[#0f8a5f] tabular-nums">
            {rowsWithEmail.toLocaleString()}
          </div>
          <div className="text-xs text-[#62605c] mt-1">rows contain valid email</div>
        </div>

        <div className="uneevo-card p-6 rounded-[24px] border border-[#121316]/08 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#62605c]">
              Phone Coverage
            </span>
            <span className="text-xs font-mono font-bold text-[#b7791f] bg-[#fde9b0]/50 px-2 py-0.5 rounded-full">
              {phonePct}%
            </span>
          </div>
          <div className="font-mono text-3xl font-bold text-[#b7791f] tabular-nums">
            {rowsWithPhone.toLocaleString()}
          </div>
          <div className="text-xs text-[#62605c] mt-1">rows contain phone/WhatsApp</div>
        </div>
      </div>

      {/* Column Mapping Container */}
      <div className="uneevo-card p-6 rounded-[24px] border border-[#121316]/08 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.03)]">
        <span className="text-xs font-bold tracking-widest text-[#ee382b] uppercase block mb-1">
          SCHEMA DEFINITION
        </span>
        <h3 className="zoho-puvi-headline text-lg font-bold text-[#121316] mb-3">
          Mapped Columns & Field Bindings
        </h3>
        <div className="flex flex-wrap gap-2">
          {Object.entries(columnMap)
            .filter(([, entry]) => entry.type !== 'ignore')
            .map(([column, entry]) => (
              <span
                key={column}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#121316]/10 bg-[#faf8f4] px-3.5 py-1 text-xs font-semibold text-[#121316]"
              >
                <span className="font-mono text-[#62605c]">{column}</span>
                <span className="text-[#ee382b]">→</span>
                <span className="font-bold">{describeColumnMapping(entry, column)}</span>
              </span>
            ))}
        </div>
      </div>

      {/* Data Rows Table */}
      <div className="uneevo-card overflow-hidden rounded-[24px] border border-[#121316]/08 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.03)]">
        <div className="p-5 border-b border-[#121316]/08 bg-[#faf8f4] flex items-center justify-between">
          <div className="text-sm font-bold text-[#121316]">
            Lead Records{' '}
            <span className="font-normal font-mono text-xs text-[#62605c]">
              (showing {pageStart.toLocaleString()}–{pageEnd.toLocaleString()} of {totalRows.toLocaleString()})
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-[#121316]/08 text-[11px] font-bold uppercase tracking-wider text-[#62605c] bg-white">
                <th className="px-6 py-3.5 w-16">#</th>
                <th className="px-6 py-3.5">Prospect Name</th>
                <th className="px-6 py-3.5">Website</th>
                <th className="px-6 py-3.5">Email Address</th>
                <th className="px-6 py-3.5">Phone / WhatsApp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#121316]/06 font-mono text-xs">
              {csvFile.rows.map((row: any) => (
                <tr key={row.id} className="transition-colors hover:bg-[#faf8f4]/60">
                  <td className="px-6 py-3.5 text-[#8a8780]">{row.rowIndex + 1}</td>
                  <td className="px-6 py-3.5 font-sans font-semibold text-[#121316] max-w-xs truncate">
                    {row.name || <span className="text-[#8a8780] font-normal italic">-</span>}
                  </td>
                  <td className="px-6 py-3.5 max-w-xs truncate">
                    {row.website ? (
                      <a
                        href={row.website.startsWith('http') ? row.website : `https://${row.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[#0f8a5f] hover:underline font-sans text-xs"
                      >
                        <span>{row.website}</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <span className="text-[#8a8780] font-normal italic">-</span>
                    )}
                  </td>
                  <td className="px-6 py-3.5 text-[#121316]">
                    {row.email || <span className="text-[#8a8780] font-normal italic">-</span>}
                  </td>
                  <td className="px-6 py-3.5 text-[#62605c]">
                    {row.whatsapp || <span className="text-[#8a8780] font-normal italic">-</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination bar */}
        {totalPages > 1 && (
          <nav
            aria-label="CSV contact pages"
            className="p-4 border-t border-[#121316]/08 bg-[#faf8f4] flex flex-wrap items-center justify-between gap-3 text-xs"
          >
            <div className="text-[#62605c] font-medium">
              50 contacts per page • Page <span className="font-bold text-[#121316]">{page}</span> of{' '}
              <span className="font-bold text-[#121316]">{totalPages}</span>
            </div>
            <div className="flex items-center gap-1.5">
              {page > 1 ? (
                <Link
                  className="rounded-full border border-[#121316]/12 bg-white px-3.5 py-1.5 text-xs font-semibold text-[#121316] hover:bg-[#f5f3ef]"
                  href={pageHref(id, page - 1)}
                >
                  Previous
                </Link>
              ) : (
                <span className="rounded-full border border-[#121316]/06 bg-white/50 px-3.5 py-1.5 text-xs font-semibold text-[#8a8780] cursor-not-allowed">
                  Previous
                </span>
              )}
              {visiblePages.map((pageNumber, index) => {
                const previousPage = visiblePages[index - 1]
                const showGap = previousPage !== undefined && pageNumber - previousPage > 1
                return (
                  <span key={pageNumber} className="flex items-center gap-1.5">
                    {showGap ? <span className="text-[#8a8780] px-1">...</span> : null}
                    <Link
                      href={pageHref(id, pageNumber)}
                      className={`min-w-[32px] text-center rounded-full px-3 py-1.5 text-xs font-bold transition-all ${
                        pageNumber === page
                          ? 'bg-[#121316] text-white shadow-xs'
                          : 'bg-white border border-[#121316]/12 text-[#121316] hover:bg-[#f5f3ef]'
                      }`}
                    >
                      {pageNumber}
                    </Link>
                  </span>
                )
              })}
              {page < totalPages ? (
                <Link
                  className="rounded-full border border-[#121316]/12 bg-white px-3.5 py-1.5 text-xs font-semibold text-[#121316] hover:bg-[#f5f3ef]"
                  href={pageHref(id, page + 1)}
                >
                  Next
                </Link>
              ) : (
                <span className="rounded-full border border-[#121316]/06 bg-white/50 px-3.5 py-1.5 text-xs font-semibold text-[#8a8780] cursor-not-allowed">
                  Next
                </span>
              )}
            </div>
          </nav>
        )}
      </div>
    </div>
  )
}
