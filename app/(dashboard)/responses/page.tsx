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
      {/* Header Card */}
      <header className="uneevo-card p-6 md:p-7 flex flex-col md:flex-row md:items-center justify-between gap-5 shadow-[0_10px_30px_rgba(0,0,0,0.03)]">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] bg-[#121316] text-white shadow-xs">
            <Inbox className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs font-bold tracking-widest text-[#ee382b] uppercase block mb-1">
              PROSPECT CONVERSATIONS
            </span>
            <h1 className="zoho-puvi-headline text-2xl sm:text-3xl font-bold tracking-tight text-[#121316]">
              Replies & Lead Sentiment
            </h1>
            <p className="text-xs sm:text-sm text-[#62605c] mt-0.5">
              Review inbound replies, classify prospect intent, and trigger quick responses from originating mailboxes.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            className="inline-flex items-center gap-1.5 rounded-full border border-[#121316]/12 bg-white px-5 py-2.5 text-xs sm:text-sm font-semibold text-[#121316] transition-all hover:bg-[#faf8f4] hover:shadow-xs shrink-0"
            onClick={() => void loadResponses({ refresh: true })}
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh Threads</span>
          </button>
        </div>
      </header>

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
