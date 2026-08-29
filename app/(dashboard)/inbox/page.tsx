'use client'

import { useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react'
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
  Check,
  ShieldAlert,
  Flame,
  X,
  Send,
  PenSquare,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Filter,
  CheckCheck,
} from 'lucide-react'

type MailAccountOption = {
  id: string
  email: string
  displayName: string
  type: 'zoho' | 'gmail'
}

type EmailInboxMessage = {
  id: string
  mailAccountId: string
  folderKind: 'INBOX' | 'SPAM' | 'SENT' | 'ARCHIVE' | 'OTHER'
  direction: 'inbound' | 'outbound'
  fromEmail: string | null
  toEmail: string | null
  subject: string | null
  snippet: string | null
  sentAt: string | null
  receivedAt: string | null
  isWarmup: boolean
  isRead: boolean
  isSpam: boolean
  repliedAt: string | null
  openedAt: string | null
  rescuedAt: string | null
  mailAccount: MailAccountOption
}

type EmailMessageModalState = {
  id: string
  mailAccountId: string
  subject: string | null
  fromEmail: string | null
  toEmail: string | null
  sentAt: string | null
  receivedAt: string | null
  html: string | null
  text: string | null
  direction: 'inbound' | 'outbound'
  isWarmup: boolean
  isSpam: boolean
  isRead: boolean
  folderKind: string
  mailAccount: MailAccountOption
}

type InboxRetention = {
  emailDays: number
}

type PaginatedPayload<T> = {
  items: T[]
  total: number
  page: number
  pages: number
  limit: number
}

function emptyPage<T>(limit: number): PaginatedPayload<T> {
  return { items: [], total: 0, page: 1, pages: 1, limit }
}

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

function getSenderInfo(message: { direction: string; toEmail: string | null; fromEmail: string | null }) {
  const isOutbound = message.direction === 'outbound'
  const rawContact = isOutbound ? message.toEmail || 'Unknown' : message.fromEmail || 'Unknown'

  let name = ''
  let email = rawContact

  if (rawContact.includes('<') && rawContact.includes('>')) {
    const match = rawContact.match(/(.*?)\s*<([^>]+)>/)
    if (match) {
      name = match[1].replace(/["']/g, '').trim()
      email = match[2].trim()
    }
  }

  if (!name && email) {
    const userPart = email.split('@')[0]
    if (userPart) {
      name = userPart
        .split(/[._+-]/)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ')
    }
  }

  const initial = (name || email || 'U').charAt(0).toUpperCase()
  return { name: name || email || 'Prospect', email, initial, isOutbound }
}

const AVATAR_COLORS = [
  'bg-blue-500',
  'bg-green-500',
  'bg-purple-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-indigo-500',
  'bg-teal-500',
  'bg-cyan-500',
]

function getAvatarColor(identifier: string) {
  let hash = 0
  for (let i = 0; i < identifier.length; i++) {
    hash = identifier.charCodeAt(i) + ((hash << 5) - hash)
  }
  const index = Math.abs(hash) % AVATAR_COLORS.length
  return AVATAR_COLORS[index]
}

function getVisiblePages(currentPage: number, totalPages: number) {
  const pages: (number | 'ellipsis')[] = []
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i)
  } else {
    if (currentPage <= 4) {
      for (let i = 1; i <= 5; i++) pages.push(i)
      pages.push('ellipsis')
      pages.push(totalPages)
    } else if (currentPage >= totalPages - 3) {
      pages.push(1)
      pages.push('ellipsis')
      for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      pages.push('ellipsis')
      pages.push(currentPage - 1)
      pages.push(currentPage)
      pages.push(currentPage + 1)
      pages.push('ellipsis')
      pages.push(totalPages)
    }
  }
  return pages
}

const QUICK_REPLY_TEMPLATES = [
  "Hi, thank you for reaching out! Would you be available for a quick 10-minute call this week?",
  "Thanks for the follow-up. I've reviewed your note and would love to learn more.",
  "Thanks for connecting. Let's schedule some time to discuss next steps.",
]

async function readJson<T>(url: string, fallback: T): Promise<T> {
  try {
    const response = await fetch(url)
    return (await response.json()) as T
  } catch {
    return fallback
  }
}

export default function InboxPage() {
  const [mailAccounts, setMailAccounts] = useState<MailAccountOption[]>([])
  const [retention, setRetention] = useState<InboxRetention>({ emailDays: 30 })
  const [emailFolder, setEmailFolder] = useState<'INBOX' | 'SPAM' | 'SENT'>('INBOX')
  const [selectedMailAccountId, setSelectedMailAccountId] = useState('')
  const [includeWarmup, setIncludeWarmup] = useState(false)
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search)
  const [emailData, setEmailData] = useState<PaginatedPayload<EmailInboxMessage>>(emptyPage(25))
  const [emailLoading, setEmailLoading] = useState(true)
  const [emailPage, setEmailPage] = useState(1)
  const [emailLimit, setEmailLimit] = useState(25)
  const [isClient, setIsClient] = useState(false)
  const [messageModal, setMessageModal] = useState<EmailMessageModalState | null>(null)
  const [messageLoadingId, setMessageLoadingId] = useState<string | null>(null)
  const [messageError, setMessageError] = useState<string | null>(null)
  const [busyAction, setBusyAction] = useState<string | null>(null)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [settingsReady, setSettingsReady] = useState(false)

  // Modal Reply State
  const [modalReplying, setModalReplying] = useState(false)
  const [modalReplySubject, setModalReplySubject] = useState('')
  const [modalReplyBody, setModalReplyBody] = useState('')
  const [isModalSendingReply, setIsModalSendingReply] = useState(false)

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

  useEffect(() => {
    const loadAccountsAndSettings = async () => {
      const mailRes = await readJson<PaginatedPayload<MailAccountOption>>(
        '/api/mail-accounts?view=selector&page=1&limit=100',
        emptyPage(100)
      )
      const accounts = mailRes.items || []
      setMailAccounts(accounts)
      if (accounts.length > 0 && !composeMailAccountId) {
        setComposeMailAccountId(accounts[0].id)
      }

      const settings = await readJson<{
        workspace?: {
          inboxPageSize?: number
          includeWarmupInInbox?: boolean
        }
      }>('/api/settings', {})

      if (settings.workspace?.inboxPageSize) setEmailLimit(settings.workspace.inboxPageSize)
      if (typeof settings.workspace?.includeWarmupInInbox === 'boolean') {
        setIncludeWarmup(settings.workspace.includeWarmupInInbox)
      }
      setSettingsReady(true)
    }

    void loadAccountsAndSettings()
  }, [composeMailAccountId])

  const loadEmail = useCallback(async () => {
    setEmailLoading(true)
    const params = new URLSearchParams({
      channel: 'email',
      folderKind: emailFolder,
      page: String(emailPage),
      limit: String(emailLimit),
    })
    if (selectedMailAccountId) params.set('mailAccountId', selectedMailAccountId)
    if (includeWarmup) params.set('includeWarmup', 'true')
    if (deferredSearch.trim()) params.set('search', deferredSearch.trim())

    const data = await readJson<
      PaginatedPayload<EmailInboxMessage> & { retention?: InboxRetention; messages?: EmailInboxMessage[] }
    >(`/api/inbox?${params.toString()}`, { ...emptyPage(emailLimit), messages: [] })

    setEmailData({
      items: data.items || data.messages || [],
      total: data.total || 0,
      page: data.page || 1,
      pages: data.pages || 1,
      limit: data.limit || emailLimit,
    })
    if (data.retention) setRetention(data.retention)
    setEmailLoading(false)
  }, [deferredSearch, emailFolder, emailLimit, emailPage, includeWarmup, selectedMailAccountId])

  useEffect(() => {
    if (settingsReady) {
      void loadEmail()
    }
  }, [loadEmail, settingsReady])

  async function runEmailAction(message: { id: string; mailAccountId: string }, action: 'mark-read' | 'rescue-to-inbox') {
    setBusyAction(`${action}:${message.id}`)
    const response = await fetch('/api/inbox', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        channel: 'email',
        mailAccountId: message.mailAccountId,
        mailboxMessageId: message.id,
        action,
      }),
    })
    const data = await response.json().catch(() => ({ error: 'Inbox action failed' }))
    setBusyAction(null)
    if (!response.ok) {
      setToast({ type: 'error', message: data.error || 'Inbox action failed' })
      return
    }
    setToast({ type: 'success', message: 'Inbox updated' })
    if (messageModal && messageModal.id === message.id) {
      if (action === 'mark-read') setMessageModal({ ...messageModal, isRead: true })
      if (action === 'rescue-to-inbox') setMessageModal({ ...messageModal, isSpam: false, folderKind: 'INBOX' })
    }
    await loadEmail()
  }

  async function handleSendModalReply() {
    if (!messageModal) return
    if (!modalReplyBody.trim()) {
      setToast({ type: 'error', message: 'Please write a reply message.' })
      return
    }

    setIsModalSendingReply(true)
    try {
      const response = await fetch('/api/inbox', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: 'email',
          mailAccountId: messageModal.mailAccountId,
          mailboxMessageId: messageModal.id,
          action: 'reply',
          subject: modalReplySubject,
          html: `<p>${modalReplyBody.replace(/\n/g, '<br/>')}</p>`,
        }),
      })

      const data = await response.json().catch(() => ({ error: 'Reply failed' }))
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send reply')
      }

      setToast({ type: 'success', message: 'Reply sent successfully!' })
      setModalReplying(false)
      setModalReplyBody('')
      setMessageModal(null)
      await loadEmail()
    } catch (err: any) {
      setToast({ type: 'error', message: err.message || 'Failed to send reply' })
    } finally {
      setIsModalSendingReply(false)
    }
  }

  async function clearSyncedData() {
    if (!window.confirm('Clear synced email inbox data from the database cache?')) return
    setBusyAction('clear:email')
    const response = await fetch('/api/inbox?scope=email', { method: 'DELETE' })
    const data = await response.json().catch(() => ({ error: 'Failed to clear inbox cache' }))
    setBusyAction(null)
    if (!response.ok) {
      setToast({ type: 'error', message: data.error || 'Failed to clear inbox cache' })
      return
    }
    setToast({ type: 'success', message: 'Cleared synced email inbox cache' })
    setEmailData(emptyPage(emailLimit))
  }

  async function openEmailMessage(message: EmailInboxMessage) {
    setMessageError(null)
    setMessageLoadingId(message.id)
    setModalReplying(false)
    setModalReplyBody('')

    try {
      const response = await fetch(`/api/inbox/${message.id}/message`)
      const data = await response.json().catch(() => ({ error: 'Failed to load message content' }))

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load message content')
      }

      const defaultSubject = (data.subject ?? message.subject ?? '').startsWith('Re:')
        ? (data.subject ?? message.subject ?? '')
        : `Re: ${data.subject ?? message.subject ?? 'Quick follow-up'}`

      setModalReplySubject(defaultSubject)

      const sender = getSenderInfo(message)
      setModalReplyBody(`Hi ${sender.name},\n\nThank you for reaching out.\n\nBest regards,`)

      setMessageModal({
        id: message.id,
        mailAccountId: message.mailAccountId,
        subject: data.subject ?? message.subject,
        fromEmail: data.fromEmail ?? message.fromEmail,
        toEmail: data.toEmail ?? message.toEmail,
        sentAt: data.sentAt ?? message.sentAt,
        receivedAt: data.receivedAt ?? message.receivedAt,
        html: data.html ?? null,
        text: data.text ?? null,
        direction: message.direction,
        isWarmup: message.isWarmup,
        isSpam: message.isSpam,
        isRead: message.isRead,
        folderKind: message.folderKind,
        mailAccount: message.mailAccount,
      })

      // Mark read automatically if unread
      if (!message.isRead) {
        void runEmailAction(message, 'mark-read')
      }
    } catch (error) {
      const nextError = error instanceof Error ? error.message : 'Failed to load message content'
      setMessageError(nextError)
      setToast({ type: 'error', message: nextError })
    } finally {
      setMessageLoadingId(null)
    }
  }

  async function handleSendCompose() {
    if (!composeTo.trim() || !composeSubject.trim() || !composeBody.trim()) {
      setToast({ type: 'error', message: 'Please provide recipient, subject, and message.' })
      return
    }
    const accountId = composeMailAccountId || mailAccounts[0]?.id
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
      await loadEmail()
    } catch (err: any) {
      setToast({ type: 'error', message: err.message || 'Failed to send email' })
    } finally {
      setIsSendingCompose(false)
    }
  }

  useEffect(() => {
    if (!messageModal && !composeOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMessageModal(null)
        setComposeOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [messageModal, composeOpen])

  return (
    <div className="bg-gray-50 text-gray-800 font-sans p-4 sm:p-6 min-h-screen relative">
      <style>{`
        .card-shadow {
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
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

      {/* BEGIN: MainContainer */}
      <main className="max-w-6xl mx-auto space-y-6">
        {/* Top Floating Actions & Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <Inbox className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Modern Inbox</h1>
              <p className="text-xs text-gray-500">Unified prospect communications & responses</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 ml-auto">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 shadow-xs transition-all hover:bg-gray-50 hover:border-gray-300 active:scale-95 cursor-pointer"
              onClick={() => void loadEmail()}
              disabled={emailLoading}
            >
              <RefreshCw className={`h-3.5 w-3.5 text-gray-600 ${emailLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50/70 px-3.5 py-2 text-xs font-semibold text-red-600 shadow-xs transition-all hover:bg-red-100 active:scale-95 disabled:opacity-50 cursor-pointer"
              onClick={() => void clearSyncedData()}
              disabled={busyAction === 'clear:email'}
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>{busyAction === 'clear:email' ? 'Clearing...' : 'Clear Cache'}</span>
            </button>
          </div>
        </div>

        {/* BEGIN: FilterBar */}
        <section
          className="bg-white p-5 rounded-xl card-shadow border border-gray-100 flex flex-wrap gap-4 items-center justify-between"
          data-purpose="filter-bar"
        >
          <div className="flex flex-wrap gap-4 flex-1">
            {/* Folder Select */}
            <div className="relative min-w-[200px]">
              <select
                className="w-full pl-4 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none text-gray-700 cursor-pointer font-medium"
                value={emailFolder}
                onChange={(event) => {
                  setEmailFolder(event.target.value as 'INBOX' | 'SPAM' | 'SENT')
                  setEmailPage(1)
                }}
              >
                <option value="INBOX">Inbox Folder</option>
                <option value="SPAM">Spam Quarantine</option>
                <option value="SENT">Sent Messages</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                <ChevronDown className="h-4 w-4" />
              </div>
            </div>

            {/* Mailbox Select */}
            <div className="relative min-w-[200px]">
              <select
                className="w-full pl-4 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none text-gray-700 cursor-pointer font-medium"
                value={selectedMailAccountId}
                onChange={(event) => {
                  setSelectedMailAccountId(event.target.value)
                  setEmailPage(1)
                }}
              >
                <option value="">All Mailboxes</option>
                {mailAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.displayName || account.email}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                <ChevronDown className="h-4 w-4" />
              </div>
            </div>

            {/* Search Input */}
            <div className="relative flex-1 min-w-[250px]">
              <input
                className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700 placeholder:text-gray-400"
                placeholder="Search prospect, subject, or content..."
                type="text"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value)
                  setEmailPage(1)
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
          </div>

          {/* Warmup Checkbox */}
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-4 py-2.5 rounded-lg hover:border-gray-300 transition-colors">
            <input
              className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
              id="warmup"
              type="checkbox"
              checked={includeWarmup}
              onChange={(event) => {
                setIncludeWarmup(event.target.checked)
                setEmailPage(1)
              }}
            />
            <label className="text-sm text-gray-600 cursor-pointer select-none font-medium flex items-center gap-1.5" htmlFor="warmup">
              <Flame className={`h-3.5 w-3.5 ${includeWarmup ? 'text-amber-500' : 'text-gray-400'}`} />
              <span>Include warmup threads</span>
            </label>
          </div>
        </section>
        {/* END: FilterBar */}

        {/* BEGIN: StatsBar */}
        <section
          className="flex justify-between items-center px-2 text-sm text-gray-500 font-medium"
          data-purpose="stats-bar"
        >
          <div className="flex items-center gap-2">
            <span>Folder:</span>
            <span className="text-gray-900 font-bold uppercase tracking-wide bg-white px-2.5 py-0.5 rounded-md border border-gray-200 text-xs">
              {emailFolder}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span>Total Messages:</span>
            <span className="text-gray-900 font-bold">{emailData.total}</span>
          </div>
        </section>
        {/* END: StatsBar */}

        {/* BEGIN: EmailList */}
        <section className="space-y-4" data-purpose="email-list">
          {emailLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((n) => (
                <div
                  key={n}
                  className="bg-white rounded-xl p-6 card-shadow border border-gray-100 animate-pulse flex justify-between items-start gap-4"
                >
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-gray-200 shrink-0" />
                      <div className="space-y-1.5 flex-1 max-w-sm">
                        <div className="h-4 bg-gray-200 rounded w-24" />
                        <div className="h-3.5 bg-gray-200 rounded w-48" />
                      </div>
                    </div>
                    <div className="h-3 bg-gray-200 rounded w-5/6" />
                  </div>
                  <div className="h-3 bg-gray-200 rounded w-32 shrink-0" />
                </div>
              ))}
            </div>
          ) : emailData.items.length === 0 ? (
            <div className="bg-white rounded-xl p-12 card-shadow border border-gray-100 text-center space-y-3">
              <div className="w-14 h-14 mx-auto rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                <Inbox className="h-7 w-7" />
              </div>
              <h3 className="text-base font-bold text-gray-900">No messages found</h3>
              <p className="text-xs text-gray-500 max-w-md mx-auto">
                No synced emails match your current folder or filter criteria. Try adjusting your search query or folder selection.
              </p>
              {search ? (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200"
                >
                  Clear search
                </button>
              ) : null}
            </div>
          ) : (
            <>
              {emailData.items.map((message) => {
                const sender = getSenderInfo(message)
                const avatarColor = getAvatarColor(sender.name + sender.email)

                return (
                  <article
                    key={message.id}
                    className={`bg-white rounded-xl p-6 card-shadow border transition-all duration-150 hover:shadow-lg hover:border-blue-300 group cursor-pointer active:scale-[0.995] ${
                      !message.isRead ? 'border-blue-100 bg-blue-50/20' : 'border-gray-100'
                    }`}
                    onClick={() => void openEmailMessage(message)}
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-4 mb-2">
                          {/* Avatar */}
                          <div
                            className={`w-10 h-10 rounded-full ${avatarColor} flex items-center justify-center text-white font-bold shrink-0 shadow-xs`}
                          >
                            {sender.initial}
                          </div>

                          {/* Name & Subject */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <div className="text-lg font-bold text-gray-900 mb-0.5 truncate group-hover:text-blue-600 transition-colors">
                                {sender.name}
                              </div>
                              {!message.isRead ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white shrink-0">
                                  New
                                </span>
                              ) : null}
                              {message.isWarmup ? (
                                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                                  <Flame className="h-2.5 w-2.5" /> Warmup
                                </span>
                              ) : null}
                              {message.isSpam ? (
                                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-50 text-red-700 border border-red-200 shrink-0">
                                  Spam
                                </span>
                              ) : null}
                              {message.repliedAt ? (
                                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                                  <CheckCheck className="h-2.5 w-2.5" /> Replied
                                </span>
                              ) : null}
                            </div>
                            <div className="text-sm font-medium text-blue-600 truncate group-hover:text-blue-700">
                              {message.subject || '(No Subject)'}
                            </div>
                          </div>
                        </div>

                        {/* Message Snippet */}
                        <p className="text-gray-500 text-sm truncate pl-14">
                          {message.snippet || 'No preview snippet available for this message.'}
                        </p>

                        {/* Account indicator & Info */}
                        <div className="pl-14 mt-3 flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-gray-100/60">
                          <div className="text-[11px] text-gray-400 font-mono flex items-center gap-1.5">
                            <span>via</span>
                            <span className="font-semibold text-gray-600">{message.mailAccount.email}</span>
                            <span>•</span>
                            <span className="uppercase">{message.folderKind}</span>
                          </div>

                          <div className="text-xs text-blue-600 font-semibold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                            <span>Click to view full message & reply →</span>
                          </div>
                        </div>
                      </div>

                      {/* Timestamp */}
                      <div className="text-right shrink-0">
                        <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">
                          {formatDate(message.receivedAt || message.sentAt)}
                        </span>
                      </div>
                    </div>
                  </article>
                )
              })}

              {/* Integrated Numeric Pagination Bar */}
              {emailData.total > 0 ? (
                <div className="bg-white rounded-xl p-4 card-shadow border border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-500 font-medium">
                  <div className="text-xs text-gray-500 font-medium">
                    Showing <span className="font-bold text-gray-800">{Math.min((emailData.page - 1) * emailData.limit + 1, emailData.total)}</span>–
                    <span className="font-bold text-gray-800">{Math.min(emailData.page * emailData.limit, emailData.total)}</span> of{' '}
                    <span className="font-bold text-gray-800">{emailData.total}</span> messages
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Previous Button */}
                    <button
                      type="button"
                      aria-label="Previous Page"
                      disabled={emailData.page <= 1}
                      onClick={() => setEmailPage((p) => Math.max(1, p - 1))}
                      className="w-8 h-8 rounded-lg flex items-center justify-center border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900 disabled:opacity-40 disabled:pointer-events-none transition-colors shadow-xs"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>

                    {/* Numeric Buttons */}
                    {getVisiblePages(emailData.page, Math.max(1, emailData.pages)).map((pageNum, idx) => {
                      if (pageNum === 'ellipsis') {
                        return (
                          <span key={`ellipsis-${idx}`} className="w-7 h-8 flex items-center justify-center text-gray-400 text-xs">
                            •••
                          </span>
                        )
                      }
                      const isActive = pageNum === emailData.page
                      return (
                        <button
                          key={pageNum}
                          type="button"
                          onClick={() => setEmailPage(pageNum)}
                          className={`w-8 h-8 rounded-lg text-xs font-semibold flex items-center justify-center transition-all ${
                            isActive
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300 shadow-xs'
                          }`}
                        >
                          {pageNum}
                        </button>
                      )
                    })}

                    {/* Next Button */}
                    <button
                      type="button"
                      aria-label="Next Page"
                      disabled={emailData.page >= emailData.pages}
                      onClick={() => setEmailPage((p) => Math.min(emailData.pages, p + 1))}
                      className="w-8 h-8 rounded-lg flex items-center justify-center border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900 disabled:opacity-40 disabled:pointer-events-none transition-colors shadow-xs"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>

                    {/* Per Page Limit Selector */}
                    <div className="relative ml-2">
                      <select
                        value={emailLimit}
                        onChange={(e) => {
                          setEmailLimit(Number(e.target.value))
                          setEmailPage(1)
                        }}
                        className="h-8 pl-2.5 pr-7 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 appearance-none cursor-pointer focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-xs"
                      >
                        <option value="10">10 / page</option>
                        <option value="25">25 / page</option>
                        <option value="50">50 / page</option>
                        <option value="100">100 / page</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                        <ChevronDown className="h-3 w-3" />
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </>
          )}
        </section>
        {/* END: EmailList */}
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
                      <p className="text-xs text-gray-500">Send an outreach email directly from your inbox</p>
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
                      {mailAccounts.map((account) => (
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

      {/* Message Viewer & Reply Modal */}
      {isClient && messageModal
        ? createPortal(
            <div
              onClick={() => setMessageModal(null)}
              className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 bg-gray-900/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto"
            >
              <div
                className="w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl border border-gray-100 bg-white shadow-2xl overflow-hidden my-auto"
                role="dialog"
                aria-modal="true"
                onClick={(event) => event.stopPropagation()}
              >
                {/* Modal Header */}
                {(() => {
                  const modalSender = getSenderInfo(messageModal)
                  const avatarColor = getAvatarColor(modalSender.name + modalSender.email)

                  return (
                    <div className="p-5 sm:p-6 border-b border-gray-100 bg-white shrink-0">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="flex items-start gap-4 min-w-0 flex-1">
                          <div
                            className={`w-12 h-12 rounded-full ${avatarColor} flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-xs`}
                          >
                            {modalSender.initial}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2.5 flex-wrap">
                              <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                                {modalSender.name}
                              </h2>
                              {messageModal.isWarmup ? (
                                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                  <Flame className="h-2.5 w-2.5" /> Warmup
                                </span>
                              ) : null}
                              {messageModal.isSpam ? (
                                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-50 text-red-700 border border-red-200">
                                  Spam
                                </span>
                              ) : null}
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-gray-100 text-gray-600">
                                {messageModal.folderKind}
                              </span>
                            </div>

                            <div className="text-sm font-semibold text-blue-600 mt-1">
                              {messageModal.subject || '(No Subject)'}
                            </div>

                            <div className="text-xs text-gray-500 mt-1 flex flex-wrap items-center gap-2">
                              <span>From: <strong className="text-gray-700">{messageModal.fromEmail || 'Unknown'}</strong></span>
                              {messageModal.toEmail ? (
                                <span>To: <strong className="text-gray-700">{messageModal.toEmail}</strong></span>
                              ) : null}
                              <span>•</span>
                              <span>via <span className="font-mono text-gray-600">{messageModal.mailAccount.email}</span></span>
                              <span>•</span>
                              <span className="font-mono text-gray-400">
                                {formatDate(messageModal.receivedAt || messageModal.sentAt)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Top Action Buttons */}
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-colors shadow-xs cursor-pointer ${
                              modalReplying
                                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                            }`}
                            onClick={() => setModalReplying((r) => !r)}
                          >
                            <Reply className="h-3.5 w-3.5" />
                            <span>{modalReplying ? 'Hide Reply' : 'Reply'}</span>
                          </button>

                          {messageModal.isSpam ? (
                            <button
                              type="button"
                              className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200"
                              onClick={() => void runEmailAction(messageModal, 'rescue-to-inbox')}
                              disabled={busyAction === `rescue-to-inbox:${messageModal.id}`}
                            >
                              <ShieldAlert className="h-3.5 w-3.5" />
                              <span>Rescue</span>
                            </button>
                          ) : null}

                          <button
                            type="button"
                            className="p-2 rounded-lg border border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
                            onClick={() => setMessageModal(null)}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })()}

                {/* Modal Body / Complete Message */}
                <div className="p-5 sm:p-6 overflow-y-auto flex-1 bg-gray-50/50 space-y-4">
                  <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-xs">
                    {messageModal.html ? (
                      <iframe
                        title={messageModal.subject || 'Inbox message'}
                        srcDoc={messageModal.html}
                        sandbox=""
                        className="w-full min-h-[40vh] border-0 bg-white p-2"
                      />
                    ) : (
                      <div className="p-6 text-sm leading-relaxed text-gray-800 font-sans whitespace-pre-wrap">
                        {messageModal.text || 'No message content available.'}
                      </div>
                    )}
                  </div>

                  {/* Inline Reply Box inside Modal */}
                  {modalReplying ? (
                    <div className="rounded-xl border border-blue-200 bg-blue-50/30 p-5 space-y-3.5 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-200">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-bold text-gray-800 flex items-center gap-2">
                          <div className="w-6 h-6 rounded-md bg-blue-600 text-white flex items-center justify-center">
                            <Reply className="h-3 w-3" />
                          </div>
                          <span>Compose Reply to {messageModal.fromEmail || 'Prospect'}</span>
                        </div>
                        <button
                          type="button"
                          className="text-xs text-gray-400 hover:text-gray-600"
                          onClick={() => setModalReplying(false)}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Quick Reply Suggestions */}
                      <div className="flex flex-wrap gap-1.5">
                        {QUICK_REPLY_TEMPLATES.map((tmpl, idx) => (
                          <button
                            key={idx}
                            type="button"
                            className="text-[11px] bg-white border border-gray-200 text-gray-700 hover:text-blue-600 hover:border-blue-300 px-2.5 py-1 rounded-md transition-colors text-left shadow-2xs"
                            onClick={() => setModalReplyBody(tmpl)}
                          >
                            💡 {tmpl.slice(0, 38)}...
                          </button>
                        ))}
                      </div>

                      <input
                        className="w-full h-9 px-3 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={modalReplySubject}
                        onChange={(e) => setModalReplySubject(e.target.value)}
                        placeholder="Reply Subject"
                      />

                      <textarea
                        className="w-full p-3.5 bg-white border border-gray-200 rounded-lg text-xs text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[120px] leading-relaxed shadow-2xs"
                        value={modalReplyBody}
                        onChange={(e) => setModalReplyBody(e.target.value)}
                        placeholder="Type your reply here..."
                      />

                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          type="button"
                          className="px-4 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-xs font-semibold text-gray-700 transition-colors"
                          onClick={() => setModalReplying(false)}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition-colors cursor-pointer"
                          onClick={() => void handleSendModalReply()}
                          disabled={isModalSendingReply}
                        >
                          <Send className="h-3.5 w-3.5" />
                          <span>{isModalSendingReply ? 'Sending Reply...' : 'Send Reply'}</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-3.5 rounded-xl border border-gray-200 bg-white shadow-2xs">
                      <div className="text-xs text-gray-500 font-medium flex items-center gap-2">
                        <Reply className="h-3.5 w-3.5 text-blue-600" />
                        <span>Ready to respond to this conversation?</span>
                      </div>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                        onClick={() => setModalReplying(true)}
                      >
                        <Reply className="h-3.5 w-3.5" />
                        <span>Reply Now</span>
                      </button>
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
