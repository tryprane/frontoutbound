'use client'

import { useMemo } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { FileSpreadsheet, Plus, ArrowLeft, ExternalLink, SlidersHorizontal, Layers } from 'lucide-react'
import { describeColumnMapping, type ColumnMapping } from '@/lib/csv-parser/column-detector'
import { useApiResource } from '@/lib/hooks'
import type { CsvDetail } from '@/lib/types'

const PAGE_SIZE = 50

function pageHref(id: string, page: number) {
  return `/csv/${encodeURIComponent(id)}?page=${page}`
}

function getRowValue(row: any, col: { key: string; field?: string }) {
  if (row.rawData && typeof row.rawData === 'object') {
    const rawVal = row.rawData[col.key] ?? row.rawData[col.key.trim()]
    if (rawVal !== undefined && rawVal !== null && String(rawVal).trim() !== '') {
      return String(rawVal).trim()
    }
  }
  if (col.field) {
    const std = row[col.field]
    if (std !== undefined && std !== null && String(std).trim() !== '') {
      return String(std).trim()
    }
  }
  const fallback = row[col.key]
  if (fallback !== undefined && fallback !== null && String(fallback).trim() !== '') {
    return String(fallback).trim()
  }
  return null
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

  const csvFile = useMemo(() => {
    if (!data) return { originalName: '', rows: [], _count: { campaigns: 0 } }
    return {
      originalName: data.csvFile.originalName,
      rows: data.rows || [],
      _count: { campaigns: data.csvFile.campaignCount },
    }
  }, [data])

  const totalRows = data?.stats?.totalRows || 0
  const rowsWithEmail = data?.stats?.rowsWithEmail || 0
  const rowsWithPhone = data?.stats?.rowsWithPhone || 0
  const emailPct = data?.stats?.emailPct || 0
  const phonePct = data?.stats?.phonePct || 0

  const page = data?.pagination?.page || 1
  const totalPages = data?.pagination?.totalPages || 1
  const pageStart = data?.pagination?.pageStart || 0
  const pageEnd = data?.pagination?.pageEnd || 0

  const columnMap = (data?.columnMap || {}) as ColumnMapping

  // Dynamically compute all columns to show in table based on mapped bindings + CSV headers
  const displayColumns = useMemo(() => {
    const cols: Array<{
      key: string
      label: string
      type: string
      field?: string
      bindingText: string
    }> = []

    const addedKeys = new Set<string>()

    // 1. From mappedColumns if returned by API
    if (Array.isArray(data?.mappedColumns) && data.mappedColumns.length > 0) {
      data.mappedColumns.forEach((mc) => {
        if (!addedKeys.has(mc.column)) {
          addedKeys.add(mc.column)
          const entry = columnMap[mc.column]
          cols.push({
            key: mc.column,
            label: mc.column,
            type: mc.type || entry?.type || 'custom',
            field: entry?.field,
            bindingText: mc.label || describeColumnMapping(entry || { type: 'custom' }, mc.column),
          })
        }
      })
    } else {
      // 2. From columnMap non-ignored entries
      Object.entries(columnMap || {}).forEach(([header, entry]) => {
        if (entry.type !== 'ignore' && !addedKeys.has(header)) {
          addedKeys.add(header)
          cols.push({
            key: header,
            label: header,
            type: entry.type,
            field: entry.field,
            bindingText: describeColumnMapping(entry, header),
          })
        }
      })
    }

    // 3. From first row's rawData keys if any were missed
    if (csvFile.rows && csvFile.rows.length > 0) {
      const firstRowData = csvFile.rows[0]?.rawData || {}
      Object.keys(firstRowData).forEach((key) => {
        const mapping = columnMap[key]
        if (!mapping || mapping.type !== 'ignore') {
          if (!addedKeys.has(key)) {
            addedKeys.add(key)
            cols.push({
              key,
              label: key,
              type: 'custom',
              bindingText: `Custom: ${key}`,
            })
          }
        }
      })
    }

    // Fallback if no columns found
    if (cols.length === 0) {
      cols.push(
        { key: 'email', label: 'email', type: 'predefined', field: 'email', bindingText: 'Email' },
        { key: 'name', label: 'name', type: 'predefined', field: 'name', bindingText: 'Prospect Name' }
      )
    }

    return cols
  }, [columnMap, data?.mappedColumns, csvFile.rows])

  const visiblePages = useMemo(() => {
    return Array.from({ length: totalPages }, (_, index) => index + 1).filter((pageNumber) => {
      if (totalPages <= 7) return true
      if (pageNumber === 1 || pageNumber === totalPages) return true
      return Math.abs(pageNumber - page) <= 1
    })
  }, [totalPages, page])

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

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Floating Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-2.5">
          <Link
            href="/csv"
            className="inline-flex items-center gap-1.5 rounded-full border border-[#121316]/10 bg-white/90 backdrop-blur-md px-4 py-2 text-xs font-semibold text-[#121316] shadow-sm transition-all hover:bg-white hover:shadow-md active:scale-95"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to CSV files</span>
          </Link>
          <span className="text-xs font-bold text-[#121316] truncate max-w-xs sm:max-w-md">
            {csvFile.originalName}
          </span>
        </div>

        <div className="flex items-center gap-2.5 ml-auto">
          <Link
            href={`/campaigns/new?csvId=${id}`}
            className="inline-flex items-center gap-2 rounded-full bg-[#ee382b] px-5 sm:px-6 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-[0_4px_16px_rgba(238,56,43,0.28)] transition-all hover:bg-[#d92b1f] hover:shadow-[0_8px_24px_rgba(238,56,43,0.38)] active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>Use in Campaign</span>
          </Link>
        </div>
      </div>

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

      {/* Data Rows Table with Lining Partition & Dynamic Columns */}
      <div className="uneevo-card overflow-hidden rounded-[24px] border border-[#121316]/12 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.03)]">
        <div className="p-4 sm:p-5 border-b border-[#121316]/12 bg-[#faf8f4] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-[#ee382b]" />
            <span className="text-sm font-bold text-[#121316]">
              Lead Records
            </span>
            <span className="font-normal font-mono text-xs text-[#62605c]">
              (showing {pageStart.toLocaleString()}–{pageEnd.toLocaleString()} of {totalRows.toLocaleString()})
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-[#8a8780] uppercase tracking-wider">
              {displayColumns.length} Mapped Column{displayColumns.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <thead>
              <tr className="bg-[#faf8f4] text-[#121316] border-b border-[#121316]/15">
                <th className="px-4 py-3.5 w-14 text-center font-mono text-[11px] font-bold text-[#8a8780] border-r border-[#121316]/12">
                  #
                </th>
                {displayColumns.map((col, index) => (
                  <th
                    key={col.key}
                    className={`px-4 sm:px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider whitespace-nowrap ${
                      index < displayColumns.length - 1 ? 'border-r border-[#121316]/12' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span>{col.label}</span>
                      <span className="text-[10px] font-mono font-normal normal-case text-[#8a8780] bg-white px-2 py-0.5 rounded-md border border-[#121316]/10">
                        {col.bindingText}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#121316]/10 font-sans text-xs">
              {csvFile.rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={displayColumns.length + 1}
                    className="px-6 py-12 text-center text-xs text-[#8a8780] italic"
                  >
                    No lead records found in this dataset.
                  </td>
                </tr>
              ) : (
                csvFile.rows.map((row: any) => (
                  <tr
                    key={row.id}
                    className="border-b border-[#121316]/10 last:border-b-0 odd:bg-white even:bg-[#faf8f4]/40 hover:bg-[#ee382b]/05 transition-colors"
                  >
                    {/* Index Partition */}
                    <td className="px-4 py-3.5 text-center font-mono font-bold text-[#8a8780] bg-[#faf8f4]/60 border-r border-[#121316]/10 whitespace-nowrap">
                      {row.rowIndex + 1}
                    </td>

                    {/* Dynamic Mapped Columns Partition */}
                    {displayColumns.map((col, colIdx) => {
                      const val = getRowValue(row, col)
                      const isWebsite =
                        col.field === 'website' ||
                        (val && (val.startsWith('http://') || val.startsWith('https://') || val.startsWith('www.')))
                      const isEmail = col.field === 'email' || (val && val.includes('@'))

                      return (
                        <td
                          key={col.key}
                          className={`px-4 sm:px-5 py-3.5 text-xs align-top ${
                            colIdx < displayColumns.length - 1 ? 'border-r border-[#121316]/10' : ''
                          }`}
                        >
                          {val === null ? (
                            <span className="text-[#8a8780] font-normal italic">-</span>
                          ) : isWebsite ? (
                            <a
                              href={val.startsWith('http') ? val : `https://${val}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 font-semibold text-[#0f8a5f] hover:underline"
                            >
                              <span className="truncate max-w-xs">{val}</span>
                              <ExternalLink className="h-3 w-3 shrink-0" />
                            </a>
                          ) : isEmail ? (
                            <span className="font-mono font-semibold text-[#121316] select-all">
                              {val}
                            </span>
                          ) : (
                            <span className="font-medium text-[#121316] leading-relaxed break-words max-w-md block">
                              {val}
                            </span>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination bar */}
        {totalPages > 1 && (
          <nav
            aria-label="CSV contact pages"
            className="p-4 border-t border-[#121316]/12 bg-[#faf8f4] flex flex-wrap items-center justify-between gap-3 text-xs"
          >
            <div className="text-[#62605c] font-medium">
              50 contacts per page • Page <span className="font-bold text-[#121316]">{page}</span> of{' '}
              <span className="font-bold text-[#121316]">{totalPages}</span>
            </div>
            <div className="flex items-center gap-1.5">
              {page > 1 ? (
                <Link
                  className="rounded-full border border-[#121316]/12 bg-white px-3.5 py-1.5 text-xs font-semibold text-[#121316] hover:bg-[#f5f3ef] shadow-2xs"
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
                      className={`min-w-[32px] text-center rounded-full px-3 py-1.5 text-xs font-bold transition-all shadow-2xs ${
                        pageNumber === page
                          ? 'bg-[#121316] text-white'
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
                  className="rounded-full border border-[#121316]/12 bg-white px-3.5 py-1.5 text-xs font-semibold text-[#121316] hover:bg-[#f5f3ef] shadow-2xs"
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
