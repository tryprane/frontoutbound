'use client'

import { useCallback, useEffect, useState } from 'react'
import { Inbox, RefreshCw } from 'lucide-react'
import { ResponsesSidebar } from '@/components/responses/ResponsesSidebar'
import { ResponseThreadView } from '@/components/responses/ResponseThreadView'
import type { MailAccountOption, ResponseListItem, ResponseThreadDetail } from '@/components/responses/types'

type ListPayload = {
  items: ResponseListItem[]
  total: number
  page: number
  pages: number
  limit: number
  filters: {
    accounts: MailAccountOption[]
  }
}

export default function ResponsesPage() {
  const [items, setItems] = useState<ResponseListItem[]>([])
  const [accounts, setAccounts] = useState<MailAccountOption[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detail, setDetail] = useState<ResponseThreadDetail | null>(null)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [limit, setLimit] = useState(20)
  const [total, setTotal] = useState(0)
  const [loadingList, setLoadingList] = useState(true)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [search, setSearch] = useState('')
  const [mailAccountId, setMailAccountId] = useState('')
  const [status, setStatus] = useState('')
  const [classification, setClassification] = useState('')
  const [showDetailMobile, setShowDetailMobile] = useState(false)

  const loadResponses = useCallback(async (options?: { refresh?: boolean }) => {
    setLoadingList(true)
    const params = new URLSearchParams({ page: String(page), limit: String(limit) })
    if (search.trim()) params.set('search', search.trim())
    if (mailAccountId) params.set('mailAccountId', mailAccountId)
    if (status) params.set('status', status)
    if (classification) params.set('classification', classification)
    if (options?.refresh) params.set('refresh', '1')

    try {
      const response = await fetch(`/api/responses?${params.toString()}`)
      const data = (await response.json()) as ListPayload & { error?: string }
      if (!response.ok) throw new Error(data.error || 'Failed to load responses')

      setItems(data.items || [])
      setAccounts(data.filters?.accounts || [])
      setTotal(data.total || 0)
      setPage(data.page || 1)
      setPages(data.pages || 1)
      setLimit(data.limit || 20)
      setSelectedId((current) => data.items?.some((item) => item.id === current) ? current : data.items?.[0]?.id || null)
    } finally {
      setLoadingList(false)
    }
  }, [classification, limit, mailAccountId, page, search, status])

  const loadDetail = useCallback(async (id: string) => {
    setLoadingDetail(true)
    try {
      const response = await fetch(`/api/responses/${id}`)
      const data = (await response.json()) as ResponseThreadDetail & { error?: string }
      if (!response.ok) throw new Error(data.error || 'Failed to load response thread')
      setDetail(data)
    } finally {
      setLoadingDetail(false)
    }
  }, [])

  useEffect(() => {
    void loadResponses().catch(() => setLoadingList(false))
  }, [loadResponses])

  useEffect(() => {
    if (!selectedId) {
      setDetail(null)
      return
    }
    void loadDetail(selectedId).catch(() => setLoadingDetail(false))
  }, [loadDetail, selectedId])

  function selectResponse(id: string) {
    setSelectedId(id)
    setItems((current) => current.map((item) => item.id === id ? { ...item, unread: false } : item))
    setShowDetailMobile(true)
  }

  function resetPageAnd(setter: (value: string) => void, value: string) {
    setter(value)
    setPage(1)
    setSelectedId(null)
    setDetail(null)
  }

  function handleDeleted() {
    const remaining = items.filter((item) => item.id !== selectedId)
    setItems(remaining)
    setSelectedId(remaining[0]?.id || null)
    setDetail(null)
    setShowDetailMobile(false)
    void loadResponses()
  }

  function handleReplied() {
    void loadResponses()
    if (selectedId) void loadDetail(selectedId)
  }

  return (
    <div className="animate-fade-in space-y-6">
      {/* Top Floating Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#121316] bg-white/90 backdrop-blur-md px-3.5 py-2 rounded-full border border-[#121316]/08 shadow-sm">
            <Inbox className="h-3.5 w-3.5 text-[#ee382b]" />
            <span>Replies & Lead Sentiment</span>
          </span>
        </div>

        <div className="flex items-center gap-2.5 ml-auto">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-full border border-[#121316]/10 bg-white/90 backdrop-blur-md px-4 sm:px-5 py-2 text-xs sm:text-sm font-semibold text-[#121316] shadow-sm transition-all hover:bg-white hover:shadow-md active:scale-95 shrink-0 cursor-pointer"
            onClick={() => void loadResponses({ refresh: true })}
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh Threads</span>
          </button>
        </div>
      </div>

      <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(300px,400px)_minmax(0,1fr)]">
        <div className={showDetailMobile ? 'hidden lg:block' : 'block'}>
          <ResponsesSidebar
            items={items}
            accounts={accounts}
            selectedId={selectedId}
            loading={loadingList}
            search={search}
            mailAccountId={mailAccountId}
            status={status}
            classification={classification}
            page={page}
            pages={pages}
            total={total}
            limit={limit}
            onSearchChange={(value) => resetPageAnd(setSearch, value)}
            onMailAccountChange={(value: string) => resetPageAnd(setMailAccountId, value)}
            onStatusChange={(value) => resetPageAnd(setStatus, value)}
            onClassificationChange={(value) => resetPageAnd(setClassification, value)}
            onSelect={selectResponse}
            onPageChange={setPage}
            onLimitChange={(value) => {
              setLimit(value)
              setPage(1)
            }}
          />
        </div>
        <div className={!showDetailMobile ? 'hidden lg:block' : 'block'}>
          <ResponseThreadView
            detail={detail}
            loading={loadingDetail}
            onBack={() => setShowDetailMobile(false)}
            onDeleted={handleDeleted}
            onReplied={handleReplied}
          />
        </div>
      </div>
    </div>
  )
}
