'use client'

import { useCallback, useDeferredValue, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  Inbox,
  RefreshCw,
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Mail,
  User,
  Clock,
  Reply,
  Trash2,
  Send,
  PenSquare,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  X,
  Flame,
  Check,
  CheckCheck,
} from 'lucide-react'
import type { MailAccountOption, ResponseListItem, ResponseThreadDetail, ResponseThreadMessage } from '@/components/responses/types'

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

const QUICK_REPLY_TEMPLATES = [
  "Hi, thank you for getting back to us! Would you be available for a brief 10-minute discovery call this week?",
  "Thanks for the update. I understand you're not looking for assistance right now—we'll keep in touch down the line.",
  "Thanks for connecting. Let's schedule a time next week to review the roadmap and preferred integrations.",
]

function formatDate(value?: string | null) {
  if (!value) return 'No timestamp'
  try {
    const date = new Date(value)
    return date.toLocaleString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    })
  } catch {
    return String(value)
  }
}

function sanitizeHtml(html: string) {
  if (typeof window === 'undefined') return html
  const doc = new DOMParser().parseFromString(html, 'text/html')
  doc.querySelectorAll('script,style,iframe,object,embed,link,meta,form,input,button,textarea,select,video,audio,source,picture,svg,canvas').forEach((node) => node.remove())
  doc.body.querySelectorAll('*').forEach((node) => {
    for (const attribute of Array.from(node.attributes)) {
      const name = attribute.name.toLowerCase()
      const value = attribute.value.trim()
      const normalizedValue = value.toLowerCase()
      const isUrlAttribute = ['href', 'src', 'srcset', 'poster', 'action', 'formaction'].includes(name)
      const isUnsafeUrl =
        normalizedValue.startsWith('javascript:') ||
        normalizedValue.startsWith('data:') ||
        normalizedValue.startsWith('vbscript:') ||
        /^https?:\/\//i.test(value) ||
        value.startsWith('//')
      const isStyleAttribute = name === 'style'
      if (name.startsWith('on') || (isUrlAttribute && isUnsafeUrl) || isStyleAttribute) {
        node.removeAttribute(attribute.name)
      }
    }
    if (node.tagName.toLowerCase() === 'a') {
      node.setAttribute('rel', 'noreferrer noopener nofollow')
      node.setAttribute('target', '_blank')
    }
  })
  return doc.body.innerHTML
}

function MessageBody({ message }: { message: ResponseThreadMessage }) {
  if (message.bodyHtml) {
    return (
      <div
        className="prose prose-sm max-w-none text-gray-800 leading-relaxed font-sans"
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(message.bodyHtml) }}
      />
    )
  }
  return (
    <div className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800 font-sans">
      {message.bodyText || 'No message content available.'}
    </div>
  )
}

function SentimentBadge({ classification }: { classification: string }) {
  switch (classification) {
    case 'interested':
      return (
        <span className="text-[10px] px-2 py-0.5 rounded-md border border-emerald-300 text-emerald-700 font-bold bg-emerald-50 uppercase tracking-wide">
          INTERESTED
        </span>
      )
    case 'not_interested':
      return (
        <span className="text-[10px] px-2 py-0.5 rounded-md border border-rose-300 text-rose-700 font-bold bg-rose-50 uppercase tracking-wide">
          NOT INTERESTED
        </span>
      )
    case 'needs_review':
      return (
        <span className="text-[10px] px-2 py-0.5 rounded-md border border-amber-300 text-amber-700 font-bold bg-amber-50 uppercase tracking-wide">
          NEEDS REVIEW
        </span>
      )
    case 'automatic':
      return (
        <span className="text-[10px] px-2 py-0.5 rounded-md border border-gray-300 text-gray-600 font-medium bg-gray-50 uppercase tracking-wide">
          AUTOMATIC
        </span>
      )
    default:
      return (
        <span className="text-[10px] px-2 py-0.5 rounded-md border border-gray-200 text-gray-600 font-medium bg-gray-50 uppercase tracking-wide">
          {classification.replace('_', ' ')}
        </span>
      )
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
  const deferredSearch = useDeferredValue(search)
  const [mailAccountId, setMailAccountId] = useState('')
  const [status, setStatus] = useState('')
  const [classification, setClassification] = useState('')
  const [showDetailMobile, setShowDetailMobile] = useState(false)
  const [isClient, setIsClient] = useState(false)

  // Quick Reply State inside continuous thread
  const [replySubject, setReplySubject] = useState('')
  const [replyBody, setReplyBody] = useState('')
  const [sendingReply, setSendingReply] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Compose Modal State
  const [composeOpen, setComposeOpen] = useState(false)
  const [composeMailAccountId, setComposeMailAccountId] = useState('')
  const [composeTo, setComposeTo] = useState('')
  const [composeSubject, setComposeSubject] = useState('')
  const [composeBody, setComposeBody] = useState('')
  const [isSendingCompose, setIsSendingCompose] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(timer)
  }, [toast])

  const loadResponses = useCallback(
    async (options?: { refresh?: boolean }) => {
      setLoadingList(true)
      const params = new URLSearchParams({ page: String(page), limit: String(limit) })
      if (deferredSearch.trim()) params.set('search', deferredSearch.trim())
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
        setSelectedId((current) =>
          data.items?.some((item) => item.id === current) ? current : data.items?.[0]?.id || null
        )
      } catch (err: any) {
        setToast({ type: 'error', message: err.message || 'Failed to load response threads' })
      } finally {
        setLoadingList(false)
      }
    },
    [classification, deferredSearch, limit, mailAccountId, page, status]
  )

  const loadDetail = useCallback(async (id: string) => {
    setLoadingDetail(true)
    try {
      const response = await fetch(`/api/responses/${id}`)
      const data = (await response.json()) as ResponseThreadDetail & { error?: string }
      if (!response.ok) throw new Error(data.error || 'Failed to load response thread')
      setDetail(data)
      const defSubject =
        data.response.subject && /^re:/i.test(data.response.subject)
          ? data.response.subject
          : `Re: ${data.response.subject || ''}`.trim()
      setReplySubject(defSubject)
      setReplyBody(`Hi,\n\nThank you for getting back to us.\n\nBest regards,`)
    } catch (err: any) {
      setToast({ type: 'error', message: err.message || 'Failed to load thread detail' })
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
    setItems((current) => current.map((item) => (item.id === id ? { ...item, unread: false } : item)))
    setShowDetailMobile(true)
  }

  async function handleSendReply() {
    if (!selectedId || !replyBody.trim()) {
      setToast({ type: 'error', message: 'Please type a reply message before sending.' })
      return
    }

    setSendingReply(true)
    try {
      const response = await fetch(`/api/responses/${selectedId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: replySubject,
          html: `<p>${replyBody.replace(/\n/g, '<br/>')}</p>`,
        }),
      })

      const data = (await response.json().catch(() => ({}))) as { error?: string }
      if (!response.ok) throw new Error(data.error || 'Failed to send reply')

      setToast({ type: 'success', message: 'Reply sent successfully!' })
      setReplyBody('')
      await loadDetail(selectedId)
      await loadResponses()
    } catch (err: any) {
      setToast({ type: 'error', message: err.message || 'Failed to send reply' })
    } finally {
      setSendingReply(false)
    }
  }

  async function handleDeleteThread() {
    if (!selectedId) return
    if (!window.confirm('Are you sure you want to delete / archive this response thread?')) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/responses/${selectedId}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to delete thread')

      setToast({ type: 'success', message: 'Thread archived successfully.' })
      const remaining = items.filter((item) => item.id !== selectedId)
      setItems(remaining)
      setSelectedId(remaining[0]?.id || null)
      setDetail(null)
      setShowDetailMobile(false)
      await loadResponses()
    } catch (err: any) {
      setToast({ type: 'error', message: err.message || 'Failed to archive thread' })
    } finally {
      setIsDeleting(false)
    }
  }

  async function handleSendCompose() {
    if (!composeTo.trim() || !composeSubject.trim() || !composeBody.trim()) {
      setToast({ type: 'error', message: 'Please provide recipient, subject, and message.' })
      return
    }
    const accountId = composeMailAccountId || accounts[0]?.id
    if (!accountId) {
      setToast({ type: 'error', message: 'Please select a mail account to send from.' })
      return
    }

    setIsSendingCompose(true)
    try {
      const response = await fetch('/api/send-mail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mailAccountId: accountId,
          recipients: [composeTo.trim()],
          subject: composeSubject.trim(),
          body: composeBody.trim(),
          sendFormat: 'html',
        }),
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message')
      }

      setToast({ type: 'success', message: 'Message queued and sent successfully!' })
      setComposeOpen(false)
      setComposeTo('')
      setComposeSubject('')
      setComposeBody('')
      await loadResponses()
    } catch (err: any) {
      setToast({ type: 'error', message: err.message || 'Failed to send email' })
    } finally {
      setIsSendingCompose(false)
    }
  }

  return (
    <div className="bg-gray-50 text-gray-800 font-sans p-4 sm:p-6 min-h-screen relative flex flex-col">
      <style>{`
        .card-shadow {
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
        }
        /* Minimalist scrollbar */
        ::-webkit-scrollbar {
          width: 6px;
        }
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        ::-webkit-scrollbar-thumb {
          background: #e1e3e4;
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #c3c6d7;
        }
      `}</style>

      {/* Toast Notification */}
      {toast ? (
        <div
          className={`fixed right-6 top-6 z-[120] flex items-center gap-2.5 rounded-xl border px-4 py-3 text-xs font-semibold shadow-lg transition-all duration-300 animate-in fade-in slide-in-from-top-3 ${
            toast.type === 'success'
              ? 'border-emerald-200 bg-white text-emerald-800 shadow-emerald-900/10'
              : 'border-red-200 bg-white text-red-800 shadow-red-900/10'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      ) : null}

      {/* Top Header */}
      <header className="flex flex-wrap items-center justify-between gap-4 mb-6 shrink-0 max-w-[1600px] w-full mx-auto">
        <div>
          <div className="text-xs font-bold text-red-600 tracking-wider uppercase mb-1 flex items-center gap-1.5">
            <Inbox className="h-3.5 w-3.5" />
            <span>Prospect Conversations</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Replies &amp; Lead Sentiment</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Review inbound replies, classify prospect intent, and trigger quick responses.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadResponses({ refresh: true })}
          disabled={loadingList}
          className="flex items-center gap-2 px-4 py-2 border border-gray-200 bg-white rounded-full text-xs sm:text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-xs cursor-pointer active:scale-95 shrink-0"
        >
          <RefreshCw className={`w-4 h-4 text-gray-600 ${loadingList ? 'animate-spin' : ''}`} />
          <span>Refresh Threads</span>
        </button>
      </header>

      {/* BEGIN: MainContainer (2-Pane Workspace) */}
      <main className="flex-1 flex flex-col lg:flex-row gap-6 lg:gap-8 overflow-hidden max-w-[1600px] w-full mx-auto min-h-[calc(100vh-180px)]">
        {/* LEFT PANE: Thread List */}
        <aside
          className={`w-full lg:w-[400px] flex flex-col shrink-0 lg:border-r border-gray-200/80 lg:pr-6 space-y-4 ${
            showDetailMobile ? 'hidden lg:flex' : 'flex'
          }`}
        >
          {/* BEGIN: FilterBar */}
          <section className="space-y-3 shrink-0" data-purpose="filter-bar">
            {/* Search Input */}
            <div className="relative">
              <input
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 placeholder-gray-400 card-shadow"
                placeholder="Search responses..."
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <Search className="h-4 w-4" />
              </div>
              {search ? (
                <button
                  type="button"
                  aria-label="Clear search"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  onClick={() => setSearch('')}
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </div>

            {/* Selects Row */}
            <div className="grid grid-cols-2 gap-2">
              {/* Mailbox Select */}
              <div className="relative">
                <select
                  className="w-full pl-3 pr-8 py-2 bg-white border border-gray-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none text-gray-700 cursor-pointer card-shadow"
                  value={mailAccountId}
                  onChange={(e) => {
                    setMailAccountId(e.target.value)
                    setPage(1)
                  }}
                >
                  <option value="">All mailboxes</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.displayName || acc.email}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                  <ChevronDown className="h-3.5 w-3.5" />
                </div>
              </div>

              {/* Status Select */}
              <div className="relative">
                <select
                  className="w-full pl-3 pr-8 py-2 bg-white border border-gray-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none text-gray-700 cursor-pointer card-shadow"
                  value={status}
                  onChange={(e) => {
                    setStatus(e.target.value)
                    setPage(1)
                  }}
                >
                  <option value="">All statuses</option>
                  <option value="active">Needs reply</option>
                  <option value="replied">Replied</option>
                  <option value="archived">Archived</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                  <ChevronDown className="h-3.5 w-3.5" />
                </div>
              </div>

              {/* Reply Sentiment Classification Select */}
              <div className="relative col-span-2">
                <select
                  className="w-full pl-3 pr-8 py-2 bg-white border border-gray-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none text-gray-700 cursor-pointer card-shadow"
                  value={classification}
                  onChange={(e) => {
                    setClassification(e.target.value)
                    setPage(1)
                  }}
                >
                  <option value="">All sentiment types</option>
                  <option value="interested">Interested</option>
                  <option value="not_interested">Not interested</option>
                  <option value="automatic">Automatic reply</option>
                  <option value="needs_review">Needs review</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                  <ChevronDown className="h-3.5 w-3.5" />
                </div>
              </div>
            </div>
          </section>
          {/* END: FilterBar */}

          {/* BEGIN: EmailList */}
          <section className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[300px]" data-purpose="email-list">
            {loadingList ? (
              <div className="space-y-2.5">
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} className="p-4 rounded-xl bg-white border border-gray-100 animate-pulse space-y-2 card-shadow">
                    <div className="flex justify-between">
                      <div className="h-4 bg-gray-200 rounded w-36" />
                      <div className="h-3 bg-gray-200 rounded w-10" />
                    </div>
                    <div className="h-3 bg-gray-200 rounded w-52" />
                    <div className="h-3 bg-gray-200 rounded w-full" />
                  </div>
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-xl border border-gray-100 card-shadow space-y-2">
                <Inbox className="h-8 w-8 text-gray-300 mx-auto" />
                <h4 className="text-sm font-bold text-gray-800">No response threads</h4>
                <p className="text-xs text-gray-500">No inbound responses match your selected filters.</p>
                {search ? (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="mt-2 inline-flex items-center text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md"
                  >
                    Clear search
                  </button>
                ) : null}
              </div>
            ) : (
              items.map((item) => {
                const isSelected = selectedId === item.id

                return (
                  <article
                    key={item.id}
                    onClick={() => selectResponse(item.id)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50/40 border-blue-300 shadow-xs ring-1 ring-blue-500/20'
                        : 'bg-white border-gray-100 hover:bg-gray-50/80 hover:border-gray-200 card-shadow'
                    }`}
                  >
                    <div className="flex justify-between items-baseline mb-1">
                      <h3 className="text-sm font-bold text-gray-900 truncate pr-2">
                        {item.counterpartEmail || 'Unknown prospect'}
                      </h3>
                      <span
                        className={`text-[10px] font-bold tracking-wide px-1.5 py-0.5 rounded ${
                          item.unread
                            ? 'bg-blue-600 text-white font-bold'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {item.unread ? 'NEW' : 'SEEN'}
                      </span>
                    </div>

                    <h4 className="text-xs sm:text-sm font-medium text-gray-700 truncate mb-1.5">
                      {item.subject || '(No Subject)'}
                    </h4>

                    <p className="text-xs text-gray-500 line-clamp-2 mb-3 leading-relaxed">
                      {item.snippet || 'No preview available for this thread.'}
                    </p>

                    <div className="flex items-center justify-between gap-2 flex-wrap pt-1 border-t border-gray-100">
                      <div className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold font-mono">
                        {formatDate(item.latestRespondedAt)}
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] px-2 py-0.5 rounded-md border border-gray-200 bg-gray-50 text-gray-600 font-medium">
                          {item.status === 'replied' ? 'Replied' : 'Needs reply'}
                        </span>
                        <SentimentBadge classification={item.classification} />
                      </div>
                    </div>
                  </article>
                )
              })
            )}
          </section>
          {/* END: EmailList */}

          {/* Compact Pagination */}
          {total > 0 && (
            <div className="shrink-0 pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
              <div>
                <span>{total}</span> threads
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  aria-label="Previous Page"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                <span className="px-2 font-semibold text-gray-700">
                  {page} / {pages}
                </span>
                <button
                  type="button"
                  aria-label="Next Page"
                  disabled={page >= pages}
                  onClick={() => setPage((p) => Math.min(pages, p + 1))}
                  className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </aside>

        {/* RIGHT PANE: Thread Workspace (Continuous Flow) */}
        <section
          className={`flex-1 flex flex-col h-full overflow-hidden bg-white rounded-2xl border border-gray-100 card-shadow p-5 sm:p-8 ${
            !showDetailMobile ? 'hidden lg:flex' : 'flex'
          }`}
        >
          {loadingDetail ? (
            <div className="flex-1 flex items-center justify-center text-sm text-gray-400">
              <RefreshCw className="h-5 w-5 animate-spin mr-2 text-gray-400" />
              <span>Loading thread conversation...</span>
            </div>
          ) : !detail ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-3">
              <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
                <Mail className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-gray-800">Select a response thread</h3>
              <p className="text-xs text-gray-500 max-w-sm">
                Choose a conversation from the left to review prospect intent, full email history, and send a reply.
              </p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              {/* Thread Header */}
              <header className="pb-5 border-b border-gray-100 shrink-0 flex flex-wrap justify-between items-start gap-4">
                <div>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 mb-2 lg:hidden"
                    onClick={() => setShowDetailMobile(false)}
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    <span>Back to threads</span>
                  </button>

                  <div className="text-[10px] font-bold text-gray-400 tracking-wider uppercase mb-1">
                    THREAD WORKSPACE
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1.5 leading-tight">
                    {detail.response.subject || '(No Subject)'}
                  </h2>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-xs sm:text-sm font-semibold text-gray-700">
                      {detail.response.counterpartEmail || 'Unknown Counterpart'}
                    </span>
                    <SentimentBadge classification={detail.response.classification} />
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => void handleDeleteThread()}
                    disabled={isDeleting}
                    className="px-4 py-2 border border-gray-200 rounded-full text-xs font-semibold hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors text-gray-600 cursor-pointer disabled:opacity-50"
                  >
                    {isDeleting ? 'Archiving...' : 'Delete'}
                  </button>
                </div>
              </header>

              {/* Message Flow */}
              <div className="flex-1 overflow-y-auto py-6 space-y-6 pr-2">
                {detail.thread.length === 0 ? (
                  <div className="p-6 text-sm text-gray-400">No messages found in this thread history.</div>
                ) : (
                  detail.thread.map((message) => {
                    const isOutbound = message.direction === 'outbound'
                    const borderColor = isOutbound
                      ? 'bg-gray-300'
                      : detail.response.classification === 'not_interested'
                      ? 'bg-rose-500'
                      : detail.response.classification === 'interested'
                      ? 'bg-emerald-500'
                      : 'bg-blue-600'

                    return (
                      <div key={`${message.sourceType}-${message.id}`} className="relative pl-5">
                        {/* Subtle left border accent */}
                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${borderColor} rounded-full`} />

                        <div className="flex justify-between items-baseline mb-3 gap-3">
                          <div>
                            <div
                              className={`text-[10px] font-bold tracking-wider uppercase mb-0.5 ${
                                isOutbound ? 'text-gray-400' : 'text-rose-600'
                              }`}
                            >
                              {isOutbound ? 'Outbound' : 'Inbound'}
                            </div>
                            <div className="text-xs sm:text-sm font-bold text-gray-900">
                              {message.fromEmail || message.mailAccount?.email || 'Unknown'} to{' '}
                              {message.toEmail || 'Unknown'}
                            </div>
                            <div className="text-xs text-gray-400 mt-0.5 truncate max-w-xl">
                              {message.subject || '(No Subject)'}
                            </div>
                          </div>
                          <div className="text-xs text-gray-400 font-medium tracking-wide font-mono shrink-0">
                            {formatDate(message.sentAt || message.receivedAt || message.createdAt)}
                          </div>
                        </div>

                        {/* Message Content */}
                        <div className="text-sm text-gray-800 leading-relaxed max-w-3xl bg-gray-50/60 p-4 rounded-xl border border-gray-100">
                          <MessageBody message={message} />
                        </div>

                        {/* Mailbox / Campaign footer */}
                        <div className="mt-2.5 pt-2 border-t border-gray-100 text-[10px] text-gray-400 flex items-center gap-3">
                          {message.mailAccount ? <span>Mailbox: {message.mailAccount.email}</span> : null}
                          {message.campaign ? <span>• Campaign: {message.campaign.name}</span> : null}
                          {message.sequenceStepNumber ? <span>• Step {message.sequenceStepNumber}</span> : null}
                        </div>
                      </div>
                    )
                  })
                )}

                {/* Reply Composer at bottom of continuous thread */}
                <div className="mt-8 pt-6 border-t border-gray-100 space-y-3 bg-gray-50/70 p-5 rounded-2xl border">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                      <Reply className="h-3.5 w-3.5 text-blue-600" />
                      <span>Send a Reply to {detail.response.counterpartEmail || 'Prospect'}</span>
                    </div>
                  </div>

                  {/* Template Chips */}
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_REPLY_TEMPLATES.map((tmpl, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className="text-[11px] bg-white border border-gray-200 text-gray-700 hover:text-blue-600 hover:border-blue-300 px-2.5 py-1 rounded-md transition-colors text-left shadow-2xs cursor-pointer"
                        onClick={() => setReplyBody(tmpl)}
                      >
                        💡 {tmpl.slice(0, 42)}...
                      </button>
                    ))}
                  </div>

                  <input
                    className="w-full h-9 px-3 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={replySubject}
                    onChange={(e) => setReplySubject(e.target.value)}
                    placeholder="Reply Subject"
                  />

                  <textarea
                    className="w-full p-3.5 bg-white border border-gray-200 rounded-lg text-xs text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[110px] leading-relaxed shadow-2xs"
                    value={replyBody}
                    onChange={(e) => setReplyBody(e.target.value)}
                    placeholder="Write your reply to the prospect..."
                  />

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition-colors cursor-pointer"
                      onClick={() => void handleSendReply()}
                      disabled={sendingReply}
                    >
                      <Send className="h-3.5 w-3.5" />
                      <span>{sendingReply ? 'Sending Reply...' : 'Send Reply'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      </main>
      {/* END: MainContainer */}

      {/* Floating Action Button (Compose) */}
      <button
        type="button"
        aria-label="Compose"
        onClick={() => setComposeOpen(true)}
        className="fixed bottom-8 right-8 w-14 h-14 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-105 active:scale-95 cursor-pointer z-40"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          />
        </svg>
      </button>

      {/* Compose Email Modal */}
      {isClient && composeOpen
        ? createPortal(
            <div
              onClick={() => setComposeOpen(false)}
              className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-xs animate-in fade-in duration-200"
            >
              <div
                className="w-full max-w-2xl rounded-2xl border border-gray-100 bg-white p-6 shadow-2xl space-y-4"
                role="dialog"
                aria-modal="true"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center">
                      <PenSquare className="h-4 w-4" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-gray-900">New Message</h2>
                      <p className="text-xs text-gray-500">Send an outreach email directly to a prospect</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600"
                    onClick={() => setComposeOpen(false)}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">From Mail Account</label>
                    <select
                      className="w-full h-9 px-3 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-800 focus:ring-2 focus:ring-blue-500"
                      value={composeMailAccountId}
                      onChange={(e) => setComposeMailAccountId(e.target.value)}
                    >
                      {accounts.map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.displayName || account.email} ({account.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">To (Recipient)</label>
                    <input
                      className="w-full h-9 px-3 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-800 focus:ring-2 focus:ring-blue-500"
                      placeholder="prospect@company.com"
                      value={composeTo}
                      onChange={(e) => setComposeTo(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Subject</label>
                    <input
                      className="w-full h-9 px-3 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-800 focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g. Exploring synergy with your brand"
                      value={composeSubject}
                      onChange={(e) => setComposeSubject(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Message Body</label>
                    <textarea
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-800 focus:ring-2 focus:ring-blue-500 min-h-[160px] leading-relaxed"
                      placeholder="Type your message content..."
                      value={composeBody}
                      onChange={(e) => setComposeBody(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    className="px-4 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-xs font-semibold text-gray-700"
                    onClick={() => setComposeOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition-colors"
                    onClick={() => void handleSendCompose()}
                    disabled={isSendingCompose}
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>{isSendingCompose ? 'Sending...' : 'Send Message'}</span>
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </div>
  )
}
