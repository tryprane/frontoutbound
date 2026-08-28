'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { createPortal } from 'react-dom'
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Download,
  Eye,
  Mail,
  MessageSquare,
  RefreshCw,
  Search,
  Send,
  X,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import { StatusBadge } from '@/components/shared/StatusBadge'

interface MailLog {
  id: string
  campaign: { id: string; name: string } | null
  apiDispatchRequest?: { id: string; apiKey: { name: string } } | null
  mailAccount: { id: string; email: string; displayName: string }
  toEmail: string
  subject: string
  status: 'sent' | 'failed' | 'bounced'
  sentAt: string
  openedAt: string | null
  lastOpenedAt: string | null
  openCount: number
  repliedAt: string | null
  replyCount: number
  complaintCount: number
  complainedAt: string | null
  errorMessage: string | null
  openStatus?: 'opened' | 'unopened' | 'No tracking'
  trackingStatus?: 'tracked' | 'no_tracking'
  sendFormat?: 'html' | 'text_only'
}

interface ReplyMessage {
  id: string
  fromEmail: string | null
  subject: string | null
  snippet: string | null
  sentAt: string | null
  receivedAt: string | null
  createdAt: string
}

interface ReplyModalState {
  sentMailId: string
  recipient: string
  subject: string
  replyCount: number
  repliedAt: string | null
  replies: ReplyMessage[]
}

interface MessageModalState {
  sentMailId: string
  recipient: string
  subject: string
  sentAt: string
  sendFormat?: 'html' | 'text_only'
  html: string | null
  text: string | null
}

type SentFilterAccount = {
  id: string
  email: string
  displayName: string
  dailyLimit: number
  sentToday: number
  isActive: boolean
  warmupStatus: 'COLD' | 'WARMING' | 'WARMED' | 'PAUSED'
  mailboxSyncStatus: 'idle' | 'syncing' | 'error'
}

type SentProgressAccount = SentFilterAccount & {
  mailboxHealthScore: number
  mailboxHealthStatus: string
}

interface CampaignsAndAccounts {
  campaigns: { id: string; name: string; channel: 'EMAIL' | 'WHATSAPP' }[]
  accounts: SentFilterAccount[]
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function isNoTracking(log: MailLog) {
  return log.trackingStatus === 'no_tracking' || log.openStatus === 'No tracking'
}

export default function GlobalSentMailPage() {
  const [logs, setLogs] = useState<MailLog[]>([])
  const [counts, setCounts] = useState({
    sent: 0,
    failed: 0,
    bounced: 0,
    complaints: 0,
    opened: 0,
    unopened: 0,
    openRate: 0,
    replied: 0,
    unreplied: 0,
    replyRate: 0,
  })
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)
  const [limit, setLimit] = useState(50)

  const [loading, setLoading] = useState(true)
  const [isClient, setIsClient] = useState(false)
  const [replyModal, setReplyModal] = useState<ReplyModalState | null>(null)
  const [replyLoadingId, setReplyLoadingId] = useState<string | null>(null)
  const [replyError, setReplyError] = useState<string | null>(null)
  const [messageModal, setMessageModal] = useState<MessageModalState | null>(null)
  const [messageLoadingId, setMessageLoadingId] = useState<string | null>(null)
  const [messageError, setMessageError] = useState<string | null>(null)
  const [accountProgressExpanded, setAccountProgressExpanded] = useState(false)
  const [accountProgressLoading, setAccountProgressLoading] = useState(false)
  const [accountProgressLoaded, setAccountProgressLoaded] = useState(false)
  const [accountProgressError, setAccountProgressError] = useState<string | null>(null)
  const [accountProgressAccounts, setAccountProgressAccounts] = useState<SentProgressAccount[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState({
    campaignId: '',
    mailAccountId: '',
    status: '',
    from: '',
    to: '',
    page: 1,
  })

  // Dropdowns for filters
  const [options, setOptions] = useState<CampaignsAndAccounts>({ campaigns: [], accounts: [] })
  const selectedAccount = useMemo(
    () => options.accounts.find((account) => account.id === filters.mailAccountId) || null,
    [filters.mailAccountId, options.accounts]
  )

  const visibleLogCount = logs.length

  function formatAccountOptionLabel(account: CampaignsAndAccounts['accounts'][number]) {
    const activity = account.isActive ? account.warmupStatus : 'INACTIVE'
    return `${account.email} - ${account.sentToday}/${account.dailyLimit} - ${activity}`
  }

  function formatReplyTimestamp(message: ReplyMessage) {
    return formatDate(message.receivedAt || message.sentAt || message.createdAt)
  }

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    // Fetch dropdown options once
    Promise.all([
      fetch('/api/campaigns?page=1&limit=100').then((r) => r.json()),
      fetch('/api/mail-accounts?resource=sent-filter-options&page=1&limit=100').then((r) => r.json()),
    ]).then(([camps, accs]) => {
      setOptions({
        campaigns: Array.isArray(camps?.items)
          ? camps.items
              .filter((c: any) => c.channel === 'EMAIL')
              .map((c: any) => ({ id: c.id, name: c.name, channel: c.channel }))
          : [],
        accounts: Array.isArray(accs?.items) ? accs.items : [],
      })
    })
  }, [])

  const fetchAccountProgress = async () => {
    setAccountProgressLoading(true)
    setAccountProgressError(null)

    try {
      const response = await fetch('/api/mail-accounts?resource=sent-progress&page=1&limit=100')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data?.error || 'Failed to load account progress')
      }

      setAccountProgressAccounts(Array.isArray(data?.items) ? data.items : [])
      setAccountProgressLoaded(true)
    } catch (error) {
      setAccountProgressError(error instanceof Error ? error.message : 'Failed to load account progress')
    } finally {
      setAccountProgressLoading(false)
    }
  }

  const handleToggleAccountProgress = () => {
    setAccountProgressExpanded((current) => {
      const next = !current
      if (next && !accountProgressLoaded && !accountProgressLoading) {
        void fetchAccountProgress()
      }
      return next
    })
  }

  const fetchLogs = () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filters.campaignId) params.append('campaignId', filters.campaignId)
    if (filters.mailAccountId) params.append('mailAccountId', filters.mailAccountId)
    if (filters.status) params.append('status', filters.status)
    if (filters.from) params.append('from', filters.from)
    if (filters.to) params.append('to', filters.to)
    params.append('channel', 'email')
    params.append('page', filters.page.toString())
    params.append('limit', limit.toString())

    fetch(`/api/sent?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        setLogs(data.logs || [])
        setCounts(
          data.counts || {
            sent: 0,
            failed: 0,
            bounced: 0,
            complaints: 0,
            opened: 0,
            unopened: 0,
            openRate: 0,
            replied: 0,
            unreplied: 0,
            replyRate: 0,
          }
        )
        setTotal(data.total || 0)
        setPages(data.pages || 1)
        setLimit(data.limit || limit)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    fetchLogs()
  }, [filters, limit]) // eslint-disable-line

  const handleLogAction = async (
    sentMailId: string,
    action: 'mark-bounced' | 'mark-complaint' | 'clear-complaint-log'
  ) => {
    const res = await fetch('/api/sent', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sentMailId, action }),
    })
    if (!res.ok) {
      return
    }
    fetchLogs()
  }

  const handleExport = () => {
    const params = new URLSearchParams()
    if (filters.campaignId) params.append('campaignId', filters.campaignId)
    if (filters.mailAccountId) params.append('mailAccountId', filters.mailAccountId)
    if (filters.status) params.append('status', filters.status)
    if (filters.from) params.append('from', filters.from)
    if (filters.to) params.append('to', filters.to)
    params.append('channel', 'email')
    params.append('export', 'csv')
    window.open(`/api/sent?${params.toString()}`)
  }

  const handleOpenReplyModal = async (log: MailLog) => {
    setReplyError(null)
    setReplyLoadingId(log.id)

    try {
      const res = await fetch(`/api/sent/${log.id}/reply`)
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.error || 'Failed to load reply details')
      }

      setReplyModal({
        sentMailId: log.id,
        recipient: log.toEmail,
        subject: log.subject.replace(/^Subject:\s*/i, ''),
        replyCount: data.replyCount || 0,
        repliedAt: data.repliedAt || null,
        replies: Array.isArray(data.replies) ? data.replies : [],
      })
    } catch (error) {
      setReplyError(error instanceof Error ? error.message : 'Failed to load reply details')
    } finally {
      setReplyLoadingId(null)
    }
  }

  const handleOpenMessageModal = async (log: MailLog) => {
    setMessageError(null)
    setMessageLoadingId(log.id)

    try {
      const res = await fetch(`/api/sent/${log.id}/message`)
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.error || 'Failed to load sent message')
      }

      setMessageModal({
        sentMailId: log.id,
        recipient: data.toEmail || log.toEmail,
        subject: (data.subject || log.subject).replace(/^Subject:\s*/i, ''),
        sentAt: data.sentAt || log.sentAt,
        sendFormat: data.sendFormat === 'text_only' ? 'text_only' : 'html',
        html: data.html || null,
        text: data.text || null,
      })
    } catch (error) {
      setMessageError(error instanceof Error ? error.message : 'Failed to load sent message')
    } finally {
      setMessageLoadingId(null)
    }
  }

  useEffect(() => {
    if (!replyModal && !messageModal) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setReplyModal(null)
        setMessageModal(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [messageModal, replyModal])

  const filteredLogs = useMemo(() => {
    if (!searchQuery.trim()) return logs
    const q = searchQuery.toLowerCase()
    return logs.filter(
      (log) =>
        log.toEmail.toLowerCase().includes(q) ||
        log.subject.toLowerCase().includes(q) ||
        log.mailAccount.email.toLowerCase().includes(q) ||
        (log.campaign?.name || '').toLowerCase().includes(q)
    )
  }, [logs, searchQuery])

  return (
    <div className="space-y-4 animate-fade-in pb-10">
      {/* Top Floating Status & Action Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white/90 backdrop-blur-md rounded-full border border-[#121316]/08 shadow-sm">
            <Send className="h-3.5 w-3.5 text-[#ee382b]" />
            <span className="text-xs font-semibold text-[#121316]">
              {total.toLocaleString()} Dispatches
            </span>
          </div>
          <div className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white/90 backdrop-blur-md rounded-full border border-[#0f8a5f]/20 shadow-sm">
            <span className="flex h-2 w-2 rounded-full bg-[#0f8a5f]" />
            <span className="text-xs font-semibold text-[#121316]">
              {counts.sent.toLocaleString()} Delivered
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          {/* Quick Search */}
          <div className="relative w-full sm:w-56 shrink-0">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8a8780]" />
            <input
              type="text"
              placeholder="Search recipient / subject..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-1.5 bg-white/90 backdrop-blur-md border border-[#121316]/10 rounded-full text-xs text-[#121316] placeholder-[#8a8780] focus:outline-none focus:ring-1 focus:ring-[#ee382b] focus:border-[#ee382b] transition-all shadow-sm"
            />
          </div>

          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-[#121316]/10 bg-white/90 backdrop-blur-md text-xs font-semibold text-[#121316] shadow-sm hover:bg-white hover:shadow-md active:scale-95 transition cursor-pointer shrink-0"
            onClick={handleExport}
          >
            <Download className="h-3.5 w-3.5 text-[#8a8780]" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="uneevo-card p-4 sm:p-5 rounded-2xl border border-[#121316]/10 bg-white shadow-2xs">
          <div className="font-mono text-xl sm:text-2xl font-bold text-[#121316] tabular-nums">
            {total.toLocaleString()}
          </div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#8a8780] mt-1">Total Logs</div>
        </div>
        <div className="uneevo-card p-4 sm:p-5 rounded-2xl border border-[#121316]/10 bg-white shadow-2xs">
          <div className="font-mono text-xl sm:text-2xl font-bold text-[#0f8a5f] tabular-nums">
            {counts.sent.toLocaleString()}
          </div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#0f8a5f] mt-1">Sent</div>
        </div>
        <div className="uneevo-card p-4 sm:p-5 rounded-2xl border border-[#121316]/10 bg-white shadow-2xs">
          <div className="font-mono text-xl sm:text-2xl font-bold text-[#ee382b] tabular-nums">
            {counts.failed.toLocaleString()}
          </div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#ee382b] mt-1">Failed</div>
        </div>
        <div className="uneevo-card p-4 sm:p-5 rounded-2xl border border-[#121316]/10 bg-white shadow-2xs">
          <div className="font-mono text-xl sm:text-2xl font-bold text-[#d97706] tabular-nums">
            {counts.bounced.toLocaleString()}
          </div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#d97706] mt-1">Bounced</div>
        </div>
        <div className="uneevo-card p-4 sm:p-5 rounded-2xl border border-[#121316]/10 bg-white shadow-2xs">
          <div className="font-mono text-xl sm:text-2xl font-bold text-[#c2414c] tabular-nums">
            {counts.complaints.toLocaleString()}
          </div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#c2414c] mt-1">Complaints</div>
        </div>
        <div className="uneevo-card p-4 sm:p-5 rounded-2xl border border-[#121316]/10 bg-white shadow-2xs">
          <div className="font-mono text-xl sm:text-2xl font-bold text-[#121316] tabular-nums">
            {counts.replied.toLocaleString()}
          </div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#121316] mt-1">Replied</div>
        </div>
      </div>

      {/* Engagement Rates Banner */}
      <div className="uneevo-card p-4 sm:p-5 rounded-2xl border border-[#121316]/10 bg-white shadow-2xs space-y-3">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          <div className="p-3 rounded-xl bg-[#faf8f4] border border-[#121316]/06 text-center">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#62605c] mb-0.5">Opened</div>
            <div className="font-mono text-lg sm:text-xl font-bold text-[#0f8a5f] tabular-nums">
              {counts.opened.toLocaleString()}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-[#faf8f4] border border-[#121316]/06 text-center">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#62605c] mb-0.5">Unopened</div>
            <div className="font-mono text-lg sm:text-xl font-bold text-[#62605c] tabular-nums">
              {counts.unopened.toLocaleString()}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-[#faf8f4] border border-[#121316]/06 text-center">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#62605c] mb-0.5">Open rate</div>
            <div className="font-mono text-lg sm:text-xl font-bold text-[#ee382b] tabular-nums">{counts.openRate}%</div>
          </div>
          <div className="p-3 rounded-xl bg-[#faf8f4] border border-[#121316]/06 text-center">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#62605c] mb-0.5">Awaiting reply</div>
            <div className="font-mono text-lg sm:text-xl font-bold text-[#62605c] tabular-nums">
              {counts.unreplied.toLocaleString()}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-[#faf8f4] border border-[#121316]/06 text-center">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#62605c] mb-0.5">Reply rate</div>
            <div className="font-mono text-lg sm:text-xl font-bold text-[#0f8a5f] tabular-nums">
              {counts.replyRate}%
            </div>
          </div>
        </div>
      </div>

      {/* Sender Pool Utilization Collapsible */}
      <div className="uneevo-card rounded-2xl border border-[#121316]/10 bg-white shadow-2xs overflow-hidden">
        <button
          type="button"
          onClick={handleToggleAccountProgress}
          className="w-full flex items-center justify-between gap-4 px-5 py-3.5 bg-transparent border-0 cursor-pointer text-left hover:bg-[#faf8f4]/60 transition-colors"
          aria-expanded={accountProgressExpanded}
        >
          <div>
            <div className="text-xs sm:text-sm font-bold text-[#121316]">
              Sender Pool Quota & Utilization Progress
            </div>
            <div className="text-[11px] text-[#62605c] mt-0.5">
              Inspect mailbox quotas, warmup stages, and remaining daily limits.
            </div>
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#faf8f4] border border-[#121316]/08 text-[#121316] shrink-0">
            <ChevronDown
              size={16}
              style={{
                transform: accountProgressExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease',
              }}
            />
          </div>
        </button>

        {accountProgressExpanded ? (
          <div className="px-5 pb-5 pt-2 border-t border-[#121316]/08">
            {accountProgressLoading ? (
              <div className="py-4 text-xs font-mono text-[#8a8780] text-center">
                Loading sender account progress...
              </div>
            ) : accountProgressError ? (
              <div className="py-4 text-xs text-[#c2414c] text-center">{accountProgressError}</div>
            ) : accountProgressAccounts.length === 0 ? (
              <div className="py-4 text-xs text-[#8a8780] text-center">No sender accounts available yet.</div>
            ) : (
              <div className="space-y-2 pt-2">
                {accountProgressAccounts.map((account) => {
                  const progress = Math.min(100, ((account.sentToday || 0) / (account.dailyLimit || 1)) * 100)
                  const isNearLimit = progress >= 90

                  return (
                    <div
                      key={account.id}
                      className="flex items-center gap-4 p-3 rounded-xl bg-[#faf8f4] border border-[#121316]/06"
                    >
                      <div className="w-52 font-bold text-xs text-[#121316] truncate">{account.email}</div>
                      <div className="flex-1">
                        <div className="h-2 w-full bg-[#121316]/08 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              isNearLimit ? 'bg-[#d97706]' : 'bg-[#ee382b]'
                            }`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                      <div className="w-24 font-mono text-xs text-[#62605c] text-right font-bold tabular-nums">
                        {account.sentToday || 0} / {account.dailyLimit || 0}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        ) : null}
      </div>

      {/* Filters Bar */}
      <div className="uneevo-card p-4 rounded-2xl border border-[#121316]/10 bg-white shadow-2xs flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[160px]">
          <label className="text-[10px] font-bold uppercase tracking-wider text-[#8a8780] mb-1 block">
            Campaign
          </label>
          <select
            value={filters.campaignId}
            onChange={(e) => setFilters((f) => ({ ...f, campaignId: e.target.value, page: 1 }))}
            className="w-full rounded-xl border border-[#121316]/12 bg-[#faf8f4] px-3 py-1.5 text-xs text-[#121316] font-medium"
          >
            <option value="">All Campaigns</option>
            {options.campaigns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1 min-w-[160px]">
          <label className="text-[10px] font-bold uppercase tracking-wider text-[#8a8780] mb-1 block">
            Sender Mailbox
          </label>
          <select
            value={filters.mailAccountId}
            onChange={(e) => setFilters((f) => ({ ...f, mailAccountId: e.target.value, page: 1 }))}
            className="w-full rounded-xl border border-[#121316]/12 bg-[#faf8f4] px-3 py-1.5 text-xs text-[#121316] font-medium"
          >
            <option value="">All Mailboxes</option>
            {options.accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {formatAccountOptionLabel(a)}
              </option>
            ))}
          </select>
        </div>

        <div className="w-32">
          <label className="text-[10px] font-bold uppercase tracking-wider text-[#8a8780] mb-1 block">
            Status
          </label>
          <select
            value={filters.status}
            onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value, page: 1 }))}
            className="w-full rounded-xl border border-[#121316]/12 bg-[#faf8f4] px-3 py-1.5 text-xs text-[#121316] font-medium"
          >
            <option value="">All Statuses</option>
            <option value="sent">Sent</option>
            <option value="failed">Failed</option>
            <option value="bounced">Bounced</option>
          </select>
        </div>

        <div className="w-32">
          <label className="text-[10px] font-bold uppercase tracking-wider text-[#8a8780] mb-1 block">
            From Date
          </label>
          <input
            type="date"
            value={filters.from}
            onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value, page: 1 }))}
            className="w-full rounded-xl border border-[#121316]/12 bg-[#faf8f4] px-2.5 py-1.5 text-xs text-[#121316]"
          />
        </div>

        <div className="w-32">
          <label className="text-[10px] font-bold uppercase tracking-wider text-[#8a8780] mb-1 block">
            To Date
          </label>
          <input
            type="date"
            value={filters.to}
            onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value, page: 1 }))}
            className="w-full rounded-xl border border-[#121316]/12 bg-[#faf8f4] px-2.5 py-1.5 text-xs text-[#121316]"
          />
        </div>

        {(filters.campaignId || filters.mailAccountId || filters.status || filters.from || filters.to) && (
          <button
            type="button"
            onClick={() => setFilters({ campaignId: '', mailAccountId: '', status: '', from: '', to: '', page: 1 })}
            className="px-3 py-1.5 rounded-full border border-[#121316]/12 bg-white text-xs font-bold text-[#121316] hover:bg-[#faf8f4] cursor-pointer"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Main Table Container */}
      <section className="uneevo-card rounded-[20px] shadow-sm border border-[#121316]/12 bg-white flex flex-col overflow-hidden">
        {/* Table Header */}
        <div className="px-4 py-3 flex items-center bg-[#faf8f4] border-b border-[#121316]/12 text-[11px] text-[#62605c] uppercase tracking-wider font-bold">
          <div className="flex-1 min-w-[200px]">Recipient & Subject</div>
          <div className="w-36 shrink-0 hidden md:block">Campaign</div>
          <div className="w-44 shrink-0 hidden lg:block">Sender</div>
          <div className="w-28 shrink-0">Status</div>
          <div className="w-32 shrink-0 hidden sm:block">Engagement</div>
          <div className="w-28 shrink-0 text-right pr-4 hidden sm:block">Date</div>
          <div className="w-20 shrink-0 text-right">Actions</div>
        </div>

        {/* Rows List */}
        <div className="flex flex-col w-full divide-y divide-[#121316]/08">
          {loading ? (
            <div className="px-4 py-12 text-center text-xs text-[#8a8780]">
              Loading sent mail logs...
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="px-4 py-12 text-center text-xs text-[#8a8780] italic">
              {searchQuery ? 'No dispatches match your search query.' : 'No email dispatches recorded yet.'}
            </div>
          ) : (
            filteredLogs.map((log) => {
              const initialLetter = log.toEmail.charAt(0).toUpperCase()

              return (
                <article
                  key={log.id}
                  className="px-4 py-3 flex items-center hover:bg-[#faf8f4]/60 transition-colors group text-xs gap-3"
                >
                  {/* Avatar Initial */}
                  <div className="w-8 h-8 rounded-lg bg-[#121316]/05 border border-[#121316]/10 flex items-center justify-center shrink-0 font-bold text-xs text-[#121316]">
                    {initialLetter}
                  </div>

                  {/* Recipient & Subject */}
                  <div className="flex flex-col flex-1 min-w-[180px] pr-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-[#121316] truncate text-xs sm:text-sm">
                        {log.toEmail}
                      </span>
                    </div>
                    <span className="text-[11px] text-[#62605c] truncate mt-0.5" title={log.subject}>
                      {log.subject.replace(/^Subject:\s*/i, '') || '(no subject)'}
                    </span>
                  </div>

                  {/* Campaign */}
                  <div className="w-36 shrink-0 hidden md:block">
                    {log.campaign ? (
                      <Link
                        href={`/campaigns/${log.campaign.id}`}
                        className="font-semibold text-[#ee382b] hover:underline truncate block"
                      >
                        {log.campaign.name}
                      </Link>
                    ) : (
                      <span className="text-[#8a8780] font-mono text-[11px]">
                        API {log.apiDispatchRequest?.apiKey.name || 'Request'}
                      </span>
                    )}
                  </div>

                  {/* Sender */}
                  <div className="w-44 shrink-0 hidden lg:block">
                    <span className="text-[#62605c] font-mono text-[11px] truncate block" title={log.mailAccount.email}>
                      {log.mailAccount.email}
                    </span>
                  </div>

                  {/* Status Badge */}
                  <div className="w-28 shrink-0">
                    <StatusBadge status={log.status} />
                    {log.errorMessage && (
                      <div className="text-[10px] text-[#c2414c] mt-0.5 truncate max-w-[110px]" title={log.errorMessage}>
                        {log.errorMessage}
                      </div>
                    )}
                  </div>

                  {/* Engagement Chips */}
                  <div className="w-32 shrink-0 hidden sm:flex flex-col gap-1">
                    {log.status === 'sent' ? (
                      <>
                        <div className="flex items-center gap-1">
                          <StatusBadge status={isNoTracking(log) ? 'No tracking' : (log.openStatus || (log.openedAt ? 'opened' : 'unopened'))} />
                          {log.repliedAt && <StatusBadge status="replied" />}
                        </div>
                        {log.repliedAt && (
                          <button
                            type="button"
                            onClick={() => void handleOpenReplyModal(log)}
                            disabled={replyLoadingId === log.id}
                            className="text-[10px] font-bold text-[#ee382b] hover:underline text-left cursor-pointer"
                          >
                            {replyLoadingId === log.id ? 'Loading...' : 'View Reply ↗'}
                          </button>
                        )}
                      </>
                    ) : (
                      <span className="text-[#8a8780] text-[11px]">N/A</span>
                    )}
                  </div>

                  {/* Sent Date */}
                  <div className="w-28 shrink-0 text-right pr-4 font-mono text-[11px] text-[#8a8780] hidden sm:block">
                    {formatDate(log.sentAt)}
                  </div>

                  {/* Actions Dropdown / Buttons */}
                  <div className="w-20 shrink-0 flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => void handleOpenMessageModal(log)}
                      disabled={messageLoadingId === log.id}
                      className="p-1.5 rounded-lg border border-[#121316]/10 text-[#121316] hover:bg-[#faf8f4] transition cursor-pointer"
                      title="View Sent Message"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => void handleLogAction(log.id, 'mark-complaint')}
                      className="p-1.5 rounded-lg border border-[#121316]/10 text-[#8a8780] hover:text-[#ee382b] hover:bg-[#faf8f4] transition cursor-pointer"
                      title="Mark as Complaint"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </article>
              )
            })
          )}
        </div>

        {/* Pagination Footer */}
        <div className="px-4 py-2.5 flex flex-wrap items-center justify-between border-t border-[#121316]/12 bg-white text-xs gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[#62605c]">Rows:</span>
            <select
              value={limit}
              onChange={(e) => {
                const newLimit = Number(e.target.value)
                setLimit(newLimit)
                setFilters((f) => ({ ...f, page: 1 }))
              }}
              className="bg-transparent text-[#121316] font-semibold border-none focus:ring-0 cursor-pointer p-0 text-xs"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="text-[#8a8780] ml-4 border-l border-[#121316]/15 pl-4">
              {total > 0
                ? `${(filters.page - 1) * limit + 1}–${Math.min(filters.page * limit, total)} of ${total}`
                : '0 of 0'}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={filters.page <= 1}
              onClick={() => setFilters((f) => ({ ...f, page: 1 }))}
              className="w-7 h-7 flex items-center justify-center rounded text-[#62605c] hover:bg-[#faf8f4] disabled:opacity-40 cursor-pointer"
            >
              <ChevronsLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              disabled={filters.page <= 1}
              onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}
              className="w-7 h-7 flex items-center justify-center rounded text-[#62605c] hover:bg-[#faf8f4] disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-1 mx-1">
              {Array.from({ length: pages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === pages || Math.abs(p - filters.page) <= 1)
                .map((p, idx, arr) => {
                  const showGap = idx > 0 && p - arr[idx - 1] > 1
                  return (
                    <span key={p} className="flex items-center gap-1">
                      {showGap && <span className="text-[#8a8780] px-0.5">...</span>}
                      <button
                        type="button"
                        onClick={() => setFilters((f) => ({ ...f, page: p }))}
                        className={`w-7 h-7 rounded text-xs font-semibold flex items-center justify-center transition-all cursor-pointer ${
                          p === filters.page
                            ? 'bg-[#121316] text-white shadow-2xs'
                            : 'text-[#121316] hover:bg-[#faf8f4]'
                        }`}
                      >
                        {p}
                      </button>
                    </span>
                  )
                })}
            </div>

            <button
              type="button"
              disabled={filters.page >= pages}
              onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}
              className="w-7 h-7 flex items-center justify-center rounded text-[#62605c] hover:bg-[#faf8f4] disabled:opacity-40 cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              disabled={filters.page >= pages}
              onClick={() => setFilters((f) => ({ ...f, page: pages }))}
              className="w-7 h-7 flex items-center justify-center rounded text-[#62605c] hover:bg-[#faf8f4] disabled:opacity-40 cursor-pointer"
            >
              <ChevronsRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Reply Modal */}
      {isClient && replyModal
        ? createPortal(
            <div
              onClick={() => setReplyModal(null)}
              className="fixed inset-0 bg-[#121316]/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in"
            >
              <div
                role="dialog"
                aria-modal="true"
                onClick={(e) => e.stopPropagation()}
                className="uneevo-card p-6 md:p-8 rounded-[24px] border border-[#121316]/12 bg-white shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto space-y-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#ee382b] block mb-1">
                      PROSPECT REPLY THREAD
                    </span>
                    <h2 className="text-xl font-bold text-[#121316]">
                      {replyModal.subject || '(No subject)'}
                    </h2>
                    <p className="text-xs text-[#62605c] mt-1">
                      Recipient: <strong className="text-[#121316]">{replyModal.recipient}</strong>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setReplyModal(null)}
                    className="p-2 rounded-full text-[#8a8780] hover:text-[#121316] hover:bg-[#121316]/05 transition-colors cursor-pointer"
                    title="Close (Esc)"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {replyModal.replies.length === 0 ? (
                  <div className="p-6 rounded-xl bg-[#faf8f4] text-center text-xs text-[#62605c]">
                    Reply event recorded, but message snippet is pending mailbox synchronization.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {replyModal.replies.map((reply) => (
                      <div
                        key={reply.id}
                        className="p-4 rounded-xl bg-[#faf8f4] border border-[#121316]/08 space-y-2.5"
                      >
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-[#121316]">
                            From: {reply.fromEmail || 'Recipient'}
                          </span>
                          <span className="font-mono text-[#8a8780] text-[11px]">
                            {formatReplyTimestamp(reply)}
                          </span>
                        </div>
                        <div className="p-3 rounded-lg bg-white border border-[#121316]/06 text-xs leading-relaxed text-[#121316] whitespace-pre-wrap">
                          {reply.snippet || 'No snippet text.'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>,
            document.body
          )
        : null}

      {/* Message Modal */}
      {isClient && messageModal
        ? createPortal(
            <div
              onClick={() => setMessageModal(null)}
              className="fixed inset-0 bg-[#121316]/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in"
            >
              <div
                role="dialog"
                aria-modal="true"
                onClick={(e) => e.stopPropagation()}
                className="uneevo-card p-6 md:p-8 rounded-[24px] border border-[#121316]/12 bg-white shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto space-y-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#ee382b] block mb-1">
                      RENDERED OUTBOUND DISPATCH
                    </span>
                    <h2 className="text-xl font-bold text-[#121316]">
                      {messageModal.subject || '(No subject)'}
                    </h2>
                    <p className="text-xs text-[#62605c] mt-1">
                      Sent to: <strong className="text-[#121316]">{messageModal.recipient}</strong> •{' '}
                      <span className="font-mono">{formatDate(messageModal.sentAt)}</span>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMessageModal(null)}
                    className="p-2 rounded-full text-[#8a8780] hover:text-[#121316] hover:bg-[#121316]/05 transition-colors cursor-pointer"
                    title="Close (Esc)"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="rounded-xl border border-[#121316]/08 overflow-hidden bg-white">
                  {messageModal.html ? (
                    <iframe
                      title={messageModal.subject || 'Sent message'}
                      srcDoc={messageModal.html}
                      sandbox=""
                      className="w-full min-h-[60vh] border-0 bg-white"
                    />
                  ) : messageModal.text ? (
                    <div className="p-6 text-xs text-[#121316] leading-relaxed whitespace-pre-wrap">
                      {messageModal.text}
                    </div>
                  ) : (
                    <div className="p-6 text-center text-xs text-[#8a8780]">
                      No message body content recorded for this log entry.
                    </div>
                  )}
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </div>
  )
}
