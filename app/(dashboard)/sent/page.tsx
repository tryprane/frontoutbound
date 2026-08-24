'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { createPortal } from 'react-dom'
import { ChevronDown, Mail } from 'lucide-react'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { PaginationControls } from '@/components/ui/pagination-controls'

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
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
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
    return `${account.email} - ${account.sentToday}/${account.dailyLimit} - ${activity} - sync ${account.mailboxSyncStatus}`
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
      fetch('/api/campaigns?page=1&limit=100').then(r => r.json()),
      fetch('/api/mail-accounts?resource=sent-filter-options&page=1&limit=100').then(r => r.json()),
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
      .then(r => r.json())
      .then(data => {
        setLogs(data.logs || [])
        setCounts(data.counts || {
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

  const handleLogAction = async (sentMailId: string, action: 'mark-bounced' | 'mark-complaint' | 'clear-complaint-log') => {
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

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Card */}
      <header className="uneevo-card p-6 md:p-7 flex flex-col md:flex-row md:items-center justify-between gap-5 shadow-[0_10px_30px_rgba(0,0,0,0.03)]">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] bg-[#121316] text-white shadow-xs">
            <Mail className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs font-bold tracking-widest text-[#ee382b] uppercase block mb-1">
              OUTBOUND LOGS
            </span>
            <h1 className="zoho-puvi-headline text-2xl sm:text-3xl font-bold tracking-tight text-[#121316]">
              Sent Mail Analytics
            </h1>
            <p className="text-xs sm:text-sm text-[#62605c] mt-0.5">
              Live audit trail of every dispatched email, open beacon, and recipient interaction.
            </p>
          </div>
        </div>

        <button
          className="inline-flex items-center gap-2 rounded-full border border-[#121316]/12 bg-white px-5 py-2.5 text-xs sm:text-sm font-semibold text-[#121316] transition-all hover:bg-[#faf8f4] hover:shadow-xs"
          onClick={handleExport}
        >
          <span>Export CSV Log</span>
        </button>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="uneevo-card p-5 rounded-[22px] border border-[#121316]/08 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.03)]">
          <div className="font-mono text-2xl sm:text-3xl font-bold text-[#121316] tabular-nums">{total.toLocaleString()}</div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#62605c] mt-1">Total Logs</div>
        </div>
        <div className="uneevo-card p-5 rounded-[22px] border border-[#121316]/08 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.03)]">
          <div className="font-mono text-2xl sm:text-3xl font-bold text-[#0f8a5f] tabular-nums">{counts.sent.toLocaleString()}</div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#0f8a5f] mt-1">Sent</div>
        </div>
        <div className="uneevo-card p-5 rounded-[22px] border border-[#121316]/08 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.03)]">
          <div className="font-mono text-2xl sm:text-3xl font-bold text-[#ee382b] tabular-nums">{counts.failed.toLocaleString()}</div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#ee382b] mt-1">Failed</div>
        </div>
        <div className="uneevo-card p-5 rounded-[22px] border border-[#121316]/08 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.03)]">
          <div className="font-mono text-2xl sm:text-3xl font-bold text-[#b7791f] tabular-nums">{counts.bounced.toLocaleString()}</div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#b7791f] mt-1">Bounced</div>
        </div>
        <div className="uneevo-card p-5 rounded-[22px] border border-[#121316]/08 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.03)]">
          <div className="font-mono text-2xl sm:text-3xl font-bold text-[#ee382b] tabular-nums">{counts.complaints.toLocaleString()}</div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#ee382b] mt-1">Complaints</div>
        </div>
        <div className="uneevo-card p-5 rounded-[22px] border border-[#121316]/08 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.03)]">
          <div className="font-mono text-2xl sm:text-3xl font-bold text-[#121316] tabular-nums">{counts.replied.toLocaleString()}</div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#121316] mt-1">Replied</div>
        </div>
      </div>

      {/* Engagement Rates Banner */}
      <div className="uneevo-card p-6 rounded-[24px] border border-[#121316]/08 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.03)]">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="p-4 rounded-xl bg-[#faf8f4] border border-[#121316]/06 text-center">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#62605c] mb-1">Opened</div>
            <div className="font-mono text-2xl font-bold text-[#0f8a5f] tabular-nums">{counts.opened.toLocaleString()}</div>
          </div>
          <div className="p-4 rounded-xl bg-[#faf8f4] border border-[#121316]/06 text-center">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#62605c] mb-1">Not opened</div>
            <div className="font-mono text-2xl font-bold text-[#62605c] tabular-nums">{counts.unopened.toLocaleString()}</div>
          </div>
          <div className="p-4 rounded-xl bg-[#faf8f4] border border-[#121316]/06 text-center">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#62605c] mb-1">Open rate</div>
            <div className="font-mono text-2xl font-bold text-[#ee382b] tabular-nums">{counts.openRate}%</div>
          </div>
          <div className="p-4 rounded-xl bg-[#faf8f4] border border-[#121316]/06 text-center">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#62605c] mb-1">Awaiting reply</div>
            <div className="font-mono text-2xl font-bold text-[#62605c] tabular-nums">{counts.unreplied.toLocaleString()}</div>
          </div>
          <div className="p-4 rounded-xl bg-[#faf8f4] border border-[#121316]/06 text-center">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#62605c] mb-1">Reply rate</div>
            <div className="font-mono text-2xl font-bold text-[#0f8a5f] tabular-nums">{counts.replyRate}%</div>
          </div>
        </div>
        <div className="mt-3 text-xs text-[#8a8780] leading-relaxed">
          Open tracking is best-effort and depends on the prospect client loading remote images. Reply tracking is inferred from synced mailbox threads.
        </div>
      </div>

      <div className="uneevo-card rounded-[24px] border border-[#121316]/08 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.03)] overflow-hidden">
        <button
          type="button"
          onClick={handleToggleAccountProgress}
          className="w-full flex items-center justify-between gap-4 p-6 bg-transparent border-0 cursor-pointer text-left"
          aria-expanded={accountProgressExpanded}
        >
          <div>
            <div className="zoho-puvi-headline text-base sm:text-lg font-bold text-[#121316]">
              Account Sending Progress & Sender Pool Utilization
            </div>
            <div className="text-xs sm:text-sm text-[#62605c] mt-0.5">
              Expand to inspect sender mailbox quotas, warmup stages, and remaining daily limits.
            </div>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#faf8f4] border border-[#121316]/08 text-[#121316] shrink-0">
            <ChevronDown
              size={18}
              style={{
                transform: accountProgressExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease',
              }}
            />
          </div>
        </button>

        {accountProgressExpanded ? (
          <div className="p-6 pt-0 border-t border-[#121316]/08">
            {accountProgressLoading ? (
              <div className="pt-4 text-xs font-mono text-[#8a8780]">
                Loading sender account progress...
              </div>
            ) : accountProgressError ? (
              <div className="pt-4 text-xs text-[#c2414c]">
                {accountProgressError}
              </div>
            ) : accountProgressAccounts.length === 0 ? (
              <div className="pt-4 text-xs text-[#8a8780]">
                No sender accounts available yet.
              </div>
            ) : (
              <div className="space-y-4 pt-4">
                <div className="space-y-2.5">
                  {accountProgressAccounts.map((account) => {
                    const progress = Math.min(100, ((account.sentToday || 0) / (account.dailyLimit || 1)) * 100)
                    const isNearLimit = progress >= 90

                    return (
                      <div
                        key={account.id}
                        className="flex items-center gap-4 p-3.5 rounded-[14px] bg-[#faf8f4] border border-[#121316]/06"
                      >
                        <div className="w-56 font-bold text-xs text-[#121316] truncate">
                          {account.email}
                        </div>
                        <div className="flex-1">
                          <div className="h-2 w-full bg-[#121316]/08 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                isNearLimit ? 'bg-[#b7791f]' : 'bg-[#ee382b]'
                              }`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                        <div className="w-20 font-mono text-xs text-[#62605c] text-right font-bold tabular-nums">
                          {account.sentToday || 0} / {account.dailyLimit || 0}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>

      {/* Filters Card */}
      <div className="uneevo-card p-6 rounded-[22px] border border-[#121316]/08 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.03)] flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[180px]">
          <label className="text-[11px] font-bold uppercase tracking-wider text-[#8a8780] mb-1.5 block">
            Campaign
          </label>
          <select
            value={filters.campaignId}
            onChange={(e) => setFilters((f) => ({ ...f, campaignId: e.target.value, page: 1 }))}
            className="w-full rounded-[12px] border border-[#121316]/12 bg-[#faf8f4] px-3.5 py-2 text-xs text-[#121316] font-medium"
          >
            <option value="">All Campaigns</option>
            {options.campaigns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1 min-w-[180px]">
          <label className="text-[11px] font-bold uppercase tracking-wider text-[#8a8780] mb-1.5 block">
            Sender Mailbox
          </label>
          <select
            value={filters.mailAccountId}
            onChange={(e) => setFilters((f) => ({ ...f, mailAccountId: e.target.value, page: 1 }))}
            className="w-full rounded-[12px] border border-[#121316]/12 bg-[#faf8f4] px-3.5 py-2 text-xs text-[#121316] font-medium"
          >
            <option value="">All Connected Mailboxes</option>
            {options.accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {formatAccountOptionLabel(a)}
              </option>
            ))}
          </select>
        </div>

        <div className="w-36">
          <label className="text-[11px] font-bold uppercase tracking-wider text-[#8a8780] mb-1.5 block">
            Status
          </label>
          <select
            value={filters.status}
            onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value, page: 1 }))}
            className="w-full rounded-[12px] border border-[#121316]/12 bg-[#faf8f4] px-3.5 py-2 text-xs text-[#121316] font-medium"
          >
            <option value="">All Statuses</option>
            <option value="sent">Sent</option>
            <option value="failed">Failed</option>
            <option value="bounced">Bounced</option>
          </select>
        </div>

        <div className="w-36">
          <label className="text-[11px] font-bold uppercase tracking-wider text-[#8a8780] mb-1.5 block">
            From Date
          </label>
          <input
            type="date"
            value={filters.from}
            onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value, page: 1 }))}
            className="w-full rounded-[12px] border border-[#121316]/12 bg-[#faf8f4] px-3 py-1.5 text-xs text-[#121316]"
          />
        </div>

        <div className="w-36">
          <label className="text-[11px] font-bold uppercase tracking-wider text-[#8a8780] mb-1.5 block">
            To Date
          </label>
          <input
            type="date"
            value={filters.to}
            onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value, page: 1 }))}
            className="w-full rounded-[12px] border border-[#121316]/12 bg-[#faf8f4] px-3 py-1.5 text-xs text-[#121316]"
          />
        </div>

        {(filters.campaignId || filters.mailAccountId || filters.status || filters.from || filters.to) && (
          <button
            type="button"
            onClick={() => setFilters({ campaignId: '', mailAccountId: '', status: '', from: '', to: '', page: 1 })}
            className="px-4 py-2 rounded-full border border-[#121316]/12 bg-white text-xs font-bold text-[#121316] hover:bg-[#faf8f4]"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Table Card */}
      <div className="uneevo-card rounded-[24px] border border-[#121316]/08 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.03)] overflow-hidden">
        <div className="flex justify-between gap-4 flex-wrap items-center px-6 py-4 border-b border-[#121316]/08 bg-[#faf8f4]">
          <div className="text-xs text-[#62605c] font-mono">
            Showing <strong className="text-[#121316]">{visibleLogCount.toLocaleString()}</strong> of{' '}
            <strong className="text-[#121316]">{total.toLocaleString()}</strong> sent mail logs
          </div>
          {pages > 0 && (
            <PaginationControls
              page={filters.page}
              pages={pages}
              total={total}
              limit={limit}
              onPageChange={(page) => setFilters((current) => ({ ...current, page }))}
              onLimitChange={(value) => {
                setLimit(value)
                setFilters((current) => ({ ...current, page: 1 }))
              }}
              label="sent logs"
            />
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#faf8f4] border-b border-[#121316]/08">
                <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-[#8a8780]">Recipient</th>
                <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-[#8a8780]">Subject</th>
                <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-[#8a8780]">Campaign</th>
                <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-[#8a8780]">Sender</th>
                <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-[#8a8780]">Date</th>
                <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-[#8a8780]">Status</th>
                <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-[#8a8780]">Open / Reply</th>
                <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-[#8a8780]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#121316]/06 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-16 text-center text-[#8a8780]">
                    Loading sent mail logs...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-16 text-center text-[#8a8780]">
                    No email dispatches found matching filters.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#faf8f4]/60 transition-colors">
                    <td className="px-5 py-4 font-bold text-[#121316]">{log.toEmail}</td>
                    <td className="px-5 py-4 text-[#62605c] max-w-xs truncate">
                      {log.subject.replace(/^Subject:\s*/i, '')}
                    </td>
                    <td className="px-5 py-4">
                      {log.campaign ? (
                        <Link
                          href={`/campaigns/${log.campaign.id}`}
                          className="font-bold text-[#ee382b] hover:underline"
                        >
                          {log.campaign.name}
                        </Link>
                      ) : (
                        <span className="text-[#8a8780] font-mono">
                          API {log.apiDispatchRequest?.apiKey.name || 'request'}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 font-mono text-[11px] text-[#62605c]">{log.mailAccount.email}</td>
                    <td className="px-5 py-4 font-mono text-[11px] text-[#8a8780]">{formatDate(log.sentAt)}</td>
                    <td className="px-5 py-4">
                      <StatusBadge status={log.status} />
                      {log.errorMessage && (
                        <div className="text-[11px] text-[#c2414c] mt-1 truncate max-w-[150px]" title={log.errorMessage}>
                          {log.errorMessage}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      {log.status === 'sent' ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <StatusBadge status={isNoTracking(log) ? 'No tracking' : (log.openStatus || (log.openedAt ? 'opened' : 'unopened'))} />
                            <StatusBadge status={log.repliedAt ? 'replied' : 'awaiting reply'} />
                          </div>
                          {log.openedAt && !isNoTracking(log) && (
                            <div className="text-[10px] text-[#0f8a5f] font-mono">
                              Opened {formatDate(log.openedAt)}
                            </div>
                          )}
                          {log.repliedAt && (
                            <div className="text-[10px] text-[#0f8a5f] font-mono">
                              Replied {formatDate(log.repliedAt)}
                            </div>
                          )}
                          {log.repliedAt && (
                            <button
                              type="button"
                              onClick={() => void handleOpenReplyModal(log)}
                              disabled={replyLoadingId === log.id}
                              className="text-[11px] font-bold text-[#ee382b] hover:underline block pt-1"
                            >
                              {replyLoadingId === log.id ? 'Loading...' : 'View Reply'}
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="text-[#8a8780]">N/A</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-1.5 min-w-[120px]">
                        <button
                          type="button"
                          onClick={() => void handleOpenMessageModal(log)}
                          disabled={messageLoadingId === log.id}
                          className="px-2.5 py-1 rounded-[8px] border border-[#121316]/10 bg-white text-[11px] font-semibold text-[#121316] hover:bg-[#faf8f4] transition text-left"
                        >
                          {messageLoadingId === log.id ? 'Loading...' : 'View Message'}
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleLogAction(log.id, 'mark-complaint')}
                          className="px-2.5 py-1 rounded-[8px] border border-[#121316]/10 bg-white text-[11px] font-semibold text-[#8a8780] hover:text-[#ee382b] hover:bg-[#faf8f4] transition text-left"
                        >
                          Mark Complaint
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleLogAction(log.id, 'mark-bounced')}
                          className="px-2.5 py-1 rounded-[8px] border border-[#121316]/10 bg-white text-[11px] font-semibold text-[#8a8780] hover:text-[#c2414c] hover:bg-[#faf8f4] transition text-left"
                        >
                          Mark Bounced
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {pages > 0 && (
          <div className="px-6 py-4 border-t border-[#121316]/08 bg-[#faf8f4]">
            <PaginationControls
              page={filters.page}
              pages={pages}
              total={total}
              limit={limit}
              onPageChange={(page) => setFilters((current) => ({ ...current, page }))}
              onLimitChange={(value) => {
                setLimit(value)
                setFilters((current) => ({ ...current, page: 1 }))
              }}
              label="sent logs"
            />
          </div>
        )}
      </div>

      {/* Reply Modal */}
      {isClient && replyModal ? createPortal(
        <div
          onClick={() => setReplyModal(null)}
          className="fixed inset-0 bg-[#121316]/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in"
        >
          <div
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
            className="uneevo-card p-6 md:p-8 rounded-[28px] border border-[#121316]/08 bg-white shadow-[0_20px_50px_rgba(0,0,0,0.12)] w-full max-w-2xl max-h-[85vh] overflow-y-auto space-y-5"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#ee382b] block mb-1">
                  PROSPECT REPLY THREAD
                </span>
                <h2 className="zoho-puvi-headline text-xl font-bold text-[#121316]">
                  {replyModal.subject || '(No subject)'}
                </h2>
                <p className="text-xs text-[#62605c] mt-1">
                  Recipient: <strong className="text-[#121316]">{replyModal.recipient}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setReplyModal(null)}
                className="px-3.5 py-1.5 rounded-full border border-[#121316]/12 bg-white text-xs font-bold text-[#121316] hover:bg-[#faf8f4]"
              >
                Close
              </button>
            </div>

            {replyModal.replies.length === 0 ? (
              <div className="p-6 rounded-[16px] bg-[#faf8f4] text-center text-xs text-[#62605c]">
                Reply event recorded, but message snippet is pending mailbox synchronization.
              </div>
            ) : (
              <div className="space-y-3">
                {replyModal.replies.map((reply, index) => (
                  <div
                    key={reply.id}
                    className="p-5 rounded-[20px] bg-[#faf8f4] border border-[#121316]/08 space-y-3"
                  >
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-[#121316]">
                        From: {reply.fromEmail || 'Recipient'}
                      </span>
                      <span className="font-mono text-[#8a8780] text-[11px]">
                        {formatReplyTimestamp(reply)}
                      </span>
                    </div>
                    <div className="p-4 rounded-[14px] bg-white border border-[#121316]/06 text-xs leading-relaxed text-[#121316] whitespace-pre-wrap">
                      {reply.snippet || 'No snippet text.'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>,
        document.body
      ) : null}

      {/* Message Modal */}
      {isClient && messageModal ? createPortal(
        <div
          onClick={() => setMessageModal(null)}
          className="fixed inset-0 bg-[#121316]/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in"
        >
          <div
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
            className="uneevo-card p-6 md:p-8 rounded-[28px] border border-[#121316]/08 bg-white shadow-[0_20px_50px_rgba(0,0,0,0.12)] w-full max-w-3xl max-h-[90vh] overflow-y-auto space-y-5"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#ee382b] block mb-1">
                  RENDERED OUTBOUND DISPATCH
                </span>
                <h2 className="zoho-puvi-headline text-xl font-bold text-[#121316]">
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
                className="px-3.5 py-1.5 rounded-full border border-[#121316]/12 bg-white text-xs font-bold text-[#121316] hover:bg-[#faf8f4]"
              >
                Close
              </button>
            </div>

            <div className="rounded-[18px] border border-[#121316]/08 overflow-hidden bg-white">
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
      ) : null}
    </div>
  )
}

